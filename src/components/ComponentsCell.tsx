'use client';

import React, { useState } from 'react';
import type { DesignSystem, ExtractedComponents } from '@/types/tokens';
import {
  Component,
  Sun,
  Moon,
  Copy,
  Check,
  MousePointerClick,
  TextCursorInput,
  CreditCard,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface ComponentsCellProps {
  components?: ExtractedComponents;
  system: DesignSystem;
}

export const ComponentsCell: React.FC<ComponentsCellProps> = ({ components, system }) => {
  const [sandboxTheme, setSandboxTheme] = useState<'light' | 'dark'>('dark');
  const [inputVal, setInputVal] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const isLight = sandboxTheme === 'light';

  // Fallback defaults from design system tokens
  const primaryBrand = system.palette.primary[0]?.hex || '#6366f1';
  const primaryContrast = system.palette.primary[0]?.contrastText || '#ffffff';
  const defaultRadius = system.radii[0]?.value || '8px';
  const neutralBorder = isLight ? '#e5e7eb' : '#27272a';
  const canvasBg = isLight ? '#f9fafb' : '#09090b';
  const surfaceBg = isLight ? '#ffffff' : '#18181b';
  const textColor = isLight ? '#111827' : '#f4f4f5';

  const buttons = components?.buttons || [
    {
      label: 'Primary Action',
      variant: 'primary',
      backgroundColor: primaryBrand,
      textColor: primaryContrast,
      borderRadius: defaultRadius,
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '600',
    },
    {
      label: 'Secondary Action',
      variant: 'secondary',
      backgroundColor: isLight ? '#18181b' : '#27272a',
      textColor: '#ffffff',
      borderRadius: defaultRadius,
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '500',
    },
    {
      label: 'Outline Button',
      variant: 'outline',
      backgroundColor: 'transparent',
      textColor: primaryBrand,
      borderColor: primaryBrand,
      borderRadius: defaultRadius,
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '500',
    },
    {
      label: 'Ghost Button',
      variant: 'ghost',
      backgroundColor: 'transparent',
      textColor: isLight ? '#4b5563' : '#9ca3af',
      borderRadius: defaultRadius,
      padding: '10px 16px',
      fontSize: '14px',
      fontWeight: '500',
    },
  ];

  const inputs = components?.inputs || [
    {
      placeholder: 'Enter your email address...',
      type: 'email',
      backgroundColor: isLight ? '#ffffff' : '#18181b',
      textColor: isLight ? '#111827' : '#f4f4f5',
      borderColor: neutralBorder,
      borderRadius: defaultRadius,
      height: '42px',
      padding: '10px 14px',
    },
    {
      placeholder: 'Search resources & documentation...',
      type: 'search',
      backgroundColor: isLight ? '#f3f4f6' : '#18181b',
      textColor: isLight ? '#111827' : '#f4f4f5',
      borderColor: neutralBorder,
      borderRadius: defaultRadius,
      height: '42px',
      padding: '10px 14px',
    },
  ];

  const cards = components?.cards || [
    {
      title: 'Standard Surface Container',
      description: 'Extracted card layout utilizing baseline border-radius, background fill, and subtle box-shadow.',
      backgroundColor: surfaceBg,
      borderColor: neutralBorder,
      borderRadius: defaultRadius,
      boxShadow: system.shadows[0]?.value || '0 1px 3px rgba(0,0,0,0.1)',
      padding: '24px',
    },
  ];

  const badges = components?.badges || [
    {
      label: 'Verified Token',
      backgroundColor: `${primaryBrand}1a`,
      textColor: primaryBrand,
      borderColor: `${primaryBrand}33`,
      borderRadius: '9999px',
    },
    {
      label: 'Production Ready',
      backgroundColor: '#10b9811a',
      textColor: '#10b981',
      borderColor: '#10b98133',
      borderRadius: '9999px',
    },
  ];

  const handleCopyCss = (name: string, cssText: string) => {
    navigator.clipboard.writeText(cssText);
    setCopiedSnippet(name);
    setTimeout(() => setCopiedSnippet(null), 1800);
  };

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors duration-200 p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-neutral-200/80 dark:border-neutral-800/80 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Component className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                Reconstructed UI Components
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Buttons, input fields, cards, and badges extracted from live markup.
              </p>
            </div>
          </div>

          {/* Theme Canvas Preview Toggle */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-950 p-0.5 rounded-full border border-neutral-200/80 dark:border-neutral-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSandboxTheme('light')}
              className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                isLight
                  ? 'bg-white dark:bg-neutral-800 text-amber-600 dark:text-amber-300 shadow-2xs font-medium'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="text-[11px]">Light Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => setSandboxTheme('dark')}
              className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                !isLight
                  ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-300 shadow-2xs font-medium'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="text-[11px]">Dark Canvas</span>
            </button>
          </div>
        </div>

        {/* Master Showcase Frame */}
        <div
          className="p-6 border rounded-xl space-y-8 transition-colors duration-300"
          style={{
            backgroundColor: canvasBg,
            borderColor: neutralBorder,
            fontFamily: `"${system.fonts.body}", -apple-system, sans-serif`,
          }}
        >
          {/* 1. BUTTONS SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <MousePointerClick className="w-3.5 h-3.5" />
                <span>Interactive Buttons</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                Click any button to copy CSS
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {buttons.map((btn, idx) => {
                const isOutline = btn.variant === 'outline';
                const isGhost = btn.variant === 'ghost';
                const isCopied = copiedSnippet === `btn-${idx}`;

                const cssString = `background: ${btn.backgroundColor}; color: ${btn.textColor}; border-radius: ${btn.borderRadius}; padding: ${btn.padding}; font-weight: ${btn.fontWeight}; font-size: ${btn.fontSize};${btn.borderColor ? ` border: 1px solid ${btn.borderColor};` : ''}`;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCopyCss(`btn-${idx}`, cssString)}
                    className="group relative inline-flex items-center gap-2 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs hover:opacity-90"
                    style={{
                      backgroundColor: isOutline || isGhost ? 'transparent' : btn.backgroundColor,
                      color: btn.textColor,
                      borderRadius: btn.borderRadius,
                      padding: btn.padding || '10px 18px',
                      fontSize: btn.fontSize || '14px',
                      fontWeight: btn.fontWeight || '600',
                      border: isOutline ? `1.5px solid ${btn.borderColor || btn.textColor}` : 'none',
                    }}
                    title={`Click to copy CSS rules for ${btn.variant} button`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied CSS!</span>
                      </>
                    ) : (
                      <>
                        <span>{btn.label}</span>
                        {btn.variant === 'primary' && <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. FORM INPUTS SECTION */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              <TextCursorInput className="w-3.5 h-3.5" />
              <span>Form Input Controls</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputs.map((inp, idx) => (
                <div key={idx} className="space-y-1.5">
                  <label
                    className="block text-[11px] font-mono font-medium opacity-70"
                    style={{ color: textColor }}
                  >
                    {inp.type === 'email' ? 'Email Address' : inp.type === 'search' ? 'Search Query' : 'Text Input'}
                  </label>
                  <input
                    type={inp.type}
                    placeholder={inp.placeholder}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border transition-all focus:outline-none"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : '#141416',
                      color: isLight ? '#111827' : '#f4f4f5',
                      borderColor: neutralBorder,
                      borderRadius: inp.borderRadius,
                      height: inp.height || '42px',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = primaryBrand;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryBrand}33`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = neutralBorder;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 3. CARDS & BADGES SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cards Preview */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Extracted Surface Card</span>
              </div>

              {cards.map((card, idx) => (
                <div
                  key={idx}
                  className="border transition-all space-y-3"
                  style={{
                    backgroundColor: isLight ? '#ffffff' : '#141416',
                    borderColor: neutralBorder,
                    borderRadius: card.borderRadius,
                    boxShadow: card.boxShadow,
                    padding: card.padding || '24px',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h4
                      className="text-base font-bold tracking-tight"
                      style={{
                        color: textColor,
                        fontFamily: `"${system.fonts.heading}", -apple-system, sans-serif`,
                      }}
                    >
                      {card.title}
                    </h4>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${primaryBrand}1a`,
                        color: primaryBrand,
                      }}
                    >
                      Card Primitive
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Badges Preview */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <Tag className="w-3.5 h-3.5" />
                <span>Badges &amp; Tags</span>
              </div>

              <div className="p-4 border rounded-xl space-y-3" style={{ backgroundColor: isLight ? '#ffffff' : '#141416', borderColor: neutralBorder }}>
                <div className="flex items-center gap-2 flex-wrap">
                  {badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono font-medium px-2.5 py-1 inline-flex items-center gap-1 border transition-transform hover:scale-105"
                      style={{
                        backgroundColor: badge.backgroundColor,
                        color: badge.textColor,
                        borderColor: badge.borderColor || 'transparent',
                        borderRadius: badge.borderRadius || '9999px',
                      }}
                    >
                      <span>{badge.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
