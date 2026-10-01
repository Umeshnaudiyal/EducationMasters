'use client';

import React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Award,
  FileCheck2,
  Brain,
  Keyboard,
  BookOpenCheck,
  ArrowUpRight,
  Sparkles,
  Zap,
  CheckCircle,
  Clock
} from 'lucide-react';

const PORTAL_CARDS = [
  {
    title: 'Latest Sarkari Jobs',
    subtitle: '2,450+ Active Vacancies',
    badge: 'Daily Updates',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Explore active central and state government recruitment notifications with eligibility & online forms.',
    link: '/jobs',
    icon: Briefcase,
    gradient: 'from-blue-600 to-indigo-700',
    hoverBorder: 'hover:border-blue-500 hover:shadow-blue-500/15',
  },
  {
    title: 'Exam Results & Cutoffs',
    subtitle: 'Scorecards & Merit Lists',
    badge: 'Direct Download',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Check latest selection lists, state PSC rank lists, final answer keys, and cutoff marks.',
    link: '/results',
    icon: Award,
    gradient: 'from-emerald-600 to-teal-700',
    hoverBorder: 'hover:border-emerald-500 hover:shadow-emerald-500/15',
  },
  {
    title: 'Admit Cards & Hall Tickets',
    subtitle: 'Exam City & Call Letters',
    badge: 'Fast Servers',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Download hall tickets for UPSC, SSC, Railways, IBPS, Defence, and State Police exams.',
    link: '/admit-cards',
    icon: FileCheck2,
    gradient: 'from-purple-600 to-violet-700',
    hoverBorder: 'hover:border-purple-500 hover:shadow-purple-500/15',
  },
  {
    title: 'Daily MCQs & Quizzes',
    subtitle: '50,000+ Subject Sets',
    badge: 'Free Practice',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    description: 'Practice chapter-wise MCQs for GK, General Science, Indian Polity, History, and Current Affairs.',
    link: '/mcq-questions',
    icon: Brain,
    gradient: 'from-amber-500 to-orange-600',
    hoverBorder: 'hover:border-amber-500 hover:shadow-amber-500/15',
  },
  {
    title: 'Typing Speed Test Tool',
    subtitle: 'Hindi & English Typing',
    badge: 'SSC Benchmark',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    description: 'Real-time WPM, Net Speed, and Accuracy evaluator modeled on SSC CGL/CHSL & High Court tests.',
    link: '/typing-test',
    icon: Keyboard,
    gradient: 'from-cyan-600 to-blue-700',
    hoverBorder: 'hover:border-cyan-500 hover:shadow-cyan-500/15',
  },
  {
    title: 'Exam Syllabus & Patterns',
    subtitle: 'Official PDF Guides',
    badge: 'Full Blueprint',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Comprehensive topic-wise syllabus, marks distribution, and previous year exam strategies.',
    link: '/syllabus',
    icon: BookOpenCheck,
    gradient: 'from-rose-600 to-pink-700',
    hoverBorder: 'hover:border-rose-500 hover:shadow-rose-500/15',
  },
];

export default function NotFoundHubGrid() {
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-flex items-center gap-1 mb-2">
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>Quick Redirection Hub</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Where Would You Like To Go Instead?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Pick any of the most popular sections to continue your exam preparation without delay.
        </p>
      </div>

      {/* 6 Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PORTAL_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              href={card.link}
              className={`group relative bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between ${card.hoverBorder} cursor-pointer`}
            >
              <div>
                {/* Header with Icon and Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${card.gradient} text-white flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>

                {/* Card Title & Subtitle */}
                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <span>{card.title}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-blue-600 shrink-0" />
                </h3>
                
                <p className="text-xs font-semibold text-blue-600/80 mb-2">
                  {card.subtitle}
                </p>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Bottom explore link */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                <span>Explore Section</span>
                <span className="text-blue-600 font-extrabold group-hover:translate-x-1 transition-transform inline-block">
                  ➔
                </span>
              </div>
            </Link>
          );
        })}
      </div>

    </section>
  );
}
