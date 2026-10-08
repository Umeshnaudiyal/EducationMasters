'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, ArrowRight } from 'lucide-react';

export const isInternalLink = (href) => {
  if (!href || typeof href !== 'string') return false;
  const trimmed = href.trim();
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return false;
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }

  try {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const currentHost = typeof window !== 'undefined' ? window.location.host : '';
    const url = new URL(trimmed, currentOrigin || 'https://educationmasters.in');

    return (
      url.origin === currentOrigin ||
      url.hostname === 'educationmasters.in' ||
      url.hostname.endsWith('.educationmasters.in') ||
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.host === currentHost
    );
  } catch {
    return false;
  }
};

export default function InternalLinkModal({
  isOpen,
  onClose,
  targetUrl,
  targetWindow = '_self',
  whatsappUrl = 'https://whatsapp.com/channel/0029Vb6sjZz0wajwDXcd5B0U',
  telegramUrl = 'https://t.me/educationmastersin',
  initialSeconds = 8,
}) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(initialSeconds);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef(null);

  // Reset countdown whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(initialSeconds);
      setIsCompleted(false);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      document.body.style.overflow = '';
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.body.style.overflow = '';
    };
  }, [isOpen, initialSeconds]);

  // Dismiss modal only - called ONLY when user clicks the Cross (X) button
  const handleDismiss = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (onClose) onClose();
  };

  // Open destination link - ONLY called when user explicitly clicks "Proceed to Link"
  const handleOpenLink = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (onClose) onClose();

    if (targetUrl) {
      if (targetWindow === '_blank' || targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } else {
        if (targetUrl.startsWith('/')) {
          router.push(targetUrl);
        } else {
          window.location.href = targetUrl;
        }
      }
    }
  };

  const handleChannelClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  // SVG circular countdown calculations
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (countdown / initialSeconds) * circumference;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-4 bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[560px] max-h-[92vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-100 transform animate-in zoom-in-95 duration-200 select-none text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Cross Button (X) - Only dismisses modal without opening link */}
        {isCompleted && (
          <button
            onClick={handleDismiss}
            className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer z-10 animate-in fade-in zoom-in-75 duration-300"
            title="Close"
            aria-label="Close modal"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* 1. Header with Confetti & Title */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <span className="text-lg sm:text-2xl animate-bounce">🎉</span>
          <h2 className="text-base sm:text-xl md:text-2xl font-black text-[#dc2626] tracking-tight leading-snug">
            Education Masters के साथ 12 साल का भरोसा!
          </h2>
          <span className="text-lg sm:text-2xl animate-bounce">🎉</span>
        </div>

        {/* 2. Subtitle */}
        <p className="text-slate-800 font-semibold text-xs sm:text-sm mt-1 sm:mt-2 px-1 leading-relaxed">
          हम पिछले 10 वर्षों से छात्रों को{' '}
          <strong className="text-[#dc2626] font-bold">सरकारी नौकरी</strong> और{' '}
          <strong className="text-[#dc2626] font-bold">परीक्षाओं</strong> की सही जानकारी दे रहे हैं।
        </p>

        {/* 3. Golden Yellow Feature Box */}
        <div className="bg-[#ffeb7b] bg-gradient-to-b from-[#ffea75] to-[#ffe562] text-slate-900 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 my-2.5 sm:my-3.5 text-left shadow-xs border border-amber-300/80">
          <h3 className="text-center font-bold text-xs sm:text-sm md:text-base text-slate-900 mb-1.5 sm:mb-2.5">
            अब सभी सरकारी अपडेट सबसे पहले पाएं
          </h3>
          <div className="space-y-1 sm:space-y-1.5 pl-1 sm:pl-3">
            <div className="flex items-center text-xs sm:text-sm font-bold text-slate-900">
              <span className="text-[#16a34a] font-black mr-2 text-xs sm:text-sm">✔</span>
              <span>Latest Sarkari Jobs</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm font-bold text-slate-900">
              <span className="text-[#16a34a] font-black mr-2 text-xs sm:text-sm">✔</span>
              <span>Exam Updates (Date, Admit Card, Result)</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm font-bold text-slate-900">
              <span className="text-[#16a34a] font-black mr-2 text-xs sm:text-sm">✔</span>
              <span>MCQs & Current Affairs</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm font-bold text-slate-900">
              <span className="text-[#16a34a] font-black mr-2 text-xs sm:text-sm">✔</span>
              <span>Latest Syllabus</span>
            </div>
          </div>
        </div>

        {/* 4. Circular Countdown Timer OR Proceed Link when Completed */}
        <div className="my-2 sm:my-2.5 flex items-center justify-center min-h-[44px] sm:min-h-[52px]">
          {!isCompleted ? (
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 44 44">
                {/* Background Ring */}
                <circle
                  cx="22"
                  cy="22"
                  r={radius}
                  className="text-slate-200 stroke-current"
                  strokeWidth="2.5"
                  fill="transparent"
                />
                {/* Animated Progress Ring */}
                <circle
                  cx="22"
                  cy="22"
                  r={radius}
                  className="text-slate-900 stroke-current transition-all duration-1000 ease-linear"
                  strokeWidth="2.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-base sm:text-lg font-bold text-slate-900">
                {countdown}
              </span>
            </div>
          ) : (
            <button
              onClick={handleOpenLink}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-[#0f172a] hover:bg-[#1e293b] active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all duration-200 cursor-pointer group animate-in fade-in zoom-in-90 duration-300"
            >
              <span>लिंक पर आगे बढ़ें (Proceed to Link)</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>

        {/* 5. Description Under Timer */}
        <p className="text-slate-800 font-semibold text-xs sm:text-sm leading-snug px-1 sm:px-2">
          अब इसी भरोसे को और मजबूत बनाने के लिए हमने अपना नया{' '}
          <strong className="text-[#16a34a] font-bold">WhatsApp</strong> और{' '}
          <strong className="text-[#0284c7] font-bold">Telegram</strong> चैनल शुरू किया है
        </p>

        {/* 6. Two Action CTA Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-2.5 sm:mt-3.5 w-full">
          {/* WhatsApp Button */}
          <button
            type="button"
            onClick={() => handleChannelClick(whatsappUrl)}
            className="w-full bg-[#25D366] hover:bg-[#20be5a] active:scale-[0.98] text-white font-bold py-2.5 sm:py-3 px-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            {/* WhatsApp SVG Icon */}
            <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            <span>WhatsApp चैनल जॉइन करें</span>
          </button>

          {/* Telegram Button */}
          <button
            type="button"
            onClick={() => handleChannelClick(telegramUrl)}
            className="w-full bg-[#24A1DE] hover:bg-[#1f91c9] active:scale-[0.98] text-white font-bold py-2.5 sm:py-3 px-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            {/* Telegram SVG Icon */}
            <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.946z" />
            </svg>
            <span>Telegram चैनल जॉइन करें</span>
          </button>
        </div>

        {/* 7. Bottom Urgency Notice */}
        <p className="mt-2.5 sm:mt-3.5 text-[10px] sm:text-xs font-semibold text-slate-800 text-center leading-snug">
          ⏰ Link कुछ ही सेकंड के लिए उपलब्ध है,{' '}
          <strong className="text-[#dc2626] font-bold">अभी जुड़ें</strong> – वरना ज़रूरी अपडेट मिस हो सकते हैं
        </p>
      </div>
    </div>
  );
}
