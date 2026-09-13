import type { DesignSystem, DesignSystemExports, ExtractedColor, ExtractedShadow } from '@/types/tokens';
import { generateBrandColorRamp } from '@/lib/color-normalizer';

type SystemCore = Pick<DesignSystem, 'palette' | 'typeScale' | 'radii' | 'shadows' | 'fonts'>;

/**
 * Generates a clean tailwind.config.js theme.extend snippet with colors, fontFamily, fontSize, borderRadius, and boxShadow.
 */
export function generateTailwindConfig(system: SystemCore): string {
  const { palette, typeScale, radii, shadows, fonts } = system;
  const colorsConfig: Record<string, any> = {};

  if (palette.primary.length > 0) {
    const primaryHex = palette.primary[0].hex;
    const ramp = generateBrandColorRamp(primaryHex);
    colorsConfig.primary = {
      DEFAULT: primaryHex,
      ...ramp,
    };
  }

  if (palette.surfaces.length > 0) {
    colorsConfig.surface = {};
    palette.surfaces.forEach((c, i) => {
      colorsConfig.surface[i === 0 ? 'DEFAULT' : `${(i + 1) * 100}`] = c.hex;
    });
  }

  if (palette.neutrals.length > 0) {
    colorsConfig.neutral = {};
    palette.neutrals.forEach((c, i) => {
      colorsConfig.neutral[`${(i + 1) * 100}`] = c.hex;
    });
  }

  if (palette.accents.length > 0) {
    colorsConfig.accent = {};
    palette.accents.forEach((c, i) => {
      colorsConfig.accent[`${i + 1}`] = c.hex;
    });
  }

  const fontSizeConfig: Record<string, [string, { lineHeight: string }]> = {};
  for (const item of typeScale) {
    fontSizeConfig[item.name] = [item.fontSize, { lineHeight: item.lineHeight }];
  }

  const radiusConfig: Record<string, string> = {};
  radii.forEach((r, i) => {
    const key = i === 0 ? 'DEFAULT' : `radius-${i}`;
    radiusConfig[key] = r.value;
  });

  const shadowConfig: Record<string, string> = {};
  shadows.forEach((s) => {
    shadowConfig[s.name] = s.value;
  });

  const config = {
    theme: {
      extend: {
        colors: colorsConfig,
        fontFamily: {
          heading: [fonts.heading, 'sans-serif'],
          body: [fonts.body, 'sans-serif'],
        },
        fontSize: fontSizeConfig,
        borderRadius: radiusConfig,
        boxShadow: shadowConfig,
      },
    },
  };

  const integrationComment = [
    '// 1. Copy the object below',
    '// 2. Paste into tailwind.config.js under `module.exports = { theme: { extend: { ... } } }`',
    '',
  ].join('\n');

  return `${integrationComment}/** @type {import('tailwindcss').Config} */\nmodule.exports = ${JSON.stringify(config, null, 2)};\n`;
}

/**
 * Generates valid :root { ... } CSS custom properties.
 */
