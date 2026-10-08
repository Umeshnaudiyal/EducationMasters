'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronLeft,
  Search,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Layers,
  Award,
  Clock,
  ExternalLink,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Base Categories for Filtering
const CATEGORY_TABS = [
  { id: 'all', name: 'All Mock Tests' },
  { id: 'ssc', name: 'SSC Exams' },
  { id: 'banking', name: 'Banking Exams' },
  { id: 'teaching', name: 'Teaching Exams' },
  { id: 'civil-services', name: 'Civil Services Exam' },
  { id: 'railways', name: 'Railways Exams' },
  { id: 'engineering', name: 'Engineering Recruitment Exams' },
  { id: 'defence', name: 'Defence Exams' },
];

// Helper to determine best matching emblem for a created series
function getSeriesEmblem(series) {
  if (series.image) return series.image;

  const text = `${series.title || ''} ${series.examination_name || ''} ${series.category_name || ''} ${series.slug || ''}`.toLowerCase();

  if (text.includes('ssc')) return '/exam-icons/ssc.svg';
  if (text.includes('bank') || text.includes('ibps') || text.includes('sbi') || text.includes('rbi') || text.includes('lic') || text.includes('nabard')) {
    return '/exam-icons/bank.svg';
  }
  if (text.includes('rail') || text.includes('rrb') || text.includes('rpf') || text.includes('group d') || text.includes('ntpc')) {
    return '/exam-icons/railway.svg';
  }
  if (text.includes('upsc') || text.includes('ias') || text.includes('ips') || text.includes('civil') || text.includes('pcs') || text.includes('bpsc') || text.includes('mppsc') || text.includes('rpsc')) {
    return '/exam-icons/upsc.svg';
  }
  if (text.includes('teach') || text.includes('tet') || text.includes('net') || text.includes('ctet') || text.includes('dsssb') || text.includes('kvs') || text.includes('nvs') || text.includes('reet')) {
    return '/exam-icons/teaching.svg';
  }
  if (text.includes('gate') || text.includes('eng') || text.includes('drdo') || text.includes('isro') || text.includes('ese') || text.includes('ies') || text.includes('ae') || text.includes('je')) {
    return '/exam-icons/engineering.svg';
  }
  if (text.includes('def') || text.includes('afcat') || text.includes('navy') || text.includes('air force') || text.includes('agniveer') || text.includes('police') || text.includes('cisf') || text.includes('nda') || text.includes('cds')) {
    return '/exam-icons/defence.svg';
  }
  if (text.includes('ib') || text.includes('security assistant') || text.includes('intelligence')) {
    return '/exam-icons/ib.svg';
  }

  // Default fallback emblem
  return '/exam-icons/ssc.svg';
}

