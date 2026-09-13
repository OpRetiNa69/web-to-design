'use client';

import React, { useState } from 'react';
import type { ExtractedIcon } from '@/types/tokens';
import { Shapes, Copy, Check, Search, Download } from 'lucide-react';

interface IconsCellProps {
  icons?: ExtractedIcon[];
}

export const IconsCell: React.FC<IconsCellProps> = ({ icons = [] }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIcons = icons.filter((icon) =>
    icon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopySvg = async (icon: ExtractedIcon) => {
    try {
      await navigator.clipboard.writeText(icon.svg);
      setCopiedId(icon.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback
    }
  };

  const handleDownloadSvg = (icon: ExtractedIcon) => {
    const blob = new Blob([icon.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${icon.name}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors duration-200 p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-neutral-200/80 dark:border-neutral-800/80 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Shapes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                Vector Icon Glyphs
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Extracted inline SVGs normalized for Figma &amp; codebase icons.
              </p>
            </div>
          </div>

          {/* Search Input & Counter */}
          <div className="flex items-center gap-2.5">
            {icons.length > 6 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter icons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 text-neutral-800 dark:text-neutral-200 w-32 sm:w-40 font-mono transition-all"
                />
              </div>
            )}
            <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono border border-neutral-200/60 dark:border-neutral-700/60">
              {icons.length} Icons
            </span>
          </div>
        </div>

        {/* Empty State */}
        {icons.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 dark:text-neutral-400 font-mono text-xs">
            No inline SVG icons found on this page.
          </div>
        ) : (
          /* Icons Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredIcons.map((icon) => {
              const isCopied = copiedId === icon.id;

              return (
                <div
                  key={icon.id}
                  className="group relative p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/50 dark:bg-neutral-950/40 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-neutral-900 transition-all flex flex-col items-center justify-between text-center"
                >
                  {/* Micro Copied Badge */}
                  {isCopied && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-[10px] font-mono font-medium shadow-md flex items-center gap-1 animate-bounce pointer-events-none whitespace-nowrap">
                      <Check className="w-2.5 h-2.5 text-emerald-400 dark:text-emerald-600" />
                      <span>SVG Copied</span>
                    </div>
                  )}

                  {/* Icon Preview */}
                  <div
                    onClick={() => handleCopySvg(icon)}
                    className="w-full py-4 flex items-center justify-center cursor-pointer text-neutral-700 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white transition-transform group-hover:scale-110"
                    title="Click to copy SVG"
                    dangerouslySetInnerHTML={{ __html: icon.svg }}
                  />

                  {/* Metadata & Actions */}
                  <div className="w-full pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between gap-1">
                    <span
                      className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 truncate text-left select-all"
                      title={icon.name}
                    >
                      {icon.name}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleCopySvg(icon)}
                        className="p-1 rounded-md hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                        title="Copy SVG to clipboard"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadSvg(icon)}
                        className="p-1 rounded-md hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                        title="Download .svg"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
