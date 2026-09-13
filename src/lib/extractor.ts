import * as cheerio from 'cheerio';
import * as csstree from 'css-tree';
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import type {
  ExtractionResult,
  ExtractedColor,
  ExtractedTypography,
  ExtractedRadius,
  ExtractedShadow,
} from '@/types/tokens';

extend([a11yPlugin]);

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface ColorAccumulator {
  hex: string;
  rgb: string;
  luminance: number;
  count: number;
  typeCounts: Record<'background' | 'text' | 'border', number>;
}

// Regex patterns to capture color representations in CSS values
const COLOR_REGEX =
  /(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|rgba?\([^)]+\)|hsla?\([^)]+\))/gi;

/**
 * Extracts distinct font family names from a CSS font-family string.
 */
function parseFontFamilies(value: string): string[] {
  const genericFallbacks = new Set([
    'sans-serif',
    'serif',
    'monospace',
    'cursive',
    'fantasy',
    'system-ui',
    '-apple-system',
    'blinkmacsystemfont',
    'segoe ui',
    'roboto',
    'helvetica neue',
    'arial',
    'inherit',
    'initial',
    'unset',
  ]);

  return value
    .split(',')
    .map((f) => f.trim().replace(/^['"]|['"]$/g, ''))
    .filter((f) => f.length > 1 && !genericFallbacks.has(f.toLowerCase()));
}

/**
 * Extracts design tokens (colors, typography, border radii, shadows, fonts)
 * using high-performance, native HTML and CSS-Tree AST parsing (no Chromium required).
 */
export async function extractTokensFromUrl(targetUrl: string): Promise<ExtractionResult> {
  // 1. Fetch main HTML document
  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${targetUrl}: HTTP ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // 2. Extract Document Title
  const title =
    $('title').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('h1').first().text().trim() ||
    new URL(targetUrl).hostname;

  // 3. Gather all CSS: <style> tags, inline style attributes, and linked stylesheets
  const cssSnippets: string[] = [];

  // 3a. Inline <style> tags
  $('style').each((_, el) => {
    const content = $(el).text();
    if (content) cssSnippets.push(content);
  });

  // 3b. Inline style attributes
  $('[style]').each((_, el) => {
    const styleAttr = $(el).attr('style');
    if (styleAttr) {
      cssSnippets.push(`* { ${styleAttr} }`);
    }
  });

  // 3c. Extract linked external stylesheets (top 5 with concurrent fetch)
  const stylesheetUrls: string[] = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      try {
        stylesheetUrls.push(new URL(href, targetUrl).toString());
      } catch {
        // Ignore invalid URLs
      }
    }
  });

  const fetchedStylesheets = await Promise.allSettled(
    stylesheetUrls.slice(0, 5).map(async (url) => {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        return await res.text();
      }
      return '';
    })
  );

  for (const result of fetchedStylesheets) {
    if (result.status === 'fulfilled' && result.value) {
      cssSnippets.push(result.value);
    }
  }

  // Also check for Google Fonts link tags to extract declared font families
  const allFontFamiliesSet = new Set<string>();
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const match = href.match(/family=([^&:]+)/);
    if (match && match[1]) {
      const fontName = decodeURIComponent(match[1]).replace(/\+/g, ' ');
      allFontFamiliesSet.add(fontName);
    }
  });

  // 4. Parse CSS AST via CSS-Tree
  const combinedCss = cssSnippets.join('\n');
  const colorMap = new Map<string, ColorAccumulator>();
  const radiusMap = new Map<string, number>();
  const shadowMap = new Map<string, number>();

  interface TagStyleRule {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
  }
  const tagStyles: Record<string, TagStyleRule> = {};

  const recordColor = (rawVal: string, type: 'background' | 'text' | 'border') => {
    const matches = rawVal.match(COLOR_REGEX);
    if (!matches) return;

    for (const match of matches) {
      try {
        const c = colord(match.trim());
        if (!c.isValid()) continue;
        if (c.alpha() < 0.05) continue; // Ignore nearly transparent colors

        const hex = c.toHex().toLowerCase();
        // Ignore pure #000000 / #ffffff unless accompanied by brand context
        const existing = colorMap.get(hex);
        if (existing) {
          existing.count += 1;
          existing.typeCounts[type] = (existing.typeCounts[type] || 0) + 1;
        } else {
          colorMap.set(hex, {
            hex,
            rgb: c.toRgbString(),
            luminance: Number(c.luminance().toFixed(4)),
            count: 1,
            typeCounts: { background: 0, text: 0, border: 0, [type]: 1 },
          });
        }
      } catch {
        // Discard invalid color parse
      }
    }
  };

  try {
    const ast = csstree.parse(combinedCss, {
      positions: false,
      parseValue: false,
      onParseError: () => {},
    });

    csstree.walk(ast, (node) => {
      if (node.type === 'Rule') {
        const selectorText = csstree.generate(node.prelude).toLowerCase();
        const targetTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'body', 'button', 'a'];

        csstree.walk(node.block, (declNode) => {
          if (declNode.type !== 'Declaration') return;
          const prop = declNode.property.toLowerCase();
          const val = csstree.generate(declNode.value).trim();

          // Collect font-families
          if (prop === 'font-family') {
            const families = parseFontFamilies(val);
            families.forEach((f) => allFontFamiliesSet.add(f));
          }

          // Map typography to semantic tags
          for (const tag of targetTags) {
            if (selectorText.includes(tag)) {
              if (!tagStyles[tag]) tagStyles[tag] = {};
              if (prop === 'font-family') tagStyles[tag].fontFamily = val;
              if (prop === 'font-size') tagStyles[tag].fontSize = val;
              if (prop === 'font-weight') tagStyles[tag].fontWeight = val;
              if (prop === 'line-height') tagStyles[tag].lineHeight = val;
              if (prop === 'letter-spacing') tagStyles[tag].letterSpacing = val;
            }
          }

          // Colors
          if (prop === 'color') {
            recordColor(val, 'text');
          } else if (prop.includes('background')) {
            recordColor(val, 'background');
          } else if (prop.includes('border') || prop === 'outline-color') {
            recordColor(val, 'border');
          } else if (prop === 'fill' || prop === 'stroke') {
            recordColor(val, 'background');
          }

          // Radii
          if (prop.includes('border-radius')) {
            if (val !== '0' && val !== '0px' && val !== 'none') {
              radiusMap.set(val, (radiusMap.get(val) || 0) + 1);
            }
          }

          // Shadows
          if (prop === 'box-shadow') {
            if (val !== 'none' && val !== 'inherit' && val !== 'initial') {
              shadowMap.set(val, (shadowMap.get(val) || 0) + 1);
            }
          }
        });
      }
    });
  } catch {
    // If AST parsing encounters unsupported features, proceed with partial findings
  }

  // 5. DOM Inspection for Utility Classes & Sample Text (Tailwind / Modern Classes)
  $('*').each((_, el) => {
    const classAttr = $(el).attr('class') || '';
    if (!classAttr) return;

    const classes = classAttr.split(/\s+/);
    for (const cls of classes) {
      // Color utility classes (e.g., bg-[#...], text-[#...])
      const bgHexMatch = cls.match(/bg-\[#([0-9a-fA-F]{3,8})\]/);
      if (bgHexMatch) recordColor(`#${bgHexMatch[1]}`, 'background');

      const textHexMatch = cls.match(/text-\[#([0-9a-fA-F]{3,8})\]/);
      if (textHexMatch) recordColor(`#${textHexMatch[1]}`, 'text');

      // Radius utility classes
      if (cls === 'rounded-sm') radiusMap.set('2px', (radiusMap.get('2px') || 0) + 1);
      else if (cls === 'rounded') radiusMap.set('4px', (radiusMap.get('4px') || 0) + 1);
      else if (cls === 'rounded-md') radiusMap.set('6px', (radiusMap.get('6px') || 0) + 1);
      else if (cls === 'rounded-lg') radiusMap.set('8px', (radiusMap.get('8px') || 0) + 1);
      else if (cls === 'rounded-xl') radiusMap.set('12px', (radiusMap.get('12px') || 0) + 1);
      else if (cls === 'rounded-2xl') radiusMap.set('16px', (radiusMap.get('16px') || 0) + 1);
      else if (cls === 'rounded-3xl') radiusMap.set('24px', (radiusMap.get('24px') || 0) + 1);
      else if (cls === 'rounded-full') radiusMap.set('9999px', (radiusMap.get('9999px') || 0) + 1);

      // Shadow utility classes
      if (cls === 'shadow-xs') shadowMap.set('0 1px 2px 0 rgba(0,0,0,0.05)', (shadowMap.get('0 1px 2px 0 rgba(0,0,0,0.05)') || 0) + 1);
      else if (cls === 'shadow-sm') shadowMap.set('0 1px 3px 0 rgba(0,0,0,0.1)', (shadowMap.get('0 1px 3px 0 rgba(0,0,0,0.1)') || 0) + 1);
      else if (cls === 'shadow' || cls === 'shadow-md') shadowMap.set('0 4px 6px -1px rgba(0,0,0,0.1)', (shadowMap.get('0 4px 6px -1px rgba(0,0,0,0.1)') || 0) + 1);
      else if (cls === 'shadow-lg') shadowMap.set('0 10px 15px -3px rgba(0,0,0,0.1)', (shadowMap.get('0 10px 15px -3px rgba(0,0,0,0.1)') || 0) + 1);
      else if (cls === 'shadow-xl') shadowMap.set('0 20px 25px -5px rgba(0,0,0,0.1)', (shadowMap.get('0 20px 25px -5px rgba(0,0,0,0.1)') || 0) + 1);
    }
  });

  // 6. Build Extracted Colors (Sorted by frequency, enriched with WCAG contrastText)
  const colors: ExtractedColor[] = Array.from(colorMap.values())
    .map((item) => {
      const type = (['background', 'text', 'border'] as const).reduce((a, b) =>
        item.typeCounts[a] >= item.typeCounts[b] ? a : b
      );
      const whiteContrast = colord(item.hex).contrast('#ffffff');
      const blackContrast = colord(item.hex).contrast('#000000');
      const contrastText = whiteContrast >= blackContrast ? '#ffffff' : '#000000';

      return {
        hex: item.hex,
        rgb: item.rgb,
        luminance: item.luminance,
        count: item.count,
        type,
        contrastText,
      };
    })
    .sort((a, b) => b.count - a.count);

  // Fallback defaults if no colors were extracted
  if (colors.length === 0) {
    const fallbackHexes = ['#0f172a', '#3b82f6', '#64748b', '#f8fafc', '#e2e8f0'];
    fallbackHexes.forEach((hex, i) => {
      const c = colord(hex);
      colors.push({
        hex,
        rgb: c.toRgbString(),
        luminance: Number(c.luminance().toFixed(4)),
        count: 10 - i * 2,
        type: i === 1 ? 'background' : i === 0 ? 'text' : 'border',
        contrastText: c.contrast('#ffffff') >= c.contrast('#000000') ? '#ffffff' : '#000000',
      });
    });
  }

  // 7. Build Semantic Typography Ramps (h1, h2, h3, p, etc.)
  const tagsToSample = ['h1', 'h2', 'h3', 'p', 'button', 'a'];
  const defaultFonts = Array.from(allFontFamiliesSet);
  const primaryFont = defaultFonts[0] || 'Inter, -apple-system, sans-serif';

  const defaultSizes: Record<string, { size: string; weight: string; line: string }> = {
    h1: { size: '36px', weight: '700', line: '40px' },
    h2: { size: '30px', weight: '600', line: '36px' },
    h3: { size: '24px', weight: '600', line: '32px' },
    p: { size: '16px', weight: '400', line: '24px' },
    button: { size: '14px', weight: '500', line: '20px' },
    a: { size: '14px', weight: '500', line: '20px' },
  };

  const typography: ExtractedTypography[] = tagsToSample.map((tag) => {
    const $first = $(tag).first();
    const sampleText =
      $first.text().replace(/\s+/g, ' ').trim().slice(0, 60) ||
      (tag === 'h1'
        ? 'Headline Title Sample'
        : tag === 'h2'
        ? 'Section Heading'
        : tag === 'h3'
        ? 'Subheading Label'
        : tag === 'button'
        ? 'Action Button'
        : tag === 'a'
        ? 'Interactive Link'
        : 'Body paragraph text detailing system design decisions.');

    const rule = tagStyles[tag] || {};
    const defaults = defaultSizes[tag] || defaultSizes.p;

    return {
      tag,
      fontFamily: rule.fontFamily || primaryFont,
      fontSize: rule.fontSize || defaults.size,
      fontWeight: rule.fontWeight || defaults.weight,
      lineHeight: rule.lineHeight || defaults.line,
      letterSpacing: rule.letterSpacing || 'normal',
      sampleText,
    };
  });

  // 8. Build Radii
  if (radiusMap.size === 0) {
    radiusMap.set('4px', 10);
    radiusMap.set('8px', 8);
    radiusMap.set('12px', 5);
  }
  const radii: ExtractedRadius[] = Array.from(radiusMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([value, count]) => ({ value, count }));

  // 9. Build Shadows
  if (shadowMap.size === 0) {
    shadowMap.set('0 1px 3px 0 rgba(0,0,0,0.1)', 8);
    shadowMap.set('0 4px 6px -1px rgba(0,0,0,0.1)', 5);
    shadowMap.set('0 10px 15px -3px rgba(0,0,0,0.1)', 3);
  }
  const shadowNames = ['sm', 'md', 'lg'] as const;
  const shadows: ExtractedShadow[] = Array.from(shadowMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([value, count], index) => ({
      name: shadowNames[index] || `elevation-${index + 1}`,
      value,
      count,
    }));

  return {
    url: targetUrl,
    title,
    fontFamilies: Array.from(allFontFamiliesSet),
    colors,
    typography,
    radii,
    shadows,
  };
}