export default function MockTestsClient({ initialSeries = [] }) {
  const router = useRouter();
  const [seriesList, setSeriesList] = useState(initialSeries);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const tabsScrollRef = useRef(null);

  // Re-fetch series client-side to ensure real-time updates when new series are created
  useEffect(() => {
    let isMounted = true;
    async function fetchLatestSeries() {
      try {
        const res = await fetch('/apis/v1/mock-test-series?status=published&limit=100');
        const data = await res.json();
        if (data.success && isMounted && Array.isArray(data.data)) {
          setSeriesList(data.data);
        }
      } catch (err) {
        console.error('Error fetching client mock series:', err);
      }
    }
    fetchLatestSeries();
    return () => {
      isMounted = false;
    };
  }, []);

  // Scroll category tabs left/right
  const scrollTabs = (direction) => {
    if (tabsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      tabsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Build dynamic category list incorporating any unique categories created in admin
  const dynamicCategories = useMemo(() => {
    const categoriesMap = new Map();
    CATEGORY_TABS.forEach((cat) => categoriesMap.set(cat.id, cat));

    // Add any unique custom category from created series
    seriesList.forEach((s) => {
      if (s.category_name && s.category_name.trim()) {
        const catId = s.category_name.toLowerCase().replace(/\s+/g, '-');
        if (!categoriesMap.has(catId)) {
          categoriesMap.set(catId, {
            id: catId,
            name: `${s.category_name} Tests`,
          });
        }
      }
    });

    return Array.from(categoriesMap.values());
  }, [seriesList]);

  // Filter created mock tests/series based on category and search query
  const filteredSeries = useMemo(() => {
    return seriesList.filter((s) => {
      const textToSearch = `${s.title || ''} ${s.slug || ''} ${s.examination_name || ''} ${s.category_name || ''} ${s.badge || ''}`.toLowerCase();

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (!textToSearch.includes(q)) return false;
      }

      // Category Tab Filter
      if (selectedCategory === 'all') return true;

      const catKeyword = selectedCategory.replace(/-/g, ' ').toLowerCase();
      if (textToSearch.includes(catKeyword)) return true;

      if (selectedCategory === 'ssc' && textToSearch.includes('ssc')) return true;
      if (selectedCategory === 'banking' && (textToSearch.includes('bank') || textToSearch.includes('ibps') || textToSearch.includes('sbi') || textToSearch.includes('rbi'))) return true;
      if (selectedCategory === 'railways' && (textToSearch.includes('rail') || textToSearch.includes('rrb') || textToSearch.includes('rpf') || textToSearch.includes('ntpc'))) return true;
      if (selectedCategory === 'civil-services' && (textToSearch.includes('upsc') || textToSearch.includes('civil') || textToSearch.includes('ias') || textToSearch.includes('pcs'))) return true;
      if (selectedCategory === 'teaching' && (textToSearch.includes('teach') || textToSearch.includes('tet') || textToSearch.includes('net') || textToSearch.includes('ctet'))) return true;
      if (selectedCategory === 'engineering' && (textToSearch.includes('gate') || textToSearch.includes('eng') || textToSearch.includes('isro') || textToSearch.includes('drdo'))) return true;
      if (selectedCategory === 'defence' && (textToSearch.includes('def') || textToSearch.includes('navy') || textToSearch.includes('air force') || textToSearch.includes('police'))) return true;

      return false;
    });
  }, [seriesList, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col font-sans">
      <Header />

      <main className="flex-1 pb-20">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10">

          {/* ========================================================================= */}
          {/* 1. MOCK TESTS HEADER */}
          {/* ========================================================================= */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
                Mock Tests
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-500 font-normal">
                Get exam-ready with full-length mock tests, practice questions and study notes as per the latest pattern
              </p>
            </div>

            {/* Quick Search Bar */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Search mock tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00c5d2] transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. CATEGORY PILL TABS CAROUSEL */}
          {/* ========================================================================= */}
          <div className="relative flex items-center mb-8">
            {/* Scroll Left Button */}
            <button
              onClick={() => scrollTabs('left')}
              className="hidden sm:flex absolute -left-4 z-10 w-7 h-7 rounded-full bg-white shadow-sm border border-slate-200 items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Horizontal Tabs Container */}
            <div
              ref={tabsScrollRef}
              className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1 w-full scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {dynamicCategories.map((cat) => {
                const isActive = selectedCategory === cat.id && !searchQuery;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSearchQuery('');
                    }}
                    className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] whitespace-nowrap transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#00c5d2] text-white font-medium shadow-2xs'
                        : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-800 font-normal'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Scroll Right Button */}
            <button
              onClick={() => scrollTabs('right')}
              className="flex shrink-0 ml-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/80 items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer z-10"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 3. DYNAMIC CREATED MOCK TESTS GRID (3-COLUMN TESTBOOK STYLE) */}
          {/* ========================================================================= */}
          {filteredSeries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredSeries.map((series) => {
                const emblemSrc = getSeriesEmblem(series);
                const freeTests = series.free_tests_count || 0;
                const totalTests = series.total_tests || (series.tests ? series.tests.length : 0);

                return (
                  <div
                    key={series._id || series.slug}
                    onClick={() => router.push(`/mock-test/${series.slug}`)}
                    className="bg-white rounded-xl border border-slate-200 hover:border-sky-400 hover:shadow-xs transition-all duration-150 px-4 py-3 sm:py-3.5 flex items-center justify-between group cursor-pointer min-h-[62px]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Authentic Exam / Category Emblem */}
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                        <img
                          src={emblemSrc}
                          alt={series.title}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.src = '/exam-icons/ssc.svg';
                          }}
                        />
                      </div>

                      {/* Mock Test Series Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-xs sm:text-[13px] tracking-tight group-hover:text-sky-600 transition-colors truncate">
                            {series.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>
                            {totalTests > 0 ? `${totalTests} Tests` : 'Practice Series'}
                          </span>
                          {freeTests > 0 && (
                            <span className="text-emerald-600 font-semibold">
                              • {freeTests} Free
                            </span>
                          )}
                          {series.category_name && (
                            <span className="text-slate-400 truncate max-w-[120px]">
                              • {series.category_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Arrow Chevron */}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </div>
                );
              })}

              {/* "Explore all mock tests" Link Card */}
              <div
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all duration-150 px-4 py-3 sm:py-3.5 flex items-center justify-center group cursor-pointer min-h-[62px] text-center"
              >
                <span className="font-medium text-[#00a8cc] hover:text-[#0092b3] text-xs sm:text-[13px]">
                  Explore all mock tests
                </span>
              </div>
            </div>
          ) : (
            /* Empty State if No Created Series Matches Filter */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <BookOpen size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  No mock tests found in this category
                </h3>
                <p className="text-xs text-slate-500">
                  Try selecting &quot;All Mock Tests&quot; or clearing your search filter.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-5 py-2 bg-[#00c5d2] hover:bg-[#00b0bd] text-white text-xs font-semibold rounded-full shadow-xs transition cursor-pointer"
              >
                View All Mock Tests ({seriesList.length})
              </button>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
