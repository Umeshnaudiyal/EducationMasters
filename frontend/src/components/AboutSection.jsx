'use client';

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

export default function AboutSection() {
  return (
    <section className="pt-2 pb-6 sm:pt-4 sm:pb-8 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title & Subtitle */}
        <div className="text-center space-y-1 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1a3a5f] tracking-tight">
            About Education<span className="text-[#e11d48]">Masters</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            An online learning platform
          </p>
        </div>

        {/* Content & Illustration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
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
                    <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 font-medium leading-snug">
                      <Check className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                {/* Right Points */}
                <div className="space-y-3">
                  {FEATURES_RIGHT.map((text, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 font-medium leading-snug">
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
            <div className="w-full max-w-[440px] sm:max-w-[480px]">
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
    </section>
  );
}
