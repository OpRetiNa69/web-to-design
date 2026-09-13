'use client';

import React, { useState } from 'react';
import type { ScanData } from '@/types/tokens';
import { Navbar } from '@/components/Navbar';
import { HeroInputBar } from '@/components/HeroInputBar';
import { SiteHeader } from '@/components/SiteHeader';
import { ColorPaletteCell } from '@/components/ColorPaletteCell';
import { TypographyCell } from '@/components/TypographyCell';
import { ComponentSandboxCell } from '@/components/ComponentSandboxCell';
import { ElevationsCell } from '@/components/ElevationsCell';
import { ExportCell } from '@/components/ExportCell';
import { FeaturesSection } from '@/components/FeaturesSection';
import {
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Code2,
  Check,
  Copy,
} from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanData | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [rawCopied, setRawCopied] = useState(false);

  const getScannedDomain = () => {
    if (!result?.raw?.url) return undefined;
    try {
      return new URL(result.raw.url).hostname.replace(/^www\./, '');
    } catch {
      return result.raw.url;
    }
  };

  const handleScan = async (targetUrl?: string) => {
    const scanUrl = (targetUrl || url).trim();
    if (!scanUrl) {
      setError('Please enter a website URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scanUrl }),
      });

      const rawText = await res.text();
      let data;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        throw new Error(
          `Server returned unexpected response (Status ${res.status}): ${rawText.slice(0, 100)}`
        );
      }

      if (!res.ok || !data?.success) {
        const serverError =
          (typeof data?.error === 'string' && data.error) ||
          (typeof data?.message === 'string' && data.message) ||
          (data?.error && typeof data.error === 'object' && (data.error.message || JSON.stringify(data.error))) ||
          (typeof data === 'string' ? data : null) ||
          `Failed with status ${res.status}${rawText ? `: ${rawText.slice(0, 150)}` : ''}`;
        throw new Error(serverError);
      }

      setResult(data.data);
      if (targetUrl) {
        setUrl(targetUrl);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during scan.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRawJson = () => {
    if (!result?.raw) return;
    navigator.clipboard.writeText(JSON.stringify(result.raw, null, 2));
    setRawCopied(true);
    setTimeout(() => setRawCopied(false), 1800);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-slate-100 selection:bg-[#2563EB] selection:text-white dark:selection:bg-[#2563EB] dark:selection:text-white transition-colors duration-200 relative overflow-x-hidden font-sans">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none -z-20" />

      {/* Modern Sticky Navigation */}
      <Navbar scannedDomain={getScannedDomain()} loading={loading} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Editorial Hero Header */}
        <header className="text-center max-w-4xl mx-auto mb-10 pt-2 sm:pt-6">
          {/* Centered Eyebrow Tag */}
          <div className="text-xs font-mono uppercase tracking-wider text-[#2563EB] font-semibold mb-3">
            Any site, reverse-engineered.
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] dark:text-white text-center max-w-4xl mx-auto leading-[1.15] mb-4">
            Turn Live Websites into{' '}
            <span className="text-[#2563EB] dark:text-blue-400">
              Design Systems
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#0F172A]/70 dark:text-slate-400 text-base sm:text-lg text-center max-w-xl mx-auto mb-8 font-normal leading-relaxed">
            Paste a link. Extract colors, typography, and UI tokens in seconds.
          </p>
        </header>

        {/* Hero URL Input Bar */}
        <div className="mb-14">
          <HeroInputBar
            url={url}
            setUrl={setUrl}
            onScan={handleScan}
            loading={loading}
          />

          {/* Error Banner */}
          {error && (
            <div className="max-w-xl mx-auto mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-3 shadow-xs backdrop-blur-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-700 dark:text-rose-200">Ingestion Error</p>
                <p className="mt-0.5 text-rose-600 dark:text-rose-300/90 text-xs leading-relaxed">{error}</p>
                <p className="mt-1 text-[11px] text-rose-500/80 dark:text-rose-400/70 font-mono">
                  Tip: Ensure the URL is public, accessible over HTTPS, and does not require active session authentication or bot verification.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Central Interactive Showcase / Results Board Container */}
        <div className="relative w-full max-w-5xl mx-auto">
          {/* Ambient Background Atmosphere Radial Gradient */}
          <div 
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-[90%] md:w-[750px] h-[380px] -z-10 pointer-events-none rounded-full blur-3xl opacity-60 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen transition-all duration-700"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.2), rgba(147,197,253,0.1), transparent 70%)'
            }}
          />

          {/* Main Content / Bento Board */}
          <div className="relative z-10">
            {/* Loading State: Shimmering Bento Grid Skeleton */}
            {loading && (
              <div className="space-y-5 animate-pulse max-w-5xl mx-auto">
                <div className="h-20 bg-white dark:bg-[#0F172A]/90 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-sm" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-7 h-[400px] bg-white dark:bg-[#0F172A]/90 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-sm" />
                  <div className="lg:col-span-5 h-[400px] bg-white dark:bg-[#0F172A]/90 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-sm" />
                </div>
              </div>
            )}

            {/* Empty / Initial State: Clean Editorial Board */}
            {!loading && !result && (
              <div className="max-w-3xl mx-auto text-center py-16 px-6 sm:px-10 bg-white dark:bg-[#0F172A]/90 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center mx-auto mb-4 text-[#2563EB] dark:text-blue-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[#0F172A] dark:text-white mb-1.5 tracking-tight font-sans">
                  Ready for Ingestion
                </h3>
                <p className="text-[#0F172A]/70 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
                  Enter a target URL above to crawl styles, isolate design decisions, and compile your design system.
                </p>
                <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs font-mono flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#2563EB] dark:text-blue-400" />
                    CIEDE2000 Clustering
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    WCAG AA/AAA Contrast
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    Modular Type Scales
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    Zero-Config Exports
                  </span>
                </div>
              </div>
            )}

            {/* Active Dashboard: Bento Grid Layout */}
            {!loading && result && (
              <div className="space-y-5 animate-fade-in">
                {/* Site Context Header with Favicon and Rescan */}
                <SiteHeader
                  data={result}
                  onRescan={() => handleScan(result.raw.url)}
                  loading={loading}
                />

                {/* Bento Grid: Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* Color Palette Bento Cell */}
                  <div className="lg:col-span-7">
                    <ColorPaletteCell palette={result.system.palette} />
                  </div>

                  {/* Dynamic Component Sandbox Bento Cell */}
                  <div className="lg:col-span-5">
                    <ComponentSandboxCell system={result.system} />
                  </div>
                </div>

                {/* Bento Grid: Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* Typography Scale Bento Cell */}
                  <div className="lg:col-span-7">
                    <TypographyCell
                      typeScale={result.system.typeScale}
                      fonts={result.system.fonts}
                    />
                  </div>

                  {/* Elevations & Box Shadows Bento Cell */}
                  <div className="lg:col-span-5">
                    <ElevationsCell shadows={result.system.shadows} />
                  </div>
                </div>

                {/* Bento Grid: Row 3 - Production Exporters */}
                <div>
                  <ExportCell
                    exports={result.system.exports}
                    system={result.system}
                    targetUrl={result.raw.url}
                  />
                </div>

                {/* Developer Raw JSON Disclosure */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F172A]/90 text-xs font-mono text-[#0F172A]/70 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer shadow-sm"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
                      <span>Inspect Raw Extraction JSON</span>
                    </span>
                    {showRawJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showRawJson && (
                    <div className="mt-3 p-4 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-inner overflow-hidden relative">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                        <span>raw_extraction.json</span>
                        <button
                          type="button"
                          onClick={handleCopyRawJson}
                          className="inline-flex items-center gap-1 text-[10px] cursor-pointer px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors"
                        >
                          {rawCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Raw JSON</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="font-mono text-xs text-slate-300 max-h-[380px] overflow-auto leading-relaxed">
                        {JSON.stringify(result.raw, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editorial Value Section */}
        <FeaturesSection />

        {/* Clean Editorial Footer */}
        <footer className="mt-24 border-t border-[#E2E8F0] dark:border-slate-800 py-8 text-center text-xs text-[#0F172A]/60 dark:text-slate-500 font-mono">
          <span>site-to-tokens • Design System Extractor</span>
        </footer>
      </main>
    </div>
  );
}
