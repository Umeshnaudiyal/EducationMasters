'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ChevronRight,
  ChevronLeft,
  Share2,
  Clock,
  BookOpen,
  Award,
  Zap,
  CheckCircle2,
  Lock,
  Play,
  Globe,
  Users,
  Layers,
  Sparkles,
  Check,
  ChevronDown,
  ShieldCheck,
  Phone,
  Trophy,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LeaderboardView from '@/components/mock-test/LeaderboardView';
import UnlockPassModal from '@/components/mock-test/UnlockPassModal';
import { BACKEND_URL } from '@/utils/api';

// Helper to determine best matching emblem for the series
function getSeriesEmblem(series) {
  if (series.image) return series.image;
  const text = `${series.title || ''} ${series.examination_name || ''} ${series.category_name || ''} ${series.slug || ''}`.toLowerCase();

  if (text.includes('ssc')) return '/exam-icons/ssc.svg';
  if (text.includes('bank') || text.includes('ibps') || text.includes('sbi') || text.includes('rbi')) return '/exam-icons/bank.svg';
  if (text.includes('rail') || text.includes('rrb') || text.includes('rpf')) return '/exam-icons/railway.svg';
  if (text.includes('upsc') || text.includes('ias') || text.includes('civil') || text.includes('pcs')) return '/exam-icons/upsc.svg';
  if (text.includes('teach') || text.includes('tet') || text.includes('net') || text.includes('ctet')) return '/exam-icons/teaching.svg';
  if (text.includes('gate') || text.includes('eng') || text.includes('isro') || text.includes('drdo')) return '/exam-icons/engineering.svg';
  if (text.includes('def') || text.includes('afcat') || text.includes('navy') || text.includes('air force') || text.includes('police')) return '/exam-icons/defence.svg';
  if (text.includes('ib') || text.includes('security')) return '/exam-icons/ib.svg';

  return '/exam-icons/ssc.svg';
}

