import type { ExtractedShadow } from '@/types/tokens';

/**
 * Calculates an approximate visual depth score for a CSS box-shadow string
 * based on its blur radii and Y offsets.
 */
function calculateShadowDepth(shadowStr: string): number {
  let maxBlur = 0;
  let maxY = 0;

  // Split multi-layer shadows by comma not inside parenthesis
  const layers = shadowStr.split(/,(?![^(]*\))/);
  for (const layer of layers) {
    // Ignore insets for depth calculation
    if (layer.includes('inset')) continue;

    // Match numbers with px/rem or unitless
    const matches = layer.match(/(-?[\d.]+)px/g);
    if (matches && matches.length >= 2) {
      const y = Math.abs(parseFloat(matches[1]));
      const blur = matches[2] ? parseFloat(matches[2]) : 0;
      if (blur > maxBlur) maxBlur = blur;
      if (y > maxY) maxY = y;
    }
  }

  return maxBlur * 1.5 + maxY;
}

/**
 * Default clean, modern elevation shadows used as fallbacks if none are extracted.
 */
export const DEFAULT_ELEVATIONS: ExtractedShadow[] = [
  {
    name: 'Elevation 1',
    value: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
    count: 10,
  },
  {
    name: 'Elevation 2',
    value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    count: 6,
  },
  {
    name: 'Elevation 3',
    value: '0 12px 16px -4px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.08)',
    count: 3,
  },
];

/**
 * Normalizes an arbitrary set of discovered CSS box-shadows into 3 discrete elevation levels:
 * - Elevation 1: Subtle card / button / input shadow
 * - Elevation 2: Floating menu / popover / interactive card
 * - Elevation 3: High-elevation modal / drawer / floating sheet
 */
export function normalizeElevations(
  rawShadows: ExtractedShadow[] | Map<string, number> | string[]
): ExtractedShadow[] {
  const shadowEntries: Array<{ value: string; count: number }> = [];

  if (Array.isArray(rawShadows)) {
    for (const item of rawShadows) {
      if (typeof item === 'string') {
        const val = item.trim();
        if (val && val !== 'none' && val !== 'inherit' && val !== 'initial' && val !== 'unset') {
          shadowEntries.push({ value: val, count: 1 });
        }
      } else if (item && typeof item === 'object' && item.value) {
        const val = item.value.trim();
        if (val && val !== 'none' && val !== 'inherit' && val !== 'initial' && val !== 'unset') {
          shadowEntries.push({ value: val, count: item.count || 1 });
        }
      }
    }
  } else if (rawShadows instanceof Map) {
    for (const [val, count] of rawShadows.entries()) {
      const cleanVal = val.trim();
      if (
        cleanVal &&
        cleanVal !== 'none' &&
        cleanVal !== 'inherit' &&
        cleanVal !== 'initial' &&
        cleanVal !== 'unset'
      ) {
        shadowEntries.push({ value: cleanVal, count });
      }
    }
  }

  // Deduplicate and aggregate counts
  const aggregatedMap = new Map<string, number>();
  for (const { value, count } of shadowEntries) {
    aggregatedMap.set(value, (aggregatedMap.get(value) || 0) + count);
  }

  const validShadows = Array.from(aggregatedMap.entries()).map(([value, count]) => ({
    value,
    count,
    depth: calculateShadowDepth(value),
  }));

  if (validShadows.length === 0) {
    return DEFAULT_ELEVATIONS;
  }

  // Sort by depth ascending
  validShadows.sort((a, b) => a.depth - b.depth);

  if (validShadows.length === 1) {
    return [
      { name: 'Elevation 1', value: validShadows[0].value, count: validShadows[0].count },
      DEFAULT_ELEVATIONS[1],
      DEFAULT_ELEVATIONS[2],
    ];
  }

  if (validShadows.length === 2) {
    return [
      { name: 'Elevation 1', value: validShadows[0].value, count: validShadows[0].count },
      { name: 'Elevation 2', value: validShadows[1].value, count: validShadows[1].count },
      DEFAULT_ELEVATIONS[2],
    ];
  }

  // Pick low, medium, and high elevations from the distribution
  const low = validShadows[0];
  const midIndex = Math.floor(validShadows.length / 2);
  const mid = validShadows[midIndex];
  const high = validShadows[validShadows.length - 1];

  return [
    { name: 'Elevation 1', value: low.value, count: low.count },
    { name: 'Elevation 2', value: mid.value, count: mid.count },
    { name: 'Elevation 3', value: high.value, count: high.count },
  ];
}
