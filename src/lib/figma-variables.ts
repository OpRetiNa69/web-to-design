import type { DesignSystem } from '@/types/tokens';
import { generateBrandColorRamp } from '@/lib/color-normalizer';

function parseNumericPx(val: string, fallback: number = 16): number {
  const match = val.match(/([\d.]+)px/i);
  if (match) {
    return Math.round(parseFloat(match[1]));
  }
  const num = parseFloat(val);
  return isNaN(num) ? fallback : Math.round(num);
}

export interface FigmaVariableItem {
  id?: string;
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, string | number | boolean>;
  description?: string;
  scopes?: string[];
}

export interface FigmaVariablesCollectionSchema {
  collection: string;
  modes: Record<string, string>;
  variableCollections: Array<{
    id: string;
    name: string;
    modes: Array<{ modeId: string; name: string }>;
    defaultModeId: string;
  }>;
  variables: FigmaVariableItem[];
}

/**
 * Generates Figma Variables collection JSON adhering to Figma REST API
 * and Tokens Studio standard structure with modes, variables, and resolvedType.
 */
export function generateFigmaVariablesJSON(system: DesignSystem): string {
  const modeKey = 'mode:default';
  const defaultModeName = 'Default';

  const variables: FigmaVariableItem[] = [];

  // 1. Primary Brand Color & 50-950 Ladder
  if (system.palette.primary.length > 0) {
    const primaryHex = system.palette.primary[0].hex;
    const ramp = generateBrandColorRamp(primaryHex);

    variables.push({
      id: 'var:color:primary:default',
      name: 'color/primary/DEFAULT',
      resolvedType: 'COLOR',
      valuesByMode: {
        [modeKey]: primaryHex,
        default: primaryHex,
      },
      description: 'Primary base brand color',
      scopes: ['ALL_FILLS', 'STROKE_COLOR'],
    });

    for (const [step, hexVal] of Object.entries(ramp)) {
      variables.push({
        id: `var:color:primary:${step}`,
        name: `color/primary/${step}`,
        resolvedType: 'COLOR',
        valuesByMode: {
          [modeKey]: hexVal,
          default: hexVal,
        },
        description: `Primary brand shade ${step}`,
        scopes: ['ALL_FILLS', 'STROKE_COLOR'],
      });
    }
  }

  // 2. Surfaces
  system.palette.surfaces.forEach((c, i) => {
    variables.push({
      id: `var:color:surface:${i + 1}`,
      name: `color/surface/${i + 1}`,
      resolvedType: 'COLOR',
      valuesByMode: {
        [modeKey]: c.hex,
        default: c.hex,
      },
      description: `Surface background tier ${i + 1}`,
      scopes: ['FRAME_FILL', 'SHAPE_FILL'],
    });
  });

  // 3. Neutrals
  system.palette.neutrals.forEach((c, i) => {
    const step = (i + 1) * 100;
    variables.push({
      id: `var:color:neutral:${step}`,
      name: `color/neutral/${step}`,
      resolvedType: 'COLOR',
      valuesByMode: {
        [modeKey]: c.hex,
        default: c.hex,
      },
      description: `Neutral gray level ${step}`,
      scopes: ['TEXT_FILL', 'STROKE_COLOR'],
    });
  });

  // 4. Accents
  system.palette.accents.forEach((c, i) => {
    variables.push({
      id: `var:color:accent:${i + 1}`,
      name: `color/accent/${i + 1}`,
      resolvedType: 'COLOR',
      valuesByMode: {
        [modeKey]: c.hex,
        default: c.hex,
      },
      description: `Secondary brand accent ${i + 1}`,
      scopes: ['ALL_FILLS'],
    });
  });

  // 5. Border Radii (FLOAT)
  system.radii.forEach((r, i) => {
    const pxNum = parseNumericPx(r.value, 8);
    variables.push({
      id: `var:radius:${i + 1}`,
      name: `radius/${i + 1}`,
      resolvedType: 'FLOAT',
      valuesByMode: {
        [modeKey]: pxNum,
        default: pxNum,
      },
      description: `Corner radius token (${r.value})`,
      scopes: ['CORNER_RADIUS'],
    });
  });

  // 6. Typography Font Sizes (FLOAT)
  system.typeScale.forEach((item) => {
    const pxNum = parseNumericPx(item.fontSize, 16);
    variables.push({
      id: `var:typography:size:${item.name}`,
      name: `typography/fontSize/${item.name}`,
      resolvedType: 'FLOAT',
      valuesByMode: {
        [modeKey]: pxNum,
        default: pxNum,
      },
      description: `Type size for ${item.name} (${item.fontSize})`,
      scopes: ['FONT_SIZE'],
    });
  });

  // 7. Font Families (STRING)
  variables.push({
    id: 'var:typography:fontFamily:heading',
    name: 'typography/fontFamily/heading',
    resolvedType: 'STRING',
    valuesByMode: {
      [modeKey]: system.fonts.heading,
      default: system.fonts.heading,
    },
    description: 'Heading font family',
    scopes: ['FONT_FAMILY'],
  });

  variables.push({
    id: 'var:typography:fontFamily:body',
    name: 'typography/fontFamily/body',
    resolvedType: 'STRING',
    valuesByMode: {
      [modeKey]: system.fonts.body,
      default: system.fonts.body,
    },
    description: 'Body font family',
    scopes: ['FONT_FAMILY'],
  });

  const schema: FigmaVariablesCollectionSchema = {
    collection: 'Design Tokens',
    modes: {
      [modeKey]: defaultModeName,
      default: defaultModeName,
    },
    variableCollections: [
      {
        id: 'VariableCollectionId:tokens',
        name: 'Design Tokens',
        modes: [{ modeId: modeKey, name: defaultModeName }],
        defaultModeId: modeKey,
      },
    ],
    variables,
  };

  return JSON.stringify(schema, null, 2);
}
