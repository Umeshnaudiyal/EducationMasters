'use client';

import React from 'react';

/**
 * Clean, professional Google AdSense placeholder.
 * Per user requirement:
 * - Pure white background
 * - Minimalist borders and typography
 * - Prominently displays only Google AdSense and the ad slot dimensions.
 */
export default function AdPlaceholder({
  dimensions = '300 x 250',
  formatName = 'Display Ad',
  className = '',
  minHeight = 'auto',
  style = {},
  compact = false,
}) {
  const isCompact = compact || dimensions.includes('728 x 90');

  if (isCompact) {
    return (
      <div
        style={{ minHeight: minHeight !== 'auto' ? minHeight : undefined, ...style }}
        className={`relative w-full bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs flex flex-col items-center justify-center py-2 px-3 sm:px-4 select-none text-center transition-all duration-200 hover:border-slate-300 ${className}`}
      >
        {/* Background subtle micro-grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#000 1px, transparent 1px), radial-gradient(#000 1px, #fff 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Top subtle Google AdSense label */}
        <div className="relative z-10 flex items-center justify-center gap-1.5 mb-0.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-slate-50 text-slate-500 border border-slate-200/70">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
            Google AdSense
          </span>
        </div>

        {/* Dimension and format on single compact row */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-slate-700">
            {dimensions}
          </span>
          {formatName && (
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider border-l border-slate-200 pl-2">
              {formatName}
            </span>
          )}
        </div>

        {/* Bottom hint */}
        <div className="relative z-10 mt-0.5 text-[9px] text-slate-300 font-mono tracking-tight">
          Advertisement
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight, ...style }}
      className={`relative w-full bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs flex flex-col items-center justify-center p-4 select-none text-center transition-all duration-200 hover:border-slate-300 ${className}`}
    >
      {/* Background subtle micro-grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#000 1px, transparent 1px), radial-gradient(#000 1px, #fff 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Top subtle Google AdSense label */}
      <div className="relative z-10 flex items-center justify-center gap-1.5 mb-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-slate-50 text-slate-500 border border-slate-200/70">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
          Google AdSense
        </span>
      </div>

      {/* Prominent dimension display */}
      <div className="relative z-10 my-1">
        <span className="font-mono font-bold text-base md:text-lg tracking-wider text-slate-700 block">
          {dimensions}
        </span>
        {formatName && (
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
            {formatName}
          </span>
        )}
      </div>

      {/* Bottom hint */}
      <div className="relative z-10 mt-2 text-[10px] text-slate-300 font-mono tracking-tight">
        Advertisement
      </div>
    </div>
  );
}
