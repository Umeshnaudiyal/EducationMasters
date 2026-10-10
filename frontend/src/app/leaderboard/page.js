'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Trophy,
  Crown,
  Award,
  Medal,
  Users,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Globe,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Layers,
  X,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BACKEND_URL } from '@/utils/api';
import { getImageUrl } from '@/utils/image';

function CandidateAvatar({ src, name, rank, isUser, size = 'md' }) {
  const [imgError, setImgError] = useState(false);

  const getInitials = (n) => {
    if (!n) return 'EM';
    const parts = n.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  let resolvedSrc = src ? getImageUrl(src) : null;

  let ringStyle = 'border border-slate-200';
  let badgeStyle = 'bg-gradient-to-tr from-slate-700 to-slate-900 text-white';

  if (rank === 1) {
    ringStyle = 'ring-2 ring-amber-400 border-amber-300 shadow-sm';
    badgeStyle = 'bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black';
  } else if (rank === 2) {
    ringStyle = 'ring-2 ring-slate-300 border-slate-300 shadow-sm';
    badgeStyle = 'bg-gradient-to-tr from-slate-300 to-slate-400 text-slate-900 font-black';
  } else if (rank === 3) {
    ringStyle = 'ring-2 ring-amber-600/60 border-amber-500 shadow-sm';
    badgeStyle = 'bg-gradient-to-tr from-amber-700 to-amber-800 text-white font-black';
  } else if (isUser) {
    ringStyle = 'ring-2 ring-blue-500 border-blue-400';
    badgeStyle = 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black';
  }

  const dimensionClass = size === 'lg' ? 'w-11 h-11' : size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';

  return (
    <div
      className={`${dimensionClass} rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden select-none ${ringStyle} ${badgeStyle}`}
    >
      {resolvedSrc && !imgError ? (
        <img
          src={resolvedSrc}
          alt={name || 'Candidate'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="tracking-tight text-[11px] font-bold">{getInitials(name)}</span>
      )}
    </div>
  );
}

function LeaderboardInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTestId = searchParams.get('test') || null;
  const initialSeriesId = searchParams.get('series') || 'all';
  const initialMedium = searchParams.get('medium') || 'English';

  const [activeTestId, setActiveTestId] = useState(initialTestId);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state (English or Hindi only)
  const [selectedSeries, setSelectedSeries] = useState(initialSeriesId);
  const [selectedMedium, setSelectedMedium] = useState(
    initialMedium.toLowerCase() === 'hindi' ? 'Hindi' : 'English'
  );
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'all' | 'month' | 'week' | 'today'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rank'); // 'rank' | 'score' | 'accuracy' | 'time'

  // Fetch Leaderboard Data (Test specific or Global)
  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (session?.user?.email) params.append('email', session.user.email);
      if (session?.user?.id || session?.user?._id) params.append('userId', session.user.id || session.user._id);
      if (selectedMedium) params.append('language', selectedMedium);

      let url = '';
      if (activeTestId) {
        url = `${BACKEND_URL}/apis/v1/mock-tests/${activeTestId}/leaderboard?${params.toString()}`;
      } else {
        if (selectedSeries !== 'all') params.append('seriesId', selectedSeries);
        if (selectedPeriod !== 'all') params.append('period', selectedPeriod);
        url = `${BACKEND_URL}/apis/v1/mock-tests/leaderboard/global?${params.toString()}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to load leaderboard data.');
      }
    } catch (err) {
      console.error('Fetch leaderboard error:', err);
      setError('Unable to load leaderboard. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, [session?.user?.email, activeTestId, selectedSeries, selectedMedium, selectedPeriod]);

  const leaderboardList = data?.leaderboard || [];
  const seriesList = data?.series_list || [];
  const testInfo = data?.test || null;
  const stats = data?.stats || {};
  const totalParticipants = data?.total_participants || stats?.total_participants || (leaderboardList.length > 0 ? leaderboardList.length : 1240);
  const maxScore = stats?.max_score || testInfo?.total_marks || (leaderboardList[0]?.max_score) || 100;

  // Process and Filter Rankings strictly by Hindi / English
  const processedRankings = useMemo(() => {
    let list = [...leaderboardList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => item.user_name?.toLowerCase().includes(q));
    }

    if (selectedMedium) {
      list = list.filter((item) => (item.language || 'English').toLowerCase() === selectedMedium.toLowerCase());
    }

    if (sortBy === 'score') {
      list.sort((a, b) => (b.total_score || b.score || 0) - (a.total_score || a.score || 0));
    } else if (sortBy === 'accuracy') {
      list.sort((a, b) => (b.avg_accuracy || b.accuracy || 0) - (a.avg_accuracy || a.accuracy || 0));
    } else if (sortBy === 'time') {
      list.sort((a, b) => (a.total_time_spent || a.time_spent_seconds || 0) - (b.total_time_spent || b.time_spent_seconds || 0));
    }

    return list;
  }, [leaderboardList, searchQuery, selectedMedium, sortBy]);

  // Current logged in candidate item in processed list
  const currentUserItem = useMemo(() => {
    return (
      processedRankings.find(
        (item) =>
          item.is_current_user ||
          (session?.user?.email &&
            (item.email === session.user.email || item.user_email === session.user.email)) ||
          (session?.user?.id && (item.user_id === session.user.id || item.userId === session.user.id))
      ) || null
    );
  }, [processedRankings, session?.user]);

  // Helper to format seconds into MM:SS or HH:MM
  const formatTime = (secs) => {
    if (!secs) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${h}h ${remM}m`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} min`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <Header />

      {/* 1. Sleek Modern Hero Header */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white pt-5 pb-7 sm:pt-8 sm:pb-10 border-b border-slate-800">
        <div className="max-w-[1520px] mx-auto px-3.5 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
          {/* Breadcrumbs & Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 overflow-x-auto max-w-full whitespace-nowrap text-[11px] sm:text-xs">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/mock-tests" className="hover:text-white transition-colors">
                Mock Tests
              </Link>
              <span>/</span>
              <span className="text-white font-semibold truncate max-w-[200px] sm:max-w-none">
                {activeTestId && testInfo ? `${testInfo.title} Leaderboard` : 'All-India Leaderboard'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeTestId ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTestId(null);
                    router.push('/leaderboard');
                  }}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/30 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-[11px] sm:text-xs"
                >
                  <Globe size={12} />
                  <span>Switch to All-India</span>
                </button>
              ) : (
                <span className="px-2.5 sm:px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full border border-emerald-500/30 flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live All-India Standings</span>
                </span>
              )}
            </div>
          </div>

          {/* Main Title Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 mt-0.5 sm:mt-0">
                  <Trophy className="w-5 h-5 sm:w-6.5 sm:h-6.5 fill-slate-950" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2 flex-wrap leading-tight">
                    <span>{activeTestId && testInfo ? testInfo.title : 'All-India Mock Test Leaderboard'}</span>
                    {activeTestId && (
                      <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 font-extrabold rounded-full">
                        Test Specific
                      </span>
                    )}
                  </h1>
                  <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-2 mt-0.5">
                    {activeTestId
                      ? 'Live real-time candidate score rankings and accuracy standings for this test paper.'
                      : 'Live rankings, topper scores & percentile standing across all competitive mock exam sessions.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start lg:self-center">
              <Link
                href="/mock-tests"
                className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <BookOpen size={13} />
                <span>Browse All Tests</span>
              </Link>

              <button
                type="button"
                onClick={fetchLeaderboardData}
                disabled={loading}
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Refresh Leaderboard"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin text-cyan-300' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Mobile 2x2 Stats Grid (Visible on Mobile Only) */}
          <div className="grid grid-cols-2 gap-2 pt-1 sm:hidden">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10 flex items-center gap-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                <Users size={14} className="text-cyan-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block leading-none">Aspirants</span>
                <strong className="text-white text-xs font-extrabold">{totalParticipants.toLocaleString()}+</strong>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10 flex items-center gap-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Trophy size={14} className="text-amber-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block leading-none">Top Score</span>
                <strong className="text-amber-300 text-xs font-extrabold truncate block">
                  {stats.highest_score !== undefined ? stats.highest_score : (leaderboardList[0]?.score || leaderboardList[0]?.total_score || maxScore)} {activeTestId ? `/${maxScore}` : 'pts'}
                </strong>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10 flex items-center gap-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block leading-none">Avg Accuracy</span>
                <strong className="text-emerald-300 text-xs font-extrabold">{stats.average_accuracy || 93.8}%</strong>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10 flex items-center gap-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                <Clock size={14} className="text-purple-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block leading-none">Duration</span>
                <strong className="text-purple-200 text-xs font-extrabold">{testInfo?.duration_minutes ? `${testInfo.duration_minutes} mins` : '20 mins'}</strong>
              </div>
            </div>
          </div>

          {/* Desktop Stats Ribbon (Hidden on Mobile) */}
          <div className="hidden sm:flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-slate-300 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-cyan-400" />
              <span>Aspirants Active: <strong className="text-white font-bold">{totalParticipants.toLocaleString()}+</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-amber-400" />
              <span>Highest Score: <strong className="text-amber-400 font-bold">{stats.highest_score !== undefined ? stats.highest_score : (leaderboardList[0]?.score || leaderboardList[0]?.total_score || maxScore)} {activeTestId ? `/${maxScore} marks` : 'pts'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <span>Avg Topper Accuracy: <strong className="text-emerald-400 font-bold">{stats.average_accuracy || 93.8}%</strong></span>
            </div>
            {activeTestId && testInfo?.duration_minutes && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-purple-400" />
                <span>Duration: <strong className="text-purple-300 font-bold">{testInfo.duration_minutes} mins</strong></span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Main Body Container (Direct Clean Card) */}
      <main className="max-w-[1520px] mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 space-y-4 sm:space-y-5">
        {/* Single-Surface Leaderboard Card (Toolbar + Table / Mobile Cards) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          {/* Unified Filter & Search Bar */}
          <div className="p-3 sm:p-5 border-b border-slate-200 space-y-2.5 sm:space-y-3 bg-slate-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3 text-xs">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md w-full">
                <input
                  type="text"
                  placeholder="Search candidate by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2271b1] font-medium shadow-2xs"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filters Group */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
                {/* Language / Medium Toggle: Hindi & English Only */}
                <div className="grid grid-cols-2 sm:inline-flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedMedium('English')}
                    className={`py-1.5 px-3 sm:px-3.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                      selectedMedium === 'English'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-blue-900'
                    }`}
                  >
                    <span>🇬🇧 English</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMedium('Hindi')}
                    className={`py-1.5 px-3 sm:px-3.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                      selectedMedium === 'Hindi'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-amber-900'
                    }`}
                  >
                    <span>🇮🇳 Hindi</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  {/* Series Dropdown (Only in Global Mode) */}
                  {!activeTestId && seriesList.length > 0 && (
                    <select
                      value={selectedSeries}
                      onChange={(e) => setSelectedSeries(e.target.value)}
                      className="p-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 outline-none focus:border-[#2271b1] shadow-2xs flex-1 sm:flex-none"
                    >
                      <option value="all">All Series</option>
                      {seriesList.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Sort selector */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="p-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 outline-none focus:border-[#2271b1] shadow-2xs flex-1 sm:flex-none"
                  >
                    <option value="rank">Sort by Rank</option>
                    <option value="score">Highest Score</option>
                    <option value="accuracy">Accuracy %</option>
                    <option value="time">Fastest Time</option>
                  </select>

                  {(searchQuery || selectedSeries !== 'all' || sortBy !== 'rank') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedSeries('all');
                        setSortBy('rank');
                      }}
                      className="text-xs text-[#2271b1] hover:underline font-bold px-2 py-1 cursor-pointer shrink-0"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Body Content (Loading / Error / Content) */}
          {loading ? (
            <div className="py-20 sm:py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 text-[#2271b1] animate-spin mx-auto" />
              <p className="text-xs sm:text-sm font-bold text-slate-700">Loading Live Rankings...</p>
            </div>
          ) : error ? (
            <div className="py-14 sm:py-16 text-center space-y-2">
              <p className="text-xs sm:text-sm font-bold text-rose-600">{error}</p>
              <button
                type="button"
                onClick={fetchLeaderboardData}
                className="px-4 py-2 bg-[#2271b1] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : processedRankings.length > 0 ? (
            <>
              {/* ========================================================= */}
              {/* MOBILE-ONLY VIEW: Top 3 Podium + Rich Candidate Card Feed */}
              {/* ========================================================= */}
              <div className="block md:hidden p-3 space-y-2.5 bg-slate-50/30">
                {/* Top 3 Visual Podium (Only when sorted by rank and search is empty) */}
                {processedRankings.length >= 3 && sortBy === 'rank' && !searchQuery && (
                  <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-3.5 pt-4 mb-2.5 border border-slate-800 shadow-md">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Crown size={13} className="fill-amber-400" />
                        <span>Top 3 Standings</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {selectedMedium} Medium
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-end pt-2">
                      {/* 2nd Place (Silver) */}
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-1">
                          <CandidateAvatar
                            src={processedRankings[1]?.avatar}
                            name={processedRankings[1]?.user_name}
                            rank={2}
                          />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-300 text-slate-900 rounded-full font-black text-[9px] flex items-center justify-center border border-white shadow-xs">
                            2
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-200 truncate w-full px-1">
                          {processedRankings[1]?.user_name}
                        </span>
                        <span className="text-[10px] font-extrabold text-cyan-300">
                          {processedRankings[1]?.score !== undefined ? processedRankings[1]?.score : processedRankings[1]?.total_score} pts
                        </span>
                        <div className="w-full h-10 mt-1.5 bg-gradient-to-t from-slate-700/80 to-slate-600/50 rounded-t-xl border-t border-slate-400/50 flex items-center justify-center">
                          <span className="text-xs font-black text-slate-200">🥈 2nd</span>
                        </div>
                      </div>

                      {/* 1st Place (Gold Champion) */}
                      <div className="flex flex-col items-center text-center -mt-3">
                        <div className="relative mb-1">
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-400">
                            <Crown size={14} className="fill-amber-400" />
                          </div>
                          <CandidateAvatar
                            src={processedRankings[0]?.avatar}
                            name={processedRankings[0]?.user_name}
                            rank={1}
                            size="lg"
                          />
                          <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-amber-400 text-slate-950 rounded-full font-black text-[9.5px] flex items-center justify-center border border-white shadow-xs">
                            1
                          </span>
                        </div>
                        <span className="text-[11px] font-black text-amber-300 truncate w-full px-1">
                          {processedRankings[0]?.user_name}
                        </span>
                        <span className="text-[10px] font-black text-amber-400">
                          {processedRankings[0]?.score !== undefined ? processedRankings[0]?.score : processedRankings[0]?.total_score} pts
                        </span>
                        <div className="w-full h-14 mt-1.5 bg-gradient-to-t from-amber-500/40 via-amber-400/30 to-amber-300/20 rounded-t-xl border-t-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
                          <span className="text-xs font-black text-amber-300">👑 Champion</span>
                        </div>
                      </div>

                      {/* 3rd Place (Bronze) */}
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-1">
                          <CandidateAvatar
                            src={processedRankings[2]?.avatar}
                            name={processedRankings[2]?.user_name}
                            rank={3}
                          />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-700 text-white rounded-full font-black text-[9px] flex items-center justify-center border border-white shadow-xs">
                            3
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-200 truncate w-full px-1">
                          {processedRankings[2]?.user_name}
                        </span>
                        <span className="text-[10px] font-extrabold text-cyan-300">
                          {processedRankings[2]?.score !== undefined ? processedRankings[2]?.score : processedRankings[2]?.total_score} pts
                        </span>
                        <div className="w-full h-8 mt-1.5 bg-gradient-to-t from-amber-900/60 to-amber-800/40 rounded-t-xl border-t border-amber-600/50 flex items-center justify-center">
                          <span className="text-xs font-black text-amber-400">🥉 3rd</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Candidate Mobile Cards List */}
                <div className="space-y-2.5">
                  {processedRankings.map((item, index) => {
                    const isUser = item.is_current_user || (currentUserItem && item === currentUserItem);
                    const rankNum = item.rank || index + 1;
                    const itemScore = item.score !== undefined ? item.score : item.total_score;
                    const itemMax = item.max_score || maxScore;
                    const itemAcc = item.accuracy !== undefined ? item.accuracy : item.avg_accuracy || 92;
                    const itemTime = item.time_spent_seconds || item.total_time_spent || 0;
                    const itemLang = item.language || (index % 2 === 0 ? 'English' : 'Hindi');

                    return (
                      <div
                        key={item.attempt_id || item.user_id || index}
                        className={`p-3 rounded-2xl border transition-all duration-200 ${
                          isUser
                            ? 'bg-gradient-to-r from-blue-50/95 via-indigo-50/70 to-white border-blue-500 shadow-md ring-2 ring-blue-300/60'
                            : rankNum === 1
                            ? 'bg-gradient-to-r from-amber-50/70 via-white to-white border-amber-300 shadow-2xs'
                            : rankNum === 2
                            ? 'bg-gradient-to-r from-slate-50/90 via-white to-white border-slate-300 shadow-2xs'
                            : rankNum === 3
                            ? 'bg-gradient-to-r from-amber-50/30 via-white to-white border-amber-200 shadow-2xs'
                            : index % 2 === 0
                            ? 'bg-white border-slate-200/90 shadow-2xs'
                            : 'bg-slate-50/60 border-slate-200/90 shadow-2xs'
                        }`}
                      >
                        {/* Top Row: Rank + Avatar + Candidate Info + Medium */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Rank Badge */}
                            <div className="shrink-0">
                              {rankNum === 1 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[11px] shadow-xs">
                                  <Crown size={11} className="fill-slate-950" /> #1
                                </span>
                              ) : rankNum === 2 ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-slate-200 text-slate-800 font-black text-[11px] border border-slate-300">
                                  🥈 #2
                                </span>
                              ) : rankNum === 3 ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-black text-[11px] border border-amber-300">
                                  🥉 #3
                                </span>
                              ) : (
                                <span className="font-extrabold text-slate-600 px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                                  #{rankNum}
                                </span>
                              )}
                            </div>

                            {/* Avatar */}
                            <CandidateAvatar
                              src={item.avatar}
                              name={item.user_name}
                              rank={rankNum}
                              isUser={isUser}
                            />

                            {/* Candidate Name & ID */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                                  {item.user_name}
                                </span>
                                {isUser && (
                                  <span className="px-1.5 py-0.2 bg-blue-600 text-white font-extrabold text-[9px] rounded uppercase shadow-2xs">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium block truncate">
                                ID: EM-{String(item.attempt_id || item.user_id || index + 1).slice(-6).toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Language & Standing Pill */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                itemLang === 'Hindi'
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-blue-50 text-blue-900 border-blue-200'
                              }`}
                            >
                              {itemLang === 'Hindi' ? '🇮🇳 HI' : '🇬🇧 EN'}
                            </span>
                            <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {rankNum === 1 ? 'Top 0.1%' : `Top ${Math.max(1, Math.ceil((rankNum / totalParticipants) * 100))}%`}
                            </span>
                          </div>
                        </div>

                        {/* Bottom Metric Row: 3 clean stat pills */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2 mt-2 border-t border-slate-100 text-center">
                          <div className="bg-slate-50/90 rounded-xl p-1.5 border border-slate-100">
                            <span className="text-[9.5px] text-slate-400 font-semibold block uppercase tracking-wider">Score</span>
                            <span className="text-xs font-black text-blue-600">
                              {itemScore} <span className="text-[9px] text-slate-400 font-normal">/{itemMax}</span>
                            </span>
                          </div>

                          <div className="bg-slate-50/90 rounded-xl p-1.5 border border-slate-100">
                            <span className="text-[9.5px] text-slate-400 font-semibold block uppercase tracking-wider">Accuracy</span>
                            <span className="text-xs font-black text-emerald-600">
                              {itemAcc}%
                            </span>
                          </div>

                          <div className="bg-slate-50/90 rounded-xl p-1.5 border border-slate-100">
                            <span className="text-[9.5px] text-slate-400 font-semibold block uppercase tracking-wider">Time</span>
                            <span className="text-xs font-bold text-slate-700">
                              {formatTime(itemTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================= */}
              {/* DESKTOP VIEW: Untouched Full-Width Standard Data Table     */}
              {/* ========================================================= */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 sm:px-6"># Rank</th>
                      <th className="py-3 px-4 sm:px-6">Candidate</th>
                      <th className="py-3 px-4 sm:px-6 text-center">Medium</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Score</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Accuracy</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Time Spent</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Standing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-800">
                    {processedRankings.map((item, index) => {
                      const isUser = item.is_current_user || (currentUserItem && item === currentUserItem);
                      const rankNum = item.rank || index + 1;
                      const itemScore = item.score !== undefined ? item.score : item.total_score;
                      const itemMax = item.max_score || maxScore;
                      const itemAcc = item.accuracy !== undefined ? item.accuracy : item.avg_accuracy || 92;
                      const itemTime = item.time_spent_seconds || item.total_time_spent || 0;
                      const itemLang = item.language || (index % 2 === 0 ? 'English' : 'Hindi');

                      return (
                        <tr
                          key={item.attempt_id || item.user_id || index}
                          className={`transition-colors ${
                            isUser
                              ? 'bg-blue-50/90 font-bold border-l-4 border-l-blue-600'
                              : rankNum === 1
                              ? 'bg-amber-50/40 hover:bg-amber-50/70'
                              : rankNum === 2
                              ? 'bg-slate-50/70 hover:bg-slate-100/70'
                              : rankNum === 3
                              ? 'bg-amber-50/20 hover:bg-amber-50/50'
                              : index % 2 === 0
                              ? 'bg-white hover:bg-slate-50/80'
                              : 'bg-slate-50/30 hover:bg-slate-50/80'
                          }`}
                        >
                          {/* 1. Rank Badge */}
                          <td className="py-3.5 px-4 sm:px-6 shrink-0">
                            {rankNum === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-xs">
                                <Crown size={13} className="fill-slate-950" /> #1 Champion
                              </span>
                            ) : rankNum === 2 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-200 text-slate-800 font-black text-xs border border-slate-300">
                                🥈 #2
                              </span>
                            ) : rankNum === 3 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-800/10 text-amber-900 font-black text-xs border border-amber-700/30">
                                🥉 #3
                              </span>
                            ) : (
                              <span className="font-bold text-slate-600 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                                #{rankNum}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3 min-w-0">
                              <CandidateAvatar
                                src={item.avatar}
                                name={item.user_name}
                                rank={rankNum}
                                isUser={isUser}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 truncate">
                                    {item.user_name}
                                  </span>
                                  {isUser && (
                                    <span className="px-1.5 py-0.2 bg-blue-600 text-white font-extrabold text-[9.5px] rounded uppercase shadow-2xs">
                                      YOU
                                    </span>
                                  )}
                                  {item.is_benchmark && (
                                    <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 font-semibold text-[9.5px] rounded border border-slate-200">
                                      Topper Benchmark
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 block">
                                  Candidate ID: EM-{String(item.attempt_id || item.user_id || index + 1).slice(-6).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 3. Medium Language Badge */}
                          <td className="py-3.5 px-4 sm:px-6 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                itemLang === 'Hindi'
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : 'bg-blue-50 text-blue-900 border-blue-300'
                              }`}
                            >
                              {itemLang === 'Hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}
                            </span>
                          </td>

                          {/* 4. Score */}
                          <td className="py-3.5 px-4 sm:px-6 text-right font-black text-slate-900">
                            <span className="text-sm sm:text-base text-[#2271b1]">{itemScore}</span>
                            <span className="text-xs text-slate-400 font-normal"> / {itemMax} pts</span>
                          </td>

                          {/* 5. Accuracy */}
                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="inline-flex flex-col items-end">
                              <span className="font-extrabold text-emerald-700">{itemAcc}%</span>
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-0.5">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(100, itemAcc)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* 6. Time Spent */}
                          <td className="py-3.5 px-4 sm:px-6 text-right text-slate-600 font-medium">
                            <div className="inline-flex items-center gap-1">
                              <Clock size={12} className="text-slate-400" />
                              <span>{formatTime(itemTime)}</span>
                            </div>
                          </td>

                          {/* 7. Standing Percentile */}
                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                                rankNum === 1
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : rankNum <= 3
                                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                  : rankNum <= 10
                                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {rankNum === 1 ? 'Top 0.1%' : `Top ${Math.max(1, Math.ceil((rankNum / totalParticipants) * 100))}%`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700">No matching candidates found</p>
              <p className="text-xs text-slate-500">Try clearing your search query or language filter.</p>
            </div>
          )}

          {/* Footer Ribbon */}
          <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles size={13} className="text-amber-500 shrink-0" />
              <span>Rankings update dynamically after every completed mock test.</span>
            </span>
            <span className="font-semibold text-[#2271b1]">
              Education Masters Online Assessment
            </span>
          </div>
        </div>
      </main>

      {/* Floating Bottom Card for Current User on Mobile */}
      {currentUserItem && (
        <div className="fixed bottom-3 left-3 right-3 z-30 p-2.5 sm:p-3 bg-slate-950/95 backdrop-blur-md text-white rounded-2xl border border-slate-700/90 shadow-2xl flex items-center justify-between gap-2.5 md:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <CandidateAvatar
              src={currentUserItem.avatar}
              name={currentUserItem.user_name}
              rank={currentUserItem.rank || 1}
              isUser={true}
              size="sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black truncate">{currentUserItem.user_name}</span>
                <span className="px-1 py-0.2 bg-blue-500 text-white text-[8.5px] font-black rounded uppercase">YOU</span>
              </div>
              <span className="text-[10px] text-amber-400 font-bold block">
                Rank #{currentUserItem.rank || 1} of {totalParticipants}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <span className="text-xs font-black text-cyan-300 block">
                {currentUserItem.score !== undefined ? currentUserItem.score : currentUserItem.total_score} /{maxScore}
              </span>
              <span className="text-[9.5px] text-emerald-400 font-bold">
                {currentUserItem.accuracy !== undefined ? currentUserItem.accuracy : currentUserItem.avg_accuracy || 92}% Acc
              </span>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function GlobalLeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 text-[#2271b1] animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-700">Loading Leaderboard...</p>
          </div>
        </div>
      }
    >
      <LeaderboardInner />
    </Suspense>
  );
}
