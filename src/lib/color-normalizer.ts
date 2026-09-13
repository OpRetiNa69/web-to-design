import { colord, extend } from 'colord';
import labPlugin from 'colord/plugins/lab';
import harmoniesPlugin from 'colord/plugins/harmonies';
import a11yPlugin from 'colord/plugins/a11y';
import type { ExtractedColor } from '@/types/tokens';

extend([labPlugin, harmoniesPlugin, a11yPlugin]);

function rad2deg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculates accessible text color (#ffffff or #000000) based on WCAG contrast ratio.
 */
export function getAccessibleContrastText(hex: string): string {
  const whiteRatio = colord(hex).contrast('#ffffff');
  const blackRatio = colord(hex).contrast('#000000');
  return whiteRatio >= blackRatio ? '#ffffff' : '#000000';
}

/**
 * Calculates the CIEDE2000 color difference between two hex colors.
 * Values below ~3.5 are generally near-imperceptible to the human eye.
 */
export function deltaE2000(hex1: string, hex2: string): number {
  const lab1 = colord(hex1).toLab();
  const lab2 = colord(hex2).toLab();

  const L1 = lab1.l;
  const a1 = lab1.a;
  const b1 = lab1.b;

  const L2 = lab2.l;
  const a2 = lab2.a;
  const b2 = lab2.b;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const C_bar = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(C_bar, 7) / (Math.pow(C_bar, 7) + Math.pow(25, 7))));
  const a1_prime = a1 * (1 + G);
  const a2_prime = a2 * (1 + G);

  const C1_prime = Math.sqrt(a1_prime * a1_prime + b1 * b1);
  const C2_prime = Math.sqrt(a2_prime * a2_prime + b2 * b2);

  let h1_prime = rad2deg(Math.atan2(b1, a1_prime));
  if (h1_prime < 0) h1_prime += 360;
  let h2_prime = rad2deg(Math.atan2(b2, a2_prime));
  if (h2_prime < 0) h2_prime += 360;

  const delta_L_prime = L2 - L1;
  const delta_C_prime = C2_prime - C1_prime;

  let delta_h_prime = 0;
  if (C1_prime * C2_prime !== 0) {
    const diff = h2_prime - h1_prime;
    if (Math.abs(diff) <= 180) {
      delta_h_prime = diff;
    } else if (diff > 180) {
      delta_h_prime = diff - 360;
    } else {
      delta_h_prime = diff + 360;
    }
  }

  const delta_H_prime = 2 * Math.sqrt(C1_prime * C2_prime) * Math.sin(deg2rad(delta_h_prime / 2));

  const L_bar_prime = (L1 + L2) / 2;
  const C_bar_prime = (C1_prime + C2_prime) / 2;

  let h_bar_prime = 0;
  if (C1_prime * C2_prime !== 0) {
    const diff = Math.abs(h1_prime - h2_prime);
    if (diff <= 180) {
      h_bar_prime = (h1_prime + h2_prime) / 2;
    } else {
      if (h1_prime + h2_prime < 360) {
        h_bar_prime = (h1_prime + h2_prime + 360) / 2;
      } else {
        h_bar_prime = (h1_prime + h2_prime - 360) / 2;
      }
    }
  }

  const T =
    1 -
    0.17 * Math.cos(deg2rad(h_bar_prime - 30)) +
    0.24 * Math.cos(deg2rad(2 * h_bar_prime)) +
    0.32 * Math.cos(deg2rad(3 * h_bar_prime + 6)) -
    0.20 * Math.cos(deg2rad(4 * h_bar_prime - 63));

  const delta_theta = 30 * Math.exp(-Math.pow((h_bar_prime - 275) / 25, 2));
  const R_C = 2 * Math.sqrt(Math.pow(C_bar_prime, 7) / (Math.pow(C_bar_prime, 7) + Math.pow(25, 7)));
  const S_L =
    1 + (0.015 * Math.pow(L_bar_prime - 50, 2)) / Math.sqrt(20 + Math.pow(L_bar_prime - 50, 2));
  const S_C = 1 + 0.045 * C_bar_prime;
  const S_H = 1 + 0.015 * C_bar_prime * T;
  const R_T = -Math.sin(deg2rad(2 * delta_theta)) * R_C;

  const dE = Math.sqrt(
    Math.pow(delta_L_prime / S_L, 2) +
      Math.pow(delta_C_prime / S_C, 2) +
      Math.pow(delta_H_prime / S_H, 2) +
      R_T * (delta_C_prime / S_C) * (delta_H_prime / S_H)
  );

  return dE;
}

export interface CategorizedPalette {
  primary: ExtractedColor[];
  neutrals: ExtractedColor[];
  accents: ExtractedColor[];
  surfaces: ExtractedColor[];
}

/**
 * Clusters colors using CIEDE2000 perceptual difference (< 3.5 Delta E)
 * and categorizes them into surfaces, neutrals, primary brand colors, and accents.
 */