// Helper to format dynamic participant/user counts (e.g. 1 -> 1, 1250 -> 1.3k, 1000000 -> 1M)
function formatUserCount(num) {
  const n = Number(num) || 0;
  if (n <= 0) return '0';
  if (n < 1000) return `${n.toLocaleString()}`;
  if (n < 1000000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `${(n / 1000000).toFixed(1)}M`;
}

export default function SingleSeriesClient({ series, allSeries = [] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeMainTab, setActiveMainTab] = useState('mock-tests'); // 'mock-tests' | 'pyps' | 'leaderboard'
  const [selectedSubTab, setSelectedSubTab] = useState('all');
  const [selectedStage, setSelectedStage] = useState('All');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [userAttemptsMap, setUserAttemptsMap] = useState({});
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [modalTargetTest, setModalTargetTest] = useState(null);
  const [userHasActivePass, setUserHasActivePass] = useState(false);
  const subTabsScrollRef = useRef(null);
  const userRole = (session?.user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const hasSubscription = Boolean(
    (session?.user?.subscription?.isActive &&
      session?.user?.subscription?.plan &&
      session?.user?.subscription?.plan !== 'free') ||
      userHasActivePass
  );

  const tests = series.tests || [];
  const freeTests = tests.filter((t) => !t.is_paid || t.is_free);
  const plans = Array.isArray(series.plans) && series.plans.length > 0 ? series.plans : [];
  const emblemSrc = getSeriesEmblem(series);

  // Check real-time pass status for user
  useEffect(() => {
    const checkPassStatus = async () => {
      const userEmail = session?.user?.email;
      const userId = session?.user?.id || session?.user?._id;
      if (!userEmail && !userId) return;

      try {
        const res = await fetch(
          `${BACKEND_URL}/apis/v1/payments/user-status?email=${encodeURIComponent(userEmail || '')}&userId=${userId || ''}`
        );
        const data = await res.json();
        if (data.success && data.data?.hasPass) {
          setUserHasActivePass(true);
        }
      } catch (e) {
        console.error('Pass status error:', e);
      }
    };
    checkPassStatus();
  }, [session]);

  const handleOpenUnlockPass = (test = null) => {
    setModalTargetTest(test);
    setIsPassModalOpen(true);
  };

  // Fetch logged in user's test attempts for this series to display "Attempted" status
  useEffect(() => {
    const fetchUserAttempts = async () => {
      const userEmail = session?.user?.email;
      const userId = session?.user?.id || session?.user?._id;
      if (!userEmail && !userId) return;

      try {
        setLoadingAttempts(true);
        const params = new URLSearchParams();
        if (userEmail) params.append('email', userEmail);
        if (userId) params.append('userId', userId);
        if (series._id) params.append('series', series._id);

        const res = await fetch(`${BACKEND_URL}/apis/v1/mock-tests/user/attempts?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.data?.attemptMap) {
          setUserAttemptsMap(data.data.attemptMap);
        }
      } catch (err) {
        console.error('Fetch user attempts error:', err);
      } finally {
        setLoadingAttempts(false);
      }
    };

    fetchUserAttempts();
  }, [session, series._id]);

  // Filter other test series for the sidebar
  const moreTestSeries = useMemo(() => {
    return allSeries.filter((s) => s.slug !== series.slug).slice(0, 6);
  }, [allSeries, series.slug]);

  // Dynamic Sub-Tabs calculation from tests
  const subTabs = useMemo(() => {
    const tabs = [{ id: 'all', name: `All Tests (${tests.length})` }];

    if (freeTests.length > 0) {
      tabs.push({ id: 'free', name: `Free Practice (${freeTests.length})` });
    }

    const fullLength = tests.filter((t) => t.test_type === 'full_length');
    if (fullLength.length > 0) {
      tabs.push({ id: 'full_length', name: `Full Test (${fullLength.length})` });
    }

    const sectional = tests.filter((t) => t.test_type === 'sectional');
    if (sectional.length > 0) {
      tabs.push({ id: 'sectional', name: `Sectional Tests (${sectional.length})` });
    }

    const chapter = tests.filter((t) => t.test_type === 'chapter');
    if (chapter.length > 0) {
      tabs.push({ id: 'chapter', name: `Subject / Chapter (${chapter.length})` });
    }

    const previousYear = tests.filter((t) => t.test_type === 'previous_year');
    if (previousYear.length > 0) {
      tabs.push({ id: 'previous_year', name: `PYP Tests (${previousYear.length})` });
    }

    return tabs;
  }, [tests, freeTests]);

  // Filtered Tests based on active tabs & stage
  const filteredTests = useMemo(() => {
    let list = tests;

    if (activeMainTab === 'pyps') {
      list = list.filter((t) => t.test_type === 'previous_year');
    }

    if (selectedSubTab === 'free') {
      list = list.filter((t) => !t.is_paid || t.is_free);
    } else if (selectedSubTab !== 'all') {
      list = list.filter((t) => t.test_type === selectedSubTab);
    }

    if (selectedStage !== 'All') {
      list = list.filter((t) => t.title?.toLowerCase().includes(selectedStage.toLowerCase()));
    }

    return list;
  }, [tests, activeMainTab, selectedSubTab, selectedStage]);

  // Scroll Sub-Tabs
  const scrollSubTabs = (direction) => {
    if (subTabsScrollRef.current) {
      const amount = direction === 'left' ? -200 : 200;
      subTabsScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Share link handler
  const handleShare = (customText) => {
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        navigator.share({
          title: series.title,
          text: customText || `Practice ${series.title} online on Education Masters`,
          url: window.location.href,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    }
  };

  // Quick signup / start free test trigger
  const handleQuickSignup = (e) => {
    e.preventDefault();
    if (freeTests.length > 0) {
      router.push(`/mock-test/${series.slug}/${freeTests[0].slug}`);
    } else if (tests.length > 0) {
      router.push(`/mock-test/${series.slug}/${tests[0].slug}`);
    } else {
      const el = document.getElementById('plans-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Default highlights fallback if none specified in DB
  const displayHighlights = Array.isArray(series.highlights) && series.highlights.length > 0
    ? series.highlights
    : [
        '5 Exam Day Special Full Tests',
        '20 Most Saved Qs Subject Tests',
        '6 Live All-India Tests',
        '60 Days Smart Study Plan',
        'New Exam Pattern & Detailed Solutions',
        'Real-Time Percentile & Performance Analytics',
      ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">
      <Header />

      <main className="flex-1 pb-24">
        {/* ========================================================================= */}
        {/* 1. TOP HERO SECTION (FAITHFUL TO TESTBOOK REFERENCE SCREENSHOT) */}
        {/* ========================================================================= */}
        <section className="bg-[#f0f6fa] border-b border-slate-200/80 pt-5 pb-8 px-4 sm:px-6">
          <div className="max-w-[1180px] mx-auto space-y-4">

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-normal">
              <Link href="/" className="hover:text-slate-900 transition-colors">
                Home
              </Link>
              <span>&gt;</span>
              <Link href="/mock-tests" className="hover:text-slate-900 transition-colors">
                {series.category_name || series.examination_name || 'Mock Tests'}
              </Link>
              <span>&gt;</span>
              <span className="text-[#00a8cc] font-medium truncate max-w-sm">
                {series.title}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Details (8 cols) */}
              <div className="lg:col-span-8 space-y-3.5">
                {/* Title & Stage Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Official Exam Emblem */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      <img
                        src={emblemSrc}
                        alt={series.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = '/exam-icons/ssc.svg';
                        }}
                      />
                    </div>

                    <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-slate-900 leading-tight">
                      {series.title}
                    </h1>
                  </div>

                  {/* Stage Dropdown Selector */}
                  <div className="relative shrink-0 self-start sm:self-center">
                    <select
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value)}
                      className="appearance-none bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold rounded-lg px-3.5 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#00c5d2] cursor-pointer"
                    >
                      <option value="All">Stage: All</option>
                      <option value="Tier 1">Stage: Tier I</option>
                      <option value="Tier 2">Stage: Tier II</option>
                      <option value="Prelims">Stage: Prelims</option>
                      <option value="Mains">Stage: Mains</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Last updated */}
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock size={13} className="text-slate-400" />
                  <span>
                    Last updated on {new Date(series.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Meta stats line */}
                <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-600 pt-0.5">
                  <span className="font-semibold text-slate-800">
                    {series.total_tests || tests.length || 1} Total Tests
                  </span>
                  <span className="text-slate-300">|</span>

                  {freeTests.length > 0 && (
                    <>
                      <span className="bg-[#00c975] text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded uppercase tracking-wide shadow-2xs">
                        {freeTests.length} FREE TESTS
                      </span>
                      <span className="text-slate-300">|</span>
                    </>
                  )}

                  <span className="flex items-center gap-1 text-slate-600">
                    <Users size={13} className="text-slate-400" />
                    <span>{formatUserCount(series.total_users || 0)} {series.total_users === 1 ? 'User' : 'Users'}</span>
                  </span>
                  <span className="text-slate-300">|</span>

                  <span className="flex items-center gap-1 text-slate-600">
                    <Globe size={13} className="text-slate-400" />
                    <span>English, Hindi</span>
                  </span>
                </div>

                {/* 3-Column Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 pt-2 text-xs text-slate-600">
                  {displayHighlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 truncate">
                      <span className="text-slate-400 text-sm leading-none">•</span>
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    onClick={() => {
                      const el = document.getElementById('tests-list-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-2.5 bg-[#00c5d2] hover:bg-[#00b0bd] text-white font-bold rounded-lg text-xs sm:text-sm shadow-xs transition cursor-pointer"
                  >
                    Add This Test Series
                  </button>

                  <button
                    onClick={() => handleShare()}
                    className="px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Share2 size={15} className="text-slate-500" />
                    <span>{isCopied ? 'Link Copied!' : 'Share'}</span>
                  </button>
                </div>
              </div>

              {/* Right Side Signup / Quick Access Card (4 cols) */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm space-y-3.5 max-w-sm ml-auto">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    Sign up To Test Your Exam Knowledge Now!
                  </h3>

                  <form onSubmit={handleQuickSignup} className="space-y-3">
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="Enter your mobile number"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c975] focus:border-transparent"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#00c975] hover:bg-[#00b074] text-white font-bold text-xs sm:text-sm rounded-lg shadow-xs transition-all cursor-pointer"
                    >
                      Signup &amp; Take Free Tests
                    </button>
                  </form>

                  <p className="text-[11px] text-slate-500 text-center">
                    {series.total_users > 0
                      ? `${formatUserCount(series.total_users)}+ Enrolled this test series`
                      : 'Be the first candidate to enroll'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. MAIN 2-COLUMN BODY SECTION */}
        {/* ========================================================================= */}
        <div id="tests-list-section" className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT COLUMN: All Tests List & Sub-Tabs (8 cols) */}
            <div className="lg:col-span-8 space-y-6">

              {/* Title: "[Series Title] All Tests (Count)" */}
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {series.title} All Tests ({tests.length})
              </h2>

              {/* Primary Pill Tabs: Mock Tests vs PYPs vs Live Leaderboard */}
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <button
                  onClick={() => setActiveMainTab('mock-tests')}
                  className={`px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    activeMainTab === 'mock-tests'
                      ? 'bg-[#00c5d2] text-white shadow-2xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  Mock Tests
                </button>

                <button
                  onClick={() => setActiveMainTab('pyps')}
                  className={`px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    activeMainTab === 'pyps'
                      ? 'bg-[#00c5d2] text-white shadow-2xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  PYPs
                </button>

                <button
                  onClick={() => setActiveMainTab('leaderboard')}
                  className={`px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeMainTab === 'leaderboard'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  <Trophy size={14} className={activeMainTab === 'leaderboard' ? 'fill-slate-950' : 'text-amber-500'} />
                  <span>Leaderboard</span>
                </button>
              </div>

              {/* Conditional View: Live Leaderboard or Tests List */}
              {activeMainTab === 'leaderboard' ? (
                <div className="space-y-4">
                  <LeaderboardView
                    seriesId={series._id || series.slug}
                    title={`${series.title} Top Rankers`}
                    subtitle="Live All-India rankings of students across all tests in this series"
                    currentUser={session?.user}
                  />
                </div>
              ) : (
                <>
                  {/* Underline Sub-Tabs with Scroll Chevrons */}
                  <div className="relative border-b border-slate-200 flex items-center">
                    <div
                      ref={subTabsScrollRef}
                      className="flex items-center gap-6 overflow-x-auto scrollbar-none w-full scroll-smooth"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {subTabs.map((tab) => {
                        const isActive = selectedSubTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setSelectedSubTab(tab.id)}
                            className={`py-3 text-xs sm:text-sm whitespace-nowrap font-medium transition-all relative cursor-pointer ${
                              isActive
                                ? 'text-[#00a8cc] font-bold border-b-2 border-[#00c5d2]'
                                : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
                            }`}
                          >
                            {tab.name}
                          </button>
                        );
                      })}
                    </div>

                    {subTabs.length > 3 && (
                      <button
                        onClick={() => scrollSubTabs('right')}
                        className="shrink-0 ml-2 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>

                  {/* Individual Mock Test Cards List */}
                  <div className="space-y-3.5">
                    {filteredTests.length > 0 ? (
                      filteredTests.map((test, index) => {
                        const isFree = !test.is_paid || test.is_free;
                        const isUnlocked = isFree || isAdmin || hasSubscription;
                        const userAttempt = userAttemptsMap[String(test._id)] || userAttemptsMap[String(test.slug)];
                        const isAttempted = Boolean(userAttempt?.has_attempted);

                        return (
                          <div
                            key={test._id || test.slug || index}
                            className={`bg-white rounded-xl border p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3 ${
                              isAttempted
                                ? 'border-emerald-300/80 bg-gradient-to-r from-white via-white to-emerald-50/20'
                                : isUnlocked && !isFree
                                ? 'border-blue-200/90 hover:border-blue-300 bg-gradient-to-r from-white via-white to-blue-50/10'
                                : 'border-slate-200/90 hover:border-slate-300'
                            }`}
                          >
                            {/* Card Top: Free Badge, Attempted Status, Title & Trending Count */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isAttempted ? (
                                  <span className="px-2.5 py-0.5 text-[10px] font-black rounded uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                                    <CheckCircle2 size={11} className="text-white" />
                                    <span>ATTEMPTED</span>
                                  </span>
                                ) : isAdmin && !isFree ? (
                                  <span className="px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 shadow-2xs">
                                    <ShieldCheck size={11} className="text-blue-600" />
                                    <span>ADMIN UNLOCKED</span>
                                  </span>
                                ) : hasSubscription && !isFree ? (
                                  <span className="px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                                    <CheckCircle2 size={11} className="text-emerald-600" />
                                    <span>PASS ACTIVE</span>
                                  </span>
                                ) : isFree ? (
                                  <span className="px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider bg-[#00c975] text-white">
                                    FREE
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                    PASS REQUIRED
                                  </span>
                                )}

                                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                                  {test.title}
                                </h3>

                                <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                                  <Zap size={12} className="fill-amber-500 text-amber-500" />
                                  <span>
                                    {formatUserCount(test.total_users || test.total_attempts || 0)}{' '}
                                    {(test.total_users || test.total_attempts) === 1 ? 'User' : 'Users'}
                                  </span>
                                </span>
                              </div>

                              {/* Action Buttons: Re-Attempt & Leaderboard if Attempted, else Start Now if Unlocked, else Unlock Pass */}
                              <div className="shrink-0 self-start sm:self-center flex flex-wrap items-center gap-2">
                                {isAttempted ? (
                                  <>
                                    <Link
                                      href={`/leaderboard?test=${test._id}&series=${series._id || series.slug}`}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs sm:text-sm rounded-lg transition cursor-pointer"
                                      title="View Test Leaderboard"
                                    >
                                      <Trophy size={13} className="text-amber-600" />
                                      <span>Leaderboard</span>
                                    </Link>
                                    <Link
                                      href={`/mock-test/${series.slug}/${test.slug}`}
                                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-lg shadow-2xs transition cursor-pointer"
                                    >
                                      <RotateCcw size={13} />
                                      <span>Re-Attempt</span>
                                    </Link>
                                  </>
                                ) : isUnlocked ? (
                                  <>
                                    <Link
                                      href={`/leaderboard?test=${test._id}&series=${series._id || series.slug}`}
                                      className="inline-flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-lg transition cursor-pointer"
                                      title="View Leaderboard"
                                    >
                                      <Trophy size={12} className="text-amber-500" />
                                      <span className="hidden sm:inline">Ranks</span>
                                    </Link>
                                    <Link
                                      href={`/mock-test/${series.slug}/${test.slug}`}
                                      className="inline-block px-5 py-2 bg-[#00c5d2] hover:bg-[#00b0bd] text-white font-bold text-xs sm:text-sm rounded-lg shadow-2xs transition cursor-pointer"
                                    >
                                      Start Now
                                    </Link>
                                  </>
                                ) : (
                                  <>
                                    <Link
                                      href={`/leaderboard?test=${test._id}&series=${series._id || series.slug}`}
                                      className="inline-flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-lg transition cursor-pointer"
                                      title="View Leaderboard"
                                    >
                                      <Trophy size={12} className="text-amber-500" />
                                      <span className="hidden sm:inline">Ranks</span>
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenUnlockPass(test)}
                                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-[#00c5d2] text-white font-bold text-xs sm:text-sm rounded-lg shadow-2xs transition cursor-pointer"
                                    >
                                      <Lock size={13} />
                                      <span>Unlock Pass</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* If Attempted: Show Student's Best Score Banner with direct View Rank */}
                            {isAttempted && userAttempt && (
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-emerald-50/90 border border-emerald-200/90 px-3.5 py-1.5 rounded-lg text-emerald-950 font-medium">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span>
                                    Your Score: <strong className="text-emerald-700 font-extrabold">{userAttempt.best_score}/{userAttempt.max_score || test.total_marks || 100}</strong>
                                  </span>
                                  <span className="text-emerald-300">•</span>
                                  <span>
                                    Accuracy: <strong className="text-emerald-700 font-extrabold">{userAttempt.accuracy}%</strong>
                                  </span>
                                  <span className="text-emerald-300">•</span>
                                  <span className="text-slate-600 font-bold">
                                    Standing: #{userAttempt.rank || 1}
                                  </span>
                                </div>

                                <Link
                                  href={`/leaderboard?test=${test._id}&series=${series._id || series.slug}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 hover:text-amber-900 bg-amber-100/90 hover:bg-amber-200 px-2.5 py-0.5 rounded-md transition cursor-pointer shadow-2xs"
                                >
                                  <Trophy size={11} className="text-amber-700" />
                                  <span>View Leaderboard</span>
                                  <ArrowRight size={10} />
                                </Link>
                              </div>
                            )}

                            {/* Specs Row: Questions, Marks, Duration */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <BookOpen size={13} className="text-slate-400" />
                                <span>{test.total_questions || 100} Questions</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Award size={13} className="text-slate-400" />
                                <span>{test.total_marks || 200} Marks</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={13} className="text-slate-400" />
                                <span>{test.duration_minutes || 60} Mins</span>
                              </div>
                            </div>

                            {/* Card Bottom: Language & Share Link */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                              <div className="flex items-center gap-1.5 font-semibold">
                                <Globe size={13} className="text-[#00a8cc]" />
                                <span className="text-slate-700">
                                  {test.medium === 'Hindi'
                                    ? '🇮🇳 Hindi Medium'
                                    : test.medium === 'English'
                                    ? '🇬🇧 English Medium'
                                    : '🇮🇳 Hindi & 🇬🇧 English'}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <Link
                                  href={`/leaderboard?test=${test._id}&series=${series._id || series.slug}`}
                                  className="flex items-center gap-1 text-slate-500 hover:text-amber-700 font-medium transition cursor-pointer"
                                  title="View Live Leaderboard for this Test"
                                >
                                  <Trophy size={12} className="text-amber-500" />
                                  <span>Leaderboard</span>
                                </Link>

                                <button
                                  onClick={() => handleShare(`Practice ${test.title} online on Education Masters`)}
                                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                >
                                  <Share2 size={13} />
                                  <span>Share</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
                        <BookOpen size={32} className="text-slate-300 mx-auto" />
                        <h4 className="font-bold text-slate-700 text-sm">No tests found in this category</h4>
                        <p className="text-xs text-slate-500">
                          Tests are continuously being added. Switch tabs or check back shortly!
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* RIGHT COLUMN: Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">

              {/* 1. "More Testseries for you" Widget */}
              {moreTestSeries.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-2xs space-y-3.5">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    More Testseries for you
                  </h3>

                  <div className="divide-y divide-slate-100">
                    {moreTestSeries.map((other) => (
                      <Link
                        key={other._id || other.slug}
                        href={`/mock-test/${other.slug}`}
                        className="py-3 flex items-center justify-between group hover:text-sky-600 transition block"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <h4 className="font-semibold text-slate-800 text-xs sm:text-[13px] group-hover:text-sky-600 transition-colors line-clamp-2">
                            {other.title}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {other.total_tests || 0} Total tests | {other.free_tests_count || 0} Free Tests
                          </p>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    ))}
                  </div>

                  <Link
                    href="/mock-tests"
                    className="w-full py-2 border border-[#00c5d2] hover:bg-cyan-50/50 text-[#00a8cc] font-semibold text-xs rounded-lg text-center transition block"
                  >
                    View More
                  </Link>
                </div>
              )}

              {/* 2. "Why Take this Test Series ?" Widget */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-2xs space-y-3.5">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Why Take this Test Series ?
                </h3>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">Exact Exam Interface:</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Real timer, section switching &amp; marking scheme.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">All India Rank &amp; Percentile:</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Compare your real-time score with thousands of test-takers.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">Detailed Bilingual Solutions:</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Step-by-step explanations in both English &amp; Hindi.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. SUBSCRIPTION PLANS SECTION (IF ATTACHED) */}
        {/* ========================================================================= */}
        {plans.length > 0 && (
          <section id="plans-section" className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-16 space-y-6 scroll-mt-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="px-3 py-1 bg-amber-50 text-amber-800 text-[11px] font-extrabold rounded-full uppercase tracking-wider border border-amber-200">
                Unlock Complete Series
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Choose Your Subscription Plan
              </h3>
              <p className="text-xs text-slate-500">
                Get unlimited access to all full-length tests, sectional papers and rank analysis.
              </p>
            </div>

            {isAdmin && (
              <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl border border-blue-700/60 shadow-md flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} className="text-cyan-300" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span>Administrator All-Access Enabled</span>
                      <span className="px-2 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] uppercase font-black">Active</span>
                    </h4>
                    <p className="text-slate-300 text-xs mt-0.5">As an administrator, all mock tests, papers, and solutions are fully unlocked for you without purchasing a pass.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {plans.map((plan, idx) => {
                const isPopular = plan.is_popular;
                const isFree = plan.is_free || Number(plan.price) === 0;

                return (
                  <div
                    key={idx}
                    className={`bg-white rounded-2xl border-2 p-6 flex flex-col justify-between relative shadow-2xs hover:shadow-md transition-all ${
                      isPopular
                        ? 'border-amber-400 ring-2 ring-amber-400/20'
                        : isFree
                        ? 'border-emerald-400'
                        : 'border-slate-200'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 right-6 px-3 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-xs">
                        {plan.badge}
                      </span>
                    )}

                    <div className="space-y-3">
                      <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[11px] font-bold rounded">
                        {plan.name}
                      </span>

                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                          {isFree ? 'FREE' : `₹${plan.price}`}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          / {plan.validity || '1 Year'}
                        </span>
                      </div>

                      {plan.tagline && (
                        <p className="text-xs text-slate-500 font-normal">
                          {plan.tagline}
                        </p>
                      )}

                      <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-700">
                        {(plan.features || []).map((f, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-2">
                            <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-5">
                      <button
                        type="button"
                        onClick={() => {
                          if (isAdmin) return;
                          handleOpenUnlockPass(null);
                        }}
                        className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer ${
                          isAdmin
                            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-default'
                            : 'bg-slate-900 hover:bg-[#00c5d2] text-white'
                        }`}
                      >
                        {isAdmin ? 'Admin All-Access Active' : (plan.button_text || (isFree ? 'Select Free Plan' : `Select ₹${plan.price} Plan`))}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* Unlock Pass & Plans Popup Modal */}
      <UnlockPassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        series={series}
        targetTest={modalTargetTest}
        onSuccess={() => {
          setUserHasActivePass(true);
        }}
      />

      <Footer />
    </div>
  );
}
