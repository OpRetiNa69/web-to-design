import puppeteer, { type Browser, type Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
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

interface RawElementData {
  backgroundColors: string[];
  textColors: string[];
  borderColors: string[];
  radii: string[];
  shadows: string[];
  typography: Array<{
    tag: string;
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    sampleText: string;
  }>;
  title: string;
}

interface ColorAccumulator {
  hex: string;
  rgb: string;
  luminance: number;
  count: number;
  typeCounts: Record<'background' | 'text' | 'border', number>;
}

/**
 * Extracts design tokens (colors, typography, border radii, shadows, font families) from a target live URL.
 */
export async function extractTokensFromUrl(targetUrl: string): Promise<ExtractionResult> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1440, height: 900 },
      executablePath,
      headless: true,
    });

    page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1440, height: 900 });

    // Set navigation to domcontentloaded with a 20s timeout so large target sites don't hit function timeout limits
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    // Hydration buffer for client-rendered computed styles
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Evaluate visible DOM elements to collect raw styling tokens (capped at 1,500 elements)
    const rawData = await page.evaluate((): RawElementData => {
      const backgroundColors: string[] = [];
      const textColors: string[] = [];
      const borderColors: string[] = [];
      const radii: string[] = [];
      const shadows: string[] = [];
      const typography: RawElementData['typography'] = [];

      const typographyTags = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'BUTTON', 'A']);

      // Cap traversal at 1,500 elements for performance
      const allElements = Array.from(document.querySelectorAll('*')).slice(0, 1500);

      for (const el of allElements) {
        if (!(el instanceof HTMLElement || el instanceof SVGElement)) {
          continue;
        }

        // Filter out zero-dimension elements
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          continue;
        }

        // Filter out hidden elements
        const style = window.getComputedStyle(el);
        const isHidden =
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0';

        if (isHidden) {
          continue;
        }

        // 1. Background color
        const bg = style.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          backgroundColors.push(bg);
        }

        // 2. Text color (only if element has textual children or is directly textual)
        const hasDirectText = Array.from(el.childNodes).some(
          (node) => node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim().length > 0
        );

        if (hasDirectText) {
          const color = style.color;
          if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
            textColors.push(color);
          }
        }

        // 3. Border colors
        const borderTopWidth = parseFloat(style.borderTopWidth) || 0;
        if (borderTopWidth > 0 && style.borderTopStyle !== 'none') {
          const bColor = style.borderTopColor;
          if (bColor && bColor !== 'rgba(0, 0, 0, 0)' && bColor !== 'transparent') {
            borderColors.push(bColor);
          }
        }

        // 4. Border radius
        const radius = style.borderRadius;
        if (radius && radius !== '0px' && radius !== '0px 0px 0px 0px' && radius.trim() !== '') {
          radii.push(radius);
        }

        // 5. Box shadow / Elevations
        const shadow = style.boxShadow;
        if (
          shadow &&
          shadow !== 'none' &&
          !shadow.startsWith('none') &&
          !shadow.includes('rgba(0, 0, 0, 0) 0px 0px 0px 0px') &&
          shadow.trim() !== ''
        ) {
          shadows.push(shadow.trim());
        }

        // 6. Typography
        if (typographyTags.has(el.tagName)) {
          const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
          if (text.length > 0) {
            typography.push({
              tag: el.tagName.toLowerCase(),
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              lineHeight: style.lineHeight,
              letterSpacing: style.letterSpacing,
              sampleText: text.slice(0, 75),
            });
          }
        }
      }

      return {
        backgroundColors,
        textColors,
        borderColors,
        radii,
        shadows,
        typography,
        title: document.title || 'Untitled Page',
      };
    });

    // --- Process & Normalize Colors with colord (deduplicated by hex, sorted by frequency) ---
    const colorHexMap = new Map<string, ColorAccumulator>();

    const processColorItem = (rawColor: string, type: 'background' | 'text' | 'border') => {
      const c = colord(rawColor);
      if (!c.isValid() || c.alpha() === 0) {
        return;
      }

      const hex = c.toHex().toUpperCase();
      const rgb = c.toRgbString();
      const luminance = Math.round(c.luminance() * 1000) / 1000;

      const existing = colorHexMap.get(hex);
      if (existing) {
        existing.count += 1;
        existing.typeCounts[type] += 1;
      } else {
        colorHexMap.set(hex, {
          hex,
          rgb,
          luminance,
          count: 1,
          typeCounts: {
            background: type === 'background' ? 1 : 0,
            text: type === 'text' ? 1 : 0,
            border: type === 'border' ? 1 : 0,
          },
        });
      }
    };

    rawData.backgroundColors.forEach((c) => processColorItem(c, 'background'));
    rawData.textColors.forEach((c) => processColorItem(c, 'text'));
    rawData.borderColors.forEach((c) => processColorItem(c, 'border'));

    const colors: ExtractedColor[] = Array.from(colorHexMap.values())
      .map((item) => {
        const dominantType = (['background', 'text', 'border'] as const).reduce((a, b) =>
          item.typeCounts[b] > item.typeCounts[a] ? b : a
        );

        const whiteContrast = colord(item.hex).contrast('#ffffff');
        const blackContrast = colord(item.hex).contrast('#000000');
        const contrastText = whiteContrast >= blackContrast ? '#ffffff' : '#000000';

        return {
          hex: item.hex,
          rgb: item.rgb,
          luminance: item.luminance,
          count: item.count,
          type: dominantType,
          contrastText,
        };
      })
      .sort((a, b) => b.count - a.count);

    // --- Process & Deduplicate Typography ---
    const typographyMap = new Map<string, ExtractedTypography>();
    const allFontFamiliesSet = new Set<string>();

    for (const typo of rawData.typography) {
      // Clean and collect font families
      const families = typo.fontFamily
        .split(',')
        .map((f) => f.trim().replace(/^["']|["']$/g, ''))
        .filter((f) => f.length > 0);

      families.forEach((f) => allFontFamiliesSet.add(f));

      const primaryFamily = families[0] || typo.fontFamily;
      const key = `${typo.tag}|${primaryFamily}|${typo.fontSize}|${typo.fontWeight}|${typo.lineHeight}|${typo.letterSpacing}`;

      if (!typographyMap.has(key)) {
        typographyMap.set(key, {
          tag: typo.tag,
          fontFamily: primaryFamily,
          fontSize: typo.fontSize,
          fontWeight: typo.fontWeight,
          lineHeight: typo.lineHeight,
          letterSpacing: typo.letterSpacing,
          sampleText: typo.sampleText,
        });
      }
    }

    const typography = Array.from(typographyMap.values());

    // --- Process & Deduplicate Radii ---
    const radiiMap = new Map<string, number>();
    for (const r of rawData.radii) {
      const normalized = r.trim();
      radiiMap.set(normalized, (radiiMap.get(normalized) || 0) + 1);
    }

    const radii: ExtractedRadius[] = Array.from(radiiMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    // --- Process & Deduplicate Box Shadows (Top 3 mapped to sm, md, lg) ---
    const shadowMap = new Map<string, number>();
    for (const s of rawData.shadows) {
      shadowMap.set(s, (shadowMap.get(s) || 0) + 1);
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
      title: rawData.title,
      fontFamilies: Array.from(allFontFamiliesSet),
      colors,
      typography,
      radii,
      shadows,
    };
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
