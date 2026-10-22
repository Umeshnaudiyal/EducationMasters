'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Search,
  BookOpen,
  Sparkles,
  Layers,
  Award,
  Clock,
  Globe,
  Users,
  CheckCircle2,
  Filter,
  ArrowRight,
  TrendingUp,
  FileText,
  ShieldCheck,
  Check,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TestbookSeriesCard from '@/components/mock-tests/TestbookSeriesCard';
import MockTestFilterSidebar from '@/components/mock-tests/MockTestFilterSidebar';
import { cleanHtmlContent } from '@/utils/cleanHtml';
import { getImageUrl } from '@/utils/image';

// Base Stream Categories for Exams Directory Filter
const BASE_CATEGORIES = [
  { id: 'all', name: 'All Exam Types', keyword: '' },
  { id: 'banking', name: 'Banking & Insurance', keyword: 'bank' },
  { id: 'ssc', name: 'SSC Exams', keyword: 'ssc' },
  { id: 'railways', name: 'Railways RRB', keyword: 'rail' },
  { id: 'teaching', name: 'Teaching Exams', keyword: 'teach' },
  { id: 'civil-services', name: 'Civil Services / UPSC', keyword: 'upsc' },
  { id: 'defence', name: 'Defence & Police', keyword: 'police' },
  { id: 'engineering', name: 'Engineering Exams', keyword: 'gate' },
  { id: 'state', name: 'State Govt Exams', keyword: 'state' },
];

