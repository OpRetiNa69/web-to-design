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

export interface ExtractedButton {
  label: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  borderRadius: string;
  padding: string;
  fontSize: string;
  fontWeight: string;
}

export interface ExtractedInput {
  placeholder: string;
  type: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderRadius: string;
  height: string;
  padding: string;
}

export interface ExtractedCard {
  title?: string;
  description?: string;
  backgroundColor: string;
  borderColor?: string;
  borderRadius: string;
  boxShadow?: string;
  padding: string;
}

export interface ExtractedBadge {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  borderRadius: string;
}

export interface ExtractedComponents {
  buttons: ExtractedButton[];
  inputs: ExtractedInput[];
  cards: ExtractedCard[];
  badges: ExtractedBadge[];
}

export interface ExtractedIcon {
  id: string;
  name: string;
  svg: string;
  viewBox: string;
}

export interface ExtractionResult {
  url: string;
  title: string;
  fontFamilies: string[];
  colors: ExtractedColor[];
  typography: ExtractedTypography[];
  radii: ExtractedRadius[];
  shadows: ExtractedShadow[];
  components?: ExtractedComponents;
  icons?: ExtractedIcon[];
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
  components?: ExtractedComponents;
  icons?: ExtractedIcon[];
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
