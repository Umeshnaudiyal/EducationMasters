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
          x: 100,
          opacity: 0,
          scale: 0.92,
        },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.45,
          ease: 'back.out(1.4)',
        }
      );
    }
  }, []);

  // Smooth dismiss with slide-out animation
  const handleDismiss = () => {
    if (itemRef.current) {
      gsap.to(itemRef.current, {
        x: 120,
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
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
          ease: 'none',
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
          wrapper: 'bg-slate-950/90 border-emerald-500/50 shadow-[0_12px_40px_-10px_rgba(16,185,129,0.35)]',
          glow: 'bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent',
          iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
          titleColor: 'text-white',
          textColor: 'text-emerald-100/90',
          progressBg: 'bg-gradient-to-r from-emerald-500 to-teal-400',
          badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          IconComponent: CheckCircle2,
        };
      case 'error':
        return {
          wrapper: 'bg-slate-950/90 border-rose-500/50 shadow-[0_12px_40px_-10px_rgba(244,63,94,0.35)]',
          glow: 'bg-gradient-to-r from-rose-500/20 via-red-500/10 to-transparent',
          iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
          titleColor: 'text-white',
          textColor: 'text-rose-100/90',
          progressBg: 'bg-gradient-to-r from-rose-500 to-red-400',
          badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          IconComponent: XCircle,
        };
      case 'warning':
        return {
          wrapper: 'bg-slate-950/90 border-amber-500/50 shadow-[0_12px_40px_-10px_rgba(245,158,11,0.35)]',
          glow: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent',
          iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          titleColor: 'text-white',
          textColor: 'text-amber-100/90',
          progressBg: 'bg-gradient-to-r from-amber-500 to-yellow-400',
          badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          IconComponent: AlertTriangle,
        };
      case 'info':
      default:
        return {
          wrapper: 'bg-slate-950/90 border-blue-500/50 shadow-[0_12px_40px_-10px_rgba(59,130,246,0.35)]',
          glow: 'bg-gradient-to-r from-blue-500/20 via-sky-500/10 to-transparent',
          iconBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
          titleColor: 'text-white',
          textColor: 'text-blue-100/90',
          progressBg: 'bg-gradient-to-r from-blue-500 to-sky-400',
          badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
          IconComponent: Info,
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.IconComponent;

  return (
    <div
      ref={itemRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-300 ${theme.wrapper}`}
      style={{ willChange: 'transform, opacity' }}
      role="alert"
      aria-live="assertive"
    >
      {/* Subtle ambient lighting highlight inside toast card */}
      <div className={`absolute inset-0 pointer-events-none opacity-40 ${theme.glow}`} />

      <div className="relative z-10 p-4 sm:p-4.5 flex items-start gap-3.5">
        {/* Animated Icon Container with Pulse Glow */}
        <div className="relative shrink-0 mt-0.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.iconBg} shadow-inner`}
          >
            <Icon className="w-5 h-5 animate-pulse" />
          </div>
          {toast.type === 'success' && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className={`text-sm font-semibold tracking-tight leading-tight ${theme.titleColor}`}>
              {toast.title}
            </h4>
            {toast.badge && (
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${theme.badge}`}
              >
                {toast.badge}
              </span>
            )}
          </div>

          {toast.message && (
            <p className={`text-xs leading-relaxed ${theme.textColor}`}>
              {toast.message}
            </p>
          )}

          {toast.action && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => {
                  toast.action.onClick?.();
                  handleDismiss();
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-md shadow transition-colors cursor-pointer"
              >
                {toast.action.label}
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Dismiss Close Button */}
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
