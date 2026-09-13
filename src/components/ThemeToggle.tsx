'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="w-9 h-9 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F172A]/90"
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F172A]/90 text-[#0F172A]/70 dark:text-slate-400 hover:text-[#2563EB] dark:hover:text-blue-400 transition-all shadow-sm cursor-pointer"
    >
      {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