export function clusterAndCategorizeColors(rawColors: ExtractedColor[]): CategorizedPalette {
  if (rawColors.length === 0) {
    return { primary: [], neutrals: [], accents: [], surfaces: [] };
  }

  // 1. Sort by frequency count descending to anchor clusters to most prominent colors
  const sorted = [...rawColors].sort((a, b) => b.count - a.count);

  // 2. Perceptual clustering (Delta E < 3.5)
  const clusters: ExtractedColor[] = [];

  for (const candidate of sorted) {
    let matchedCluster: ExtractedColor | null = null;

    for (const anchor of clusters) {
      if (deltaE2000(candidate.hex, anchor.hex) < 3.5) {
        matchedCluster = anchor;
        break;
      }
    }

    if (matchedCluster) {
      // Accumulate count into the anchor swatch
      matchedCluster.count += candidate.count;
    } else {
      clusters.push({
        ...candidate,
        contrastText: getAccessibleContrastText(candidate.hex),
      });
    }
  }

  // Re-sort clusters after count aggregation
  clusters.sort((a, b) => b.count - a.count);

  const surfaces: ExtractedColor[] = [];
  const neutrals: ExtractedColor[] = [];
  const saturatedCandidates: ExtractedColor[] = [];

  // 3. Semantic Bucketing
  for (const c of clusters) {
    const hsl = colord(c.hex).toHsl();
    const saturation = hsl.s; // 0 - 100
    const luminance = c.luminance; // 0 - 1

    // Surfaces: Low saturation (< 15%) and extreme luminance (light mode > 0.9, dark mode < 0.12)
    const isExtremeLuminance = luminance > 0.9 || luminance < 0.12;
    if (isExtremeLuminance && saturation < 15) {
      surfaces.push(c);
      continue;
    }

    // Neutrals: Low saturation (< 20%) used in text and borders across remaining luminance levels
    if (saturation < 20) {
      neutrals.push(c);
      continue;
    }

    // Saturated candidates (saturation >= 20%)
    saturatedCandidates.push(c);
  }

  const primary: ExtractedColor[] = [];
  const accents: ExtractedColor[] = [];

  // 4. Primary / Brand Identification & Monochromatic Fallback
  // High-frequency color with saturation > 25%
  const vibrantColors = saturatedCandidates.filter(
    (c) => colord(c.hex).toHsl().s > 25
  );

  if (vibrantColors.length > 0) {
    // Pick the most prominent vibrant color found in interactive or background roles
    const interactiveOrFill = vibrantColors.filter(
      (c) => c.type === 'background' || c.type === 'border'
    );

    const brandAnchor = interactiveOrFill[0] || vibrantColors[0];
    primary.push(brandAnchor);

    // Accents: Remaining distinct saturated swatches (top 3–4 by count)
    for (const c of saturatedCandidates) {
      if (c.hex !== brandAnchor.hex && accents.length < 4) {
        accents.push(c);
      }
    }
  } else {
    // CRITICAL FALLBACK for monochromatic/minimal sites:
    // Designate the most frequent high-contrast neutral as the Primary brand color.
    if (neutrals.length > 0) {
      // Find the most frequent neutral
      const primaryNeutral = neutrals[0];
      primary.push(primaryNeutral);
    } else if (surfaces.length > 0) {
      // If only surfaces exist, pick the darkest surface (e.g. black on a white site or vice versa)
      primary.push(surfaces[0]);
    }
  }

  return {
    primary,
    neutrals,
    accents,
    surfaces,
  };
}

/**
 * Calculates the exact WCAG 2.1 contrast ratio between two colors (e.g. 4.5:1).
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  return Math.round(colord(color1).contrast(color2) * 10) / 10;
}

export type BrandColorRamp = Record<'50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950', string>;

/**
 * Generates a standard 50–950 tint/shade ladder from a detected brand color
 * using colord lightness steps and saturation preservation.
 */
export function generateBrandColorRamp(baseHex: string): BrandColorRamp {
  const base = colord(baseHex);
  const hsl = base.toHsl();

  const steps: Partial<BrandColorRamp> = {
    '50': colord({ h: hsl.h, s: Math.min(hsl.s, 50), l: 96 }).toHex(),
    '100': colord({ h: hsl.h, s: Math.min(hsl.s, 65), l: 92 }).toHex(),
    '200': colord({ h: hsl.h, s: Math.min(hsl.s, 75), l: 83 }).toHex(),
    '300': colord({ h: hsl.h, s: Math.min(hsl.s, 80), l: 73 }).toHex(),
    '400': colord({ h: hsl.h, s: hsl.s, l: 62 }).toHex(),
    '500': base.toHex(),
    '600': base.darken(0.08).toHex(),
    '700': base.darken(0.16).toHex(),
    '800': base.darken(0.24).toHex(),
    '900': base.darken(0.32).toHex(),
    '950': base.darken(0.40).toHex(),
  };

  // If base color is extremely dark (L < 20) or extremely light (L > 80):
  if (hsl.l < 20 || hsl.l > 80) {
    const targets: Record<keyof BrandColorRamp, number> = {
      '50': 96,
      '100': 92,
      '200': 84,
      '300': 72,
      '400': 60,
      '500': 50,
      '600': 40,
      '700': 30,
      '800': 20,
      '900': 12,
      '950': 6,
    };
    for (const [k, l] of Object.entries(targets)) {
      steps[k as keyof BrandColorRamp] = colord({ h: hsl.h, s: Math.min(hsl.s, 85), l }).toHex();
    }
  }

  return steps as BrandColorRamp;
}

