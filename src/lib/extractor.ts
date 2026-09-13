import https from 'https';
import http from 'http';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as csstree from 'css-tree';
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import namesPlugin from 'colord/plugins/names';
import type {
  ExtractionResult,
  ExtractedColor,
  ExtractedTypography,
  ExtractedRadius,
  ExtractedShadow,
} from '@/types/tokens';

extend([a11yPlugin, namesPlugin]);

// Force IPv4 to prevent AWS Lambda / Vercel serverless IPv6 connection timeouts (ECONNREFUSED / ETIMEDOUT / fetch failed)
const httpsAgent = new https.Agent({
  family: 4,
  keepAlive: true,
  rejectUnauthorized: false,
});

const httpAgent = new http.Agent({
  family: 4,
  keepAlive: true,
});

// Realistic desktop browser headers to prevent Cloudflare/anti-bot blocks
const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'Upgrade-Insecure-Requests': '1',
};

const CSS_FETCH_HEADERS: Record<string, string> = {
  'User-Agent': BROWSER_HEADERS['User-Agent'],
  Accept: 'text/css,*/*;q=0.1',
  'Accept-Language': 'en-US,en;q=0.9',
  'sec-ch-ua': BROWSER_HEADERS['sec-ch-ua'],
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'style',
  'sec-fetch-mode': 'no-cors',
  'sec-fetch-site': 'cross-site',
};

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

