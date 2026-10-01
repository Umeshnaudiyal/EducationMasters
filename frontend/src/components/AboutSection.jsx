'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Check } from 'lucide-react';

const FEATURES_LEFT = [
  'Result Oriented Mock Test',
  '100% Reliable study material',
  'Expert Electures with detailed explaination on youtube',
  'Study material prepared by experts authors/teachers',
];

const FEATURES_RIGHT = [
  'Trusted by 15 million users',
  '28+ Industry Relevant Skills',
  '2 Specializations Available',
  '0% EMI Option Available',
];

const PRODUCTS_SERVICES = [
  {
    id: 'bulk-sms',
    titlePrefix: 'Bulk',
    titleSuffix: 'SMS',
    description: '10 Lakh SMS Delivered/Day',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 transition-transform duration-300 group-hover:scale-110 drop-shadow-sm">
        {/* Blue Chat Bubble */}
        <rect x="6" y="8" width="52" height="42" rx="10" fill="#0084FF" />
        <path d="M14 50 L14 58 L24 50 Z" fill="#0084FF" />
        <text x="32" y="36" fill="white" fontSize="15" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle" letterSpacing="0.5">SMS</text>
      </svg>
    ),
  },
  {
    id: 'online-crm',
    titlePrefix: 'Online',
    titleSuffix: 'CRM',
    description: 'Online CRM for Institutes',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 transition-transform duration-300 group-hover:scale-110 drop-shadow-sm">
        {/* Yellow Chat Bubble */}
        <rect x="7" y="6" width="20" height="13" rx="4" fill="#FBBF24" />
        <circle cx="12" cy="12.5" r="1.5" fill="#D97706" />
        <circle cx="17" cy="12.5" r="1.5" fill="#D97706" />
        <circle cx="22" cy="12.5" r="1.5" fill="#D97706" />
        <path d="M11 19 L11 23 L15 19 Z" fill="#FBBF24" />

        {/* Pink Chat Bubble */}
        <rect x="39" y="8" width="17" height="11" rx="3.5" fill="#FB7185" />
        <circle cx="44.5" cy="13.5" r="1.2" fill="#E11D48" />
        <circle cx="49.5" cy="13.5" r="1.2" fill="#E11D48" />

        {/* Bold Purple CRM Text */}
        <text x="32" y="42" fill="#6366F1" fontSize="17" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle" letterSpacing="0.5">CRM</text>

        {/* Bottom Gear & Stats Accent */}
        <circle cx="17" cy="52" r="4.5" fill="#A855F7" />
        <circle cx="17" cy="52" r="2" fill="white" />
        <rect x="28" y="49" width="8" height="6" rx="2" fill="#F59E0B" />
        <rect x="40" y="46" width="9" height="9" rx="2" fill="#EC4899" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    titlePrefix: 'You',
    titleSuffix: 'Tube',
    description: 'Youtube Lectures',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 transition-transform duration-300 group-hover:scale-110 drop-shadow-sm">
        <rect x="4" y="14" width="56" height="36" rx="11" fill="#FF0000" />
        <path d="M26 23 L44 32 L26 41 Z" fill="white" />
      </svg>
    ),
  },
  {
    id: 'mobile-app',
    titlePrefix: 'Mobile',
    titleSuffix: 'App',
    description: '1 Lakh+ Downloads',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 transition-transform duration-300 group-hover:scale-110 drop-shadow-sm">
        {/* Cyan App Squircle */}
        <rect x="6" y="10" width="46" height="46" rx="13" fill="#22D3EE" />
        <text x="29" y="40" fill="white" fontSize="13" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle" letterSpacing="0.5">APP</text>

        {/* Notification Badge with '1' */}
        <circle cx="48" cy="14" r="9" fill="#EF4444" stroke="white" strokeWidth="2" />
        <text x="48" y="18" fill="white" fontSize="10" fontWeight="bold" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle">1</text>
      </svg>
    ),
  },
  {
    id: 'mock-test',
    titlePrefix: 'Mock',
    titleSuffix: 'Test',
    description: 'Online Mock Test Available',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 transition-transform duration-300 group-hover:scale-110 drop-shadow-sm">
        {/* Laptop Screen Bezel */}
        <rect x="11" y="12" width="42" height="28" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
        <rect x="14" y="15" width="36" height="22" rx="1.5" fill="#6366F1" />

        {/* Screen Quiz Rows */}
        <rect x="17" y="18.5" width="5" height="4" rx="1" fill="#A5B4FC" />
        <line x1="25" y1="20.5" x2="44" y2="20.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

        <rect x="17" y="24.5" width="5" height="4" rx="1" fill="#A5B4FC" />
        <line x1="25" y1="26.5" x2="41" y2="26.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

        <rect x="17" y="30.5" width="5" height="4" rx="1" fill="#34D399" />
        <line x1="25" y1="32.5" x2="38" y2="32.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

        {/* Laptop Base */}
        <path d="M5 42 L59 42 L55 47 L9 47 Z" fill="#94A3B8" />
        <rect x="26" y="42" width="12" height="2" rx="1" fill="#64748B" />
      </svg>
    ),
  },
];

