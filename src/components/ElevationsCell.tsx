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
    <div className="bg-white dark:bg-[#0F172A]/90 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200 p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E2E8F0] dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
              <BoxSelect className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-[#0F172A] dark:text-white">
                Elevations &amp; Shadows
              </h3>
              <p className="text-xs text-[#0F172A]/70 dark:text-slate-400">
                Extracted box-shadow hierarchy tokens
              </p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 font-mono font-medium border border-blue-200 dark:border-blue-800">
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
                className="group relative p-3.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC]/70 dark:bg-[#0F172A]/60 hover:border-[#2563EB]/40 transition-colors cursor-pointer flex flex-col items-center justify-between text-center"
              >
                {/* Micro "Copied!" Popover */}
                {isCopied && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-md bg-[#0F172A] text-white dark:bg-white dark:text-[#0F172A] text-[10px] font-mono font-medium shadow-md flex items-center gap-1 animate-bounce pointer-events-none">
                    <Check className="w-2.5 h-2.5 text-emerald-400 dark:text-emerald-600" />
                    <span>Copied</span>
                  </div>
                )}

                {/* Visual Elevation Box with real shadow applied */}
                <div className="w-full py-5 flex items-center justify-center mb-2">
                  <div
                    className="w-14 h-14 rounded-xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-700/60 transition-transform group-hover:scale-105 flex items-center justify-center"
                    style={{ boxShadow: s.value }}
                  >
                    <span className="text-[11px] font-mono font-semibold uppercase text-slate-500 dark:text-slate-400">
                      {s.name}
                    </span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0F172A] dark:text-slate-200 uppercase text-[11px] font-mono">
                      elevation-{s.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      ×{s.count}
                    </span>
                  </div>

                  <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate text-left" title={s.value}>
                    {s.value}
                  </p>

                  <div className="pt-2 flex items-center justify-center text-[10px] text-slate-400 group-hover:text-[#0F172A] dark:group-hover:text-slate-200">
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
