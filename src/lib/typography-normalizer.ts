import type { ExtractedTypography, TypeScaleItem, DesignSystemFonts } from '@/types/tokens';

/**
 * Parses font size string (e.g. "16px", "1.25rem", "24pt") to comparable numeric pixel value.
 * Assumes 1rem = 16px, 1em = 16px.
 */
export function parseFontSizeToPixels(fontSizeStr: string): number {
  if (!fontSizeStr) return 16;
  const trimmed = fontSizeStr.trim().toLowerCase();

  if (trimmed.endsWith('px')) {
    return parseFloat(trimmed) || 16;
  }
  if (trimmed.endsWith('rem')) {
    return (parseFloat(trimmed) || 1) * 16;
  }
  if (trimmed.endsWith('em')) {
    return (parseFloat(trimmed) || 1) * 16;
  }
  if (trimmed.endsWith('pt')) {
    return (parseFloat(trimmed) || 12) * (4 / 3);
  }

  const num = parseFloat(trimmed);
  return isNaN(num) ? 16 : num;
}

/**
 * Standardizes line height values: converts "normal" to numeric defaults (1.2 for headings, 1.5 for body),
 * and standardizes unitless values.
 */
export function normalizeLineHeight(lineHeightStr: string, isHeading: boolean): string {
  if (!lineHeightStr || lineHeightStr.trim() === '' || lineHeightStr.trim().toLowerCase() === 'normal') {
    return isHeading ? '1.2' : '1.5';
  }

  const trimmed = lineHeightStr.trim();
  // If line height is in px, convert to clean unitless ratio relative to font size if needed,
  // or retain clean standardized string
  return trimmed;
}

type ScaleName = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'caption';

interface ScaleDefinition {
  name: ScaleName;
  min: number;
  max: number;
  defaultPx: number;
  defaultLineHeight: string;
  defaultTag: string;
  isHeading: boolean;
}

const SCALE_DEFINITIONS: ScaleDefinition[] = [
  { name: 'display', min: 48, max: Infinity, defaultPx: 56, defaultLineHeight: '1.1', defaultTag: 'h1', isHeading: true },
  { name: 'h1', min: 36, max: 47.99, defaultPx: 40, defaultLineHeight: '1.2', defaultTag: 'h1', isHeading: true },
  { name: 'h2', min: 28, max: 35.99, defaultPx: 32, defaultLineHeight: '1.25', defaultTag: 'h2', isHeading: true },
  { name: 'h3', min: 20, max: 27.99, defaultPx: 24, defaultLineHeight: '1.3', defaultTag: 'h3', isHeading: true },
  { name: 'body', min: 14, max: 19.99, defaultPx: 16, defaultLineHeight: '1.5', defaultTag: 'p', isHeading: false },
  { name: 'caption', min: 0, max: 13.99, defaultPx: 12, defaultLineHeight: '1.4', defaultTag: 'span', isHeading: false },
];

export interface TypographyAnalysis {
  typeScale: TypeScaleItem[];
  fonts: DesignSystemFonts;
}

/**
 * Normalizes raw extracted typography instances into a structured, semantic type scale
 * and detects the dominant font family for headings (h1-h3) versus body copy (p).
 */
export function normalizeTypography(rawTypography: ExtractedTypography[]): TypographyAnalysis {
  const buckets: Record<ScaleName, ExtractedTypography[]> = {
    display: [],
    h1: [],
    h2: [],
    h3: [],
    body: [],
    caption: [],
  };

  const headingFontsCount = new Map<string, number>();
  const bodyFontsCount = new Map<string, number>();

  for (const typo of rawTypography) {
    const px = parseFontSizeToPixels(typo.fontSize);
    const tag = typo.tag.toLowerCase();

    // Clean primary font family
    const primaryFont = typo.fontFamily
      .split(',')[0]
      .trim()
      .replace(/^["']|["']$/g, '');

    // Track heading vs body font families
    if (['h1', 'h2', 'h3'].includes(tag)) {
      headingFontsCount.set(primaryFont, (headingFontsCount.get(primaryFont) || 0) + 1);
    } else if (tag === 'p') {
      bodyFontsCount.set(primaryFont, (bodyFontsCount.get(primaryFont) || 0) + 1);
    } else {
      // General text
      bodyFontsCount.set(primaryFont, (bodyFontsCount.get(primaryFont) || 0) + 1);
    }

    // Place into corresponding scale definition bucket
    for (const def of SCALE_DEFINITIONS) {
      if (px >= def.min && px <= def.max) {
        buckets[def.name].push(typo);
        break;
      }
    }
  }

  // Detect dominant font families
  const dominantHeading =
    Array.from(headingFontsCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    Array.from(bodyFontsCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    'sans-serif';

  const dominantBody =
    Array.from(bodyFontsCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    dominantHeading;

  // Build the final TypeScaleItem array for each defined tier
  const typeScale: TypeScaleItem[] = SCALE_DEFINITIONS.map((def) => {
    const matched = buckets[def.name];

    if (matched && matched.length > 0) {
      // Pick the specimen with the most representative tag or highest fidelity
      const representative =
        matched.find((m) => m.tag.toLowerCase() === def.defaultTag) || matched[0];

      return {
        name: def.name,
        fontSize: representative.fontSize,
        lineHeight: normalizeLineHeight(representative.lineHeight, def.isHeading),
        sampleTag: representative.tag,
      };
    }

    // Fallback if website lacks elements in this specific tier
    return {
      name: def.name,
      fontSize: `${def.defaultPx}px`,
      lineHeight: def.defaultLineHeight,
      sampleTag: def.defaultTag,
    };
  });

  return {
    typeScale,
    fonts: {
      heading: dominantHeading,
      body: dominantBody,
    },
  };
}