function formatCount(num) {
  const n = Number(num) || 0;
  if (n <= 0) return '0';
  if (n < 1000) return `${n.toLocaleString()}`;
  if (n < 1000000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `${(n / 1000000).toFixed(1)}M`;
}

export default function ExamSubDirectoryClient({
  exam = {},
  initialSeries = [],
  subjects = [],
}) {
  const [seriesList, setSeriesList] = useState(initialSeries);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const examTitle = exam.name || 'Examination';
  const examEmblem = exam.emblem || exam.image ? getImageUrl(exam.emblem || exam.image) : null;
  const examBanner = exam.banner_image || exam.image ? getImageUrl(exam.banner_image || exam.image) : null;

  // Real-time computed counts from child series
  const totalSeries = seriesList.length;
  const totalTests = useMemo(() => {
    return seriesList.reduce((acc, s) => acc + (s.total_tests || 0), 0) || exam.total_tests || 0;
  }, [seriesList, exam.total_tests]);

  const freeTests = useMemo(() => {
    return seriesList.reduce((acc, s) => acc + (s.free_tests_count || 0), 0) || exam.free_tests_count || 0;
  }, [seriesList, exam.free_tests_count]);

  const totalAttempts = useMemo(() => {
    const fromSeries = seriesList.reduce((acc, s) => acc + (s.total_users || 0), 0);
    return Math.max(fromSeries, exam.total_attempts || exam.total_users || 0);
  }, [seriesList, exam.total_attempts, exam.total_users]);

  // Compute dynamic category counts based on child series
  const categoriesWithCounts = useMemo(() => {
    return BASE_CATEGORIES.map((cat) => {
      if (cat.id === 'all') return { ...cat, count: seriesList.length };
      const kw = cat.keyword.toLowerCase();
      const count = seriesList.filter((s) => {
        const text = `${s.title || ''} ${s.category_name || ''} ${s.slug || ''}`.toLowerCase();
        if (cat.id === 'banking') {
          return text.includes('clerk') || text.includes('po') || text.includes('so') || text.includes('rbi') || text.includes('bank');
        }
        if (cat.id === 'ssc') {
          return text.includes('cgl') || text.includes('chsl') || text.includes('mts') || text.includes('cpo') || text.includes('gd');
        }
        return text.includes(kw);
      }).length;
      return { ...cat, count };
    });
  }, [seriesList]);

  // Dynamic subject filters from active series
  const subjectsWithCounts = useMemo(() => {
    return subjects.slice(0, 15).map((sub) => {
      const subSlug = (sub.slug || '').toLowerCase();
      const subName = (sub.name || '').toLowerCase();
      const count = seriesList.filter((s) => {
        if (Array.isArray(s.subjects) && s.subjects.length > 0) {
          return s.subjects.some((item) => item.slug === sub.slug || item._id === sub._id);
        }
        const text = `${s.title || ''} ${s.slug || ''}`.toLowerCase();
        return text.includes(subName) || text.includes(subSlug);
      }).length;

      return {
        _id: sub._id,
        name: sub.name,
        slug: sub.slug,
        count,
      };
    });
  }, [subjects, seriesList]);

  // Filter series based on user selections
  const filteredSeries = useMemo(() => {
    return seriesList.filter((series) => {
      const titleLower = (series.title || '').toLowerCase();
      const slugLower = (series.slug || '').toLowerCase();

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          titleLower.includes(query) ||
          slugLower.includes(query) ||
          (series.category_name || '').toLowerCase().includes(query) ||
          (Array.isArray(series.highlights) &&
            series.highlights.some((h) => h.toLowerCase().includes(query)));

        if (!matchesQuery) return false;
      }

      // Stream category filter
      if (selectedCategory !== 'all') {
        const cat = BASE_CATEGORIES.find((c) => c.id === selectedCategory);
        if (cat && cat.keyword) {
          const text = `${titleLower} ${slugLower} ${(series.category_name || '').toLowerCase()}`;
          if (!text.includes(cat.keyword)) return false;
        }
      }

      // Subject filter
      if (selectedSubject !== 'all') {
        if (Array.isArray(series.subjects) && series.subjects.length > 0) {
          const hasSub = series.subjects.some(
            (s) => s.slug === selectedSubject || s._id === selectedSubject
          );
          if (!hasSub) return false;
        } else {
          const targetSub = subjects.find(
            (s) => s.slug === selectedSubject || s._id === selectedSubject
          );
          if (targetSub) {
            const subName = targetSub.name.toLowerCase();
            if (!titleLower.includes(subName)) return false;
          }
        }
      }

      return true;
    });
  }, [seriesList, searchQuery, selectedCategory, selectedSubject, subjects]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubject('all');
    setSearchQuery('');
  };

  const topDescriptionHtml = exam.top_description ? cleanHtmlContent(exam.top_description) : '';
  const bottomDescriptionHtml = exam.bottom_description ? cleanHtmlContent(exam.bottom_description) : '';

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans">
      <Header />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
        
        {/* ========================================================================= */}
        {/* 1. BREADCRUMBS */}
        {/* ========================================================================= */}
        <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-3 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-sky-600 font-normal">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <Link href="/mock-tests" className="hover:text-sky-600 font-normal">
            Mock Tests
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-slate-800 font-semibold">{examTitle}</span>
        </nav>

        {/* ========================================================================= */}
        {/* 2. SUB-DIRECTORY HEADER BANNER */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 mb-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title & Emblem */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden">
                {examEmblem ? (
                  <img
                    src={examEmblem}
                    alt={examTitle}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-blue-50 text-blue-700 font-black text-lg flex items-center justify-center">
                    {examTitle.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide">
                    {exam.category_name || 'Exam Directory'}
                  </span>
                  {totalAttempts > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                      <span className="text-amber-500">⚡</span>
                      <span>{formatCount(totalAttempts)} Attempts Taken</span>
                    </div>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {examTitle} Mock Test Series 2026
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
                  Practice online mock tests for {examTitle} exams with latest pattern tests, free practice papers, sectional quizzes, and detailed bilingual solutions.
                </p>
              </div>
            </div>

            {/* Dynamic Metric Badges */}
            <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>{totalSeries} Sub-Exam Test Series</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span>{totalTests} Total Tests ({freeTests} Free)</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>Bilingual Hindi &amp; English</span>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. TOP JODIT DESCRIPTION (IF SET BY ADMIN) */}
        {/* ========================================================================= */}
        {topDescriptionHtml ? (
          <div className="mb-6 p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
              <Sparkles size={16} className="text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                About {examTitle} Examination &amp; Preparation
              </h2>
            </div>
            <div
              className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed font-normal"
              dangerouslySetInnerHTML={{ __html: topDescriptionHtml }}
            />
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* 4. 2-COLUMN RESPONSIVE LAYOUT (LEFT FILTER + RIGHT TESTBOOK CARDS GRID) */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">
          
          {/* ================= COMPACT LEFT FILTER SIDEBAR ================= */}
          <MockTestFilterSidebar
            categories={categoriesWithCounts}
            selectedCategory={selectedCategory}
            onSelectCategory={(id) => setSelectedCategory(id)}
            subjects={subjectsWithCounts}
            selectedSubject={selectedSubject}
            onSelectSubject={(id) => setSelectedSubject(id)}
            searchQuery={searchQuery}
            onSearchChange={(q) => setSearchQuery(q)}
            onResetFilters={handleResetFilters}
            totalCount={filteredSeries.length}
          />

          {/* ================= MAIN SUB-DIRECTORY CARDS SECTION ================= */}
          <section className="flex-1 min-w-0 space-y-4">
            
            {/* Active Filter Pills Bar */}
            {(selectedCategory !== 'all' || selectedSubject !== 'all' || searchQuery) && (
              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">Active Filters:</span>
                  {selectedCategory !== 'all' && (
                    <span className="bg-white border border-sky-300 px-2 py-0.5 rounded-full font-semibold">
                      Stream: {categoriesWithCounts.find((c) => c.id === selectedCategory)?.name}
                    </span>
                  )}
                  {selectedSubject !== 'all' && (
                    <span className="bg-white border border-sky-300 px-2 py-0.5 rounded-full font-semibold">
                      Subject: {subjectsWithCounts.find((s) => s.slug === selectedSubject || s._id === selectedSubject)?.name}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="bg-white border border-sky-300 px-2 py-0.5 rounded-full font-semibold">
                      Search: &quot;{searchQuery}&quot;
                    </span>
                  )}
                  <span className="text-slate-500 font-medium ml-1">
                    ({filteredSeries.length} series found)
                  </span>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-sky-700 font-bold hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Test Series Sub-Directory Grid (Testbook Card Design) */}
            {filteredSeries.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-slate-700 font-bold text-sm">
                  No test series found matching your search criteria
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try clearing your search query or selecting a different subject from the left filter panel.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4 pt-1">
                {filteredSeries.map((series) => (
                  <TestbookSeriesCard
                    key={series._id || series.slug}
                    item={series}
                    type="series"
                  />
                ))}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5. BOTTOM JODIT DESCRIPTION (OR DETAILED SEO SYLLABUS SECTION) */}
            {/* ========================================================================= */}
            {bottomDescriptionHtml ? (
              <div className="mt-10 p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <FileText size={18} className="text-[#00c5d2]" />
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    {examTitle} Syllabus Breakdown, Exam Pattern &amp; Guidelines
                  </h2>
                </div>
                <div
                  className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed font-normal"
                  dangerouslySetInnerHTML={{ __html: bottomDescriptionHtml }}
                />
              </div>
            ) : (
              <div className="mt-10 p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs text-slate-600 leading-relaxed">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  {examTitle} Online Test Series 2026 - Preparation Guide &amp; Key Features
                </h2>
                <p>
                  Prepare for upcoming {examTitle} examinations with Education Masters&apos; full-length mock test series designed by expert educators. Each test series replicates the actual computer-based test (CBT) environment, including sectional timers, negative marking scheme, and immediate result analysis.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-200 text-xs">
                  <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs">1</span>
                      <span>Real Exam Screen</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Identical question palette, timer countdown, review flags, and section switching as actual {examTitle} exams.
                    </p>
                  </div>

                  <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">2</span>
                      <span>All India Rank &amp; Percentile</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Compare your score with thousands of test takers and identify your weak topics with AI analytics.
                    </p>
                  </div>

                  <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">3</span>
                      <span>Detailed Bilingual Solutions</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Step-by-step explanations, shortcut methods, and tips provided in both English and Hindi.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </section>
        </div>

      </main>

      <Footer />
    </div>
  );
}