// Comprehensive Tailwind CSS color palette dictionary
const TAILWIND_COLORS: Record<string, Record<string, string>> = {
  slate: {
    '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0', '300': '#cbd5e1', '400': '#94a3b8',
    '500': '#64748b', '600': '#475569', '700': '#334155', '800': '#1e293b', '900': '#0f172a', '950': '#020617',
  },
  gray: {
    '50': '#f9fafb', '100': '#f3f4f6', '200': '#e5e7eb', '300': '#d1d5db', '400': '#9ca3af',
    '500': '#6b7280', '600': '#4b5563', '700': '#374151', '800': '#1f2937', '900': '#111827', '950': '#030712',
  },
  zinc: {
    '50': '#fafafa', '100': '#f4f4f5', '200': '#e4e4e7', '300': '#d4d4d8', '400': '#a1a1aa',
    '500': '#71717a', '600': '#52525b', '700': '#3f3f46', '800': '#27272a', '900': '#18181b', '950': '#09090b',
  },
  neutral: {
    '50': '#fafafa', '100': '#f5f5f5', '200': '#e5e5e5', '300': '#d4d4d4', '400': '#a3a3a3',
    '500': '#737373', '600': '#525252', '700': '#404040', '800': '#262626', '900': '#171717', '950': '#0a0a0a',
  },
  stone: {
    '50': '#fafaf9', '100': '#f5f5f4', '200': '#e7e5e4', '300': '#d6d3d1', '400': '#a8a29e',
    '500': '#78716c', '600': '#57534e', '700': '#44403c', '800': '#292524', '900': '#1c1917', '950': '#0c0a09',
  },
  red: {
    '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca', '300': '#fca5a5', '400': '#f87171',
    '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c', '800': '#991b1b', '900': '#7f1d1d', '950': '#450a0a',
  },
  orange: {
    '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa', '300': '#fdba74', '400': '#fb923c',
    '500': '#f97316', '600': '#ea580c', '700': '#c2410c', '800': '#9a3412', '900': '#7c2d12', '950': '#431407',
  },
  amber: {
    '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d', '400': '#fbbf24',
    '500': '#f59e0b', '600': '#d97706', '700': '#b45309', '800': '#92400e', '900': '#78350f', '950': '#451a03',
  },
  yellow: {
    '50': '#fefce8', '100': '#fef9c3', '200': '#fef08a', '300': '#fde047', '400': '#facc15',
    '500': '#eab308', '600': '#ca8a04', '700': '#a16207', '800': '#854d0e', '900': '#713f12', '950': '#422006',
  },
  lime: {
    '50': '#f7fee7', '100': '#ecfccb', '200': '#d9f99d', '300': '#bef264', '400': '#a3e635',
    '500': '#84cc16', '600': '#65a30d', '700': '#4d7c0f', '800': '#3f6212', '900': '#365314', '950': '#1a2e05',
  },
  green: {
    '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0', '300': '#86efac', '400': '#4ade80',
    '500': '#22c55e', '600': '#16a34a', '700': '#15803d', '800': '#166534', '900': '#14532d', '950': '#052e16',
  },
  emerald: {
    '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7', '400': '#34d399',
    '500': '#10b981', '600': '#059669', '700': '#047857', '800': '#065f46', '900': '#064e3b', '950': '#022c22',
  },
  teal: {
    '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4', '400': '#2dd4bf',
    '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e', '800': '#115e59', '900': '#134e4a', '950': '#042f2e',
  },
  cyan: {
    '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc', '300': '#67e8f9', '400': '#22d3ee',
    '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490', '800': '#155e75', '900': '#164e63', '950': '#083344',
  },
  sky: {
    '50': '#f0f9ff', '100': '#e0f2fe', '200': '#bae6fd', '300': '#7dd3fc', '400': '#38bdf8',
    '500': '#0ea5e9', '600': '#0284c7', '700': '#0369a1', '800': '#075985', '900': '#0c4a6e', '950': '#082f49',
  },
  blue: {
    '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa',
    '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a', '950': '#172554',
  },
  indigo: {
    '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc', '400': '#818cf8',
    '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b',
  },
  violet: {
    '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa',
    '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95', '950': '#2e1065',
  },
  purple: {
    '50': '#faf5ff', '100': '#f3e8ff', '200': '#e9d5ff', '300': '#d8b4fe', '400': '#c084fc',
    '500': '#a855f7', '600': '#9333ea', '700': '#7e22ce', '800': '#6b21a8', '900': '#581c87', '950': '#3b0764',
  },
  fuchsia: {
    '50': '#fdf4ff', '100': '#fae8ff', '200': '#f5d0fe', '300': '#f0abfc', '400': '#e879f9',
    '500': '#d946ef', '600': '#c026d3', '700': '#a21caf', '800': '#86198f', '900': '#701a75', '950': '#4a044e',
  },
  pink: {
    '50': '#fdf2f8', '100': '#fce7f3', '200': '#fbcfe8', '300': '#f9a8d4', '400': '#f472b6',
    '500': '#ec4899', '600': '#db2777', '700': '#be185d', '800': '#9d174d', '900': '#831843', '950': '#500724',
  },
  rose: {
    '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af', '400': '#fb7185',
    '500': '#f43f5e', '600': '#e11d48', '700': '#be123c', '800': '#9f1239', '900': '#881337', '950': '#4c0519',
  },
};

/**
 * Sanitizes and normalizes an input URL:
 * - Trims whitespaces
 * - Automatically prepends https:// if protocol is missing (e.g. apple.com -> https://apple.com)
 * - Trims trailing slashes
 */
