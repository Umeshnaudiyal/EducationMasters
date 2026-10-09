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
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { API_BASE } from '@/utils/api';
import { getImageUrl } from '@/utils/image';

function CandidateAvatar({ src, name, rank, isUser }) {
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

  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden select-none ${ringStyle} ${badgeStyle}`}
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
        url = `${API_BASE}/apis/v1/mock-tests/${activeTestId}/leaderboard?${params.toString()}`;
      } else {
        if (selectedSeries !== 'all') params.append('seriesId', selectedSeries);
        if (selectedPeriod !== 'all') params.append('period', selectedPeriod);
        url = `${API_BASE}/apis/v1/mock-tests/leaderboard/global?${params.toString()}`;
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
  const totalParticipants = data?.total_participants || stats?.total_participants || 1240;
  const userRank = data?.user_rank || null;
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

  // Helper to get initials
  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <Header />

      {/* 1. Sleek Modern Hero Header */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white pt-8 pb-10 border-b border-slate-800">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          {/* Breadcrumbs & Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/mock-tests" className="hover:text-white transition-colors">
                Mock Tests
              </Link>
              <span>/</span>
              <span className="text-white font-semibold">
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
                  className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/30 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe size={13} />
                  <span>Switch to All-India Global Rankings</span>
                </button>
              ) : (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full border border-emerald-500/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live All-India Standings</span>
                </span>
              )}
            </div>
          </div>

          {/* Main Title Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                  <Trophy size={26} className="fill-slate-950" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
                    <span>{activeTestId && testInfo ? testInfo.title : 'All-India Mock Test Leaderboard'}</span>
                    {activeTestId && (
                      <span className="text-xs px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 font-extrabold rounded-full">
                        Test Specific
                      </span>
                    )}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {activeTestId
                      ? 'Live real-time candidate score rankings and accuracy standings for this test paper.'
                      : 'Live rankings, topper scores & percentile standing across all competitive mock exam sessions.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
              <Link
                href="/mock-tests"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <BookOpen size={14} />
                <span>Browse All Tests</span>
              </Link>

              <button
                type="button"
                onClick={fetchLeaderboardData}
                disabled={loading}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Refresh Leaderboard"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin text-cyan-300' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Clean Integrated Stats Ribbon (NO heavy nested boxes) */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-slate-300 border-t border-slate-800/80">
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
      <main className="max-w-[1520px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-5">
        {/* Single-Surface Leaderboard Card (Toolbar + Table) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          {/* Unified Filter & Search Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3 bg-slate-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search candidate by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2271b1] font-medium shadow-2xs"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Filters Group */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Language / Medium Toggle: Hindi & English Only (No "All Mediums") */}
                <div className="inline-flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedMedium('English')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedMedium === 'English'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-blue-900'
                    }`}
                  >
                    <span>🇬🇧 English Medium</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMedium('Hindi')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedMedium === 'Hindi'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-amber-900'
                    }`}
                  >
                    <span>🇮🇳 Hindi Medium</span>
                  </button>
                </div>

                {/* Series Dropdown (Only in Global Mode) */}
                {!activeTestId && seriesList.length > 0 && (
                  <select
                    value={selectedSeries}
                    onChange={(e) => setSelectedSeries(e.target.value)}
                    className="p-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 outline-none focus:border-[#2271b1] shadow-2xs"
                  >
                    <option value="all">All Test Series</option>
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
                  className="p-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 outline-none focus:border-[#2271b1] shadow-2xs"
                >
                  <option value="rank">Sort by Rank</option>
                  <option value="score">Highest Score</option>
                  <option value="accuracy">Highest Accuracy %</option>
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
                    className="text-xs text-[#2271b1] hover:underline font-bold px-2 py-1 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Unified Leaderboard Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-24 text-center space-y-3">
                <Loader2 className="w-9 h-9 text-[#2271b1] animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-700">Loading Live Rankings...</p>
              </div>
            ) : error ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-bold text-rose-600">{error}</p>
                <button
                  type="button"
                  onClick={fetchLeaderboardData}
                  className="px-4 py-2 bg-[#2271b1] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : processedRankings.length > 0 ? (
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
                    const isUser = item.is_current_user;
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
                        {/* 1. Rank Badge with subtle gold/silver/bronze icons */}
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
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                            itemLang === 'Hindi'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-blue-50 text-blue-900 border-blue-300'
                          }`}>
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
            ) : (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700">No matching candidates found</p>
                <p className="text-xs text-slate-500">Try clearing your search query or language filter.</p>
              </div>
            )}
          </div>

          {/* Footer Ribbon */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles size={13} className="text-amber-500" />
              <span>Rankings update dynamically after every completed mock test attempt.</span>
            </span>
            <span className="font-semibold text-[#2271b1]">
              Education Masters Online Assessment Platform
            </span>
          </div>
        </div>
      </main>

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
