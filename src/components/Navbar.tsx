'use client';

import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Layers } from 'lucide-react';

interface NavbarProps {
  scannedDomain?: string;
  loading?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ scannedDomain, loading }) => {
  return (
    <header className="w-full border-b border-neutral-100 dark:border-neutral-900 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Clean Brand Mark */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center shadow-xs">
            <Layers className="w-3.5 h-3.5 text-white dark:text-neutral-950" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-50">
            site-to-tokens
          </span>
          {loading && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-mono ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Scanning...</span>
            </div>
          )}
          {!loading && scannedDomain && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-[11px] font-mono ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="truncate max-w-[160px]">{scannedDomain}</span>
            </div>
          )}
        </div>

        {/* Right: Theme Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