export function generateCSSVariables(system: SystemCore): string {
  const { palette, typeScale, radii, shadows, fonts } = system;
  const lines: string[] = [
    '/* Paste into your root stylesheet (e.g., globals.css / style.css) */',
    ':root {',
  ];

  // Font Families
  lines.push('  /* Font Families */');
  lines.push(`  --font-heading: "${fonts.heading}", sans-serif;`);
  lines.push(`  --font-body: "${fonts.body}", sans-serif;`);
  lines.push('');

  // Primary Colors
  if (palette.primary.length > 0) {
    lines.push('  /* Primary Brand & 50–950 Color Ramp */');
    lines.push(`  --color-primary: ${palette.primary[0].hex};`);
    lines.push(`  --color-primary-contrast: ${palette.primary[0].contrastText};`);
    const ramp = generateBrandColorRamp(palette.primary[0].hex);
    for (const [step, hexVal] of Object.entries(ramp)) {
      lines.push(`  --color-primary-${step}: ${hexVal};`);
    }
    lines.push('');
  }

  // Surfaces
  if (palette.surfaces.length > 0) {
    lines.push('  /* Surfaces & Backgrounds */');
    palette.surfaces.forEach((c, i) => {
      lines.push(`  --color-surface-${i + 1}: ${c.hex};`);
      lines.push(`  --color-surface-${i + 1}-contrast: ${c.contrastText};`);
    });
    lines.push('');
  }

  // Neutrals
  if (palette.neutrals.length > 0) {
    lines.push('  /* Neutrals & Text */');
    palette.neutrals.forEach((c, i) => {
      lines.push(`  --color-neutral-${(i + 1) * 100}: ${c.hex};`);
    });
    lines.push('');
  }

  // Accents
  if (palette.accents.length > 0) {
    lines.push('  /* Accent Swatches */');
    palette.accents.forEach((c, i) => {
      lines.push(`  --color-accent-${i + 1}: ${c.hex};`);
      lines.push(`  --color-accent-${i + 1}-contrast: ${c.contrastText};`);
    });
    lines.push('');
  }

  // Typography Scale
  lines.push('  /* Typography Scale */');
  for (const item of typeScale) {
    lines.push(`  --font-size-${item.name}: ${item.fontSize};`);
    lines.push(`  --line-height-${item.name}: ${item.lineHeight};`);
  }
  lines.push('');

  // Border Radii
  if (radii.length > 0) {
    lines.push('  /* Border Radii */');
    radii.forEach((r, i) => {
      lines.push(`  --radius-${i + 1}: ${r.value};`);
    });
    lines.push('');
  }

  // Box Shadows / Elevations
  if (shadows.length > 0) {
    lines.push('  /* Elevations & Box Shadows */');
    shadows.forEach((s) => {
      lines.push(`  --shadow-${s.name}: ${s.value};`);
    });
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generates standard Design Tokens Community Group (DTCG) / Tokens Studio compliant JSON schema.
 */
export function generateTokensJSON(system: SystemCore): string {
  const { palette, typeScale, radii, shadows, fonts } = system;

  const dtcg: Record<string, any> = {
    $schema: 'https://design-tokens.github.io/community-group/format/',
    color: {},
    fontFamily: {
      heading: { $type: 'fontFamily', $value: fonts.heading },
      body: { $type: 'fontFamily', $value: fonts.body },
    },
    typography: {},
    borderRadius: {},
    boxShadow: {},
  };

  if (palette.primary.length > 0) {
    const primaryHex = palette.primary[0].hex;
    const ramp = generateBrandColorRamp(primaryHex);
    dtcg.color.primary = {
      $type: 'color',
      $value: primaryHex,
      $description: 'Primary brand color',
      contrastText: palette.primary[0].contrastText,
    };
    for (const [step, hexVal] of Object.entries(ramp)) {
      dtcg.color.primary[step] = {
        $type: 'color',
        $value: hexVal,
        $description: `Primary brand shade ${step}`,
      };
    }
  }

  if (palette.surfaces.length > 0) {
    dtcg.color.surface = {};
    palette.surfaces.forEach((c, i) => {
      dtcg.color.surface[`surface-${i + 1}`] = {
        $type: 'color',
        $value: c.hex,
        $description: `Surface layer ${i + 1}`,
        contrastText: c.contrastText,
      };
    });
  }

  if (palette.neutrals.length > 0) {
    dtcg.color.neutral = {};
    palette.neutrals.forEach((c, i) => {
      dtcg.color.neutral[`neutral-${(i + 1) * 100}`] = {
        $type: 'color',
        $value: c.hex,
        $description: `Neutral shade ${(i + 1) * 100}`,
      };
    });
  }

  if (palette.accents.length > 0) {
    dtcg.color.accent = {};
    palette.accents.forEach((c, i) => {
      dtcg.color.accent[`accent-${i + 1}`] = {
        $type: 'color',
        $value: c.hex,
        $description: `Accent color ${i + 1}`,
        contrastText: c.contrastText,
      };
    });
  }

  for (const item of typeScale) {
    dtcg.typography[item.name] = {
      $type: 'typography',
      $value: {
        fontSize: item.fontSize,
        lineHeight: item.lineHeight,
        fontFamily: ['display', 'h1', 'h2', 'h3'].includes(item.name) ? fonts.heading : fonts.body,
      },
    };
  }

  radii.forEach((r, i) => {
    dtcg.borderRadius[`radius-${i + 1}`] = {
      $type: 'borderRadius',
      $value: r.value,
    };
  });

  shadows.forEach((s) => {
    dtcg.boxShadow[s.name] = {
      $type: 'boxShadow',
      $value: s.value,
    };
  });

  return JSON.stringify(dtcg, null, 2);
}

/**
 * Generates all export formats for a DesignSystem.
 */
export function generateAllExports(system: SystemCore): DesignSystemExports {
  return {
    tailwind: generateTailwindConfig(system),
    cssVars: generateCSSVariables(system),
    tokensJson: generateTokensJSON(system),
  };
}
