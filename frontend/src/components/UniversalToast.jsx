'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Sparkles,
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

  // Slide-in Animation
  useEffect(() => {
    if (itemRef.current) {
      gsap.fromTo(
        itemRef.current,
        {
          x: 80,
          opacity: 0,
          scale: 0.94,
        },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: 'back.out(1.2)',
        }
      );
    }
  }, []);

  // Smooth dismiss with slide-out animation
  const handleDismiss = () => {
    if (itemRef.current) {
      gsap.to(itemRef.current, {
        x: 100,
        opacity: 0,
        scale: 0.9,
        duration: 0.25,
        ease: 'power3.in',
        onComplete: () => onRemove(toast.id),
      });
    } else {
      onRemove(toast.id);
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
          wrapper: 'bg-[#091b24]/95 border-[#10b981]/40 shadow-[0_16px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(16,185,129,0.18)]',
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
          wrapper: 'bg-[#1e0f14]/95 border-rose-500/40 shadow-[0_16px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(244,63,94,0.18)]',
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
          wrapper: 'bg-[#1c1808]/95 border-amber-500/40 shadow-[0_16px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(245,158,11,0.18)]',
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
          wrapper: 'bg-[#0b1726]/95 border-sky-500/40 shadow-[0_16px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(59,130,246,0.18)]',
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
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-2xl transition-all duration-300 ${theme.wrapper}`}
      style={{ willChange: 'transform, opacity' }}
      role="alert"
      aria-live="assertive"
    >
      {/* Subtle ambient lighting highlight inside toast card */}
      <div className={`absolute inset-0 pointer-events-none opacity-40 ${theme.glow}`} />

      <div className="relative z-10 p-4 sm:p-4.5 flex items-start gap-3.5">
        {/* Animated Squircle Icon Container with Solid Neon Dot */}
        <div className="relative shrink-0 mt-0.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${theme.iconBox}`}
          >
            <Icon className="w-5 h-5 stroke-[2.2]" />
          </div>
          {/* Top-right corner neon dot indicator */}
          <span
            className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 ${theme.dotColor} ${theme.dotBorder} shadow-[0_0_8px_rgba(16,185,129,0.7)]`}
          />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className={`text-sm sm:text-[15px] font-bold tracking-tight leading-snug flex items-center gap-1.5 ${theme.titleColor}`}>
              {emojiPrefix && <span className="text-base select-none">{emojiPrefix}</span>}
              <span>{toast.title}</span>
            </h4>
            {toast.badge && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${theme.badge}`}
              >
                {toast.badge}
              </span>
            )}
          </div>

          {toast.message && (
            <p className={`text-xs sm:text-[13px] leading-relaxed font-normal ${theme.textColor}`}>
              {toast.message}
            </p>
          )}

          {toast.action && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.action.onClick?.();
                  handleDismiss();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
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
          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
      className="fixed top-5 right-5 z-[999999] pointer-events-none flex flex-col gap-3 max-w-[420px] w-[calc(100vw-2.5rem)] sm:w-full"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
