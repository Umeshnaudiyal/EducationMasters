'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Sparkles,
  Flame,
  ArrowRight,
  ExternalLink,
  Clock,
  Filter,
} from 'lucide-react';
import {
  AnimatedRadio,
  AnimatedBell,
  AnimatedBriefcase,
  AnimatedFileText,
  AnimatedAward,
  AnimatedZap,
  AnimatedRefresh,
  AnimatedMockTest,
  AnimatedChevronRight,
  AnimatedSparkles,
} from './AnimatedIcons';
import { useStickyNotes } from '@/context/StickyNotesContext';

const API_BASE = typeof window !== 'undefined'
  ? '/apis/v1'
  : (process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/apis/v1` : 'http://localhost:5001/apis/v1');

const DEFAULT_TICKER_ITEMS = [
  {
    id: 'def-1',
    type: 'admit-card',
    tag: 'Admit Card',
    tagStyle: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    badgeText: 'Call Letter',
    text: 'UPSC IAS Prelims official admit card released - download now',
    subtitle: 'Direct admit card download portal active',
    href: '/admit-cards',
    timeAgo: 'Just now',
  },
  {
    id: 'def-2',
    type: 'result',
    tag: 'Result',
    tagStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'Merit List',
    text: 'SBI PO 2026 Mains result & merit list uploaded',
    subtitle: 'Cut-off scores and scorecard published',
    href: '/results',
    timeAgo: '12m ago',
  },
  {
    id: 'def-3',
    type: 'job',
    tag: 'Job',
    tagStyle: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeText: 'Recruitment',
    text: 'Railway RRB NTPC CBT-2 exam dates & recruitment notification',
    subtitle: 'Online application & exam schedule released',
    href: '/jobs',
    timeAgo: '25m ago',
  },
  {
    id: 'def-4',
    type: 'mock-test',
    tag: 'Mock Test',
    tagStyle: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeText: 'Test Series',
    text: 'New 30 MCQs added for General Knowledge & Current Affairs',
    subtitle: 'Full-length simulated test series available',
    href: '/mock-tests',
    timeAgo: '1h ago',
  },
];

export default function LiveTicker() {
  const { openDrawer, unreadCount } = useStickyNotes();
  const [tickerItems, setTickerItems] = useState(DEFAULT_TICKER_ITEMS);
  const [allUpdates, setAllUpdates] = useState(DEFAULT_TICKER_ITEMS);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Real-Time');

  const closeTimerRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch dynamic updates across jobs, admit-cards, results, and mock-tests
  const fetchDynamicUpdates = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [admitRes, resultRes, jobRes, seriesRes] = await Promise.allSettled([
        fetch(`${API_BASE}/admit-cards?limit=8&status=publish`).then((r) => r.json()),
        fetch(`${API_BASE}/results?limit=8&status=publish`).then((r) => r.json()),
        fetch(`${API_BASE}/jobs?limit=8&status=publish`).then((r) => r.json()),
        fetch(`${API_BASE}/mock-test-series?limit=6`).then((r) => r.json()),
      ]);

      const admitCards =
        admitRes.status === 'fulfilled' && admitRes.value?.success && Array.isArray(admitRes.value?.data)
          ? admitRes.value.data
          : [];

      const results =
        resultRes.status === 'fulfilled' && resultRes.value?.success && Array.isArray(resultRes.value?.data)
          ? resultRes.value.data
          : [];

      const jobs =
        jobRes.status === 'fulfilled' && jobRes.value?.success && Array.isArray(jobRes.value?.data)
          ? jobRes.value.data
          : [];

      const seriesList =
        seriesRes.status === 'fulfilled' && seriesRes.value?.success && Array.isArray(seriesRes.value?.data)
          ? seriesRes.value.data
          : [];

      const combined = [];
      const interleaved = [];
      const maxLen = Math.max(admitCards.length, results.length, jobs.length, seriesList.length);

      // Map individual categories
      admitCards.forEach((item) => {
        combined.push({
          id: `admit-${item._id || item.slug}`,
          type: 'admit-card',
          tag: 'Admit Card',
          tagStyle: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          badgeText: item.exam_mode || 'Exam Notice',
          text: item.title,
          subtitle: item.dept || item.department?.name || 'Official Examination Board',
          href: `/admit-card/${item.slug || item._id}`,
          date: item.createdAt || item.exam_date,
          timeAgo: 'Recent',
        });
      });

      results.forEach((item) => {
        combined.push({
          id: `result-${item._id || item.slug}`,
          type: 'result',
          tag: 'Result',
          tagStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          badgeText: item.result_status || 'Scorecard',
          text: item.title,
          subtitle: item.dept || item.department?.name || 'Merit List Declared',
          href: `/result/${item.slug || item._id}`,
          date: item.createdAt || item.result_date,
          timeAgo: 'Recent',
        });
      });

      jobs.forEach((item) => {
        combined.push({
          id: `job-${item._id || item.slug}`,
          type: 'job',
          tag: 'Govt Job',
          tagStyle: 'bg-blue-50 text-blue-700 border-blue-200',
          badgeText: item.total_posts ? `${item.total_posts} Vacancies` : 'Recruitment',
          text: item.title,
          subtitle: item.dept || item.department?.name || 'Application Active',
          href: `/job/${item.slug || item._id}`,
          date: item.createdAt || item.app_ends,
          timeAgo: 'Recent',
        });
      });

      seriesList.forEach((item) => {
        combined.push({
          id: `series-${item._id || item.slug}`,
          type: 'mock-test',
          tag: 'Mock Test',
          tagStyle: 'bg-purple-50 text-purple-700 border-purple-200',
          badgeText: item.isFree ? 'Free Pass' : 'Test Series',
          text: item.title,
          subtitle: `${item.totalTests || item.tests?.length || 0}+ Tests Available`,
          href: `/mock-test/${item.slug || item._id}`,
          date: item.createdAt,
          timeAgo: 'Updated',
        });
      });

      // Build interleaved ticker track
      for (let i = 0; i < maxLen; i++) {
        if (admitCards[i]) {
          interleaved.push({
            id: `ticker-admit-${admitCards[i]._id || i}`,
            tag: 'Admit Card',
            tagStyle: 'bg-cyan-50 text-cyan-700 border-cyan-200',
            text: admitCards[i].title,
            href: `/admit-card/${admitCards[i].slug || admitCards[i]._id}`,
          });
        }
        if (results[i]) {
          interleaved.push({
            id: `ticker-res-${results[i]._id || i}`,
            tag: 'Result',
            tagStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            text: results[i].title,
            href: `/result/${results[i].slug || results[i]._id}`,
          });
        }
        if (jobs[i]) {
          interleaved.push({
            id: `ticker-job-${jobs[i]._id || i}`,
            tag: 'Job',
            tagStyle: 'bg-blue-50 text-blue-700 border-blue-200',
            text: jobs[i].title,
            href: `/job/${jobs[i].slug || jobs[i]._id}`,
          });
        }
      }

      if (combined.length > 0) {
        setAllUpdates(combined);
      }
      if (interleaved.length > 0) {
        setTickerItems(interleaved);
      }
      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } catch (err) {
      console.error('Error fetching live updates:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDynamicUpdates();
  }, [fetchDynamicUpdates]);

  // Helper to detect if device has genuine hover capability (desktop mouse vs mobile touch)
  const isHoverCapable = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Handle Mouse Hover with Graceful Close Debounce (Desktop Pointer Only)
  const handleMouseEnter = () => {
    if (!isHoverCapable()) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isHoverCapable()) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 280);
  };

  // Close popup on Click/Touch Outside or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filter updates based on active category tab & search query
  const filteredUpdates = useMemo(() => {
    return allUpdates.filter((item) => {
      const matchesTab = activeTab === 'all' || item.type === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.text.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.tag.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [allUpdates, activeTab, searchQuery]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    return {
      all: allUpdates.length,
      job: allUpdates.filter((i) => i.type === 'job').length,
      'admit-card': allUpdates.filter((i) => i.type === 'admit-card').length,
      result: allUpdates.filter((i) => i.type === 'result').length,
      'mock-test': allUpdates.filter((i) => i.type === 'mock-test').length,
    };
  }, [allUpdates]);

  // Duplicate items for continuous marquee loop
  const displayTickerItems = tickerItems.length > 0 ? tickerItems.concat(tickerItems) : [];

  // Compute dynamic duration so marquee maintains a uniform, steady reading pace regardless of item count
  const animationDuration = useMemo(() => {
    const count = tickerItems.length || 4;
    // 4.2 seconds per unique item gives an ideal constant speed of ~50px/sec
    return Math.max(18, count * 4.2);
  }, [tickerItems.length]);

  return (
    <div
      ref={containerRef}
      className={`relative border-b border-slate-200/90 bg-white text-slate-800 select-none transition-all ${
        isOpen ? 'z-50' : 'z-30'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-3 px-2 sm:px-6 lg:px-8">
        {/* Live Updates Interactive Trigger Button */}
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group relative flex shrink-0 items-center gap-1 sm:gap-1.5 border-r border-slate-200 py-2.5 pr-2 sm:pr-4 cursor-pointer transition-all duration-200 ${isOpen ? 'bg-rose-50/60 text-rose-600' : 'hover:bg-slate-50'
            }`}
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          title="Hover or click to view live updates radar"
        >
          {/* Pulsing Live Radar Animated Icon */}
          <span className="relative flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-2 ring-rose-100 transition-transform duration-300 group-hover:scale-110">
            <span className="live-ping absolute h-3 w-3 rounded-full bg-rose-400 opacity-75" />
            <AnimatedRadio size={13} className="relative text-rose-600" />
          </span>

          <div className="flex items-center gap-1">
            <span className="hidden text-xs font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-rose-600 sm:inline">
              Live Updates
            </span>
            <span className="text-[11px] font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-rose-600 sm:hidden">
              Live
            </span>

            <ChevronDown
              size={12}
              className={`text-slate-400 transition-transform duration-200 group-hover:text-rose-600 ${isOpen ? 'rotate-180 text-rose-600' : ''
                }`}
            />
          </div>
        </div>

        {/* Continuous Marquee Ticker Track */}
        <div className="ticker-mask flex-1 overflow-hidden py-2.5 min-w-0">
          <div
            className="ticker-track flex w-max items-center gap-7 whitespace-nowrap"
            style={{ animationDuration: `${animationDuration}s` }}
          >
            {displayTickerItems.map((item, index) => (
              <Link
                key={`${item.href}-${index}`}
                href={item.href || '#'}
                className="group flex items-center gap-2 text-xs font-semibold text-slate-600 transition-colors hover:text-[#0b66c3]"
              >
                <span
                  className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold transition-all group-hover:shadow-xs ${item.tagStyle}`}
                >
                  {item.tag}
                </span>
                <span className="line-clamp-1">{item.text}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#0b66c3]" />
              </Link>
            ))}
          </div>
        </div>

        {/* Verified Notices / Sticky Notes Quick Trigger (Visible on all devices including mobile!) */}
        <div
          onClick={() => {
            setIsOpen(false);
            openDrawer();
          }}
          className="group flex shrink-0 items-center gap-1.5 border-l border-slate-200 py-2.5 pl-2 sm:pl-3.5 pr-0.5 sm:pr-0 text-xs font-bold text-slate-600 hover:text-[#0b66c3] cursor-pointer transition-colors"
          title="Click to view official sticky notes & verified directives"
        >
          <span className="relative flex h-6 w-6 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
            <AnimatedBell size={15} className="text-[#0b66c3]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[8.5px] font-black text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </span>
          <span className="hidden md:inline">Notices</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PROFESSIONAL LIVE UPDATES POPUP PANEL (Closes on Hover Out / Mouse Leave) */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="animate-popup-enter absolute left-2 sm:left-4 lg:left-6 top-full mt-1.5 w-[calc(100vw-20px)] sm:w-[460px] md:w-[490px] max-w-[500px] rounded-xl border border-slate-200/90 bg-white/95 shadow-xl backdrop-blur-xl ring-1 ring-black/5 z-50 overflow-hidden text-slate-800"
          style={{ maxHeight: 'calc(100vh - 130px)' }}
        >
          {/* Subtle Accent Glow Bar on Top */}
          <div className="h-0.5 w-full bg-gradient-to-r from-rose-500 via-blue-600 to-indigo-600" />

          {/* 1. Header with Live Status, Refresh, and Close */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3.5 py-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-2xs">
                <AnimatedRadio size={13} />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-[13px] font-black text-slate-900 leading-none">
                    Live Education & Exam Radar
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                    <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" />
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-none">
                  Instant verified government notifications & test updates ({lastUpdated})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Refresh Button */}
              <button
                type="button"
                onClick={fetchDynamicUpdates}
                disabled={isRefreshing}
                className="group flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-[#0b66c3] hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                title="Refresh live updates feed"
              >
                <AnimatedRefresh
                  size={12}
                  className={isRefreshing ? 'animate-spin text-[#0b66c3]' : ''}
                />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                title="Close popup"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* 2. Instant Search Input */}
          <div className="border-b border-slate-100 bg-white px-3.5 py-1.5">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search live exams, recruitments, results..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1 pl-8 pr-7 text-xs font-medium text-slate-800 placeholder-slate-400 transition-all focus:border-[#0b66c3] focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[#0b66c3]/15"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* 3. Filter Tabs with Animated Icons */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50/50 px-3.5 py-1.5 no-scrollbar">
            {/* All Updates Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`group flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <AnimatedZap
                size={11.5}
                className={activeTab === 'all' ? 'text-amber-400' : 'text-slate-400'}
              />
              <span>All Feeds</span>
              <span
                className={`rounded-full px-1 py-0.1 text-[9px] font-bold ${
                  activeTab === 'all'
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tabCounts.all}
              </span>
            </button>

            {/* Govt Jobs Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('job')}
              className={`group flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'job'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <AnimatedBriefcase
                size={11.5}
                className={activeTab === 'job' ? 'text-white' : 'text-blue-500'}
              />
              <span>Govt Jobs</span>
              {tabCounts.job > 0 && (
                <span
                  className={`rounded-full px-1 py-0.1 text-[9px] font-bold ${
                    activeTab === 'job'
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {tabCounts.job}
                </span>
              )}
            </button>

            {/* Admit Cards Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('admit-card')}
              className={`group flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'admit-card'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <AnimatedFileText
                size={11.5}
                className={activeTab === 'admit-card' ? 'text-white' : 'text-cyan-600'}
              />
              <span>Admit Cards</span>
              {tabCounts['admit-card'] > 0 && (
                <span
                  className={`rounded-full px-1 py-0.1 text-[9px] font-bold ${
                    activeTab === 'admit-card'
                      ? 'bg-cyan-700 text-white'
                      : 'bg-cyan-50 text-cyan-700'
                  }`}
                >
                  {tabCounts['admit-card']}
                </span>
              )}
            </button>

            {/* Results Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('result')}
              className={`group flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'result'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <AnimatedAward
                size={11.5}
                className={activeTab === 'result' ? 'text-white' : 'text-emerald-600'}
              />
              <span>Results</span>
              {tabCounts.result > 0 && (
                <span
                  className={`rounded-full px-1 py-0.1 text-[9px] font-bold ${
                    activeTab === 'result'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {tabCounts.result}
                </span>
              )}
            </button>

            {/* Mock Tests Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('mock-test')}
              className={`group flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'mock-test'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <AnimatedMockTest
                size={11.5}
                className={activeTab === 'mock-test' ? 'text-white' : 'text-purple-600'}
              />
              <span>Mock Tests</span>
              {tabCounts['mock-test'] > 0 && (
                <span
                  className={`rounded-full px-1 py-0.1 text-[9px] font-bold ${
                    activeTab === 'mock-test'
                      ? 'bg-purple-700 text-white'
                      : 'bg-purple-50 text-purple-700'
                  }`}
                >
                  {tabCounts['mock-test']}
                </span>
              )}
            </button>
          </div>

          {/* 4. Updates Feed List (Scrollable with custom slim scrollbar) */}
          <div className="custom-scrollbar max-h-[250px] overflow-y-auto p-2 sm:p-2.5 space-y-1.5">
            {filteredUpdates.length === 0 ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Search size={15} />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  No live updates found matching &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Try searching for general keywords or choose another category tab
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTab('all');
                  }}
                  className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              filteredUpdates.map((item) => (
                <Link
                  key={item.id}
                  href={item.href || '#'}
                  onClick={() => setIsOpen(false)}
                  className="group relative flex items-center justify-between gap-2.5 rounded-lg border border-slate-200/80 bg-white p-2 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Category Icon */}
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-transform duration-300 group-hover:scale-105 ${
                        item.type === 'admit-card'
                          ? 'bg-cyan-50 border-cyan-200 text-cyan-600'
                          : item.type === 'result'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : item.type === 'job'
                              ? 'bg-blue-50 border-blue-200 text-blue-600'
                              : 'bg-purple-50 border-purple-200 text-purple-600'
                      }`}
                    >
                      {item.type === 'admit-card' ? (
                        <AnimatedFileText size={14} />
                      ) : item.type === 'result' ? (
                        <AnimatedAward size={14} />
                      ) : item.type === 'job' ? (
                        <AnimatedBriefcase size={14} />
                      ) : (
                        <AnimatedMockTest size={14} />
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`rounded border px-1 py-0.1 text-[8.5px] font-bold uppercase tracking-wider ${item.tagStyle}`}
                        >
                          {item.tag}
                        </span>
                        {item.badgeText && (
                          <span className="rounded bg-slate-100 px-1 py-0.1 text-[8.5px] font-semibold text-slate-600">
                            {item.badgeText}
                          </span>
                        )}
                        <span className="text-[9.5px] font-medium text-slate-400">
                          {item.timeAgo}
                        </span>
                      </div>

                      <h4 className="mt-0.5 text-[11.5px] font-bold text-slate-800 line-clamp-1 transition-colors group-hover:text-[#0b66c3]">
                        {item.text}
                      </h4>

                      {item.subtitle && (
                        <p className="text-[10px] font-medium text-slate-500 line-clamp-1">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Micro CTA Button */}
                  <div className="shrink-0 flex items-center justify-center self-center pl-0.5">
                    <span className="flex h-5.5 w-5.5 items-center justify-center rounded-md bg-slate-100 text-slate-400 group-hover:bg-[#0b66c3] group-hover:text-white transition-all shadow-2xs">
                      <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* 5. Footer Quick Shortcuts & Verification Notice */}
          <div className="border-t border-slate-100 bg-slate-50/80 px-3.5 py-1.5 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500">
                Quick Portals:
              </span>
              <Link
                href="/jobs"
                onClick={() => setIsOpen(false)}
                className="text-[10.5px] font-bold text-[#0b66c3] hover:underline"
              >
                Govt Jobs
              </Link>
              <span className="text-slate-300">•</span>
              <Link
                href="/admit-cards"
                onClick={() => setIsOpen(false)}
                className="text-[10.5px] font-bold text-[#0b66c3] hover:underline"
              >
                Admit Cards
              </Link>
              <span className="text-slate-300">•</span>
              <Link
                href="/results"
                onClick={() => setIsOpen(false)}
                className="text-[10.5px] font-bold text-[#0b66c3] hover:underline"
              >
                Results
              </Link>
              <span className="text-slate-300">•</span>
              <Link
                href="/mock-tests"
                onClick={() => setIsOpen(false)}
                className="text-[10.5px] font-bold text-[#0b66c3] hover:underline"
              >
                Mock Tests
              </Link>
            </div>

            <div className="flex items-center gap-1 text-[9.5px] font-semibold text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>100% Verified Notices</span>
            </div>
          </div>
        </div>
      )}

      {/* Styles for Infinite Marquee, Popups, and Scrollbars */}
      <style>{`
        .ticker-track {
          animation-name: ticker-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .ticker-mask:hover .ticker-track {
          animation-play-state: paused;
        }
        .ticker-mask {
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0,
            black 24px,
            black calc(100% - 24px),
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0,
            black 24px,
            black calc(100% - 24px),
            transparent 100%
          );
        }
        .live-ping {
          animation: live-ping-pulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ticker-scroll {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes live-ping-pulse {
          0% { transform: scale(1); opacity: 0.75; }
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes popup-enter {
          0% {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-popup-enter {
          animation: popup-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track { animation: none; }
          .live-ping { animation: none; }
          .animate-popup-enter { animation: none; }
        }
      `}</style>
    </div>
  );
}
