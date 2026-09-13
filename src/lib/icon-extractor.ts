import type * as cheerio from 'cheerio';
import type { ExtractedIcon } from '@/types/tokens';

/**
 * Extracts, cleans, and normalizes inline SVGs from a Cheerio-parsed HTML document.
 * Returns up to 24 unique, production-ready icon tokens.
 */
export function extractIcons($: cheerio.CheerioAPI): ExtractedIcon[] {
  const icons: ExtractedIcon[] = [];
  const seenFingerprints = new Set<string>();

  $('svg').each((index, el) => {
    if (icons.length >= 24) return false;

    const $svg = $(el);

    // Filter out SVGs that have no vector drawing tags
    const hasVectorChildren =
      $svg.find('path, circle, rect, polygon, polyline, line, ellipse').length > 0;
    if (!hasVectorChildren) return;

    // Check dimensions to ignore full-page background illustrations or huge hero blobs
    const rawWidth = parseFloat($svg.attr('width') || '24');
    const rawHeight = parseFloat($svg.attr('height') || '24');
    if (rawWidth > 120 || rawHeight > 120) return;

    let viewBox = $svg.attr('viewbox') || $svg.attr('viewBox') || '';
    if (!viewBox) {
      if (rawWidth > 0 && rawHeight > 0) {
        viewBox = `0 0 ${Math.round(rawWidth)} ${Math.round(rawHeight)}`;
      } else {
        viewBox = '0 0 24 24';
      }
    }

    // Ignore SVGs with massive viewBox bounds (likely illustrations/charts)
    const vbParts = viewBox.split(/[\s,]+/).map(Number);
    if (vbParts.length === 4) {
      const vbW = vbParts[2];
      const vbH = vbParts[3];
      if (vbW > 256 || vbH > 256) return;
    }

    // Determine icon name from title, aria-label, class, or parent element
    const titleText = $svg.find('title').text().trim();
    const ariaLabel =
      $svg.attr('aria-label') ||
      $svg.parent('button, a').attr('aria-label') ||
      $svg.parent('button, a').text().trim();
    const classAttr = $svg.attr('class') || '';

    let iconName = '';
    if (titleText && titleText.length < 30) {
      iconName = titleText;
    } else if (ariaLabel && ariaLabel.length < 25 && !ariaLabel.includes('\n')) {
      iconName = ariaLabel;
    } else {
      const match = classAttr.match(/(?:icon-|lucide-|fa-|bi-)([a-z0-9-]+)/i);
      if (match && match[1]) {
        iconName = match[1];
      }
    }

    if (!iconName) {
      iconName = `icon-${index + 1}`;
    }

    // Clean name to kebab-case
    iconName = iconName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Clone element to clean attributes without mutating the original DOM
    const $clone = $svg.clone();

    // Clean tracking / dynamic attributes on SVG and descendants
    const cleanAttributes = ($element: cheerio.Cheerio<any>) => {
      const attribs = ($element[0] as any)?.attribs || {};
      for (const attrKey of Object.keys(attribs)) {
        if (
          attrKey.startsWith('data-') ||
          attrKey.startsWith('aria-') ||
          attrKey.startsWith('on') ||
          attrKey === 'id' ||
          attrKey === 'class' ||
          attrKey === 'style'
        ) {
          $element.removeAttr(attrKey);
        }
      }
      $element.children().each((_, child) => {
        cleanAttributes($(child));
      });
    };

    cleanAttributes($clone);

    // Normalize SVG root attributes
    $clone.attr('xmlns', 'http://www.w3.org/2000/svg');
    $clone.attr('width', '24');
    $clone.attr('height', '24');
    $clone.attr('viewBox', viewBox);

    // Determine stroke vs fill mode
    const hasStroke =
      $clone.attr('stroke') !== undefined ||
      $clone.find('[stroke]').length > 0;
    const hasFill =
      $clone.attr('fill') !== undefined && $clone.attr('fill') !== 'none';

    if (hasStroke && !hasFill) {
      $clone.attr('fill', 'none');
      $clone.attr('stroke', 'currentColor');
      if (!$clone.attr('stroke-width')) {
        $clone.attr('stroke-width', '2');
      }
      $clone.attr('stroke-linecap', 'round');
      $clone.attr('stroke-linejoin', 'round');
    } else if (!hasStroke) {
      $clone.attr('fill', 'currentColor');
    }

    // Generate inner markup fingerprint to deduplicate identical icons
    const innerHtml = $clone.html() || '';
    const pathFingerprint = (innerHtml.match(/d="([^"]+)"/g) || [innerHtml]).join('');
    if (seenFingerprints.has(pathFingerprint)) {
      return;
    }
    seenFingerprints.add(pathFingerprint);

    const svgString = $.html($clone).trim();

    icons.push({
      id: `icon-${icons.length + 1}`,
      name: iconName,
      viewBox,
      svg: svgString,
    });
  });

  return icons;
}
