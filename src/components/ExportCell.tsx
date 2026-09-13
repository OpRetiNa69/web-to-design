'use client';

import React, { useState } from 'react';
import type { DesignSystem, DesignSystemExports } from '@/types/tokens';
import { generateFigmaTokenSheetSvg } from '@/lib/figma-svg';
import { generateFigmaVariablesJSON } from '@/lib/figma-variables';
import { Code2, Copy, Download, Check, FileCode } from 'lucide-react';

interface ExportCellProps {
  exports: DesignSystemExports;
  system?: DesignSystem;
  targetUrl?: string;
}

type TabType = 'tailwind' | 'cssVars' | 'tokensJson' | 'figmaVars';

const TAB_METADATA: Record<TabType, { label: string; filename: string; mime: string }> = {
  tailwind: {
    label: 'Tailwind CSS',
    filename: 'tailwind.config.js',
    mime: 'text/javascript',
  },
  cssVars: {
    label: 'CSS Variables',
    filename: 'tokens.css',
    mime: 'text/css',
  },
  tokensJson: {
    label: 'Tokens Studio (JSON)',
    filename: 'tokens.json',
    mime: 'application/json',
  },
  figmaVars: {
    label: 'Figma Variables (JSON)',
    filename: 'figma-variables.json',
    mime: 'application/json',
  },
};

const FigmaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
    <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
    <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
    <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
    <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
  </svg>
);

// Clean syntax colorizer for keywords, keys, and values
const formatCodeLine = (line: string) => {
  // Comment line
  if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
    return <span className="text-neutral-500 italic">{line}</span>;
  }

  // CSS Var declaration (e.g. --color-primary: #123456;)
  if (line.includes('--') && line.includes(':')) {
    const parts = line.split(':');
    return (
      <>
        <span className="text-indigo-400 font-medium">{parts[0]}</span>:
        <span className="text-amber-300">{parts.slice(1).join(':')}</span>
      </>
    );
  }

  // Key-Value pairs (e.g. "primary": "#123" or primary: '#123')
  const kvMatch = line.match(/^(\s*)(['"]?[\w-]+['"]?)(:\s*)(.+)$/);
  if (kvMatch) {
    const [, indent, key, colon, val] = kvMatch;
    const isString = val.trim().startsWith('"') || val.trim().startsWith("'");
    return (
      <>
        {indent}
        <span className="text-violet-400 font-medium">{key}</span>
        {colon}
        <span className={isString ? 'text-emerald-400' : 'text-neutral-200'}>{val}</span>
      </>
    );
  }

  // General JS keywords
  if (line.includes('module.exports') || line.includes('const') || line.includes(':root') || line.includes('export')) {
    return <span className="text-blue-400 font-medium">{line}</span>;
  }

  return <span className="text-neutral-300">{line}</span>;
};

export const ExportCell: React.FC<ExportCellProps> = ({ exports, system, targetUrl }) => {
  const [activeTab, setActiveTab] = useState<TabType>('tailwind');
  const [copied, setCopied] = useState(false);
  const [figmaCopied, setFigmaCopied] = useState(false);

  const currentMeta = TAB_METADATA[activeTab];

  const getCurrentCode = (): string => {
    if (activeTab === 'figmaVars') {
      return system ? generateFigmaVariablesJSON(system) : '';
    }
    return exports[activeTab];
  };

  const currentCode = getCurrentCode();
  const codeLines = currentCode.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleCopyFigmaSvg = async () => {
    if (!system) return;
    const svgString = generateFigmaTokenSheetSvg(system, targetUrl);

    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        const textBlob = new Blob([svgString], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/svg+xml': svgBlob,
            'text/plain': textBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(svgString);
      }
    } catch {
      await navigator.clipboard.writeText(svgString);
    }

    setFigmaCopied(true);
    setTimeout(() => setFigmaCopied(false), 2600);
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: currentMeta.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentMeta.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFigmaVariables = () => {
    if (!system) return;
    const jsonString = generateFigmaVariablesJSON(system);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'figma-variables.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors duration-200 p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-4 border-b border-neutral-200/80 dark:border-neutral-800/80 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                Export Pipeline &amp; Figma Integration
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Direct Figma vector clipboard sync, Figma Variables JSON, or codebase configs.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            {/* Prominent Copy for Figma (Canvas) Button */}
            {system && (
              <button
                id="copy-figma-button"
                type="button"
                onClick={handleCopyFigmaSvg}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 text-xs font-medium transition-colors cursor-pointer active:scale-95 shadow-2xs"
                title="Copies an SVG vector token sheet to paste directly onto your Figma canvas"
              >
                {figmaCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                    <span className="text-emerald-400 dark:text-emerald-600 font-medium">Copied! Paste directly into Figma (Cmd+V)</span>
                  </>
                ) : (
                  <>
                    <FigmaIcon className="w-3.5 h-3.5" />
                    <span>Copy for Figma (Canvas)</span>
                  </>
                )}
              </button>
            )}

            {/* Direct Download Figma Variables (.json) Button */}
            {system && (
              <button
                id="download-figma-vars-button"
                type="button"
                onClick={handleDownloadFigmaVariables}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-colors cursor-pointer active:scale-95 border border-neutral-200 dark:border-neutral-700"
                title="Download standard Figma Variables collection JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Figma Variables (.json)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-colors cursor-pointer active:scale-95 border border-neutral-200 dark:border-neutral-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-300 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-colors cursor-pointer active:scale-95 border border-neutral-200 dark:border-neutral-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {currentMeta.filename.split('.').pop()?.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* Segmented Pill Tab Bar */}
        <div className="flex items-center gap-1 bg-neutral-100/80 dark:bg-neutral-900/80 p-1 rounded-full border border-neutral-200/60 dark:border-neutral-800/60 mb-4 overflow-x-auto">
          {(Object.keys(TAB_METADATA) as TabType[]).map((tabKey) => {
            const meta = TAB_METADATA[tabKey];
            const isActive = activeTab === tabKey;

            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => {
                  setActiveTab(tabKey);
                  setCopied(false);
                }}
                className={`flex-1 py-1.5 px-4 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 opacity-60" />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* Minimal Dark Terminal Container */}
        <div className="relative bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-xl overflow-hidden font-mono text-xs">
          {/* Code Window Header Bar */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-950/80 border-b border-neutral-800 text-[11px] text-neutral-400 select-none">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
              </div>
              <span className="ml-2 text-neutral-300 font-medium">{currentMeta.filename}</span>
            </div>
            <span className="text-[10px] text-neutral-500 uppercase">UTF-8 • {codeLines.length} lines</span>
          </div>

          {/* Code Body with Line Numbers */}
          <div className="p-4 max-h-[360px] overflow-auto flex">
            {/* Line numbers gutter */}
            <div className="select-none pr-4 text-neutral-600 text-right font-mono text-xs border-r border-neutral-800 mr-4">
              {codeLines.map((_, i) => (
                <div key={i} className="leading-relaxed text-[11px]">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Content */}
            <div className="flex-1 min-w-0">
              <pre className="font-mono text-xs leading-relaxed overflow-x-auto">
                {codeLines.map((line, idx) => (
                  <div key={idx} className="leading-relaxed hover:bg-neutral-800/40 rounded px-1 -mx-1">
                    {formatCodeLine(line)}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
