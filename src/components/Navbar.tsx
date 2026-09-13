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
    <header className="w-full border-b border-[#E2E8F0] dark:border-slate-800/80 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Clean Brand Mark */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-[#0F172A] dark:text-white">
            site-to-tokens
          </span>
          {loading && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-400 text-[11px] font-mono ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
              <span>Scanning...</span>
            </div>
          )}
          {!loading && scannedDomain && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-[#2563EB] dark:text-blue-400 text-[11px] font-mono ml-2">
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
