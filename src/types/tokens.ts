export interface ExtractedColor {
  hex: string;
  rgb: string;
  luminance: number;
  count: number;
  type: 'background' | 'text' | 'border';
  contrastText: string;
}

export interface ExtractedTypography {
  tag: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  sampleText: string;
}

export interface ExtractedRadius {
  value: string;
  count: number;
}

export interface ExtractedShadow {
  name: 'sm' | 'md' | 'lg' | string;
  value: string;
  count: number;
}

export interface ExtractionResult {
  url: string;
  title: string;
  fontFamilies: string[];
  colors: ExtractedColor[];
  typography: ExtractedTypography[];
  radii: ExtractedRadius[];
  shadows: ExtractedShadow[];
}

export interface TypeScaleItem {
  name: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  fontSize: string;
  lineHeight: string;
  sampleTag: string;
}

export interface DesignSystemExports {
  tailwind: string;
  cssVars: string;
  tokensJson: string;
}

export interface DesignSystemFonts {
  heading: string;
  body: string;
}

export interface DesignSystem {
  palette: {
    primary: ExtractedColor[];
    neutrals: ExtractedColor[];
    accents: ExtractedColor[];
    surfaces: ExtractedColor[];
  };
  typeScale: TypeScaleItem[];
  radii: ExtractedRadius[];
  shadows: ExtractedShadow[];
  fonts: DesignSystemFonts;
  exports: DesignSystemExports;
}

export interface ScanData {
  raw: ExtractionResult;
  system: DesignSystem;
}

export interface ScanSuccessResponse {
  success: true;
  data: ScanData;
}

export interface ScanErrorResponse {
  success: false;
  error: string;
}

export type ScanResponse = ScanSuccessResponse | ScanErrorResponse;
