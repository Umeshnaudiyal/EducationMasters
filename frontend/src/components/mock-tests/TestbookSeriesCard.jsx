'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, Plus, ArrowRight, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { getImageUrl } from '@/utils/image';

// Generates an elegant gradient backdrop when no banner image is provided
function getFallbackBanner(title = '') {
  const t = (title || '').toLowerCase();
  if (t.includes('sbi') || t.includes('bank') || t.includes('ibps') || t.includes('rbi')) {
    return 'from-blue-900 via-indigo-800 to-sky-700';
  }
  if (t.includes('ssc') || t.includes('cgl') || t.includes('chsl')) {
    return 'from-amber-800 via-orange-700 to-amber-600';
  }
  if (t.includes('railway') || t.includes('rrb') || t.includes('ntpc')) {
    return 'from-emerald-900 via-teal-800 to-emerald-700';
  }
  if (t.includes('upsc') || t.includes('ias') || t.includes('pcs') || t.includes('civil')) {
    return 'from-purple-900 via-indigo-900 to-violet-800';
  }
  if (t.includes('teach') || t.includes('tet') || t.includes('ctet') || t.includes('utet')) {
    return 'from-teal-900 via-emerald-800 to-cyan-700';
  }
  if (t.includes('police') || t.includes('defence') || t.includes('army') || t.includes('nda')) {
    return 'from-rose-900 via-pink-800 to-rose-700';
  }
  return 'from-slate-900 via-slate-800 to-blue-950';
}

function getFallbackEmblemText(title = '') {
  const t = (title || '').trim();
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return t.slice(0, 3).toUpperCase() || 'EX';
}

function formatCandidateCount(count) {
  const n = Number(count);
  if (!n || n <= 0) {
    if (typeof count === 'string' && count.trim()) return count;
    return '1.2k Users';
  }
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M Users`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k Users`;
  return `${n} Users`;
}

