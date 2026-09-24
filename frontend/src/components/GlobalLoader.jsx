'use client';

import React from 'react';

export default function GlobalLoader({
  text = 'Loading Author Profile...',
  subtext = 'Fetching publications, exam notices, and author distribution stats',
  minHeight = 'min-h-[380px]',
  fullScreen = false,
}) {
  const content = (
    <div className={`w-full ${minHeight} flex flex-col items-center justify-center gap-4 select-none font-sans px-4 py-12`}>
      {/* Modern High-End Spinner Emblem */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Glow Aura */}
        <div className="absolute w-20 h-20 rounded-full bg-blue-500/15 blur-xl animate-pulse" />

        {/* Outer Rotating Gradient Ring */}
        <div className="w-16 h-16 rounded-full border-[3px] border-slate-200/80 border-t-blue-600 border-r-indigo-500 animate-spin" />

        {/* Inner Counter-Rotating Pulse Ring */}
        <div className="absolute w-11 h-11 rounded-full border-[2px] border-dashed border-slate-300 border-b-cyan-500 animate-[spin_3s_linear_infinite_reverse]" />

        {/* Center Circular Brand Logo */}
        <div className="absolute w-8 h-8 rounded-full overflow-hidden bg-white p-0.5 shadow-sm border border-slate-100 flex items-center justify-center">
          <img
            src="/logo.webp"
            alt="Education Masters"
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Modern Status Typography */}
      <div className="flex flex-col items-center text-center space-y-1 mt-1">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 tracking-wide">
          <span>{text}</span>
          <span className="inline-flex space-x-1 ml-0.5">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
          </span>
        </div>
        {subtext && (
          <p className="text-xs text-slate-500 font-normal max-w-sm">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f8fafc]/90 backdrop-blur-xs flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
