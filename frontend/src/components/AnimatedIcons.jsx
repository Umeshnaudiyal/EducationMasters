'use client';

import React from 'react';

/**
 * High-performance, micro-animated Lucide-style SVG icons.
 * Inspired by https://lucide-animated.com/
 * Features smooth SVG keyframe transformations, hover interactions, and crisp vector paths.
 */

// 1. Dashboard / Gauge Icon (Needle rotates smoothly on hover)
export function AnimatedGauge({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <path
        d="m12 14 4-4"
        className="origin-[12px_14px] transition-transform duration-500 ease-out group-hover:rotate-45 group-hover:scale-110"
      />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  );
}

// 2. Pin / Posts Icon (Pin rocks and lifts on hover)
export function AnimatedPin({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 origin-center group-hover:-rotate-12 group-hover:-translate-y-0.5 ${className}`}
    >
      <line
        x1="12"
        y1="17"
        x2="12"
        y2="22"
        className="transition-all duration-300 group-hover:translate-y-0.5"
      />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  );
}

// 3. Media / Image Icon (Sun scales and landscape moves on hover)
export function AnimatedImage({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <rect
        width="18"
        height="18"
        x="3"
        y="3"
        rx="2"
        ry="2"
        className="transition-all duration-300 group-hover:stroke-blue-400"
      />
      <circle
        cx="9"
        cy="9"
        r="2"
        className="origin-[9px_9px] transition-transform duration-300 group-hover:scale-125 group-hover:fill-amber-400 group-hover:stroke-amber-400"
      />
      <path
        d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
        className="transition-transform duration-300 group-hover:translate-y-[-1px]"
      />
    </svg>
  );
}

// 4. Institutes / Landmark Icon (Roof elevates and columns glow on hover)
export function AnimatedLandmark({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <line x1="3" y1="22" x2="21" y2="22" />
      <line
        x1="6"
        y1="18"
        x2="6"
        y2="11"
        className="transition-transform duration-300 group-hover:scale-y-110 origin-bottom"
      />
      <line
        x1="10"
        y1="18"
        x2="10"
        y2="11"
        className="transition-transform duration-300 delay-75 group-hover:scale-y-110 origin-bottom"
      />
      <line
        x1="14"
        y1="18"
        x2="14"
        y2="11"
        className="transition-transform duration-300 delay-100 group-hover:scale-y-110 origin-bottom"
      />
      <line
        x1="18"
        y1="18"
        x2="18"
        y2="11"
        className="transition-transform duration-300 delay-150 group-hover:scale-y-110 origin-bottom"
      />
      <polygon
        points="12 2 20 7 4 7"
        className="transition-transform duration-300 group-hover:-translate-y-1"
      />
    </svg>
  );
}

// 5. MCQs / CheckSquare Icon (Checkmark draws & bounces on hover)
export function AnimatedCheckSquare({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path
        d="m9 12 2 2 4-4"
        className="origin-center transition-transform duration-300 group-hover:scale-125 group-hover:stroke-emerald-500"
      />
    </svg>
  );
}

// 6. Users Icon (Secondary user slides out & peeks on hover)
export function AnimatedUsers({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        className="transition-transform duration-300 group-hover:-translate-x-0.5"
      />
      <circle
        cx="9"
        cy="7"
        r="4"
        className="transition-transform duration-300 group-hover:-translate-x-0.5"
      />
      <path
        d="M22 21v-2a4 4 0 0 0-3-3.87"
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
      <path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
    </svg>
  );
}

// 7. Login Logs / History Icon (Clock hands spin 360 degrees on hover)
export function AnimatedHistory({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        className="transition-all duration-300 group-hover:stroke-blue-400"
      />
      <path d="M3 3v5h5" />
      <path
        d="M12 7v5l4 2"
        className="origin-[12px_12px] transition-transform duration-700 ease-out group-hover:rotate-[360deg]"
      />
    </svg>
  );
}

// 8. User / Profile Icon (Avatar head floats & nods on hover)
export function AnimatedUser({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <circle
        cx="12"
        cy="7"
        r="4"
        className="origin-[12px_7px] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105"
      />
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        className="transition-transform duration-300 group-hover:scale-x-105 origin-bottom"
      />
    </svg>
  );
}

// 9. Settings Icon (Gear rotates 90 degrees smoothly on hover)
export function AnimatedSettings({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-transform duration-700 ease-out group-hover:rotate-90 ${className}`}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// 10. Briefcase Icon (Handle lifts on hover)
export function AnimatedBriefcase({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path
        d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
        className="origin-top transition-transform duration-300 group-hover:-translate-y-1"
      />
    </svg>
  );
}

// 11. BookOpen / Articles Icon (Pages flip open on hover)
export function AnimatedBookOpen({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <path
        d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
        className="origin-right transition-transform duration-300 group-hover:-rotate-3"
      />
      <path
        d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
        className="origin-left transition-transform duration-300 group-hover:rotate-3"
      />
    </svg>
  );
}

// 12. HelpCircle / Question Icon (Wobbles & pulses on hover)
export function AnimatedHelpCircle({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        className="transition-all duration-300 group-hover:stroke-purple-400"
      />
      <path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
        className="origin-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
      />
      <path
        d="M12 17h.01"
        className="origin-center transition-transform duration-300 group-hover:scale-125 group-hover:stroke-purple-400"
      />
    </svg>
  );
}

// 13. GraduationCap / Exam Icon (Cap tilts and tassel wiggles on hover)
export function AnimatedGraduationCap({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <path
        d="M22 10v6M2 10l10-5 10 5-10 5z"
        className="origin-center transition-transform duration-300 group-hover:-rotate-3 group-hover:-translate-y-0.5"
      />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

// 14. FileText Icon (Lines shimmer and slide on hover)
export function AnimatedFileText({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path
        d="M10 9H8"
        className="transition-transform duration-200 group-hover:translate-x-1"
      />
      <path
        d="M16 13H8"
        className="transition-transform duration-300 delay-75 group-hover:translate-x-1"
      />
      <path
        d="M16 17H8"
        className="transition-transform duration-300 delay-150 group-hover:translate-x-1"
      />
    </svg>
  );
}

// 15. Award / Trophy Icon (Lifts and sparkles on hover)
export function AnimatedAward({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 ${className}`}
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

// 16. Chevron Icon for Toggle (Elastic slide on hover)
export function AnimatedChevronLeft({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-300 group-hover:-translate-x-1 ${className}`}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function AnimatedChevronRight({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-300 group-hover:translate-x-1 ${className}`}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// 17. Bell / Notification Icon (Rings on hover)
export function AnimatedBell({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-top transition-transform duration-300 group-hover:rotate-12 ${className}`}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path
        d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
        className="origin-top transition-transform duration-300 group-hover:-translate-x-0.5"
      />
    </svg>
  );
}

// 18. Sparkles / AI Icon (Twinkles on hover)
export function AnimatedSparkles({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <path
        d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
        className="origin-center transition-transform duration-500 group-hover:rotate-45 group-hover:scale-110"
      />
      <path
        d="M5 3v4"
        className="transition-opacity duration-300 group-hover:opacity-100"
      />
      <path
        d="M19 17v4"
        className="transition-opacity duration-300 group-hover:opacity-100"
      />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

// 19. Zap / Cache / Flash Icon (Sparks & pulses on hover)
export function AnimatedZap({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6 ${className}`}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

// 20. Refresh / Sync Icon (Spins 360 degrees on hover)
export function AnimatedRefresh({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-transform duration-700 ease-out group-hover:rotate-180 ${className}`}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

// 21. LogIn Icon (Arrow enters box on hover)
export function AnimatedLogIn({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline
        points="10 17 15 12 10 7"
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
      <line
        x1="15"
        y1="12"
        x2="3"
        y2="12"
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
    </svg>
  );
}

// 22. LogOut Icon (Arrow exits box on hover)
export function AnimatedLogOut({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline
        points="16 17 21 12 16 7"
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
      <line
        x1="21"
        y1="12"
        x2="9"
        y2="12"
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
    </svg>
  );
}

// 23. Clock / Timer Icon (Clock hands rotate on hover)
export function AnimatedClock({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline
        points="12 6 12 12 16 14"
        className="origin-[12px_12px] transition-transform duration-500 ease-out group-hover:rotate-90"
      />
    </svg>
  );
}

// 24. Shield / Security Icon (Shield expands on hover)
export function AnimatedShield({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-transform duration-300 group-hover:scale-110 ${className}`}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// 25. TrendingUp / Chart Growth Icon (Arrow points up & scales on hover)
export function AnimatedTrendingUp({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <polyline
        points="23 6 13.5 15.5 8.5 10.5 1 18"
        className="transition-transform duration-300 group-hover:-translate-y-0.5"
      />
      <polyline
        points="17 6 23 6 23 12"
        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </svg>
  );
}

// 26. BarChart / Activity Icon (Bars grow upward on hover)
export function AnimatedBarChart({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <line
        x1="18"
        y1="20"
        x2="18"
        y2="10"
        className="origin-bottom transition-transform duration-300 group-hover:scale-y-125"
      />
      <line
        x1="12"
        y1="20"
        x2="12"
        y2="4"
        className="origin-bottom transition-transform duration-300 delay-75 group-hover:scale-y-110"
      />
      <line
        x1="6"
        y1="20"
        x2="6"
        y2="14"
        className="origin-bottom transition-transform duration-300 delay-150 group-hover:scale-y-130"
      />
    </svg>
  );
}

// 27. PieChart / Breakdown Icon (Rotates subtly on hover)
export function AnimatedPieChart({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-transform duration-500 ease-out group-hover:rotate-45 ${className}`}
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" className="origin-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </svg>
  );
}

// 28. Layers / Updates Icon (Layers spread apart on hover)
export function AnimatedLayers({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <polygon
        points="12 2 2 7 12 12 22 7 12 2"
        className="transition-transform duration-300 group-hover:-translate-y-1"
      />
      <polyline
        points="2 17 12 22 22 17"
        className="transition-transform duration-300 delay-75 group-hover:translate-y-1"
      />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

// 29. Database Icon (Discs compress and glow on hover)
export function AnimatedDatabase({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" className="transition-transform duration-300 group-hover:-translate-y-0.5" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

// 30. Cpu / Runtime Icon (Circuit pins pulse on hover)
export function AnimatedCpu({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <rect
        width="6"
        height="6"
        x="9"
        y="9"
        rx="1"
        className="origin-center transition-transform duration-300 group-hover:scale-115 group-hover:stroke-blue-400"
      />
      <path d="M15 2v2" className="transition-transform duration-200 group-hover:-translate-y-0.5" />
      <path d="M15 20v2" className="transition-transform duration-200 group-hover:translate-y-0.5" />
      <path d="M2 15h2" className="transition-transform duration-200 group-hover:-translate-x-0.5" />
      <path d="M2 9h2" className="transition-transform duration-200 group-hover:-translate-x-0.5" />
      <path d="M20 15h2" className="transition-transform duration-200 group-hover:translate-x-0.5" />
      <path d="M20 9h2" className="transition-transform duration-200 group-hover:translate-x-0.5" />
      <path d="M9 2v2" className="transition-transform duration-200 group-hover:-translate-y-0.5" />
      <path d="M9 20v2" className="transition-transform duration-200 group-hover:translate-y-0.5" />
    </svg>
  );
}

// 31. Plus / Create Icon (Rotates 90 degrees on hover)
export function AnimatedPlus({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-transform duration-300 group-hover:rotate-90 ${className}`}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

// 32. CheckCircle Icon (Pops on hover)
export function AnimatedCheckCircle({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-transform duration-300 group-hover:scale-110 ${className}`}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// 33. Menu / Hamburger Icon (Bars shift smoothly on hover)
export function AnimatedMenu({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <line
        x1="4"
        y1="6"
        x2="20"
        y2="6"
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
      <line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        className="transition-transform duration-300 group-hover:scale-x-90 origin-center"
      />
      <line
        x1="4"
        y1="18"
        x2="20"
        y2="18"
        className="transition-transform duration-300 group-hover:-translate-x-1"
      />
    </svg>
  );
}

// 34. Search / Magnifier Icon (Rotates and scales smoothly on hover)
export function AnimatedSearch({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <circle
        cx="11"
        cy="11"
        r="8"
        className="origin-center transition-transform duration-300 group-hover:scale-105"
      />
      <line
        x1="21"
        y1="21"
        x2="16.65"
        y2="16.65"
        className="origin-[16.65px_16.65px] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
      />
    </svg>
  );
}

// 35. Keyboard Icon (Keys bounce / ripple on hover)
export function AnimatedKeyboard({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 origin-center group-hover:-translate-y-0.5 ${className}`}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" ry="2" />
      <path d="M6 8h.001" className="transition-transform duration-200 group-hover:translate-y-0.5" />
      <path d="M10 8h.001" className="transition-transform duration-200 delay-75 group-hover:translate-y-0.5" />
      <path d="M14 8h.001" className="transition-transform duration-200 delay-100 group-hover:translate-y-0.5" />
      <path d="M18 8h.001" className="transition-transform duration-200 delay-150 group-hover:translate-y-0.5" />
      <path d="M8 12h.001" className="transition-transform duration-200 delay-75 group-hover:translate-y-0.5" />
      <path d="M12 12h.001" className="transition-transform duration-200 delay-100 group-hover:translate-y-0.5" />
      <path d="M16 12h.001" className="transition-transform duration-200 delay-150 group-hover:translate-y-0.5" />
      <path d="M7 16h10" className="transition-transform duration-200 group-hover:scale-x-110 origin-center" />
    </svg>
  );
}

// 36. Radio / Live Signal Icon (Waves broadcast outward on hover)
export function AnimatedRadio({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <circle cx="12" cy="12" r="2" className="fill-current group-hover:scale-125 origin-center transition-transform" />
      <path
        d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"
        className="transition-all duration-300 group-hover:scale-110 origin-center group-hover:stroke-rose-500"
      />
      <path
        d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"
        className="transition-all duration-500 delay-100 group-hover:scale-115 origin-center opacity-80 group-hover:opacity-100 group-hover:stroke-rose-500"
      />
    </svg>
  );
}

// 37. Flame / Trending Icon (Flickers and lifts on hover)
export function AnimatedFlame({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-bottom transition-transform duration-300 group-hover:scale-115 group-hover:-rotate-3 ${className}`}
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

// 38. ArrowUpRight Icon (Glides diagonally on hover)
export function AnimatedArrowUpRight({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${className}`}
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

// 39. CornerDownLeft / Enter Icon (Points in on hover)
export function AnimatedCornerDownLeft({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-300 group-hover:-translate-x-0.5 ${className}`}
    >
      <polyline points="9 10 4 15 9 20" />
      <path d="M20 4v7a4 4 0 0 1-4 4H4" />
    </svg>
  );
}

// 40. Mail / Envelope Icon (Flap opens / bounces on hover)
export function AnimatedMail({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" className="transition-colors duration-300 group-hover:stroke-emerald-400" />
      <path
        d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
        className="origin-top transition-transform duration-300 group-hover:scale-y-75 group-hover:stroke-emerald-400"
      />
    </svg>
  );
}

// 41. Phone / WhatsApp Icon (Vibrates / tilts on hover)
export function AnimatedPhone({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 ${className}`}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// 42. Send / ArrowRight Icon (Glides forward smoothly on hover)
export function AnimatedSend({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-300 group-hover:translate-x-1 ${className}`}
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

// 43. Lock Icon (Shackle lifts and rotates slightly on hover)
export function AnimatedLock({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${className}`}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" className="transition-colors duration-300 group-hover:stroke-blue-500" />
      <path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        className="origin-bottom transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-6"
      />
    </svg>
  );
}

// 44. ShieldCheck Icon (Shield pulses and check shines on hover)
export function AnimatedShieldCheck({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 origin-center group-hover:scale-110 ${className}`}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path
        d="m9 12 2 2 4-4"
        className="origin-center transition-transform duration-300 group-hover:scale-125 group-hover:stroke-emerald-500"
      />
    </svg>
  );
}

// 45. KeyRound Icon (Key turns smoothly on hover)
export function AnimatedKeyRound({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-transform duration-500 ease-out group-hover:rotate-45 group-hover:scale-110 ${className}`}
    >
      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

// 46. ArrowRight Icon (Glides right with arrow bounce on hover)
export function AnimatedArrowRight({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-300 ease-out group-hover:translate-x-1.5 ${className}`}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// 47. AnimatedAiEye (Pupil tracks, eyelid moves, surrounding AI sparkle star rotates on hover)
export function AnimatedAiEye({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 origin-center group-hover:scale-110 ${className}`}
    >
      <path
        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
        className="transition-all duration-300 group-hover:stroke-blue-300"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        className="origin-center transition-transform duration-300 group-hover:scale-125 group-hover:fill-blue-400/30 group-hover:stroke-blue-200"
      />
      <path
        d="m19 4 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z"
        className="origin-[19px_6px] transition-all duration-500 ease-out group-hover:rotate-90 group-hover:scale-125 fill-amber-300 stroke-amber-400 stroke-1"
      />
    </svg>
  );
}

// 48. AnimatedBrain (Neural hemispheres pulse and synaptic nodes shimmer on hover)
export function AnimatedBrain({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 origin-center group-hover:scale-110 ${className}`}
    >
      <path
        d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"
        className="transition-all duration-300 group-hover:stroke-indigo-400"
      />
      <path
        d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"
        className="transition-all duration-300 group-hover:stroke-blue-400"
      />
      <path
        d="M12 5v14"
        className="transition-all duration-300 group-hover:stroke-amber-400 group-hover:stroke-[2.5]"
      />
      <circle cx="12" cy="12" r="1" className="fill-amber-400 stroke-none animate-ping" />
    </svg>
  );
}

// 49. AnimatedRotateCcw (Spins counter-clockwise on hover)
export function AnimatedRotateCcw({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`origin-center transition-transform duration-500 ease-out group-hover:-rotate-180 group-hover:scale-110 ${className}`}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}



