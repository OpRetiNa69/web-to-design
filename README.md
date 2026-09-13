# site-to-tokens

> **Reverse-engineer design systems from any live website into production-ready tokens.**

`site-to-tokens` scans any public URL using an automated headless browser pipeline, analyzes the rendered DOM and computed styles, extracts the core design primitives (colors, typography, radii, elevations), and exports them directly to **Tailwind CSS**, **Figma Variables**, **Tokens Studio (W3C DTCG)**, and **CSS Custom Properties**.

---

## Key Features

- **Automated Headless Extraction**: Uses Playwright to render web pages, capture rendered states, and extract computed typography, colors, surfaces, and spacing metrics.
- **Brand Color Ladder (50–950)**: Automatically generates an 11-step tint/shade ramp anchored to the detected primary brand color using perceptual HSL lightness progression.
- **WCAG 2.1 Contrast Auditing**: Real-time relative luminance calculation for all extracted swatches against their surface text, displaying `Pass AA` ($\ge$ 4.5:1) or `Fail AA` indicators with exact contrast ratios.
- **Zero-Friction Figma Integrations**:
  - **Copy to Figma (Canvas)**: One-click copy of an SVG vector sheet directly to your clipboard. Paste (`Cmd+V` / `Ctrl+V`) right into Figma to get editable frames, swatches, and typography specimens.
  - **Figma Variables (.json)**: Generates a standardized JSON collection matching the Figma REST API & Tokens Studio specification (`modes`, `variableCollections`, `variables` with `resolvedType`).
- **Code & Framework Exporters**:
  - **Tailwind CSS**: Pre-structured `tailwind.config.js` theme extension snippet with full color ramps and typography hierarchies.
  - **CSS Custom Properties**: Clean `:root` variable definitions (`--color-primary-500`, `--font-display`, etc.).
  - **W3C DTCG Token JSON**: Strictly formatted with `$value` and `$type` for Tokens Studio and cross-platform token pipelines.
- **Live Component Sandbox**: Real-time visual playground rendering hero sections, metric cards, buttons, badges, and forms styled with the extracted tokens.
- **Refined Editorial UI**: Minimalist aesthetic with dark mode support, smooth micro-interactions, and accessible typography.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Custom Design System
- **Browser Automation**: [Playwright](https://playwright.dev/)
- **Color Science**: [colord](https://github.com/omgovich/colord) (A11y & HSL color manipulation)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: TypeScript 5

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/OpRetiNa69/site-to-tokens.git
   cd site-to-tokens
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browser binaries (for extraction):
   ```bash
   npx playwright install chromium
   ```

4. For production deployment (Vercel, Render, Railway, Docker, etc.):
   Configure the build command as:
   ```bash
   npx playwright install chromium && npm run build
   ```
   Or use the provided npm script:
   ```bash
   npm run build:deploy
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
site-to-tokens/
├── src/
│   ├── app/
│   │   ├── api/scan/route.ts       # Headless extraction API route
│   │   ├── layout.tsx              # Root layout & font configurations
│   │   ├── page.tsx                # Main application interface
│   │   └── globals.css             # Global styles & design tokens
│   ├── components/
│   │   ├── ColorPaletteCell.tsx    # Color palette & 50–950 ramp visualizer
│   │   ├── ComponentSandboxCell.tsx# Interactive live preview sandbox
│   │   ├── ExportCell.tsx          # Code exporters & Figma download actions
│   │   ├── SiteHeader.tsx          # Navigation bar & theme controls
│   │   ├── TypographyCell.tsx      # Font hierarchy & specimen inspector
│   │   └── ThemeToggle.tsx         # Dark / Light theme toggle
│   ├── lib/
│   │   ├── color-normalizer.ts     # Color grouping, ramps & WCAG calculations
│   │   ├── exporters.ts            # Tailwind, CSS variables, & DTCG exports
│   │   ├── figma-svg.ts            # Figma canvas SVG vector sheet builder
│   │   ├── figma-variables.ts      # Figma REST API variables schema builder
│   │   ├── font-normalizer.ts      # Typography clustering & normalization
│   │   └── scanner.ts              # Playwright DOM scraping pipeline
│   └── types/
│       └── tokens.ts               # Core TypeScript definitions & schemas
├── public/                         # Static assets & icons
└── package.json
```

---

## License

MIT
