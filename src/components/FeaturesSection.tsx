'use client';

import React from 'react';
import { Palette, Type, Code2 } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      num: '01',
      title: 'Color Clustering',
      description: 'Perceptual grouping using CIEDE2000 algorithms to eliminate duplicate swatches and isolate core brand roles.',
      icon: Palette,
    },
    {
      num: '02',
      title: 'Type Scales',
      description: 'Clean modular scales calculated from live computed headings and body text with line-height preservation.',
      icon: Type,
    },
    {
      num: '03',
      title: 'Ready Exports',
      description: 'Production configs ready to paste into Tailwind, CSS custom properties, or Tokens Studio with zero manual inspection.',
      icon: Code2,
    },
  ];

  return (
    <section className="mt-28 mb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#E2E8F0] dark:border-slate-800 pt-20">
      {/* 2-Column Editorial Headline & Intro */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
        <div className="max-w-xl">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] dark:text-white leading-[1.1]">
            Designed for Speed.{' '}
            <span className="font-medium block text-[#2563EB] dark:text-blue-400">
              Zero manual inspection.
            </span>
          </h2>
        </div>
        <div>
          <p className="text-[#0F172A]/70 dark:text-slate-400 text-base md:text-lg max-w-md leading-relaxed">
            Extract computed color swatches, modular typography ladders, and border curves directly into production code.
          </p>
        </div>
      </div>

      {/* 3 Clean Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
        {features.map(({ num, title, description, icon: Icon }) => (
          <div key={num} className="space-y-3 group">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#2563EB] dark:text-blue-400 tracking-wider font-semibold">
                {num}.
              </span>
              <h3 className="text-base font-semibold text-[#0F172A] dark:text-white tracking-tight">
                {title}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#0F172A]/70 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