export function sanitizeUrl(input: string): string {
  let url = input.trim();
  if (!url) return '';

  if (url.startsWith('//')) {
    url = `https:${url}`;
  } else if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) {
    url = `https://${url}`;
  }

  url = url.trim().replace(/\/+$/, '');
  return url;
}

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
    .map((f) => f.trim().replace(/^['"\s(]+|['"\s)]+$/g, ''))
    .filter(
      (f) =>
        f.length > 1 &&
        !f.startsWith('var(') &&
        !genericFallbacks.has(f.toLowerCase())
    );
}

/**
 * Recursively resolves CSS variables (e.g. `var(--primary)` or `var(--hue, 220)`)
 * up to a max recursion depth.
 */
function resolveCssVariable(
  rawValue: string,
  variables: Map<string, string>,
  maxDepth = 6
): string {
  let current = rawValue.trim();
  for (let i = 0; i < maxDepth; i++) {
    const varMatch = current.match(/var\((--[a-zA-Z0-9_-]+)(?:,\s*([^)]+))?\)/);
    if (!varMatch) break;

    const varName = varMatch[1].toLowerCase();
    const fallback = varMatch[2] ? varMatch[2].trim() : '';
    const replacement = variables.get(varName) || fallback;
    current = current.replace(varMatch[0], replacement).trim();
  }
  return current;
}

/**
 * Attempts to parse a color string into hex, rgb, and luminance.
 * Supports hex, rgb/rgba, hsl/hsla, space-separated HSL/RGB (Tailwind/shadcn), and named colors.
 */
function parseColorFromValue(
  rawVal: string
): { hex: string; rgb: string; luminance: number } | null {
  const trimmed = rawVal.trim().replace(/^['"]|['"]$/g, '');
  if (!trimmed || trimmed === 'none' || trimmed === 'transparent' || trimmed === 'inherit') {
    return null;
  }

  // 1. Direct colord evaluation
  try {
    const c = colord(trimmed);
    if (c.isValid() && c.alpha() >= 0.05) {
      return {
        hex: c.toHex().toLowerCase(),
        rgb: c.toRgbString(),
        luminance: Number(c.luminance().toFixed(4)),
      };
    }
  } catch {}

  // 2. Space-separated or comma-separated HSL (e.g. "222.2 84% 4.9%" or "222.2, 84%, 4.9%")
  try {
    const hslWrapped = colord(`hsl(${trimmed})`);
    if (hslWrapped.isValid() && hslWrapped.alpha() >= 0.05) {
      return {
        hex: hslWrapped.toHex().toLowerCase(),
        rgb: hslWrapped.toRgbString(),
        luminance: Number(hslWrapped.luminance().toFixed(4)),
      };
    }
  } catch {}

  // 3. Space-separated or comma-separated RGB (e.g. "37 99 235")
  try {
    const rgbWrapped = colord(`rgb(${trimmed})`);
    if (rgbWrapped.isValid() && rgbWrapped.alpha() >= 0.05) {
      return {
        hex: rgbWrapped.toHex().toLowerCase(),
        rgb: rgbWrapped.toRgbString(),
        luminance: Number(rgbWrapped.luminance().toFixed(4)),
      };
    }
  } catch {}

  // 4. Regex extraction for embedded hex or color functions
  const match = trimmed.match(
    /(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|rgba?\([^)]+\)|hsla?\([^)]+\))/i
  );
  if (match) {
    try {
      const c = colord(match[1]);
      if (c.isValid() && c.alpha() >= 0.05) {
        return {
          hex: c.toHex().toLowerCase(),
          rgb: c.toRgbString(),
          luminance: Number(c.luminance().toFixed(4)),
        };
      }
    } catch {}
  }

  return null;
}

/**
 * Normalizes border-radius CSS values (rem, em, calc, px) to standardized pixel strings.
 */
function parseRadiusValue(
  rawVal: string,
  variables: Map<string, string>
): string | null {
  const resolved = resolveCssVariable(rawVal, variables).trim();
  if (!resolved || resolved === '0' || resolved === '0px' || resolved === 'none') {
    return null;
  }

  // Direct px
  const pxMatch = resolved.match(/^([\d.]+)px$/);
  if (pxMatch) {
    return `${Math.round(parseFloat(pxMatch[1]))}px`;
  }

  // Rem to px (assuming 16px root font)
  const remMatch = resolved.match(/^([\d.]+)rem$/);
  if (remMatch) {
    return `${Math.round(parseFloat(remMatch[1]) * 16)}px`;
  }

  // Simple calc() expressions: calc(Xpx - Ypx) or calc(Xrem - Ypx)
  const calcMatch = resolved.match(
    /calc\(\s*([\d.]+)(px|rem)\s*([+-])\s*([\d.]+)(px|rem)\s*\)/i
  );
  if (calcMatch) {
    const [, val1, unit1, op, val2, unit2] = calcMatch;
    const px1 = unit1 === 'rem' ? parseFloat(val1) * 16 : parseFloat(val1);
    const px2 = unit2 === 'rem' ? parseFloat(val2) * 16 : parseFloat(val2);
    const result = op === '+' ? px1 + px2 : px1 - px2;
    if (result > 0) return `${Math.round(result)}px`;
  }

  // Valid length string
  if (/^[\d.]+(?:px|rem|em|%)$/.test(resolved)) {
    return resolved;
  }

  return null;
}

/**
 * Extracts design tokens (colors, typography, border radii, shadows, fonts)
 * using high-performance Axios IPv4-forced fetching and CSS-Tree AST parsing.
 */
export async function extractTokensFromUrl(targetUrl: string): Promise<ExtractionResult> {
  // 1. Sanitize & Normalize Input URL (e.g. apple.com -> https://apple.com)
  const normalizedUrl = sanitizeUrl(targetUrl);
  if (!normalizedUrl) {
    throw new Error(`Invalid URL provided: "${targetUrl}"`);
  }

  // 2. Fetch main HTML document using IPv4-forced Axios agent and browser headers
  let html: string;
  let finalUrl = normalizedUrl;

  try {
    const response = await axios.get<string>(normalizedUrl, {
      headers: BROWSER_HEADERS,
      httpsAgent,
      httpAgent,
      timeout: 15000,
      maxRedirects: 5,
      responseType: 'text',
      validateStatus: (status) => status >= 200 && status < 400,
    });

    finalUrl =
      (response.request as any)?.res?.responseUrl ||
      response.request?.responseURL ||
      response.config?.url ||
      normalizedUrl;

    html = typeof response.data === 'string' ? response.data : String(response.data);
  } catch (err: any) {
    const statusText = err.response?.status ? `HTTP ${err.response.status}` : err.code || '';
    const message = err.message || 'Network request failed';
    throw new Error(`Failed to fetch ${normalizedUrl}: ${statusText} ${message}`.trim());
  }

  const $ = cheerio.load(html);

  // 3. Extract Document Title
  const title =
    $('title').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('h1').first().text().trim() ||
    new URL(finalUrl).hostname;

  // 4. Gather CSS: <style> tags, inline style attributes, and external stylesheets
  const cssSnippets: string[] = [];

  // 4a. Inline <style> tags
  $('style').each((_, el) => {
    const content = $(el).text();
    if (content) cssSnippets.push(content);
  });

  // 4b. Inline style attributes
  $('[style]').each((_, el) => {
    const styleAttr = $(el).attr('style');
    if (styleAttr) {
      cssSnippets.push(`* { ${styleAttr} }`);
    }
  });

  // 4c. Extract linked external stylesheets
  const stylesheetUrls: string[] = [];
  const seenStylesheetUrls = new Set<string>();

  $('link[rel="stylesheet"], link[rel~="stylesheet"], link[as="style"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const trimmed = href.trim();
    if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('javascript:')) return;

    try {
      const resolved = new URL(trimmed, finalUrl).toString();
      if (!seenStylesheetUrls.has(resolved)) {
        seenStylesheetUrls.add(resolved);
        stylesheetUrls.push(resolved);
      }
    } catch {
      // Ignore invalid URLs
    }
  });

  // Concurrently fetch external stylesheets using Axios with IPv4-forced agent
  const candidateUrls = stylesheetUrls.slice(0, 10);
  const fetchedStylesheets = await Promise.allSettled(
    candidateUrls.map(async (url) => {
      const res = await axios.get<string>(url, {
        headers: {
          ...CSS_FETCH_HEADERS,
          Referer: finalUrl,
        },
        httpsAgent,
        httpAgent,
        timeout: 5000,
        maxRedirects: 5,
        responseType: 'text',
        validateStatus: (status) => status >= 200 && status < 400,
      });
      return typeof res.data === 'string' ? res.data : String(res.data);
    })
  );

  // Collect successful CSS texts and sort descending by length to pick the top 5 largest
  const validExternalCss: string[] = [];
  for (const result of fetchedStylesheets) {
    if (result.status === 'fulfilled' && result.value && result.value.trim().length > 0) {
      validExternalCss.push(result.value);
    }
  }

  validExternalCss.sort((a, b) => b.length - a.length);
  const top5LargestCss = validExternalCss.slice(0, 5);
  for (const cssContent of top5LargestCss) {
    cssSnippets.push(cssContent);
  }

  // Also extract declared Google Fonts link tags
  const allFontFamiliesSet = new Set<string>();
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const match = href.match(/family=([^&:]+)/);
    if (match && match[1]) {
      const fontName = decodeURIComponent(match[1]).replace(/\+/g, ' ');
      allFontFamiliesSet.add(fontName);
    }
  });

  // 5. Token accumulator maps
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

  const recordColor = (
    rawVal: string,
    type: 'background' | 'text' | 'border',
    weight: number = 1
  ) => {
    const parsed = parseColorFromValue(rawVal);
    if (!parsed) return;

    const { hex, rgb, luminance } = parsed;
    const existing = colorMap.get(hex);
    if (existing) {
      existing.count += weight;
      existing.typeCounts[type] = (existing.typeCounts[type] || 0) + weight;
    } else {
      colorMap.set(hex, {
        hex,
        rgb,
        luminance,
        count: weight,
        typeCounts: { background: 0, text: 0, border: 0, [type]: weight },
      });
    }
  };

  // 6. Parse CSS AST via CSS-Tree
  const combinedCss = cssSnippets.join('\n');
  const rootVariables = new Map<string, string>();

  try {
    const ast = csstree.parse(combinedCss, {
      positions: false,
      parseValue: false,
      onParseError: () => {},
    });

    csstree.walk(ast, (node) => {
      // 6a. Check @font-face declarations
      if (node.type === 'Atrule' && node.name.toLowerCase() === 'font-face' && node.block) {
        csstree.walk(node.block, (faceDecl) => {
          if (faceDecl.type === 'Declaration' && faceDecl.property.toLowerCase() === 'font-family') {
            const faceName = csstree.generate(faceDecl.value).trim().replace(/^['"]|['"]$/g, '');
            if (faceName && faceName.length > 1) {
              const parsed = parseFontFamilies(faceName);
              parsed.forEach((f) => allFontFamiliesSet.add(f));
            }
          }
        });
      }

      // 6b. Rules and Declarations
      if (node.type === 'Rule') {
        const selectorText = csstree.generate(node.prelude).toLowerCase();
        const targetTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'body', 'button', 'a'];
        const isRootOrHtml = /(^|[,\s>+~])(:root|\bhtml\b|:host)/i.test(selectorText);

        csstree.walk(node.block, (declNode) => {
          if (declNode.type !== 'Declaration') return;
          const prop = declNode.property.toLowerCase();
          const val = csstree.generate(declNode.value).trim();

          // Collect :root and html custom properties
          if (isRootOrHtml && prop.startsWith('--')) {
            rootVariables.set(prop, val);
          }

          // Font family extraction
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
          } else if (prop.includes('border') || prop === 'outline-color' || prop.includes('ring')) {
            recordColor(val, 'border');
          } else if (prop === 'fill' || prop === 'stroke') {
            recordColor(val, 'background');
          }

          // Radii
          if (prop.includes('border-radius')) {
            const normalized = parseRadiusValue(val, rootVariables);
            if (normalized) {
              radiusMap.set(normalized, (radiusMap.get(normalized) || 0) + 1);
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

    // 7. Resolve :root & html CSS Custom Properties directly into design token maps
    for (const [prop, rawVal] of rootVariables.entries()) {
      const resolvedVal = resolveCssVariable(rawVal, rootVariables);

      // 7a. Color Custom Properties: --color-*, --primary*, --background*, etc.
      const isColorVar =
        prop.startsWith('--color-') ||
        prop.startsWith('--primary') ||
        prop.includes('brand') ||
        prop.includes('accent') ||
        prop.includes('surface') ||
        prop.includes('background') ||
        prop.includes('foreground') ||
        prop.includes('border');

      if (isColorVar || COLOR_REGEX.test(resolvedVal)) {
        const colorType =
          prop.includes('text') || prop.includes('foreground') || prop.includes('font')
            ? 'text'
            : prop.includes('border') || prop.includes('stroke') || prop.includes('ring')
            ? 'border'
            : 'background';

        // Add resolved CSS variable colors directly into palette frequency map with boosted weight
        recordColor(resolvedVal, colorType, 5);
      }

      // 7b. Font Custom Properties: --font-*
      if (prop.startsWith('--font-') || prop.includes('font-family')) {
        const families = parseFontFamilies(resolvedVal);
        families.forEach((f) => allFontFamiliesSet.add(f));
      }

      // 7c. Radius Custom Properties: --radius-*
      if (prop.startsWith('--radius') || prop.includes('border-radius')) {
        const normalized = parseRadiusValue(resolvedVal, rootVariables);
        if (normalized) {
          radiusMap.set(normalized, (radiusMap.get(normalized) || 0) + 5);
        }
      }

      // 7d. Shadow Custom Properties: --shadow-*
      if (prop.startsWith('--shadow') || prop.includes('box-shadow')) {
        if (
          resolvedVal &&
          resolvedVal !== 'none' &&
          resolvedVal !== 'inherit' &&
          !resolvedVal.startsWith('var(')
        ) {
          shadowMap.set(resolvedVal, (shadowMap.get(resolvedVal) || 0) + 3);
        }
      }
    }
  } catch {
    // If AST parsing encounters unsupported features, proceed with partial findings
  }

  // 8. Class-Based Fallback for Tailwind/Utility Sites (DOM Inspection)
  $('[class]').each((_, el) => {
    const classAttr = $(el).attr('class') || '';
    if (!classAttr) return;

    const tagName = el.tagName?.toLowerCase() || '';
    const classes = classAttr.split(/\s+/);

    for (const cls of classes) {
      if (!cls) continue;

      // Strip responsive and pseudo prefixes (e.g. 'dark:hover:bg-slate-900/80' -> 'bg-slate-900/80')
      const cleanCls = cls.split(':').pop() || '';
      // Strip opacity modifiers (e.g. 'bg-slate-900/80' -> 'bg-slate-900')
      const baseCls = cleanCls.replace(/\/(?:[0-9]{1,3}|\[[^\]]+\])$/, '');

      // 8a. Arbitrary Color Utility Classes: bg-[#...], text-[#...], border-[#...]
      const hexMatch = baseCls.match(
        /^(bg|text|border|ring|fill|stroke|from|to|via)-\[#([0-9a-fA-F]{3,8})\]$/
      );
      if (hexMatch) {
        const type =
          hexMatch[1] === 'text'
            ? 'text'
            : hexMatch[1] === 'border' || hexMatch[1] === 'ring'
            ? 'border'
            : 'background';
        recordColor(`#${hexMatch[2]}`, type, 2);
      }

      // 8b. Standard Tailwind Palette Colors (e.g., text-slate-900, bg-blue-600)
      const twMatch = baseCls.match(
        /^(bg|text|border|ring|fill|stroke|from|to|via)-([a-z]+)-(\d{2,3})$/
      );
      if (twMatch) {
        const [, prefix, colorName, shade] = twMatch;
        const hex = TAILWIND_COLORS[colorName]?.[shade];
        if (hex) {
          const type =
            prefix === 'text'
              ? 'text'
              : prefix === 'border' || prefix === 'ring'
              ? 'border'
              : 'background';
          recordColor(hex, type, 2);
        }
      }

      // Black & White utilities
      if (/^(bg|from|to|via)-(black|white)$/.test(baseCls)) {
        recordColor(baseCls.endsWith('black') ? '#000000' : '#ffffff', 'background', 1);
      } else if (/^text-(black|white)$/.test(baseCls)) {
        recordColor(baseCls.endsWith('black') ? '#000000' : '#ffffff', 'text', 1);
      } else if (/^(border|ring)-(black|white)$/.test(baseCls)) {
        recordColor(baseCls.endsWith('black') ? '#000000' : '#ffffff', 'border', 1);
      }

      // 8c. Radius utility classes
      if (baseCls === 'rounded-none') radiusMap.set('0px', (radiusMap.get('0px') || 0) + 1);
      else if (baseCls === 'rounded-xs' || baseCls === 'rounded-sm')
        radiusMap.set('2px', (radiusMap.get('2px') || 0) + 1);
      else if (baseCls === 'rounded') radiusMap.set('4px', (radiusMap.get('4px') || 0) + 1);
      else if (baseCls === 'rounded-md') radiusMap.set('6px', (radiusMap.get('6px') || 0) + 1);
      else if (baseCls === 'rounded-lg') radiusMap.set('8px', (radiusMap.get('8px') || 0) + 1);
      else if (baseCls === 'rounded-xl') radiusMap.set('12px', (radiusMap.get('12px') || 0) + 1);
      else if (baseCls === 'rounded-2xl') radiusMap.set('16px', (radiusMap.get('16px') || 0) + 1);
      else if (baseCls === 'rounded-3xl') radiusMap.set('24px', (radiusMap.get('24px') || 0) + 1);
      else if (baseCls === 'rounded-full') radiusMap.set('9999px', (radiusMap.get('9999px') || 0) + 1);
      else {
        const customRadius = baseCls.match(
          /^rounded(?:-[trblse]{1,2})?-\[(\d+(?:\.\d+)?(?:px|rem|em)?)\]$/
        );
        if (customRadius) {
          let rVal = customRadius[1];
          if (rVal.endsWith('rem')) {
            rVal = `${Math.round(parseFloat(rVal) * 16)}px`;
          }
          radiusMap.set(rVal, (radiusMap.get(rVal) || 0) + 1);
        }
      }

      // 8d. Shadow utility classes
      if (baseCls === 'shadow-2xs' || baseCls === 'shadow-xs') {
        shadowMap.set('0 1px 2px 0 rgba(0,0,0,0.05)', (shadowMap.get('0 1px 2px 0 rgba(0,0,0,0.05)') || 0) + 1);
      } else if (baseCls === 'shadow-sm') {
        shadowMap.set('0 1px 3px 0 rgba(0,0,0,0.1)', (shadowMap.get('0 1px 3px 0 rgba(0,0,0,0.1)') || 0) + 1);
      } else if (baseCls === 'shadow' || baseCls === 'shadow-md') {
        shadowMap.set('0 4px 6px -1px rgba(0,0,0,0.1)', (shadowMap.get('0 4px 6px -1px rgba(0,0,0,0.1)') || 0) + 1);
      } else if (baseCls === 'shadow-lg') {
        shadowMap.set('0 10px 15px -3px rgba(0,0,0,0.1)', (shadowMap.get('0 10px 15px -3px rgba(0,0,0,0.1)') || 0) + 1);
      } else if (baseCls === 'shadow-xl') {
        shadowMap.set('0 20px 25px -5px rgba(0,0,0,0.1)', (shadowMap.get('0 20px 25px -5px rgba(0,0,0,0.1)') || 0) + 1);
      } else if (baseCls === 'shadow-2xl') {
        shadowMap.set('0 25px 50px -12px rgba(0,0,0,0.25)', (shadowMap.get('0 25px 50px -12px rgba(0,0,0,0.25)') || 0) + 1);
      }

      // 8e. Typography hints from utility classes
      if (baseCls === 'font-sans') {
        allFontFamiliesSet.add('Inter, system-ui, -apple-system, sans-serif');
      } else if (baseCls === 'font-serif') {
        allFontFamiliesSet.add('ui-serif, Georgia, Cambria, serif');
      } else if (baseCls === 'font-mono') {
        allFontFamiliesSet.add('ui-monospace, SFMono-Regular, Menlo, Monaco, monospace');
      }

      // Enrich tagStyles for semantic elements if not already defined in CSS rules
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'button', 'a'].includes(tagName)) {
        if (!tagStyles[tagName]) tagStyles[tagName] = {};
        const rule = tagStyles[tagName];

        if (!rule.fontSize) {
          if (baseCls === 'text-xs') rule.fontSize = '12px';
          else if (baseCls === 'text-sm') rule.fontSize = '14px';
          else if (baseCls === 'text-base') rule.fontSize = '16px';
          else if (baseCls === 'text-lg') rule.fontSize = '18px';
          else if (baseCls === 'text-xl') rule.fontSize = '20px';
          else if (baseCls === 'text-2xl') rule.fontSize = '24px';
          else if (baseCls === 'text-3xl') rule.fontSize = '30px';
          else if (baseCls === 'text-4xl') rule.fontSize = '36px';
          else if (baseCls === 'text-5xl') rule.fontSize = '48px';
          else if (baseCls === 'text-6xl') rule.fontSize = '60px';
        }

        if (!rule.fontWeight) {
          if (baseCls === 'font-normal') rule.fontWeight = '400';
          else if (baseCls === 'font-medium') rule.fontWeight = '500';
          else if (baseCls === 'font-semibold') rule.fontWeight = '600';
          else if (baseCls === 'font-bold') rule.fontWeight = '700';
          else if (baseCls === 'font-extrabold') rule.fontWeight = '800';
        }
      }
    }
  });

  // 9. Build Extracted Colors (Sorted by frequency, enriched with WCAG contrastText)
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

  // 10. Build Semantic Typography Ramps (h1, h2, h3, p, etc.)
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

    const rawRule = tagStyles[tag] || {};
    const defaults = defaultSizes[tag] || defaultSizes.p;

    const resolvedFontFamily = rawRule.fontFamily
      ? resolveCssVariable(rawRule.fontFamily, rootVariables)
      : undefined;
    const resolvedFontSize = rawRule.fontSize
      ? resolveCssVariable(rawRule.fontSize, rootVariables)
      : undefined;
    const resolvedFontWeight = rawRule.fontWeight
      ? resolveCssVariable(rawRule.fontWeight, rootVariables)
      : undefined;
    const resolvedLineHeight = rawRule.lineHeight
      ? resolveCssVariable(rawRule.lineHeight, rootVariables)
      : undefined;
    const resolvedLetterSpacing = rawRule.letterSpacing
      ? resolveCssVariable(rawRule.letterSpacing, rootVariables)
      : undefined;

    const fontFamily =
      resolvedFontFamily &&
      !resolvedFontFamily.startsWith('var(') &&
      resolvedFontFamily !== 'inherit' &&
      resolvedFontFamily !== 'initial'
        ? resolvedFontFamily
        : primaryFont;

    const fontSize =
      resolvedFontSize &&
      !resolvedFontSize.startsWith('var(') &&
      resolvedFontSize !== 'inherit' &&
      resolvedFontSize !== 'initial'
        ? resolvedFontSize
        : defaults.size;

    const fontWeight =
      resolvedFontWeight &&
      !resolvedFontWeight.startsWith('var(') &&
      resolvedFontWeight !== 'inherit' &&
      resolvedFontWeight !== 'initial'
        ? resolvedFontWeight
        : defaults.weight;

    const lineHeight =
      resolvedLineHeight &&
      !resolvedLineHeight.startsWith('var(') &&
      resolvedLineHeight !== 'inherit' &&
      resolvedLineHeight !== 'initial'
        ? resolvedLineHeight
        : defaults.line;

    const letterSpacing =
      resolvedLetterSpacing &&
      !resolvedLetterSpacing.startsWith('var(') &&
      resolvedLetterSpacing !== 'inherit'
        ? resolvedLetterSpacing
        : 'normal';

    return {
      tag,
      fontFamily,
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      sampleText,
    };
  });

  // 11. Build Radii
  const filteredRadii = Array.from(radiusMap.entries())
    .filter(([val]) => val !== '0px' && val !== '0')
    .sort((a, b) => b[1] - a[1]);

  if (filteredRadii.length === 0) {
    filteredRadii.push(['4px', 10], ['8px', 8], ['12px', 5]);
  }

  const radii: ExtractedRadius[] = filteredRadii.slice(0, 4).map(([value, count]) => ({
    value,
    count,
  }));

  // 12. Build Shadows
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
    url: normalizedUrl,
    title,
    fontFamilies: Array.from(allFontFamiliesSet),
    colors,
    typography,
    radii,
    shadows,
  };
}
