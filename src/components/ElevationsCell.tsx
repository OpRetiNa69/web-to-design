'use client';

import React, { useState } from 'react';
import type { ExtractedShadow } from '@/types/tokens';
import { BoxSelect, Copy, Check } from 'lucide-react';

interface ElevationsCellProps {
  shadows: ExtractedShadow[];
}

export const ElevationsCell: React.FC<ElevationsCellProps> = ({ shadows }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (value: string, index: number) => {
    navigator.clipboard.writeText(value);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1600);
  };

  // Fallbacks if website has minimal/no custom shadows
  const displayShadows =
    shadows.length > 0
      ? shadows
      : [
          { name: 'sm', value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', count: 1 },
          { name: 'md', value: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', count: 1 },
          { name: 'lg', value: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', count: 1 },
        ];

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors duration-200 p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-200/80 dark:border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-center">
              <BoxSelect className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                Elevations & Shadows
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Extracted box-shadow hierarchy tokens
              </p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300 font-mono border border-neutral-200/60 dark:border-neutral-700/60">
            {displayShadows.length} Levels
          </span>
        </div>

        {/* Shadows Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {displayShadows.map((s, idx) => {
            const isCopied = copiedIndex === idx;

            return (
              <div
                key={s.name}
                onClick={() => handleCopy(s.value, idx)}
                className="group relative p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/40 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer flex flex-col items-center justify-between text-center"
              >
                {/* Micro "Copied!" Popover */}
                {isCopied && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-[10px] font-mono font-medium shadow-md flex items-center gap-1 animate-bounce pointer-events-none">
                    <Check className="w-2.5 h-2.5 text-emerald-400 dark:text-emerald-600" />
                    <span>Copied</span>
                  </div>
                )}

                {/* Visual Elevation Box with real shadow applied */}
                <div className="w-full py-5 flex items-center justify-center mb-2">
                  <div
                    className="w-14 h-14 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-700/60 transition-transform group-hover:scale-105 flex items-center justify-center"
                    style={{ boxShadow: s.value }}
                  >
                    <span className="text-[11px] font-mono font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                      {s.name}
                    </span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase text-[11px] font-mono">
                      elevation-{s.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                      ×{s.count}
                    </span>
                  </div>

                  <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 truncate text-left" title={s.value}>
                    {s.value}
                  </p>

                  <div className="pt-2 flex items-center justify-center text-[10px] text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
                    <span className="inline-flex items-center gap-1 opacity-70 group-hover:opacity-100 font-mono">
                      <Copy className="w-2.5 h-2.5" /> Click to copy
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
