'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Search, Sparkles, Command } from 'lucide-react';

interface HeroInputBarProps {
  url: string;
  setUrl: (url: string) => void;
  onScan: (targetUrl?: string) => void;
  loading: boolean;
}

const PRESET_PILLS = [
  { label: 'Stripe', url: 'https://stripe.com' },
  { label: 'Linear', url: 'https://linear.app' },
  { label: 'Apple', url: 'https://apple.com' },
];

export const HeroInputBar: React.FC<HeroInputBarProps> = ({
  url,
  setUrl,
  onScan,
  loading,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut ⌘K / Ctrl+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const getLoadingStage = () => {
    if (elapsedSeconds < 2) {
      return { step: '1/3', message: 'Spinning up browser & connecting to URL...' };
    }
    if (elapsedSeconds < 5) {
      return { step: '2/3', message: 'Hydrating DOM & parsing computed styles...' };
    }
    return { step: '3/3', message: 'Clustering colors & building design scale...' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    onScan();
  };

  const currentStage = getLoadingStage();

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} suppressHydrationWarning className="relative group">
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F172A]/90 p-1.5 pl-5 shadow-sm max-w-xl mx-auto flex items-center gap-2 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/40 transition-all backdrop-blur-md">
          <div className="text-slate-400 dark:text-slate-500 flex items-center pointer-events-none">
            <Search className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
            id="url-input"
            suppressHydrationWarning
            type="text"
            placeholder="Paste any website URL (e.g. stripe.com)..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="flex-1 bg-transparent py-2 text-[#0F172A] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none"
          />

          {/* Shortcut badge */}
          <div className="hidden sm:flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 pointer-events-none border border-[#E2E8F0] dark:border-slate-700">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>

          <button
            id="scan-submit-button"
            type="submit"
            suppressHydrationWarning
            disabled={loading || !url.trim()}
            className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-xl px-5 py-2 text-sm font-medium shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 flex items-center gap-1.5 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Extracting...</span>
              </>
            ) : (
              <>
                <span>Extract</span>
                <span className="text-base leading-none">→</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Perceptual Loading Stage Indicator */}
      {loading && (
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[#0F172A]/70 dark:text-slate-400 animate-fade-in bg-white dark:bg-[#0F172A]/90 border border-[#E2E8F0] dark:border-slate-800 py-2 px-4 rounded-xl max-w-sm mx-auto shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 animate-pulse flex-shrink-0" />
            <span className="font-medium truncate text-xs">{currentStage.message}</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
            {currentStage.step}
          </span>
        </div>
      )}

      {/* Quick Demo Chips */}
      {!loading && (
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-xs">
          <span className="text-[#0F172A]/60 dark:text-slate-400 text-[11px] font-mono">
            Try:
          </span>
          {PRESET_PILLS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              suppressHydrationWarning
              onClick={() => {
                setUrl(preset.url);
                onScan(preset.url);
              }}
              disabled={loading}
              className="rounded-full bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-3 py-1 text-xs font-mono font-medium transition-all cursor-pointer active:scale-95 disabled:pointer-events-none"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
