'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Search,
  BookOpen,
  Sparkles,
  Layers,
  Award,
  Clock,
  Compass,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TestbookSeriesCard from '@/components/mock-tests/TestbookSeriesCard';
import MockTestFilterSidebar from '@/components/mock-tests/MockTestFilterSidebar';

// Base Stream Categories for Exams Directory
const BASE_CATEGORIES = [
  { id: 'all', name: 'All Exam Streams', keyword: '' },
  { id: 'banking', name: 'Banking & Insurance', keyword: 'bank' },
  { id: 'ssc', name: 'SSC Exams', keyword: 'ssc' },
  { id: 'railways', name: 'Railways RRB', keyword: 'rail' },
  { id: 'teaching', name: 'Teaching Exams', keyword: 'teach' },
  { id: 'civil-services', name: 'Civil Services / UPSC', keyword: 'upsc' },
  { id: 'defence', name: 'Defence & Police', keyword: 'police' },
  { id: 'engineering', name: 'Engineering Exams', keyword: 'gate' },
  { id: 'state', name: 'State Govt Exams', keyword: 'state' },
];

export default function MockTestsClient({
  initialExams = [],
  initialSeries = [],
  initialSubjects = [],
}) {
  const router = useRouter();
  const [examsList, setExamsList] = useState(initialExams);
  const [seriesList, setSeriesList] = useState(initialSeries);
  const [subjectsList, setSubjectsList] = useState(initialSubjects);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Client-side refresh on mount to ensure fresh data
  useEffect(() => {
    let isMounted = true;
    async function refreshDirectories() {
      try {
        const [eRes, sRes, subRes] = await Promise.all([
          fetch('/apis/v1/exams?all=true&status=published'),
          fetch('/apis/v1/mock-test-series?status=published&limit=100'),
          fetch('/apis/v1/subjects?limit=100'),
        ]);

        const [eData, sData, subData] = await Promise.all([
          eRes.json(),
          sRes.json(),
          subRes.json(),
        ]);

        if (isMounted) {
          if (eData.success && Array.isArray(eData.data)) setExamsList(eData.data);
          if (sData.success && Array.isArray(sData.data)) setSeriesList(sData.data);
          if (subData.success && Array.isArray(subData.data)) setSubjectsList(subData.data);
        }
      } catch (err) {
        console.error('Error refreshing client directories:', err);
      }
    }

    refreshDirectories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute dynamic category counts based on current exams list
  const categoriesWithCounts = useMemo(() => {
    return BASE_CATEGORIES.map((cat) => {
      if (cat.id === 'all') {
        return { ...cat, count: examsList.length };
      }
      const kw = cat.keyword.toLowerCase();
      const count = examsList.filter((e) => {
        const text = `${e.name || ''} ${e.slug || ''} ${e.category_name || ''} ${e.description || ''}`.toLowerCase();
        if (cat.id === 'banking') {
          return text.includes('bank') || text.includes('sbi') || text.includes('ibps') || text.includes('rbi') || text.includes('lic');
        }
        if (cat.id === 'ssc') {
          return text.includes('ssc') || text.includes('cgl') || text.includes('chsl');
        }
        if (cat.id === 'railways') {
          return text.includes('rail') || text.includes('rrb') || text.includes('ntpc') || text.includes('group d');
        }
        if (cat.id === 'teaching') {
          return text.includes('teach') || text.includes('tet') || text.includes('ctet') || text.includes('utet') || text.includes('net');
        }
        if (cat.id === 'civil-services') {
          return text.includes('upsc') || text.includes('ias') || text.includes('pcs') || text.includes('civil');
        }
        if (cat.id === 'defence') {
          return text.includes('def') || text.includes('police') || text.includes('army') || text.includes('nda') || text.includes('cds');
        }
        if (cat.id === 'engineering') {
          return text.includes('gate') || text.includes('eng') || text.includes('je') || text.includes('ae') || text.includes('isro');
        }
        if (cat.id === 'state') {
          return text.includes('state') || text.includes('pcs') || text.includes('patwari') || text.includes('constable');
        }
        return text.includes(kw);
      }).length;

      return { ...cat, count };
    });
  }, [examsList]);

  // Compute dynamic subject counts based on current exams
  const subjectsWithCounts = useMemo(() => {
    return subjectsList.slice(0, 15).map((sub) => {
      const subSlug = (sub.slug || '').toLowerCase();
      const subName = (sub.name || '').toLowerCase();
      const count = examsList.filter((e) => {
        if (Array.isArray(e.subjects) && e.subjects.length > 0) {
          return e.subjects.some((s) => s.slug === sub.slug || s._id === sub._id);
        }
        const text = `${e.name || ''} ${e.description || ''}`.toLowerCase();
        return text.includes(subName) || text.includes(subSlug);
      }).length;

      return {
        _id: sub._id,
        name: sub.name,
        slug: sub.slug,
        count,
      };
    });
  }, [subjectsList, examsList]);

  // Dynamic attempts taken and tests across all directories
  const totalDirectoryAttempts = useMemo(() => {
    return examsList.reduce((acc, e) => acc + (e.total_attempts || e.total_users || 0), 0);
  }, [examsList]);

  const totalDirectoryTests = useMemo(() => {
    return examsList.reduce((acc, e) => acc + (e.total_tests || 0), 0);
  }, [examsList]);

  // Filter exams based on category, subject, and search query
  const filteredExams = useMemo(() => {
    return examsList.filter((exam) => {
      const text = `${exam.name || ''} ${exam.slug || ''} ${exam.category_name || ''} ${exam.description || ''} ${exam.badge || ''}`.toLowerCase();

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (!text.includes(q)) return false;
      }

      // Category Filter
      if (selectedCategory !== 'all') {
        const cat = BASE_CATEGORIES.find((c) => c.id === selectedCategory);
        if (cat) {
          if (selectedCategory === 'banking') {
            const isBanking = text.includes('bank') || text.includes('sbi') || text.includes('ibps') || text.includes('rbi') || text.includes('lic');
            if (!isBanking) return false;
          } else if (selectedCategory === 'ssc') {
            if (!text.includes('ssc') && !text.includes('cgl') && !text.includes('chsl')) return false;
          } else if (selectedCategory === 'railways') {
            if (!text.includes('rail') && !text.includes('rrb') && !text.includes('ntpc')) return false;
          } else if (selectedCategory === 'teaching') {
            if (!text.includes('teach') && !text.includes('tet') && !text.includes('ctet') && !text.includes('utet')) return false;
          } else if (selectedCategory === 'civil-services') {
            if (!text.includes('upsc') && !text.includes('ias') && !text.includes('pcs') && !text.includes('civil')) return false;
          } else if (selectedCategory === 'defence') {
            if (!text.includes('def') && !text.includes('police') && !text.includes('army') && !text.includes('nda')) return false;
          } else if (selectedCategory === 'engineering') {
            if (!text.includes('gate') && !text.includes('eng') && !text.includes('je') && !text.includes('isro')) return false;
          } else if (selectedCategory === 'state') {
            if (!text.includes('state') && !text.includes('pcs') && !text.includes('patwari')) return false;
          } else {
            if (!text.includes(cat.keyword.toLowerCase())) return false;
          }
        }
      }

      // Subject Filter
      if (selectedSubject !== 'all') {
        if (Array.isArray(exam.subjects) && exam.subjects.length > 0) {
          const hasSub = exam.subjects.some(
            (s) => s.slug === selectedSubject || s._id === selectedSubject
          );
          if (!hasSub) return false;
        } else {
          const subObj = subjectsList.find(
            (s) => s.slug === selectedSubject || s._id === selectedSubject
          );
          if (subObj) {
            const subWord = subObj.name.toLowerCase();
            if (!text.includes(subWord)) return false;
          }
        }
      }

      return true;
    });
  }, [examsList, selectedCategory, selectedSubject, searchQuery, subjectsList]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubject('all');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans">
      <Header />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-2 min-[360px]:px-2.5 sm:px-4 md:px-6 py-2.5 sm:py-4 md:py-6 overflow-x-hidden min-w-0">
        
        {/* ========================================================================= */}
        {/* 1. TOP BREADCRUMBS */}
        {/* ========================================================================= */}
        <nav className="flex items-center space-x-1.5 text-[11px] sm:text-xs text-slate-500 mb-1.5 sm:mb-2 overflow-x-auto whitespace-nowrap scrollbar-none w-full max-w-full min-w-0">
          <Link href="/" className="hover:text-sky-600 font-normal">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-slate-800 font-medium">Mock Tests Directory</span>
        </nav>

        {/* ========================================================================= */}
        {/* 2. PAGE HEADER BANNER */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3 border-b border-slate-200 pb-2.5 sm:pb-4 mb-2.5 sm:mb-5 w-full max-w-full min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-[360px]:gap-2 flex-wrap">
              <h1 className="text-lg min-[360px]:text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Mock Tests Directory
              </h1>
              <span className="text-[10px] min-[360px]:text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                {examsList.length} Exam Directories
              </span>
            </div>
            <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
              Select an examination directory to practice full-length test series, chapter-wise MCQs, and free papers
            </p>
          </div>

          {/* Real-time Directory Stats */}
          <div className="flex flex-wrap items-center gap-1.5 min-[360px]:gap-2 sm:gap-4 text-[10.5px] sm:text-xs font-semibold text-slate-600 shrink-0">
            {totalDirectoryAttempts > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                <span className="text-amber-500">⚡</span>
                <span>{totalDirectoryAttempts.toLocaleString()} Attempts Taken</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{totalDirectoryTests > 0 ? `${totalDirectoryTests}+ Mock Tests` : '100% Latest Pattern'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>All India Ranking</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. 2-COLUMN RESPONSIVE LAYOUT (LEFT FILTER SIDEBAR + MAIN DIRECTORY GRID) */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row gap-2.5 lg:gap-6 items-stretch lg:items-start w-full max-w-full min-w-0">
          
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
            totalCount={filteredExams.length}
          />

          {/* ================= EXPANSIVE MAIN DIRECTORY SECTION ================= */}
          <section className="flex-1 w-full max-w-full min-w-0 space-y-2.5 sm:space-y-4">

            {/* Quick Mobile Category Scroll Bar (Mobile view only) */}
            <div className="lg:hidden w-full max-w-full min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs w-full">
                {categoriesWithCounts.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-all text-[11px] sm:text-xs cursor-pointer shrink-0 ${
                      selectedCategory === tab.id
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.name} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Active Filter Indicator */}
            {(selectedCategory !== 'all' || selectedSubject !== 'all' || searchQuery) && (
              <div className="p-1.5 min-[360px]:p-2 sm:p-3 bg-sky-50/70 border border-sky-200 rounded-lg sm:rounded-xl flex items-center justify-between text-[11px] sm:text-xs text-sky-900 w-full max-w-full min-w-0 gap-2">
                <div className="flex items-center gap-1.5 min-[360px]:gap-2 flex-wrap min-w-0">
                  <span className="font-bold shrink-0">Active Filter:</span>
                  {selectedCategory !== 'all' && (
                    <span className="bg-white border border-sky-300 px-2 py-0.5 rounded-full font-semibold truncate max-w-[180px]">
                      Stream: {categoriesWithCounts.find((c) => c.id === selectedCategory)?.name}
                    </span>
                  )}
                  {selectedSubject !== 'all' && (
                    <span className="bg-white border border-sky-300 px-2 py-0.5 rounded-full font-semibold truncate max-w-[180px]">
                      Subject: {subjectsWithCounts.find((s) => s.slug === selectedSubject || s._id === selectedSubject)?.name}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="bg-white border border-sky-300 px-2 py-0.5 rounded-full font-semibold truncate max-w-[180px]">
                      Search: &quot;{searchQuery}&quot;
                    </span>
                  )}
                  <span className="text-slate-500 font-medium shrink-0">
                    ({filteredExams.length} directories)
                  </span>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-sky-700 font-bold hover:underline shrink-0 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* ================= DIRECTORY CARDS GRID ================= */}
            {filteredExams.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3 w-full max-w-full">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-slate-700 font-bold text-sm">
                  No exam directories found matching your filter criteria
                </p>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
                >
                  Reset search & filters
                </button>
              </div>
            ) : (
              <div className="w-full max-w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 sm:gap-4 pt-1">
                {filteredExams.map((exam) => (
                  <TestbookSeriesCard
                    key={exam._id || exam.slug}
                    item={exam}
                    type="directory"
                  />
                ))}
              </div>
            )}

            {/* ================= BOTTOM SEO EXPLANATORY SECTION ================= */}
            <div className="mt-10 p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs text-slate-600 leading-relaxed w-full max-w-full min-w-0 break-words">
              <h2 className="text-sm font-bold text-slate-900">
                Online Mock Test Series Directory for All India Government & Competitive Exams
              </h2>
              <p>
                EducationMasters provides premier exam management and mock test directories designed to replicate actual examination patterns for Banking (SBI PO/Clerk, IBPS, RBI), SSC (CGL, CHSL, MTS, CPO), Railway Recruitment Boards (RRB NTPC, Group D, ALP), Teaching (CTET, UTET, State TET), Civil Services (UPSC, State PCS), Defence (Police, NDA, CDS), and Engineering Recruitments.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200 text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="text-sky-600 font-bold text-base leading-none">✓</span>
                  <div>
                    <strong className="text-slate-800">Authentic Interface:</strong> Identical exam screen timer, question palette, and section navigation as actual exam boards.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-base leading-none">✓</span>
                  <div>
                    <strong className="text-slate-800">Free Practice Papers:</strong> Every exam directory contains free practice mock tests with bilingual detailed solutions.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold text-base leading-none">✓</span>
                  <div>
                    <strong className="text-slate-800">All India Rank:</strong> Compare percentiles, accuracy rates, and time-management analytics with thousands of aspirants nationwide.
                  </div>
                </div>
              </div>
            </div>

          </section>

        </div>

      </main>

      <Footer />
    </div>
  );
}
