'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import gsap from 'gsap';

function ToastItem({ toast, onRemove }) {
  const itemRef = useRef(null);
  const progressBarRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const remainingTimeRef = useRef(toast.duration || 5000);
  const startTimeRef = useRef(Date.now());
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  // Responsive slide-in Animation
  useEffect(() => {
    if (itemRef.current) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      gsap.fromTo(
        itemRef.current,
        isMobile
          ? { y: -24, opacity: 0, scale: 0.95 }
          : { x: 50, opacity: 0, scale: 0.95 },
        {
          x: 0,
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.35,
          ease: 'back.out(1.1)',
        }
      );
    }
  }, []);

  // Smooth dismiss with slide-out animation
  const handleDismiss = () => {
    if (itemRef.current) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      gsap.to(itemRef.current, {
        x: isMobile ? 0 : 50,
        y: isMobile ? -24 : 0,
        opacity: 0,
        scale: 0.92,
        duration: 0.22,
        ease: 'power3.in',
        onComplete: () => onRemove(toast.id),
      });
    } else {
      onRemove(toast.id);
    }
  };

  // Touch handlers for mobile swipe-to-dismiss
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e) => {
    setIsPaused(false);
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;
    // Dismiss if swiped right or swiped up
    if (diffX > 60 || diffY < -40) {
      handleDismiss();
    }
  };

  // Auto-dismiss countdown timer with progress bar
  useEffect(() => {
    if (toast.duration === 0 || toast.duration === Infinity) return;

    if (!isPaused) {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, remainingTimeRef.current);

      // Animate progress bar
      if (progressBarRef.current) {
        gsap.to(progressBarRef.current, {
          width: '0%',
          duration: remainingTimeRef.current / 1000,
          ease: 'linear',
        });
      }
    } else {
      // Pause
      if (timerRef.current) clearTimeout(timerRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      if (progressBarRef.current) {
        gsap.killTweensOf(progressBarRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, toast.duration]);

  // Color Schemes and Theme Presets
  const getTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          wrapper: 'bg-[#091b24]/95 border-[#10b981]/40 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(16,185,129,0.18)]',
          glow: 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent',
          iconBox: 'bg-[#082c2e]/90 border-[#10b981]/50 text-[#10b981]',
          dotColor: 'bg-[#10b981]',
          dotBorder: 'border-[#091b24]',
          titleColor: 'text-white',
          textColor: 'text-slate-200',
          progressBg: 'bg-gradient-to-r from-[#10b981] to-[#34d399]',
          badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
          defaultEmoji: '🎉',
          IconComponent: CheckCircle2,
        };
      case 'error':
        return {
          wrapper: 'bg-[#1e0f14]/95 border-rose-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(244,63,94,0.18)]',
          glow: 'bg-gradient-to-r from-rose-500/15 via-red-500/10 to-transparent',
          iconBox: 'bg-[#350d18]/90 border-rose-500/50 text-rose-400',
          dotColor: 'bg-rose-500',
          dotBorder: 'border-[#1e0f14]',
          titleColor: 'text-white',
          textColor: 'text-rose-100',
          progressBg: 'bg-gradient-to-r from-rose-500 to-red-400',
          badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
          defaultEmoji: '⚠️',
          IconComponent: XCircle,
        };
      case 'warning':
        return {
          wrapper: 'bg-[#1c1808]/95 border-amber-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(245,158,11,0.18)]',
          glow: 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent',
          iconBox: 'bg-[#332508]/90 border-amber-500/50 text-amber-400',
          dotColor: 'bg-amber-400',
          dotBorder: 'border-[#1c1808]',
          titleColor: 'text-white',
          textColor: 'text-amber-100',
          progressBg: 'bg-gradient-to-r from-amber-400 to-yellow-400',
          badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
          defaultEmoji: '⚡',
          IconComponent: AlertTriangle,
        };
      case 'info':
      default:
        return {
          wrapper: 'bg-[#0b1726]/95 border-sky-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(59,130,246,0.18)]',
          glow: 'bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-transparent',
          iconBox: 'bg-[#0c243d]/90 border-sky-500/50 text-sky-400',
          dotColor: 'bg-sky-400',
          dotBorder: 'border-[#0b1726]',
          titleColor: 'text-white',
          textColor: 'text-sky-100',
          progressBg: 'bg-gradient-to-r from-sky-400 to-blue-400',
          badge: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
          defaultEmoji: 'ℹ️',
          IconComponent: Info,
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.IconComponent;
  const emojiPrefix = toast.emoji !== undefined ? toast.emoji : (toast.type === 'success' ? '🎉' : '');

  return (
    <div
      ref={itemRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`pointer-events-auto relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-2xl transition-all duration-200 select-none ${theme.wrapper}`}
      style={{ willChange: 'transform, opacity' }}
      role="alert"
      aria-live="assertive"
    >
      {/* Subtle ambient lighting highlight inside toast card */}
      <div className={`absolute inset-0 pointer-events-none opacity-40 ${theme.glow}`} />

      <div className="relative z-10 p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3.5">
        {/* Animated Squircle Icon Container with Solid Neon Dot */}
        <div className="relative shrink-0 mt-0.5">
          <div
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center border shadow-inner ${theme.iconBox}`}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          {/* Top-right corner neon dot indicator */}
          <span
            className={`absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 ${theme.dotColor} ${theme.dotBorder} shadow-[0_0_8px_rgba(16,185,129,0.7)]`}
          />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-1 sm:pr-2">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
            <h4 className={`text-xs sm:text-[14px] font-bold tracking-tight leading-snug flex items-center gap-1.5 ${theme.titleColor}`}>
              {emojiPrefix && <span className="text-sm sm:text-base select-none">{emojiPrefix}</span>}
              <span>{toast.title}</span>
            </h4>
            {toast.badge && (
              <span
                className={`text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider ${theme.badge}`}
              >
                {toast.badge}
              </span>
            )}
          </div>

          {toast.message && (
            <p className={`text-[11px] sm:text-xs leading-normal sm:leading-relaxed font-normal ${theme.textColor}`}>
              {toast.message}
            </p>
          )}

          {toast.action && (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.action.onClick?.();
                  handleDismiss();
                }}
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <span>{toast.action.label}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Dismiss Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 p-1.5 sm:p-1 -mr-1 -mt-1 sm:mr-0 sm:mt-0 rounded-lg text-slate-400 hover:text-white active:bg-white/20 transition-colors cursor-pointer"
          title="Dismiss notification"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress countdown bar */}
      {toast.duration > 0 && (
        <div className="h-1 w-full bg-white/10 overflow-hidden relative">
          <div
            ref={progressBarRef}
            className={`h-full w-full ${theme.progressBg}`}
          />
        </div>
      )}
    </div>
  );
}

export default function UniversalToast({ toasts = [], onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="fixed top-3 sm:top-5 left-3 right-3 sm:left-auto sm:right-5 z-[999999] pointer-events-none flex flex-col gap-2.5 sm:gap-3 max-w-[420px] mx-auto sm:mx-0 w-auto"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