export default function AboutSection() {
  const sectionRef = useRef(null);
  const illuRef = useRef(null);
  const productsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stagger reveal ensuring elements always remain fully visible
      gsap.fromTo(
        '.product-card-item',
        { y: 15, opacity: 0.5 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.4,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        }
      );

      // Subtle floating animation on illustration
      if (illuRef.current) {
        gsap.to(illuRef.current, {
          y: -6,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="pt-8 pb-14 sm:pt-10 sm:pb-18 bg-white border-t border-slate-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">

        {/* TOP: About EducationMasters */}
        <div>
          {/* Section Title & Subtitle */}
          <div className="text-center space-y-1 mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1a3a5f] tracking-tight">
              About Education<span className="text-[#e11d48]">Masters</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              An online learning platform
            </p>
          </div>

          {/* Content & Illustration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* Left Description & Features */}
            <div className="lg:col-span-7 space-y-6">
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                Education masters is a platform for aspirants preparing &amp; looking to pursue their career in Defence &amp; Government. organisations. Education masters guides and helps aspirants to get prepare to achieve their goal by providing the latest information regarding latest exam &amp; current job openings in the Government/ defence sector along with the study material prepared by highly experienced trainers all over india.
              </p>

              <div className="space-y-4 pt-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b-2 border-slate-900 inline-block pb-1">
                  Why Education master is best
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-1">
                  {/* Left Points */}
                  <div className="space-y-3">
                    {FEATURES_LEFT.map((text, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium leading-snug">
                        <Check className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Right Points */}
                  <div className="space-y-3">
                    {FEATURES_RIGHT.map((text, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium leading-snug">
                        <Check className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div ref={illuRef} className="w-full max-w-[440px] sm:max-w-[480px]">
                <img
                  src="/about.webp"
                  alt="About EducationMasters Illustration"
                  className="w-full h-auto object-contain drop-shadow-xs"
                  loading="lazy"
                />
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM: Our Products & Services */}
        <div ref={productsRef} className="pt-4 sm:pt-6">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-[#1e293b] tracking-tight">
              Our Products &amp; Services
            </h2>
          </div>

          {/* 5-Column Grid of Product Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
            {PRODUCTS_SERVICES.map((product) => (
              <div
                key={product.id}
                className="product-card-item group bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-between text-center min-h-[180px] sm:min-h-[200px] cursor-default"
              >
                {/* Icon Container */}
                <div className="flex items-center justify-center h-16 w-16 mb-2">
                  {product.icon}
                </div>

                {/* Title */}
                <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight mb-1.5">
                  {product.titlePrefix}
                  <span className="text-[#e11d48]">{product.titleSuffix}</span>
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-snug">
                  {product.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}