export default function TestbookSeriesCard({
  item = {},
  type = 'series', // 'directory' (links to /mock-tests/[slug]) or 'series' (links to /mock-test/[slug])
  className = '',
}) {
  const isDirectory = type === 'directory';
  const targetHref = isDirectory
    ? `/mock-tests/${item.slug}`
    : `/mock-test/${item.slug}`;

  const title = item.name || item.title || 'Mock Test Series';
  const bannerImage = item.banner_image || item.image ? getImageUrl(item.banner_image || item.image) : null;
  const emblemImage = item.emblem || item.image ? getImageUrl(item.emblem || item.image) : null;

  const totalTests = item.total_tests || (item.tests ? item.tests.length : 0);
  const freeTests = item.free_tests_count || 0;
  const candidateNumber = item.total_users || item.total_attempts || 0;
  const usersBadge = item.user_count_badge || (candidateNumber > 0 ? formatCandidateCount(candidateNumber) : item.badge || '1.5k Users');

  // Parse languages
  let languagesList = ['English', 'Hindi'];
  if (Array.isArray(item.languages) && item.languages.length > 0) {
    languagesList = item.languages;
  } else if (typeof item.languages === 'string' && item.languages.trim()) {
    languagesList = item.languages.split(',').map((l) => l.trim()).filter(Boolean);
  }
  const languagesDisplay = languagesList.join(', ');

  // Parse highlights
  let highlights = Array.isArray(item.highlights) && item.highlights.length > 0 ? item.highlights : [];
  if (highlights.length === 0) {
    if (isDirectory) {
      highlights = [
        `${title} Prelims & Mains Series`,
        `${totalTests > 0 ? totalTests : 20}+ Full-Length Mock Papers`,
        `${freeTests > 0 ? freeTests : 5}+ Free Instant Practice Tests`,
        'All India Rank & Performance Analytics',
      ];
    } else {
      highlights = [
        'Full-Length Mock Tests (Latest Pattern)',
        'Chapter & Sectional Practice Tests',
        'Detailed Hindi & English Step-by-Step Solutions',
        '+150 more sectional & topic tests',
      ];
    }
  }

  // Slice to max 4 highlights for consistent card height
  const displayHighlights = highlights.slice(0, 4);

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400 hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group relative ${className}`}
    >
      <div>
        {/* ========================================================================= */}
        {/* 1. TOP BANNER IMAGE */}
        {/* ========================================================================= */}
        <Link href={targetHref} className="block relative w-full aspect-[2.1/1] overflow-hidden bg-slate-100">
          {bannerImage ? (
            <img
              src={bannerImage}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  e.currentTarget.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}

          {/* Elegant Gradient Fallback with exam watermarking */}
          <div
            className={`w-full h-full bg-gradient-to-r ${getFallbackBanner(title)} p-3 text-white flex flex-col justify-between ${
              bannerImage ? 'hidden' : 'flex'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-black/30 backdrop-blur-[2px] px-2 py-0.5 rounded-full text-white/90">
                {item.category_name || (isDirectory ? 'Exam Directory' : 'Mock Test Series')}
              </span>
              <span className="text-xs">📚</span>
            </div>
            <div>
              <p className="text-xs font-black text-white/95 line-clamp-1 drop-shadow-sm">
                {title}
              </p>
              <p className="text-[10px] text-white/80 font-medium">
                EducationMasters Practice Series
              </p>
            </div>
          </div>
        </Link>

        {/* ========================================================================= */}
        {/* 2. CARD HEADER: EMBLEM LOGO & USERS BADGE */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-4 pb-2">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            {/* Circular Emblem / Logo */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-slate-200 bg-white p-1 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden">
              {emblemImage ? (
                <img
                  src={emblemImage}
                  alt={title}
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full rounded-full bg-blue-50 text-blue-600 font-extrabold text-xs flex items-center justify-center ${
                  emblemImage ? 'hidden' : 'flex'
                }`}
              >
                {getFallbackEmblemText(title)}
              </div>
            </div>

            {/* Candidate / Users Count Badge (Testbook Lightning Style) */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50/90 border border-amber-200 text-amber-800 text-[11px] font-bold shadow-2xs">
              <span className="text-amber-500">⚡</span>
              <span>{usersBadge}</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. TITLE & STATS */}
          {/* ========================================================================= */}
          <Link href={targetHref} className="block group-hover:text-sky-600 transition-colors">
            <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 min-h-[2.5rem]">
              {title}
            </h3>
          </Link>

          {/* Tests Stats Line */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-1.5">
            <span>{totalTests > 0 ? `${totalTests} Total Tests` : 'Curated Test Series'}</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-600 font-bold">
              {freeTests > 0 ? `${freeTests} Free Tests` : 'Free Tests Available'}
            </span>
          </div>

          {/* Languages Row */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium pt-2 mt-2 border-t border-slate-100">
            <Globe size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">{languagesDisplay}</span>
          </div>

          {/* ========================================================================= */}
          {/* 4. BULLET HIGHLIGHTS (TESTBOOK STYLE) */}
          {/* ========================================================================= */}
          <ul className="space-y-1.5 pt-2.5 mt-2 text-xs text-slate-700">
            {displayHighlights.map((highlight, idx) => {
              const isLast = idx === displayHighlights.length - 1 && highlight.startsWith('+');
              return (
                <li
                  key={idx}
                  className={`flex items-start gap-2 leading-tight ${
                    isLast ? 'text-teal-600 font-bold' : 'text-slate-600 font-normal'
                  }`}
                >
                  <span className="text-slate-400 font-black leading-none mt-1">•</span>
                  <span className="line-clamp-1">{highlight}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CARD FOOTER: PRIMARY ACTION BUTTON & PLUS BUTTON */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-4 pt-2 border-t border-slate-100 bg-white flex items-center gap-2">
        <Link
          href={targetHref}
          className="flex-1 bg-[#00c5d2] hover:bg-[#00b0bd] text-white text-xs sm:text-[13px] font-bold py-2 sm:py-2.5 px-3 rounded-xl shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 text-center cursor-pointer"
        >
          <span>{isDirectory ? 'Explore Directory' : 'View Test Series'}</span>
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Secondary Action (+) */}
        <Link
          href={targetHref}
          title={isDirectory ? 'Browse All' : 'Add to favorites'}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-sky-300 text-sky-600 hover:bg-sky-50 flex items-center justify-center transition-colors shrink-0 shadow-2xs cursor-pointer"
        >
          <Plus size={16} />
        </Link>
      </div>
    </div>
  );
}
