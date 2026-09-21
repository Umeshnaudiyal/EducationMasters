'use client';

import React from 'react';

export default function AdminLoader({
  text = 'Loading Education Masters...',
  subtext = 'Please wait while we prepare your content',
  minHeight = 'min-h-[360px]',
  fullScreen = false,
}) {
  const content = (
    <div className={`w-full ${minHeight} flex flex-col items-center justify-center gap-4 select-none font-sans px-4 py-8`}>
      {/* Modern High-End Spinner Emblem */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Glow Aura */}
        <div className="absolute w-16 h-16 rounded-full bg-blue-500/15 blur-xl animate-pulse"></div>

        {/* Outer Rotating Gradient Ring */}
        <div className="w-14 h-14 rounded-full border-[2.5px] border-slate-200/80 border-t-[#2271b1] border-r-[#0ea5e9] animate-spin"></div>

        {/* Inner Counter-Rotating Pulse Ring */}
        <div className="absolute w-10 h-10 rounded-full border-[1.5px] border-dashed border-slate-300 border-b-[#2271b1] animate-[spin_3s_linear_infinite_reverse]"></div>

        {/* Center Circular Brand Logo */}
        <div className="absolute w-7 h-7 rounded-full overflow-hidden bg-white p-0.5 shadow-sm border border-slate-100 flex items-center justify-center">
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
      <div className="flex flex-col items-center text-center space-y-1">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 tracking-wide">
          <span>{text}</span>
          <span className="inline-flex space-x-1 ml-0.5">
            <span className="w-1.5 h-1.5 bg-[#2271b1] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-[#0ea5e9] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-[#2271b1] rounded-full animate-bounce"></span>
          </span>
        </div>
        {subtext && (
          <p className="text-[11px] text-slate-400 font-normal tracking-tight max-w-xs">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f0f0f1]/90 backdrop-blur-xs flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
