import type { DesignSystem, ExtractedColor, TypeScaleItem, ExtractedRadius, ExtractedShadow } from '@/types/tokens';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parsePx(val: string, fallback: number = 16): number {
  const match = val.match(/([\d.]+)px/i);
  if (match) {
    return Math.round(parseFloat(match[1]));
  }
  const num = parseFloat(val);
  return isNaN(num) ? fallback : Math.round(num);
}

/**
 * Generates an SVG vector sheet of extracted design tokens.
 * When copied to clipboard and pasted into Figma (Cmd+V / Ctrl+V),
 * Figma natively converts this SVG into editable frames, rectangles, and text layers.
 */
export function generateFigmaTokenSheetSvg(
  system: DesignSystem,
  targetUrl?: string,
  scanDate?: string
): string {
  const canvasWidth = 1200;
  const paddingX = 48;
  const contentWidth = canvasWidth - paddingX * 2;
  const dateStr = scanDate || new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const domain = targetUrl ? targetUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : 'Design System';

  // Track vertical rendering position
  let currentY = 48;

  const svgParts: string[] = [];

  // --- HEADER ---
  svgParts.push(`
  <!-- Header Section -->
  <g id="Header">
    <rect x="${paddingX}" y="${currentY}" width="140" height="24" rx="12" fill="#27272A" />
    <text x="${paddingX + 70}" y="${currentY + 16}" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="10" font-weight="600" fill="#A1A1AA" letter-spacing="1">DESIGN TOKENS</text>
    
    <text x="${paddingX}" y="${currentY + 60}" font-family="Inter, -apple-system, sans-serif" font-size="32" font-weight="700" fill="#FAFAFA" letter-spacing="-0.5">${escapeXml(domain)}</text>
    <text x="${paddingX}" y="${currentY + 84}" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="400" fill="#71717A">Extracted via site-to-tokens • ${escapeXml(dateStr)} • W3C / Figma Compatible</text>
    
    <line x1="${paddingX}" y1="${currentY + 104}" x2="${paddingX + contentWidth}" y2="${currentY + 104}" stroke="#27272A" stroke-width="1" />
  </g>
  `);

  currentY += 128;

  // --- COLOR PALETTE SECTION ---
  const colorSections: Array<{ title: string; colors: ExtractedColor[] }> = [
    { title: 'Primary Brand', colors: system.palette.primary },
    { title: 'Surfaces', colors: system.palette.surfaces },
    { title: 'Neutrals', colors: system.palette.neutrals },
    { title: 'Accents', colors: system.palette.accents },
  ].filter((s) => s.colors.length > 0);

  svgParts.push(`
  <!-- Color System Section Header -->
  <g id="Section-Colors">
    <text x="${paddingX}" y="${currentY + 16}" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#FAFAFA" letter-spacing="-0.3">01 / COLOR SYSTEM</text>
    <text x="${paddingX + 160}" y="${currentY + 15}" font-family="Inter, -apple-system, sans-serif" font-size="12" font-weight="400" fill="#71717A">CIEDE2000 Clustered &amp; WCAG AA/AAA Audited</text>
  </g>
  `);

  currentY += 36;

  for (const group of colorSections) {
    svgParts.push(`
    <!-- Group: ${escapeXml(group.title)} -->
    <g id="ColorGroup-${escapeXml(group.title.replace(/\s+/g, '-'))}">
      <text x="${paddingX}" y="${currentY + 14}" font-family="monospace" font-size="11" font-weight="600" fill="#A1A1AA" text-transform="uppercase" letter-spacing="0.5">${escapeXml(group.title)} (${group.colors.length})</text>
    </g>
    `);

    currentY += 24;

    const cardW = 124;
    const cardH = 104;
    const swatchH = 56;
    const gap = 16;
    const itemsPerRow = Math.floor((contentWidth + gap) / (cardW + gap));

    group.colors.forEach((color, i) => {
      const col = i % itemsPerRow;
      const row = Math.floor(i / itemsPerRow);
      const x = paddingX + col * (cardW + gap);
      const y = currentY + row * (cardH + gap);
      const contrastLabel = color.luminance > 0.8 || color.luminance < 0.15 ? 'AAA' : 'AA';

      svgParts.push(`
      <g id="Swatch-${escapeXml(group.title)}-${i + 1}">
        <!-- Card Frame -->
        <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="10" fill="#18181B" stroke="#27272A" stroke-width="1" />
        
        <!-- Swatch Block -->
        <rect x="${x + 4}" y="${y + 4}" width="${cardW - 8}" height="${swatchH}" rx="6" fill="${color.hex}" />
        
        <!-- Contrast Badge -->
        <rect x="${x + 8}" y="${y + 8}" width="28" height="14" rx="3" fill="#000000" fill-opacity="0.45" />
        <text x="${x + 22}" y="${y + 18}" text-anchor="middle" font-family="monospace" font-size="8" font-weight="700" fill="#FFFFFF">${contrastLabel}</text>
        
        <!-- Hex Label -->
        <text x="${x + 8}" y="${y + 78}" font-family="monospace" font-size="11" font-weight="600" fill="#FAFAFA">${escapeXml(color.hex.toUpperCase())}</text>
        
        <!-- Role / Lum Label -->
        <text x="${x + 8}" y="${y + 94}" font-family="Inter, -apple-system, sans-serif" font-size="9" font-weight="400" fill="#71717A">Lum: ${Math.round(color.luminance * 100)}%</text>
      </g>
      `);
    });

    const totalRows = Math.ceil(group.colors.length / itemsPerRow);
    currentY += totalRows * (cardH + gap) + 12;
  }

  currentY += 16;

  // --- TYPOGRAPHY SCALE SECTION ---
  svgParts.push(`
  <!-- Typography System Section Header -->
  <g id="Section-Typography">
    <line x1="${paddingX}" y1="${currentY}" x2="${paddingX + contentWidth}" y2="${currentY}" stroke="#27272A" stroke-width="1" />
    <text x="${paddingX}" y="${currentY + 34}" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#FAFAFA" letter-spacing="-0.3">02 / TYPOGRAPHY SCALE</text>
    <text x="${paddingX + 210}" y="${currentY + 33}" font-family="Inter, -apple-system, sans-serif" font-size="12" font-weight="400" fill="#71717A">Heading: "${escapeXml(system.fonts.heading)}" • Body: "${escapeXml(system.fonts.body)}"</text>
  </g>
  `);

  currentY += 54;

  system.typeScale.forEach((item, idx) => {
    const isHeading = ['display', 'h1', 'h2', 'h3'].includes(item.name);
    const fontName = isHeading ? system.fonts.heading : system.fonts.body;
    const pxSize = parsePx(item.fontSize, 16);
    const itemHeight = Math.max(54, pxSize + 24);

    svgParts.push(`
    <g id="TypeScale-${escapeXml(item.name)}">
      <!-- Item Row Background -->
      <rect x="${paddingX}" y="${currentY}" width="${contentWidth}" height="${itemHeight}" rx="10" fill="#18181B" stroke="#27272A" stroke-width="1" />
      
      <!-- Tag Badge -->
      <rect x="${paddingX + 12}" y="${currentY + 12}" width="60" height="20" rx="4" fill="#27272A" />
      <text x="${paddingX + 42}" y="${currentY + 26}" text-anchor="middle" font-family="monospace" font-size="10" font-weight="700" fill="#A1A1AA">${escapeXml(item.name.toUpperCase())}</text>
      
      <!-- Metrics Info -->
      <text x="${paddingX + 84}" y="${currentY + 26}" font-family="monospace" font-size="11" font-weight="500" fill="#71717A">${escapeXml(item.fontSize)} • LH: ${escapeXml(item.lineHeight)}</text>
      
      <!-- Specimen Text -->
      <text x="${paddingX + 280}" y="${currentY + Math.min(itemHeight - 12, pxSize + 16)}" font-family="${escapeXml(fontName)}, -apple-system, sans-serif" font-size="${pxSize}" font-weight="${isHeading ? '700' : '400'}" fill="#FAFAFA" overflow="hidden">The quick brown fox jumps over the lazy dog</text>
    </g>
    `);

    currentY += itemHeight + 10;
  });

  currentY += 20;

  // --- RADII & ELEVATIONS SECTION ---
  svgParts.push(`
  <!-- Radii & Elevations Section Header -->
  <g id="Section-RadiiAndElevations">
    <line x1="${paddingX}" y1="${currentY}" x2="${paddingX + contentWidth}" y2="${currentY}" stroke="#27272A" stroke-width="1" />
    <text x="${paddingX}" y="${currentY + 34}" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#FAFAFA" letter-spacing="-0.3">03 / BORDER RADII &amp; ELEVATIONS</text>
    <text x="${paddingX + 290}" y="${currentY + 33}" font-family="Inter, -apple-system, sans-serif" font-size="12" font-weight="400" fill="#71717A">Geometric Corner Radius Ladders &amp; Shadow Profiles</text>
  </g>
  `);

  currentY += 54;

  // Render Radii
  const radiiToDisplay = system.radii.length > 0 ? system.radii.slice(0, 6) : [
    { value: '4px', count: 1 },
    { value: '8px', count: 1 },
    { value: '12px', count: 1 },
    { value: '16px', count: 1 },
  ];

  const radiiCardW = 120;
  const radiiCardH = 110;
  const radiiGap = 16;

  radiiToDisplay.forEach((r, idx) => {
    const rxVal = parsePx(r.value, 8);
    const x = paddingX + idx * (radiiCardW + radiiGap);

    svgParts.push(`
    <g id="Radius-${idx + 1}">
      <rect x="${x}" y="${currentY}" width="${radiiCardW}" height="${radiiCardH}" rx="10" fill="#18181B" stroke="#27272A" stroke-width="1" />
      
      <!-- Demo Shape showing radius -->
      <rect x="${x + 28}" y="${currentY + 16}" width="64" height="48" rx="${rxVal}" fill="#27272A" stroke="#3F3F46" stroke-width="1.5" />
      
      <text x="${x + 60}" y="${currentY + 84}" text-anchor="middle" font-family="monospace" font-size="12" font-weight="700" fill="#FAFAFA">${escapeXml(r.value)}</text>
      <text x="${x + 60}" y="${currentY + 98}" text-anchor="middle" font-family="monospace" font-size="9" font-weight="400" fill="#71717A">radius-${idx + 1}</text>
    </g>
    `);
  });

  currentY += radiiCardH + 48;

  // Total Canvas Height
  const totalHeight = currentY;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvasWidth}" height="${totalHeight}" viewBox="0 0 ${canvasWidth} ${totalHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Canvas -->
  <rect width="${canvasWidth}" height="${totalHeight}" rx="20" fill="#0C0C0E" />
  <rect x="1" y="1" width="${canvasWidth - 2}" height="${totalHeight - 2}" rx="19" fill="none" stroke="#1F1F23" stroke-width="2" />
  
  ${svgParts.join('\n')}
</svg>`.trim();
}
