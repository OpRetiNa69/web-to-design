'use client';

import React, { useState, useEffect } from 'react';
import type { DesignSystem, TypeScaleItem } from '@/types/tokens';
import { Type, SlidersHorizontal, Sparkles, RotateCcw, Check, Copy } from 'lucide-react';

interface TypographyCellProps {
  typeScale: TypeScaleItem[];
  fonts: DesignSystem['fonts'];
}

const SYSTEM_WEB_SAFE_FONTS = new Set([
  'system-ui',
  '-apple-system',
  'blinkmacsystemfont',
  'segoe ui',
  'roboto',
  'arial',
  'helvetica',
  'helvetica neue',
  'times new roman',
  'times',
  'courier new',
  'courier',
  'verdana',
  'georgia',
  'palatino',
  'garamond',
  'bookman',
  'comic sans ms',
  'trebuchet ms',
  'arial black',
  'impact',
  'sans-serif',
  'serif',
  'monospace',
  'tahoma',
  'geneva',
  'calibri',
  'candara',
  'optima',
  'cambria',
]);

export const TypographyCell: React.FC<TypographyCellProps> = ({ typeScale, fonts }) => {
  const [specimen, setSpecimen] = useState('The quick brown fox jumps over the lazy dog.');
  const [fontLoaded, setFontLoaded] = useState(false);
  const [fallbackFonts, setFallbackFonts] = useState<Set<string>>(new Set());
  const [copiedFeedback, setCopiedFeedback] = useState<{ id: string; label: string } | null>(null);
  const [contextMenuToken, setContextMenuToken] = useState<string | null>(null);

  useEffect(() => {
    const handleCloseMenu = () => setContextMenuToken(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  const handleCopy = (text: string, label: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedFeedback({ id, label });
    setContextMenuToken(null);
    setTimeout(() => {
      setCopiedFeedback((curr) => (curr?.id === id ? null : curr));
    }, 1500);
  };

  // Dynamic Google Font Injection & Fallback Detection
  useEffect(() => {
    let mounted = true;
    const fontsToCheck = [fonts.heading, fonts.body].filter(Boolean);

    const fontsToLoad = fontsToCheck.filter((f) => {
      const lower = f.replace(/["']/g, '').trim().toLowerCase();
      return !SYSTEM_WEB_SAFE_FONTS.has(lower);
    });

    const links: HTMLLinkElement[] = [];

    const evaluateFontAvailability = async () => {
      const detectedFallbacks = new Set<string>();

      for (const fontName of fontsToCheck) {
        const cleanName = fontName.replace(/["']/g, '').trim();
        const lower = cleanName.toLowerCase();

        if (SYSTEM_WEB_SAFE_FONTS.has(lower)) {
          continue;
        }

        let isAvailable = false;
        if (typeof document !== 'undefined' && 'fonts' in document) {
          try {
            await document.fonts.ready;
            isAvailable =
              document.fonts.check(`16px "${cleanName}"`) ||
              document.fonts.check(`bold 16px "${cleanName}"`);
          } catch {
            isAvailable = false;
          }
        }

        if (!isAvailable) {
          detectedFallbacks.add(fontName);
        }
      }

      if (mounted) {
        setFallbackFonts(detectedFallbacks);
      }
    };

    if (fontsToLoad.length === 0) {
      setFontLoaded(true);
      evaluateFontAvailability();
      return;
    }

    fontsToLoad.forEach((fontName) => {
      const cleanName = fontName.replace(/["']/g, '').trim();
      const linkId = `gfont-${cleanName.toLowerCase().replace(/\s+/g, '-')}`;

      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanName)}:wght@400;500;600;700&display=swap`;
        link.onload = () => {
          evaluateFontAvailability();
        };
        link.onerror = () => {
          if (mounted) {
            setFallbackFonts((prev) => new Set(prev).add(fontName));
          }
        };
        document.head.appendChild(link);
        links.push(link);
      }
    });

    setFontLoaded(true);
    evaluateFontAvailability();
    const fallbackTimer = setTimeout(evaluateFontAvailability, 1200);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      links.forEach((l) => {
        if (l.parentNode) {
          l.parentNode.removeChild(l);
        }
      });
    };
  }, [fonts.heading, fonts.body]);

  const getFallbackChain = (font: string) => {
    if (!font) return 'system-ui, -apple-system, sans-serif';
    return `"${font}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  };

  return (
    <div className="bg-white dark:bg-[#0F172A]/90 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200 p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#E2E8F0] dark:border-slate-800 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight text-[#0F172A] dark:text-white">
                  Typography &amp; Hierarchy
                </h3>
                {fontLoaded && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1 font-mono">
                    <Sparkles className="w-2.5 h-2.5 text-[#2563EB] dark:text-blue-400" /> High-Fidelity
                  </span>
                )}
              </div>
              <p className="text-xs text-[#0F172A]/70 dark:text-slate-400">
                Computed font-family stacks, proportional type scaling, and dynamic line-heights.
              </p>
            </div>
          </div>

          {/* Font Family Badges with Fallback chains and Fallback indicator */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Heading Font Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-[#E2E8F0] dark:border-slate-700 text-[#0F172A]/80 dark:text-slate-200 font-mono text-[11px]">
              <span className="text-slate-400 dark:text-slate-500 font-sans uppercase text-[10px]">Head:</span>
              <span className="font-semibold text-[#0F172A] dark:text-white">{fonts.heading}</span>
              <span className="text-slate-400 dark:text-slate-500 text-[10px]">, sans-serif</span>
              {fallbackFonts.has(fonts.heading) && (
                <span
                  title="Rendering via local system fallback stack"
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-sans font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 cursor-help ml-1 select-none"
                >
                  System Render
                </span>
              )}
            </div>

            {/* Body Font Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-[#E2E8F0] dark:border-slate-700 text-[#0F172A]/80 dark:text-slate-200 font-mono text-[11px]">
              <span className="text-slate-400 dark:text-slate-500 font-sans uppercase text-[10px]">Body:</span>
              <span className="font-semibold text-[#0F172A] dark:text-white">{fonts.body}</span>
              <span className="text-slate-400 dark:text-slate-500 text-[10px]">, sans-serif</span>
              {fallbackFonts.has(fonts.body) && (
                <span
                  title="Rendering via local system fallback stack"
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-sans font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 cursor-help ml-1 select-none"
                >
                  System Render
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Editable Specimen Input Bar */}
        <div className="mb-5">
          <div className="relative flex items-center bg-white dark:bg-[#0F172A] rounded-xl px-4 py-2.5 text-xs transition-all border border-[#E2E8F0] dark:border-slate-800 focus-within:ring-2 focus-within:ring-[#2563EB]/40 focus-within:border-[#2563EB]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mr-2.5 flex-shrink-0" />
            <input
              id="specimen-input"
              suppressHydrationWarning
              type="text"
              value={specimen}
              onChange={(e) => setSpecimen(e.target.value)}
              placeholder="The quick brown fox jumps over the lazy dog..."
              className="bg-transparent text-[#0F172A] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 w-full focus:outline-none text-xs"
            />
            {specimen && (
              <button
                type="button"
                onClick={() => setSpecimen('The quick brown fox jumps over the lazy dog.')}
                className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200 ml-2 cursor-pointer flex items-center gap-1 flex-shrink-0"
                title="Reset sample text"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Modular Scale Ladder */}
        <div className="space-y-2.5">
          {typeScale.map((item) => {
            const isHeading = ['display', 'h1', 'h2', 'h3'].includes(item.name);
            const fontName = isHeading ? fonts.heading : fonts.body;
            const tokenKey = `type-${item.name}`;
            const isCopied = copiedFeedback?.id === tokenKey;
            const varSyntax = `var(--font-size-${item.name})`;
            const twSyntax = `text-${item.name}`;
            const isFallback = fallbackFonts.has(fontName);

            return (
              <div
                key={item.name}
                onClick={() => handleCopy(item.fontSize, 'size', tokenKey)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenuToken(contextMenuToken === tokenKey ? null : tokenKey);
                }}
                title="Click to copy font-size, right-click or use buttons for other formats"
                className="group relative p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC]/70 dark:bg-[#0F172A]/60 hover:border-[#2563EB]/40 transition-colors cursor-pointer"
              >
                {/* Temporary Checkmark Feedback Popover */}
                {isCopied && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 px-2 py-0.5 rounded-md bg-[#0F172A] text-white dark:bg-white dark:text-[#0F172A] text-[10px] font-mono font-medium shadow-md flex items-center gap-1 animate-bounce pointer-events-none whitespace-nowrap">
                    <Check className="w-2.5 h-2.5 text-emerald-400 dark:text-emerald-600" />
                    <span>Copied {copiedFeedback.label}!</span>
                  </div>
                )}

                {/* Subtle Context Menu Popover */}
                {contextMenuToken === tokenKey && (
                  <div
                    className="absolute top-2 right-2 z-30 min-w-[140px] py-1 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-xl shadow-xl text-[11px] font-mono animate-in fade-in zoom-in-95"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-2.5 py-1 text-[9px] text-slate-400 uppercase tracking-wider font-sans border-b border-[#E2E8F0] dark:border-slate-800 mb-0.5">
                      Copy Format
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.fontSize, 'size', tokenKey)}
                      className="w-full text-left px-2.5 py-1 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800/80 flex items-center justify-between cursor-pointer"
                    >
                      <span>Size</span>
                      <span className="text-[10px] text-slate-400">{item.fontSize}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(varSyntax, 'var()', tokenKey)}
                      className="w-full text-left px-2.5 py-1 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800/80 flex items-center justify-between cursor-pointer"
                    >
                      <span>CSS Var</span>
                      <span className="text-[9px] text-slate-400 truncate max-w-[65px]">{varSyntax}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(twSyntax, 'class', tokenKey)}
                      className="w-full text-left px-2.5 py-1 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800/80 flex items-center justify-between cursor-pointer"
                    >
                      <span>Tailwind</span>
                      <span className="text-[9px] text-slate-400 truncate max-w-[65px]">{twSyntax}</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs mb-1 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] uppercase font-bold tracking-wider">
                      {item.name}
                    </span>
                    <span className="text-[#0F172A]/60 dark:text-slate-400 text-[11px]">&lt;{item.sampleTag}&gt;</span>
                    {isFallback && (
                      <span
                        title="Rendering via local system fallback stack"
                        className="px-1.5 py-0.5 rounded text-[9px] font-sans font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 cursor-help select-none"
                      >
                        System Render
                      </span>
                    )}
                  </div>

                  {/* Metrics & Hover Split Action Buttons */}
                  <div className="flex items-center gap-2">
                    <div className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                        {item.fontSize}
                        <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                      </span>
                      <span>•</span>
                      <span>LH: {item.lineHeight}</span>
                    </div>

                    {/* Split Copy Buttons on Hover */}
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleCopy(varSyntax, 'var()', tokenKey)}
                        title={`Copy CSS Variable: ${varSyntax}`}
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        var()
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(twSyntax, 'class', tokenKey)}
                        title={`Copy Tailwind class: ${twSyntax}`}
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        class
                      </button>
                    </div>
                  </div>
                </div>

                <p
                  className="text-neutral-900 dark:text-neutral-100 truncate transition-all leading-tight mt-1"
                  style={{
                    fontSize: item.fontSize,
                    lineHeight: item.lineHeight,
                    fontFamily: getFallbackChain(fontName),
                  }}
                >
                  {specimen || 'Sphinx of black quartz, judge my vow.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
