'use client';

import Link from 'next/link';

const POPULAR_CATEGORIES = [
  {
    id: 'gk',
    titlePrefix: '',
    titleAccent: 'G.K.',
    titleSuffix: '',
    subtitle: 'Improve your General Knowledge',
    imgSrc: '/knowledge.png',
    href: '/category/gk'
  },
  {
    id: 'latest-jobs',
    titlePrefix: 'Latest ',
    titleAccent: 'Jobs',
    titleSuffix: '',
    subtitle: 'View the latest govt. jobs available',
    imgSrc: '/job-search.png',
    href: '/jobs'
  },
  {
    id: 'current-affair',
    titlePrefix: 'Current ',
    titleAccent: 'Affair',
    titleSuffix: '',
    subtitle: 'Learn in detail about Current Affairs',
    imgSrc: '/new.png',
    href: '/category/current-affair'
  },
  {
    id: 'defence',
    titlePrefix: '',
    titleAccent: 'Defence',
    titleSuffix: '',
    subtitle: 'Learn in detail for Defence preparation',
    imgSrc: '/commander.png',
    href: '/category/defence'
  },
  {
    id: 'biography',
    titlePrefix: '',
    titleAccent: 'Biography',
    titleSuffix: '',
    subtitle: 'Read biography of famous personalities',
    imgSrc: '/biography.png',
    href: '/category/biography'
  },
  {
    id: 'results',
    titlePrefix: '',
    titleAccent: 'Results',
    titleSuffix: '',
    subtitle: 'Check latest information about results',
    imgSrc: '/exam-results.png',
    href: '/results'
  },
  {
    id: 'railway',
    titlePrefix: '',
    titleAccent: 'Railway',
    titleSuffix: '',
    subtitle: 'Learn in detail about Railway',
    imgSrc: '/railway.png',
    href: '/category/railway'
  },
  {
    id: 'bank',
    titlePrefix: '',
    titleAccent: 'Bank',
    titleSuffix: '',
    subtitle: 'Learn in detail about Bank Jobs',
    imgSrc: '/bank.png',
    href: '/category/bank'
  },
  {
    id: 'ssc',
    titlePrefix: '',
    titleAccent: 'SSC',
    titleSuffix: '',
    subtitle: 'Learn and prepare for SSC',
    imgSrc: '/ssc.png',
    href: '/category/ssc'
  },
  {
    id: 'funzone',
    titlePrefix: '',
    titleAccent: 'Funzone',
    titleSuffix: '',
    subtitle: 'Improve your knowledge through interesting facts',
    imgSrc: '/funzone.png',
    href: '/category/funzone'
  },
  {
    id: 'tips',
    titlePrefix: '',
    titleAccent: 'Tips',
    titleSuffix: '',
    subtitle: 'Get tips & guidance for your career',
    imgSrc: '/tips.png',
    href: '/category/tips'
  },
  {
    id: 'upsc',
    titlePrefix: '',
    titleAccent: 'UPSC',
    titleSuffix: '',
    subtitle: 'Learn and prepare for UPSC',
    imgSrc: '/upsc.png',
    href: '/category/upsc'
  }
];

export default function CategoriesSection({ onSelectCategory }) {
  return (
    <section className="py-12 sm:py-16 bg-slate-50/50 text-slate-800 border-b border-slate-200/60">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Section Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#213547] tracking-tight">
            Popular Categories
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            Start Learning and update yourself for Govt. jobs Exam
          </p>
        </div>

        {/* 6-Column × 2-Row Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {POPULAR_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              scroll={false}
              className="bg-white rounded-2xl p-5 text-center border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col items-center justify-start h-full group no-underline text-slate-900"
            >
              {/* Category Image Icon */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 mb-3 flex items-center justify-center">
                <img
                  src={cat.imgSrc}
                  alt={cat.titleAccent}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Title with Accent */}
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                <span>{cat.titlePrefix}</span>
                <span className="text-[#e11d48]">{cat.titleAccent}</span>
                <span>{cat.titleSuffix}</span>
              </h3>

              {/* Subtitle */}
              <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                {cat.subtitle}
              </p>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
