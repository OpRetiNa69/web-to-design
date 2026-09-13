'use client';

import React, { useState } from 'react';
import { ExternalLink, RotateCw, CheckCircle2, Check } from 'lucide-react';
import type { ScanData } from '@/types/tokens';
import { generateFigmaTokenSheetSvg } from '@/lib/figma-svg';

interface SiteHeaderProps {
  data: ScanData;
  onRescan: () => void;
  loading: boolean;
}

const FigmaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
    <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
    <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
    <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
    <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
  </svg>
);

export const SiteHeader: React.FC<SiteHeaderProps> = ({ data, onRescan, loading }) => {
  const [figmaCopied, setFigmaCopied] = useState(false);

  const getHostname = (urlString: string) => {
    try {
      return new URL(urlString).hostname.replace(/^www\./, '');
    } catch {
      return urlString;
    }
  };

  const domain = getHostname(data.raw.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  const totalColors =
    data.system.palette.primary.length +
    data.system.palette.surfaces.length +
    data.system.palette.neutrals.length +
    data.system.palette.accents.length;

  const totalComponents =
    (data.raw?.components?.buttons?.length || 0) +
    (data.raw?.components?.inputs?.length || 0) +
    (data.raw?.components?.cards?.length || 0) +
    (data.raw?.components?.badges?.length || 0);

  const totalIcons = data.raw?.icons?.length || 0;

  const handleCopyFigma = async () => {
    const svgString = generateFigmaTokenSheetSvg(data.system, data.raw.url);
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        const textBlob = new Blob([svgString], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/svg+xml': svgBlob,
            'text/plain': textBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(svgString);
      }
    } catch {
      await navigator.clipboard.writeText(svgString);
    }

    setFigmaCopied(true);
    setTimeout(() => setFigmaCopied(false), 2600);
  };

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors duration-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        {/* Left: Favicon & Domain Title */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-center p-2.5 flex-shrink-0 overflow-hidden">
            <img
              src={faviconUrl}
              alt={`${domain} icon`}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-medium font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Extracted</span>
              </span>
              <a
                href={data.raw.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 inline-flex items-center gap-1 transition-colors"
              >
                <span className="truncate max-w-[180px] sm:max-w-xs">{domain}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate max-w-xl">
              {data.raw.title || domain}
            </h2>
          </div>
        </div>

        {/* Right: Quick Stats, Figma Action & Solid Rescan Button */}
        <div className="flex items-center gap-3 self-start sm:self-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-200/80 dark:border-neutral-800/80 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-700/60 text-neutral-600 dark:text-neutral-300 text-[11px]">
              {totalColors} Colors
            </span>
            <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-700/60 text-neutral-600 dark:text-neutral-300 text-[11px]">
              {data.system.typeScale.length} Type Steps
            </span>
            {totalComponents > 0 && (
              <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-700/60 text-neutral-600 dark:text-neutral-300 text-[11px]">
                {totalComponents} Components
              </span>
            )}
            {totalIcons > 0 && (
              <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-700/60 text-neutral-600 dark:text-neutral-300 text-[11px]">
                {totalIcons} SVGs
              </span>
            )}
          </div>

          {/* Quick Copy for Figma Button */}
          <button
            type="button"
            onClick={handleCopyFigma}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-colors cursor-pointer active:scale-95 border border-neutral-200 dark:border-neutral-700"
            title="Copy SVG vector token sheet for Figma"
          >
            {figmaCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-300">Copied for Figma!</span>
              </>
            ) : (
              <>
                <FigmaIcon className="w-3.5 h-3.5" />
                <span>Copy for Figma</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRescan}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 text-xs font-medium transition-colors cursor-pointer active:scale-95 disabled:opacity-50 flex-shrink-0"
            title="Re-extract design system"
          >
            <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Rescan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
