'use client';

import React, { useState } from 'react';
import type { DesignSystem } from '@/types/tokens';
import {
  LayoutDashboard,
  Sparkles,
  Send,
  Sun,
  Moon,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

interface ComponentSandboxCellProps {
  system: DesignSystem;
}

export const ComponentSandboxCell: React.FC<ComponentSandboxCellProps> = ({ system }) => {
  const [inputValue, setInputValue] = useState('');
  const [activeRadiusIndex, setActiveRadiusIndex] = useState(0);
  const [sandboxTheme, setSandboxTheme] = useState<'light' | 'dark'>('dark');

  const primaryColor = system.palette.primary[0]?.hex || '#6366f1';
  const primaryContrast = system.palette.primary[0]?.contrastText || '#ffffff';
  const accentColor = system.palette.accents[0]?.hex || primaryColor;
  const accentContrast = system.palette.accents[0]?.contrastText || '#ffffff';

  const isLight = sandboxTheme === 'light';

  // Dynamic sandbox canvas colors
  const surfaceBg = isLight
    ? '#ffffff'
    : system.palette.surfaces[0]?.hex || '#18181b';

  const surfaceContrast = isLight
    ? '#09090b'
    : system.palette.surfaces[0]?.contrastText || '#ffffff';

  const neutralBorder = isLight
    ? '#e5e7eb'
    : system.palette.neutrals[0]?.hex || '#27272a';

  const canvasBg = isLight ? '#f9fafb' : '#09090b';

  const currentRadius = system.radii[activeRadiusIndex]?.value || '12px';

  return (
    <div className="bg-white dark:bg-[#0F172A]/90 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200 p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E2E8F0] dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-[#0F172A] dark:text-white">
                Rendered UI Primitives
              </h3>
              <p className="text-xs text-[#0F172A]/70 dark:text-slate-400">
                Real DOM elements dynamically rendered using your extracted tokens.
              </p>
            </div>
          </div>

          {/* Segmented Switch for Surface Preview */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-0.5 rounded-full border border-[#E2E8F0] dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSandboxTheme('light')}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                isLight
                  ? 'bg-white dark:bg-slate-800 text-[#2563EB] dark:text-blue-400 shadow-2xs font-medium'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Preview in Light Canvas"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="text-[11px]">Light</span>
            </button>
            <button
              type="button"
              onClick={() => setSandboxTheme('dark')}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                !isLight
                  ? 'bg-white dark:bg-slate-800 text-[#2563EB] dark:text-blue-400 shadow-2xs font-medium'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Preview in Dark Canvas"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="text-[11px]">Dark</span>
            </button>
          </div>
        </div>

        {/* Sandbox Playground Frame */}
        <div
          className="p-5 border rounded-xl space-y-4 transition-colors duration-300"
          style={{
            backgroundColor: canvasBg,
            borderColor: neutralBorder,
            fontFamily: `"${system.fonts.body}", -apple-system, sans-serif`,
          }}
        >
          {/* Stat / Metric Card Primitive */}
          <div
            className="p-4 border shadow-xs transition-all"
            style={{
              backgroundColor: surfaceBg,
              color: surfaceContrast,
              borderColor: neutralBorder,
              borderRadius: currentRadius,
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium uppercase font-mono tracking-wider opacity-60">
                Conversion Rate
              </span>
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${primaryColor}1a`,
                  color: primaryColor,
                  border: `1px solid ${primaryColor}33`,
                }}
              >
                <TrendingUp className="w-3 h-3" />
                <span>+14.8%</span>
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: `"${system.fonts.heading}", -apple-system, sans-serif` }}
              >
                2,845 ARR
              </span>
              {/* Token Badge */}
              <span
                className="text-[10px] font-mono px-2 py-0.5 inline-flex items-center gap-1"
                style={{
                  backgroundColor: accentColor,
                  color: accentContrast,
                  borderRadius: currentRadius,
                }}
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>Active Token</span>
              </span>
            </div>
          </div>

          {/* Form Input Control */}
          <div className="space-y-1">
            <label
              className="block text-[11px] font-mono uppercase tracking-wider opacity-60"
              style={{ color: surfaceContrast }}
            >
              Branded Input Component
            </label>
            <input
              type="text"
              suppressHydrationWarning
              placeholder="Focus to preview brand accent ring..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full text-xs px-3 py-2 border focus:outline-none transition-all"
              style={{
                backgroundColor: isLight ? '#ffffff' : '#18181b',
                color: isLight ? '#111827' : '#f4f4f5',
                borderColor: neutralBorder,
                borderRadius: currentRadius,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}33`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = neutralBorder;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Interactive Button Primitives (Primary, Secondary, Ghost) */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {/* Primary Action Button (Solid, crisp) */}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition-colors active:scale-95 cursor-pointer"
              style={{
                backgroundColor: primaryColor,
                color: primaryContrast,
                borderRadius: currentRadius,
              }}
            >
              <span>Primary Action</span>
              <Send className="w-3 h-3" />
            </button>

            {/* Secondary Outline Button */}
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-medium transition-colors active:scale-95 cursor-pointer bg-transparent border"
              style={{
                color: primaryColor,
                borderColor: primaryColor,
                borderRadius: currentRadius,
              }}
            >
              <span>Secondary</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>

            {/* Ghost Button */}
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-medium transition-colors active:scale-95 cursor-pointer hover:bg-neutral-500/10"
              style={{
                color: surfaceContrast,
                borderRadius: currentRadius,
              }}
            >
              <span>Ghost Action</span>
            </button>
          </div>
        </div>

        {/* Corner Radius Tester Footer */}
        {system.radii.length > 0 && (
          <div className="flex items-center justify-between pt-4 mt-3 text-xs text-[#0F172A]/70 dark:text-slate-400 border-t border-[#E2E8F0] dark:border-slate-800 font-mono">
            <span className="text-[11px]">Radius Ladder:</span>
            <div className="flex items-center gap-1">
              {system.radii.slice(0, 4).map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveRadiusIndex(idx)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                    activeRadiusIndex === idx
                      ? 'bg-[#2563EB] text-white border-[#2563EB] font-bold'
                      : 'border-[#E2E8F0] dark:border-slate-800 text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
                  }`}
                >
                  {r.value}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
