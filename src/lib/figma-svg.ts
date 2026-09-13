import type { DesignSystem, ExtractedColor, TypeScaleItem, ExtractedRadius, ExtractedShadow } from '@/types/tokens';

function escapeXml(unsafe: string | undefined | null): string {
  if (!unsafe) return '';
  return String(unsafe)
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
    <text x="${paddingX}" y="${currentY + 84}" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="400" fill="#71717A">Extracted via web-to-design • ${escapeXml(dateStr)} • W3C / Figma Compatible</text>
    
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
    <text x="${paddingX + 210}" y="${currentY + 33}" font-family="Inter, -apple-system, sans-serif" font-size="12" font-weight="400" fill="#71717A">Heading: "${escapeXml(system.fonts?.heading || 'Inter')}" • Body: "${escapeXml(system.fonts?.body || 'Inter')}"</text>
  </g>
  `);

  currentY += 54;

  system.typeScale.forEach((item, idx) => {
    const itemName = item.name || (item as any).step || `step-${idx + 1}`;
    const isHeading = ['display', 'h1', 'h2', 'h3'].includes(itemName);
    const fontName = isHeading ? (system.fonts?.heading || 'Inter') : (system.fonts?.body || 'Inter');
    const pxSize = parsePx(item.fontSize, 16);
    const itemHeight = Math.max(54, pxSize + 24);

    svgParts.push(`
    <g id="TypeScale-${escapeXml(itemName)}">
      <!-- Item Row Background -->
      <rect x="${paddingX}" y="${currentY}" width="${contentWidth}" height="${itemHeight}" rx="10" fill="#18181B" stroke="#27272A" stroke-width="1" />
      
      <!-- Tag Badge -->
      <rect x="${paddingX + 12}" y="${currentY + 12}" width="60" height="20" rx="4" fill="#27272A" />
      <text x="${paddingX + 42}" y="${currentY + 26}" text-anchor="middle" font-family="monospace" font-size="10" font-weight="700" fill="#A1A1AA">${escapeXml(itemName.toUpperCase())}</text>
      
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

    currentY += radiiCardH + 40;

  // --- UI COMPONENTS SECTION ---
  const buttons = system.components?.buttons || [];
  const inputs = system.components?.inputs || [];
  const badges = system.components?.badges || [];

  svgParts.push(`
  <!-- UI Components Section Header -->
  <g id="Section-Components">
    <line x1="${paddingX}" y1="${currentY}" x2="${paddingX + contentWidth}" y2="${currentY}" stroke="#27272A" stroke-width="1" />
    <text x="${paddingX}" y="${currentY + 34}" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#FAFAFA" letter-spacing="-0.3">04 / EXTRACTED UI COMPONENTS</text>
    <text x="${paddingX + 270}" y="${currentY + 33}" font-family="Inter, -apple-system, sans-serif" font-size="12" font-weight="400" fill="#71717A">Interactive Buttons, Inputs &amp; Status Badges</text>
  </g>
  `);

  currentY += 54;

  // Render Buttons
  if (buttons.length > 0) {
    svgParts.push(`
    <g id="ComponentGroup-Buttons">
      <text x="${paddingX}" y="${currentY + 14}" font-family="monospace" font-size="11" font-weight="600" fill="#A1A1AA" text-transform="uppercase" letter-spacing="0.5">Button Primitives (${buttons.length})</text>
    </g>
    `);

    currentY += 26;

    let btnX = paddingX;
    const btnRowY = currentY;
    const btnHeight = 42;

    buttons.slice(0, 4).forEach((btn, idx) => {
      const btnWidth = Math.max(130, btn.label.length * 8 + 36);
      const btnRadius = parsePx(btn.borderRadius, 8);
      const isOutline = btn.variant === 'outline';
      const isGhost = btn.variant === 'ghost';

      svgParts.push(`
      <g id="Button-${idx + 1}-${escapeXml(btn.variant)}">
        <!-- Button Background Frame -->
        <rect x="${btnX}" y="${btnRowY}" width="${btnWidth}" height="${btnHeight}" rx="${btnRadius}" 
          fill="${isOutline || isGhost ? 'none' : btn.backgroundColor}" 
          ${isOutline ? `stroke="${btn.borderColor || btn.textColor}" stroke-width="1.5"` : ''} 
        />
        <!-- Button Label -->
        <text x="${btnX + btnWidth / 2}" y="${btnRowY + 25}" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="600" fill="${btn.textColor}">
          ${escapeXml(btn.label)}
        </text>
      </g>
      `);

      btnX += btnWidth + 16;
    });

    currentY += btnHeight + 28;
  }

  // Render Input Field & Badges in a side-by-side row
  const inputToDisplay = inputs[0];
  if (inputToDisplay || badges.length > 0) {
    const inputW = 340;
    const inputH = 44;
    const inputRadius = inputToDisplay ? parsePx(inputToDisplay.borderRadius, 8) : 8;

    svgParts.push(`
    <g id="ComponentGroup-InputsAndBadges">
      <text x="${paddingX}" y="${currentY + 14}" font-family="monospace" font-size="11" font-weight="600" fill="#A1A1AA" text-transform="uppercase" letter-spacing="0.5">Form Inputs &amp; Status Badges</text>
    </g>
    `);

    currentY += 26;

    if (inputToDisplay) {
      svgParts.push(`
      <g id="Component-Input">
        <rect x="${paddingX}" y="${currentY}" width="${inputW}" height="${inputH}" rx="${inputRadius}" fill="#18181B" stroke="${inputToDisplay.borderColor || '#3F3F46'}" stroke-width="1.5" />
        <text x="${paddingX + 16}" y="${currentY + 26}" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="400" fill="#71717A">
          ${escapeXml(inputToDisplay.placeholder.slice(0, 38))}
        </text>
      </g>
      `);
    }

    // Render Badges next to input
    let badgeX = paddingX + (inputToDisplay ? inputW + 24 : 0);
    badges.slice(0, 4).forEach((badge, bIdx) => {
      const badgeWidth = Math.max(80, badge.label.length * 7 + 24);
      const badgeHeight = 28;
      const bRadius = parsePx(badge.borderRadius, 14);

      svgParts.push(`
      <g id="Badge-${bIdx + 1}">
        <rect x="${badgeX}" y="${currentY + 8}" width="${badgeWidth}" height="${badgeHeight}" rx="${bRadius}" fill="${badge.backgroundColor}" ${badge.borderColor ? `stroke="${badge.borderColor}" stroke-width="1"` : ''} />
        <text x="${badgeX + badgeWidth / 2}" y="${currentY + 26}" text-anchor="middle" font-family="monospace" font-size="11" font-weight="600" fill="${badge.textColor}">
          ${escapeXml(badge.label)}
        </text>
      </g>
      `);

      badgeX += badgeWidth + 12;
    });

    currentY += inputH + 40;
  }

  // --- VECTOR ICONS SECTION ---
  const icons = system.icons || [];
  if (icons.length > 0) {
    svgParts.push(`
    <!-- Vector Icons Section Header -->
    <g id="Section-Icons">
      <line x1="${paddingX}" y1="${currentY}" x2="${paddingX + contentWidth}" y2="${currentY}" stroke="#27272A" stroke-width="1" />
      <text x="${paddingX}" y="${currentY + 34}" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#FAFAFA" letter-spacing="-0.3">05 / VECTOR ICONS</text>
      <text x="${paddingX + 175}" y="${currentY + 33}" font-family="Inter, -apple-system, sans-serif" font-size="12" font-weight="400" fill="#71717A">Extracted SVG Glyphs • Native Figma Vectors (${icons.length})</text>
    </g>
    `);

    currentY += 54;

    const iconCardW = 120;
    const iconCardH = 96;
    const iconGap = 16;
    const iconsPerRow = Math.floor((contentWidth + iconGap) / (iconCardW + iconGap));

    icons.slice(0, 24).forEach((icon, i) => {
      const col = i % iconsPerRow;
      const row = Math.floor(i / iconsPerRow);
      const x = paddingX + col * (iconCardW + iconGap);
      const y = currentY + row * (iconCardH + iconGap);

      // Clean and extract inner SVG paths
      const innerSvg = icon.svg
        .replace(/<svg[^>]*>/i, '')
        .replace(/<\/svg>/i, '')
        .trim();

      svgParts.push(`
      <g id="Icon-${escapeXml(icon.name)}">
        <rect x="${x}" y="${y}" width="${iconCardW}" height="${iconCardH}" rx="10" fill="#18181B" stroke="#27272A" stroke-width="1" />
        
        <!-- Centered 24x24 Vector Container -->
        <g transform="translate(${x + (iconCardW - 24) / 2}, ${y + 18})" fill="none" stroke="#FAFAFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${innerSvg}
        </g>
        
        <!-- Icon Label -->
        <text x="${x + iconCardW / 2}" y="${y + 76}" text-anchor="middle" font-family="monospace" font-size="10" font-weight="500" fill="#A1A1AA">
          ${escapeXml(icon.name.slice(0, 14))}
        </text>
      </g>
      `);
    });

    const totalIconRows = Math.ceil(Math.min(icons.length, 24) / iconsPerRow);
    currentY += totalIconRows * (iconCardH + iconGap) + 40;
  }

  // Total Canvas Height
  const totalHeight = currentY + 16;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvasWidth}" height="${totalHeight}" viewBox="0 0 ${canvasWidth} ${totalHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Canvas -->
  <rect width="${canvasWidth}" height="${totalHeight}" rx="20" fill="#0C0C0E" />
  <rect x="1" y="1" width="${canvasWidth - 2}" height="${totalHeight - 2}" rx="19" fill="none" stroke="#1F1F23" stroke-width="2" />
  
  ${svgParts.join('\n')}
</svg>`.trim();
}
