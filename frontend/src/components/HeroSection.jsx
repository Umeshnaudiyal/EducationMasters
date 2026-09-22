'use client';

import Link from 'next/link';

const HERO_CARDS = [
  {
    id: 'mcq',
    count: '1000+',
    countColor: 'text-pink-600',
    title: 'M.C.Q',
    image: '/mcq.png',
    href: '/general-knowledge/mcq-questions'
  },
  {
    id: 'syllabus',
    count: '50+',
    countColor: 'text-amber-600',
    title: 'Syllabus',
    image: '/syllabus.png',
    href: '/category/syllabus'
  },
  {
    id: 'jobs',
    count: '1000+',
    countColor: 'text-emerald-600',
    title: 'Jobs',
    image: '/jobs.png',
    href: '/jobs'
  },
  {
    id: 'admit-card',
    count: '100+',
    countColor: 'text-blue-600',
    title: 'Admit Card',
    image: '/id-card.png',
    href: '/admit-cards'
  },
  {
    id: 'results',
    count: '300+',
    countColor: 'text-purple-600',
    title: 'Results',
    image: '/exam-results.png',
    href: '/results'
  },
  {
    id: 'articles',
    count: '300+',
    countColor: 'text-rose-600',
    title: 'Articles',
    image: '/articles.png',
    href: '/category/articles'
  }
];

export default function HeroSection({ onCardSelect }) {
  return (
    <section
      className="relative text-white py-16 sm:py-20 lg:py-24 h-[52vh] flex flex-col justify-center px-4 sm:px-6 lg:px-8 shadow-2xl overflow-hidden bg-[#0d5ea6]"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(13, 94, 166, 0.45), rgba(13, 94, 166, 0.70)), url('/enhanced_blueprint_bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Subtle ambient lighting orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-10 left-1/3 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto text-center space-y-8 sm:space-y-10 relative z-10 w-full">

        {/* Main Headline */}
        <div className="space-y-3 pt-1">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-semibold font-black text-white tracking-tight drop-shadow-md">
            15 MILLION Student Trust
          </h1>
          <p className="text-slate-100 text-xs sm:text-sm max-w-2xl mx-auto font-medium opacity-95 leading-relaxed drop-shadow-xs">
            (More than 15 million student trust educationmasters as a guide for their further studies)
          </p>
        </div>

        {/* 6 Compact White Stat Cards with Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5 pt-1 max-w-4xl mx-auto">
          {HERO_CARDS.map((card) => {
            return (
              <Link
                key={card.id}
                href={card.href}
                className="bg-white/95 backdrop-blur-md rounded-xl p-3 text-center shadow-md hover:shadow-xl hover:bg-white transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col items-center justify-center border border-slate-100/80 group no-underline text-slate-900"
              >
                {/* PNG Icon Illustration */}
                <div className="w-11 h-11 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-contain filter drop-shadow-2xs"
                  />
                </div>

                {/* Compact Count Text */}
                <span className={`text-base sm:text-lg font-black tracking-tight block mb-0.5 ${card.countColor}`}>
                  {card.count}
                </span>

                {/* Red Title Text */}
                <h3 className="text-[16px] font-medium text-[#d93838] tracking-tight">
                  {card.title}
                </h3>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
