import { NextRequest, NextResponse } from 'next/server';
import { extractTokensFromUrl } from '@/lib/extractor';
import { clusterAndCategorizeColors } from '@/lib/color-normalizer';
import { normalizeTypography } from '@/lib/typography-normalizer';
import { generateAllExports } from '@/lib/exporters';
import type { ScanResponse, DesignSystem } from '@/types/tokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max duration

export async function POST(req: NextRequest): Promise<NextResponse<ScanResponse>> {
  try {
    let body: { url?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body. Expected { "url": "https://..." }' },
        { status: 400 }
      );
    }

    let { url } = body;

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'A valid "url" parameter is required.' },
        { status: 400 }
      );
    }

    url = url.trim();

    // Auto-prefix https:// if protocol scheme is omitted
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) {
      url = `https://${url}`;
    }

    // Validate URL syntax
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: `Invalid URL format: "${url}"` },
        { status: 400 }
      );
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { success: false, error: 'Only HTTP and HTTPS URLs are supported.' },
        { status: 400 }
      );
    }

    // 1. Raw token extraction via Cheerio & CSS-Tree AST
    const raw = await extractTokensFromUrl(parsedUrl.toString());

    // 2. Perceptual color clustering & semantic categorization
    const palette = clusterAndCategorizeColors(raw.colors);

    // 3. Semantic typography scale mapping & font detection
    const typographyAnalysis = normalizeTypography(raw.typography);

    // 4. Construct design system core
    const systemCore = {
      palette,
      typeScale: typographyAnalysis.typeScale,
      radii: raw.radii,
      shadows: raw.shadows,
      fonts: typographyAnalysis.fonts,
    };

    // 5. Code exporters (Tailwind, CSS Variables, DTCG JSON)
    const exports = generateAllExports(systemCore);

    const system: DesignSystem = {
      ...systemCore,
      exports,
    };

    return NextResponse.json({
      success: true,
      data: {
        raw,
        system,
      },
    });
  } catch (err: any) {
    console.error('Extraction fatal error:', err);

    const errorMessage =
      err?.message ||
      (err instanceof Error
        ? err.message
        : typeof err === 'string'
        ? err
        : 'Scrape failed');

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
