import type * as cheerio from 'cheerio';
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';

extend([a11yPlugin]);
import type {
  ExtractedButton,
  ExtractedInput,
  ExtractedCard,
  ExtractedBadge,
  ExtractedComponents,
  ExtractedColor,
  ExtractedRadius,
  ExtractedShadow,
} from '@/types/tokens';

export interface ComponentExtractorOptions {
  palette?: {
    primary?: ExtractedColor[];
    surfaces?: ExtractedColor[];
    neutrals?: ExtractedColor[];
    accents?: ExtractedColor[];
  };
  radii?: ExtractedRadius[];
  shadows?: ExtractedShadow[];
}

/**
 * Parses inline CSS style attribute string into a key-value dictionary.
 */
function parseInlineStyle(styleStr: string | undefined): Record<string, string> {
  const styles: Record<string, string> = {};
  if (!styleStr) return styles;

  const declarations = styleStr.split(';');
  for (const decl of declarations) {
    const [prop, val] = decl.split(':');
    if (prop && val) {
      styles[prop.trim().toLowerCase()] = val.trim();
    }
  }
  return styles;
}

/**
 * Extracts button components from the DOM or generates standard variants based on extracted tokens.
 */
function extractButtons(
  $: cheerio.CheerioAPI,
  options: ComponentExtractorOptions = {}
): ExtractedButton[] {
  const primaryBrand = options.palette?.primary?.[0]?.hex || '#6366f1';
  const primaryContrast = options.palette?.primary?.[0]?.contrastText || '#ffffff';
  const surfaceColor = options.palette?.surfaces?.[0]?.hex || '#18181b';
  const surfaceContrast = options.palette?.surfaces?.[0]?.contrastText || '#ffffff';
  const defaultRadius = options.radii?.[0]?.value || '8px';

  const buttons: ExtractedButton[] = [];
  const seenSignatures = new Set<string>();

  $('button, a[role="button"], a.btn, a.button, [class*="btn-"], [class*="button-"]').each(
    (_, el) => {
      if (buttons.length >= 6) return false;

      const $el = $(el);
      const text = $el.text().replace(/\s+/g, ' ').trim();
      const label =
        text.length > 0 && text.length < 35
          ? text
          : $el.attr('aria-label') || $el.attr('title') || 'Action Button';

      // Ignore empty or icon-only buttons
      if (!label || label.length < 2) return;

      const inlineStyle = parseInlineStyle($el.attr('style'));
      const classAttr = ($el.attr('class') || '').toLowerCase();

      // Detect background color
      let bg =
        inlineStyle['background-color'] ||
        inlineStyle['background'] ||
        '';

      if (!bg) {
        const bgHexMatch = classAttr.match(/bg-\[#([0-9a-f]{3,8})\]/i);
        if (bgHexMatch) bg = `#${bgHexMatch[1]}`;
        else if (classAttr.includes('bg-primary') || classAttr.includes('btn-primary')) bg = primaryBrand;
        else if (classAttr.includes('bg-black') || classAttr.includes('bg-neutral-900')) bg = '#18181b';
        else if (classAttr.includes('bg-white')) bg = '#ffffff';
        else if (classAttr.includes('bg-blue-')) bg = '#2563eb';
        else if (classAttr.includes('bg-transparent') || classAttr.includes('btn-ghost') || classAttr.includes('btn-outline')) bg = 'transparent';
      }

      // Detect text color
      let textColor = inlineStyle['color'] || '';
      if (!textColor) {
        const textHexMatch = classAttr.match(/text-\[#([0-9a-f]{3,8})\]/i);
        if (textHexMatch) textColor = `#${textHexMatch[1]}`;
        else if (classAttr.includes('text-white')) textColor = '#ffffff';
        else if (classAttr.includes('text-black')) textColor = '#000000';
      }

      // Detect border radius
      let borderRadius = inlineStyle['border-radius'] || '';
      if (!borderRadius) {
        if (classAttr.includes('rounded-full')) borderRadius = '9999px';
        else if (classAttr.includes('rounded-2xl')) borderRadius = '16px';
        else if (classAttr.includes('rounded-xl')) borderRadius = '12px';
        else if (classAttr.includes('rounded-lg')) borderRadius = '8px';
        else if (classAttr.includes('rounded-md')) borderRadius = '6px';
        else if (classAttr.includes('rounded-sm')) borderRadius = '2px';
        else if (classAttr.includes('rounded-none')) borderRadius = '0px';
        else borderRadius = defaultRadius;
      }

      // Variant classification
      let variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary';
      if (bg === 'transparent' || classAttr.includes('outline') || classAttr.includes('border-')) {
        variant = classAttr.includes('ghost') ? 'ghost' : 'outline';
      } else if (
        classAttr.includes('secondary') ||
        colord(bg || primaryBrand).luminance() < 0.2
      ) {
        variant = 'secondary';
      }

      if (!bg) {
        bg = variant === 'outline' || variant === 'ghost' ? 'transparent' : primaryBrand;
      }
      if (!textColor) {
        textColor =
          bg === 'transparent'
            ? primaryBrand
            : colord(bg).contrast('#ffffff') >= 4.5
            ? '#ffffff'
            : '#09090b';
      }

      const sig = `${variant}-${bg}-${textColor}-${borderRadius}`;
      if (seenSignatures.has(sig)) return;
      seenSignatures.add(sig);

      buttons.push({
        label,
        variant,
        backgroundColor: bg,
        textColor,
        borderColor: variant === 'outline' ? textColor : undefined,
        borderRadius,
        padding: inlineStyle['padding'] || '8px 16px',
        fontSize: inlineStyle['font-size'] || '14px',
        fontWeight: inlineStyle['font-weight'] || '600',
      });
    }
  );

  // Fallback defaults if no buttons or few buttons were discovered
  if (buttons.length === 0) {
    buttons.push(
      {
        label: 'Primary Action',
        variant: 'primary',
        backgroundColor: primaryBrand,
        textColor: primaryContrast,
        borderRadius: defaultRadius,
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '600',
      },
      {
        label: 'Secondary Action',
        variant: 'secondary',
        backgroundColor: options.palette?.surfaces?.[0]?.hex || '#18181b',
        textColor: options.palette?.surfaces?.[0]?.contrastText || '#ffffff',
        borderRadius: defaultRadius,
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '500',
      },
      {
        label: 'Outline Button',
        variant: 'outline',
        backgroundColor: 'transparent',
        textColor: primaryBrand,
        borderColor: primaryBrand,
        borderRadius: defaultRadius,
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '500',
      },
      {
        label: 'Ghost Button',
        variant: 'ghost',
        backgroundColor: 'transparent',
        textColor: options.palette?.surfaces?.[0]?.contrastText || '#18181b',
        borderRadius: defaultRadius,
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: '500',
      }
    );
  }

  return buttons;
}

/**
 * Extracts input fields from the DOM or generates standard inputs based on tokens.
 */
function extractInputs(
  $: cheerio.CheerioAPI,
  options: ComponentExtractorOptions = {}
): ExtractedInput[] {
  const defaultRadius = options.radii?.[0]?.value || '8px';
  const neutralBorder = options.palette?.neutrals?.[0]?.hex || '#e2e8f0';

  const inputs: ExtractedInput[] = [];
  const seenPlaceholders = new Set<string>();

  $('input[type="text"], input[type="email"], input[type="search"], input:not([type])').each(
    (_, el) => {
      if (inputs.length >= 4) return false;

      const $el = $(el);
      const placeholder = $el.attr('placeholder')?.trim() || '';
      const type = $el.attr('type') || 'text';

      if (seenPlaceholders.has(placeholder)) return;
      if (placeholder) seenPlaceholders.add(placeholder);

      const inlineStyle = parseInlineStyle($el.attr('style'));
      const classAttr = ($el.attr('class') || '').toLowerCase();

      let borderRadius = inlineStyle['border-radius'] || '';
      if (!borderRadius) {
        if (classAttr.includes('rounded-full')) borderRadius = '9999px';
        else if (classAttr.includes('rounded-xl')) borderRadius = '12px';
        else if (classAttr.includes('rounded-lg')) borderRadius = '8px';
        else if (classAttr.includes('rounded-md')) borderRadius = '6px';
        else borderRadius = defaultRadius;
      }

      inputs.push({
        placeholder: placeholder || (type === 'email' ? 'Enter your email address...' : 'Type to search or enter...'),
        type,
        backgroundColor: inlineStyle['background-color'] || '#ffffff',
        textColor: inlineStyle['color'] || '#18181b',
        borderColor: inlineStyle['border-color'] || neutralBorder,
        borderRadius,
        height: inlineStyle['height'] || '40px',
        padding: inlineStyle['padding'] || '8px 12px',
      });
    }
  );

  if (inputs.length === 0) {
    inputs.push(
      {
        placeholder: 'Enter email address...',
        type: 'email',
        backgroundColor: '#ffffff',
        textColor: '#18181b',
        borderColor: neutralBorder,
        borderRadius: defaultRadius,
        height: '42px',
        padding: '10px 14px',
      },
      {
        placeholder: 'Search documentation & resources...',
        type: 'search',
        backgroundColor: '#f8fafc',
        textColor: '#18181b',
        borderColor: neutralBorder,
        borderRadius: defaultRadius,
        height: '42px',
        padding: '10px 14px',
      }
    );
  }

  return inputs;
}

/**
 * Extracts card containers or synthesizes standard container models.
 */
function extractCards(
  $: cheerio.CheerioAPI,
  options: ComponentExtractorOptions = {}
): ExtractedCard[] {
  const surfaceBg = options.palette?.surfaces?.[0]?.hex || '#ffffff';
  const neutralBorder = options.palette?.neutrals?.[0]?.hex || '#e2e8f0';
  const defaultRadius = options.radii?.[1]?.value || options.radii?.[0]?.value || '12px';
  const defaultShadow = options.shadows?.[0]?.value || '0 1px 3px 0 rgba(0,0,0,0.1)';

  const cards: ExtractedCard[] = [];

  $('[class*="card"], [class*="Card"], article, [class*="pricing"], [class*="feature"]').each(
    (_, el) => {
      if (cards.length >= 3) return false;

      const $el = $(el);
      const title = $el.find('h2, h3, h4').first().text().trim();
      const description = $el.find('p').first().text().trim();

      if (!title && !description) return;

      const inlineStyle = parseInlineStyle($el.attr('style'));

      cards.push({
        title: title || 'Featured Resource',
        description: description.slice(0, 100) || 'Streamlined architectural container with standardized elevation.',
        backgroundColor: inlineStyle['background-color'] || surfaceBg,
        borderColor: inlineStyle['border-color'] || neutralBorder,
        borderRadius: inlineStyle['border-radius'] || defaultRadius,
        boxShadow: inlineStyle['box-shadow'] || defaultShadow,
        padding: inlineStyle['padding'] || '24px',
      });
    }
  );

  if (cards.length === 0) {
    cards.push(
      {
        title: 'System Card Primitive',
        description: 'Standardized surface element rendering extracted border radii, background tones, and elevation.',
        backgroundColor: surfaceBg,
        borderColor: neutralBorder,
        borderRadius: defaultRadius,
        boxShadow: defaultShadow,
        padding: '20px',
      },
      {
        title: 'Metric Overview',
        description: 'High-contrast analytical container for key metrics and performance indicators.',
        backgroundColor: surfaceBg,
        borderColor: options.palette?.primary?.[0]?.hex || neutralBorder,
        borderRadius: defaultRadius,
        boxShadow: options.shadows?.[1]?.value || defaultShadow,
        padding: '20px',
      }
    );
  }

  return cards;
}

/**
 * Extracts badges/chips from the DOM or generates standard status badges based on tokens.
 */
function extractBadges(
  $: cheerio.CheerioAPI,
  options: ComponentExtractorOptions = {}
): ExtractedBadge[] {
  const primaryBrand = options.palette?.primary?.[0]?.hex || '#6366f1';
  const primaryContrast = options.palette?.primary?.[0]?.contrastText || '#ffffff';
  const defaultRadius = options.radii?.[0]?.value || '9999px';

  const badges: ExtractedBadge[] = [];
  const seenLabels = new Set<string>();

  $('[class*="badge"], [class*="Badge"], [class*="pill"], [class*="tag"], [class*="chip"]').each(
    (_, el) => {
      if (badges.length >= 5) return false;

      const $el = $(el);
      const label = $el.text().replace(/\s+/g, ' ').trim();
      if (!label || label.length > 20 || seenLabels.has(label)) return;
      seenLabels.add(label);

      const inlineStyle = parseInlineStyle($el.attr('style'));

      badges.push({
        label,
        backgroundColor: inlineStyle['background-color'] || `${primaryBrand}1a`,
        textColor: inlineStyle['color'] || primaryBrand,
        borderColor: inlineStyle['border-color'] || `${primaryBrand}33`,
        borderRadius: inlineStyle['border-radius'] || defaultRadius,
      });
    }
  );

  if (badges.length === 0) {
    badges.push(
      {
        label: 'Active Token',
        backgroundColor: `${primaryBrand}1a`,
        textColor: primaryBrand,
        borderColor: `${primaryBrand}33`,
        borderRadius: '9999px',
      },
      {
        label: 'Production Ready',
        backgroundColor: '#10b9811a',
        textColor: '#10b981',
        borderColor: '#10b98133',
        borderRadius: '9999px',
      },
      {
        label: 'Brand Component',
        backgroundColor: primaryBrand,
        textColor: primaryContrast,
        borderRadius: '4px',
      }
    );
  }

  return badges;
}

/**
 * Main component extraction pipeline.
 */
export function extractComponents(
  $: cheerio.CheerioAPI,
  options: ComponentExtractorOptions = {}
): ExtractedComponents {
  return {
    buttons: extractButtons($, options),
    inputs: extractInputs($, options),
    cards: extractCards($, options),
    badges: extractBadges($, options),
  };
}
