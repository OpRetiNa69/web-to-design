'use client';

import React, { useState, useEffect } from 'react';
import type { ExtractedColor, DesignSystem } from '@/types/tokens';
import { calculateContrastRatio, generateBrandColorRamp } from '@/lib/color-normalizer';
import { Palette, Check, Copy } from 'lucide-react';

interface ColorPaletteCellProps {
  palette: DesignSystem['palette'];
}

export const ColorPaletteCell: React.FC<ColorPaletteCellProps> = ({ palette }) => {
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

  const getTokenSyntax = (sectionLabel: string, index: number, hex: string) => {
    switch (sectionLabel) {
      case 'Primary Brand':
        return {
          varSyntax: index > 0 ? `var(--color-primary-${index})` : 'var(--color-primary)',
          twSyntax: index > 0 ? `bg-primary-shade-${index}` : 'bg-primary',
        };
      case 'Surfaces':
        return {
          varSyntax: `var(--color-surface-${index + 1})`,
          twSyntax: index === 0 ? 'bg-surface' : `bg-surface-${(index + 1) * 100}`,
        };
      case 'Neutrals':
        return {
          varSyntax: `var(--color-neutral-${(index + 1) * 100})`,
          twSyntax: `bg-neutral-${(index + 1) * 100}`,
        };
      case 'Accents':
        return {
          varSyntax: `var(--color-accent-${index + 1})`,
          twSyntax: `bg-accent-${index + 1}`,
        };
      default:
        return {
          varSyntax: `var(--color-${index + 1})`,
          twSyntax: `bg-[${hex}]`,
        };
    }
  };

  const sections: Array<{ label: string; colors: ExtractedColor[]; description: string }> = [
    { label: 'Primary Brand', colors: palette.primary, description: 'Core interactive & brand tokens' },
    { label: 'Surfaces', colors: palette.surfaces, description: 'Cards, modals, and canvas backgrounds' },
    { label: 'Neutrals', colors: palette.neutrals, description: 'Text, borders, and subtle dividers' },
    { label: 'Accents', colors: palette.accents, description: 'Secondary emphasis and badges' },
  ];

  const totalSwatches =
    palette.primary.length +
    palette.surfaces.length +
    palette.neutrals.length +
    palette.accents.length;

  const brandRamp = palette.primary.length > 0 ? generateBrandColorRamp(palette.primary[0].hex) : null;

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors duration-200 p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-200/80 dark:border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                Color Tokens & Harmonies
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                CIEDE2000 clustered with automated 50–950 brand ramps &amp; WCAG AA contrast auditing.
              </p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300 font-mono border border-neutral-200/60 dark:border-neutral-700/60">
            {totalSwatches} Tokens
          </span>
        </div>

        {/* Semantic Rows */}
        <div className="space-y-6">
          {sections.map(({ label, colors }) => {
            if (!colors || colors.length === 0) return null;

            return (
              <div key={label} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-mono tracking-wider text-neutral-400 dark:text-neutral-500 font-medium">
                    {label}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                    {colors.length} {colors.length === 1 ? 'token' : 'tokens'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {colors.map((color, idx) => {
                    const tokenKey = `${label}-${color.hex}-${idx}`;
                    const isCopied = copiedFeedback?.id === tokenKey;
                    const contrastRatio = calculateContrastRatio(color.hex, color.contrastText);
                    const isPassAA = contrastRatio >= 4.5;
                    const { varSyntax, twSyntax } = getTokenSyntax(label, idx, color.hex);

                    return (
                      <div
                        key={tokenKey}
                        onClick={() => handleCopy(color.hex, 'HEX', tokenKey)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenuToken(contextMenuToken === tokenKey ? null : tokenKey);
                        }}
                        title="Click to copy HEX, right-click or use buttons for other formats"
                        className="group relative rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/40 p-2.5 transition-all duration-150 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-2xs cursor-pointer"
                      >
                        {/* Micro "Copied!" Popover Feedback */}
                        {isCopied && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 px-2 py-0.5 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-[10px] font-mono font-medium shadow-md flex items-center gap-1 animate-bounce pointer-events-none whitespace-nowrap">
                            <Check className="w-2.5 h-2.5 text-emerald-400 dark:text-emerald-600" />
                            <span>Copied {copiedFeedback.label}!</span>
                          </div>
                        )}

                        {/* Subtle Context Menu Popover */}
                        {contextMenuToken === tokenKey && (
                          <div
                            className="absolute top-1 right-1 z-30 min-w-[130px] py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl text-[11px] font-mono animate-in fade-in zoom-in-95"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-2.5 py-1 text-[9px] text-neutral-400 uppercase tracking-wider font-sans border-b border-neutral-100 dark:border-neutral-800 mb-0.5">
                              Copy Format
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(color.hex, 'HEX', tokenKey)}
                              className="w-full text-left px-2.5 py-1 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer"
                            >
                              <span>HEX</span>
                              <span className="text-[10px] text-neutral-400">{color.hex}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(varSyntax, 'var()', tokenKey)}
                              className="w-full text-left px-2.5 py-1 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer"
                            >
                              <span>CSS Var</span>
                              <span className="text-[9px] text-neutral-400 truncate max-w-[60px]">{varSyntax}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(twSyntax, 'class', tokenKey)}
                              className="w-full text-left px-2.5 py-1 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer"
                            >
                              <span>Tailwind</span>
                              <span className="text-[9px] text-neutral-400 truncate max-w-[60px]">{twSyntax}</span>
                            </button>
                          </div>
                        )}

                        {/* Rounded Preview Block */}
                        <div
                          className="w-full h-14 rounded-xl border border-black/5 dark:border-white/5 mb-2 relative overflow-hidden flex items-end justify-between p-1.5 transition-transform duration-150 group-hover:scale-[1.01]"
                          style={{ backgroundColor: color.hex }}
                        >
                          {/* WCAG Contrast Tag */}
                          {isPassAA ? (
                            <div
                              className="inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md backdrop-blur-md shadow-xs"
                              style={{
                                backgroundColor: color.contrastText === '#ffffff' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.75)',
                                color: color.contrastText,
                                border: `1px solid ${color.contrastText}33`,
                              }}
                              title={`Contrast Ratio: ${contrastRatio.toFixed(1)}:1 (Meets WCAG AA threshold 4.5:1)`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Pass AA</span>
                            </div>
                          ) : (
                            <div
                              className="inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md backdrop-blur-md shadow-xs"
                              style={{
                                backgroundColor: color.contrastText === '#ffffff' ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                              }}
                              title={`Contrast Ratio: ${contrastRatio.toFixed(1)}:1 (Below WCAG AA threshold 4.5:1 for body text)`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>Fail AA ({contrastRatio.toFixed(1)}:1)</span>
                            </div>
                          )}

                          {/* Split Action Buttons on Hover */}
                          <div
                            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(varSyntax, 'var()', tokenKey);
                              }}
                              title={`Copy CSS Variable: ${varSyntax}`}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                              style={{
                                backgroundColor: color.contrastText === '#ffffff' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.75)',
                                color: color.contrastText,
                                border: `1px solid ${color.contrastText}33`,
                              }}
                            >
                              var()
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(twSyntax, 'class', tokenKey);
                              }}
                              title={`Copy Tailwind class: ${twSyntax}`}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                              style={{
                                backgroundColor: color.contrastText === '#ffffff' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.75)',
                                color: color.contrastText,
                                border: `1px solid ${color.contrastText}33`,
                              }}
                            >
                              class
                            </button>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex items-center justify-between px-0.5">
                          <span className="font-mono text-xs font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                            {color.hex}
                            <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                          </span>
                          <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">
                            {contrastRatio.toFixed(1)}:1
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Auto-Generated 50-950 Color Ramp for Primary Brand */}
                {label === 'Primary Brand' && brandRamp && (
                  <div className="mt-3 p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 font-medium">
                        Auto-Generated Brand Ramp (50–950)
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                        Tailwind &amp; Tokens Studio Ready
                      </span>
                    </div>
                    <div className="grid grid-cols-11 gap-1">
                      {Object.entries(brandRamp).map(([step, hexVal]) => {
                        const rampKey = `ramp-${step}`;
                        const isRampCopied = copiedFeedback?.id === rampKey;
                        return (
                          <div
                            key={step}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(hexVal, step, rampKey);
                            }}
                            title={`primary-${step}: ${hexVal} (Click to copy)`}
                            className="group/ramp relative flex flex-col items-center cursor-pointer"
                          >
                            {isRampCopied && (
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 px-1.5 py-0.5 rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-[9px] font-mono whitespace-nowrap shadow-md">
                                Copied!
                              </div>
                            )}
                            <div
                              className="w-full h-8 rounded-md border border-black/10 dark:border-white/10 transition-transform group-hover/ramp:scale-110 shadow-2xs"
                              style={{ backgroundColor: hexVal }}
                            />
                            <span className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400 mt-1">
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
