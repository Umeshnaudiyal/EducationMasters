'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Search,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Globe,
  Filter,
  ArrowUpDown,
  Target,
  ArrowRight,
} from 'lucide-react';
import { BACKEND_URL } from '@/utils/api';
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
      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden select-none ${ringStyle} ${badgeStyle}`}
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

export default function LeaderboardView({
  testId = null,
  seriesId = null,
  title = 'Live Test Leaderboard',
  subtitle = 'Real-time performance rankings based on score, accuracy & time efficiency',
  currentUser = null,
  initialLanguage = 'English',
  className = '',
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedium, setSelectedMedium] = useState(
    (initialLanguage || 'English').toLowerCase() === 'hindi' ? 'Hindi' : 'English'
  );
  const [sortBy, setSortBy] = useState('rank'); // 'rank' | 'score' | 'accuracy' | 'time'

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '';
      const params = new URLSearchParams();
      if (currentUser?.email) params.append('email', currentUser.email);
      if (currentUser?.id || currentUser?._id) params.append('userId', currentUser.id || currentUser._id);
      if (selectedMedium) params.append('language', selectedMedium);

      if (testId) {
        url = `${BACKEND_URL}/apis/v1/mock-tests/${testId}/leaderboard?${params.toString()}`;
      } else if (seriesId) {
        url = `${BACKEND_URL}/apis/v1/mock-tests/series/${seriesId}/leaderboard?${params.toString()}`;
      } else {
        url = `${BACKEND_URL}/apis/v1/mock-tests/leaderboard/global?${params.toString()}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to load leaderboard data');
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError('Unable to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [testId, seriesId, currentUser?.email, selectedMedium]);

  const leaderboardList = data?.leaderboard || [];
  const stats = data?.stats || {};
  const totalParticipants = data?.total_participants || stats?.total_participants || leaderboardList.length || 1;
  const userRank = data?.user_rank || null;
  const maxScore = stats?.max_score || (leaderboardList[0]?.max_score) || 100;

  // Filter & Sort rankings strictly by Hindi / English
  const processedRankings = useMemo(() => {
    let list = [...leaderboardList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => item.user_name?.toLowerCase().includes(q));
    }

    if (selectedMedium) {
      list = list.filter(
        (item) => (item.language || 'English').toLowerCase() === selectedMedium.toLowerCase()
      );
    }

    if (sortBy === 'score') {
      list.sort((a, b) => (b.score || b.total_score || 0) - (a.score || a.total_score || 0));
    } else if (sortBy === 'accuracy') {
      list.sort((a, b) => (b.accuracy || b.avg_accuracy || 0) - (a.accuracy || a.avg_accuracy || 0));
    } else if (sortBy === 'time') {
      list.sort((a, b) => (a.time_spent_seconds || a.total_time_spent || 0) - (b.time_spent_seconds || b.total_time_spent || 0));
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
    <div className={`w-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-sans space-y-0 ${className}`}>
      {/* 1. Sleek Header Banner with Integrated Stats Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 border-b border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Trophy size={22} className="fill-slate-950" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {title}
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] rounded-full uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Ranks
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <Link
              href="/leaderboard"
              className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>Full Leaderboard Page</span>
              <ArrowRight size={13} />
            </Link>

            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Leaderboard"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-cyan-300' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Clean Integrated Stats Ribbon */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 mt-3 border-t border-slate-700/80 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-cyan-400" />
            <span>Active Aspirants: <strong className="text-white font-bold">{totalParticipants.toLocaleString()}+</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy size={13} className="text-amber-400" />
            <span>Highest Score: <strong className="text-amber-400 font-bold">{stats?.highest_score !== undefined ? stats.highest_score : (leaderboardList[0]?.score || maxScore)} / {maxScore}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} className="text-emerald-400" />
            <span>Avg Accuracy: <strong className="text-emerald-400 font-bold">{stats?.average_accuracy || 93.8}%</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar & Search (English & Hindi Medium Only) */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search candidate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#2271b1] font-medium"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Language / Medium Toggle: Hindi & English Only (No "All") */}
          <div className="inline-flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedMedium('English')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
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
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMedium === 'Hindi'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-amber-900'
              }`}
            >
              <span>🇮🇳 Hindi</span>
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-1.5 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 outline-none focus:border-[#2271b1]"
          >
            <option value="rank">Rank</option>
            <option value="score">Score</option>
            <option value="accuracy">Accuracy</option>
            <option value="time">Speed</option>
          </select>
        </div>
      </div>

      {/* 4. Main Table on Desktop / Card Feed on Mobile */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-8 h-8 text-[#2271b1] animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">Loading Leaderboard...</p>
        </div>
      ) : error ? (
        <div className="py-14 text-center space-y-2">
          <p className="text-xs font-bold text-rose-600">{error}</p>
          <button
            type="button"
            onClick={fetchLeaderboard}
            className="px-3.5 py-1.5 bg-[#2271b1] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : processedRankings.length > 0 ? (
        <>
          {/* MOBILE-ONLY VIEW: Cards Feed */}
          <div className="block md:hidden p-3 space-y-2.5 bg-slate-50/30">
            {/* Top 3 Visual Podium on Mobile (if sorted by rank and >= 3 candidates) */}
            {processedRankings.length >= 3 && sortBy === 'rank' && !searchQuery && (
              <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-3.5 pt-4 mb-2.5 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Crown size={13} className="fill-amber-400" />
                    <span>Top 3 Standings</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {selectedMedium}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 items-end pt-2">
                  {/* 2nd Place */}
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
                    <div className="w-full h-9 mt-1.5 bg-gradient-to-t from-slate-700/80 to-slate-600/50 rounded-t-xl border-t border-slate-400/50 flex items-center justify-center">
                      <span className="text-xs font-black text-slate-200">🥈 2nd</span>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="flex flex-col items-center text-center -mt-3">
                    <div className="relative mb-1">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-400">
                        <Crown size={14} className="fill-amber-400" />
                      </div>
                      <CandidateAvatar
                        src={processedRankings[0]?.avatar}
                        name={processedRankings[0]?.user_name}
                        rank={1}
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
                    <div className="w-full h-12 mt-1.5 bg-gradient-to-t from-amber-500/40 via-amber-400/30 to-amber-300/20 rounded-t-xl border-t-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
                      <span className="text-xs font-black text-amber-300">👑 1st</span>
                    </div>
                  </div>

                  {/* 3rd Place */}
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
                    <div className="w-full h-7 mt-1.5 bg-gradient-to-t from-amber-900/60 to-amber-800/40 rounded-t-xl border-t border-amber-600/50 flex items-center justify-center">
                      <span className="text-xs font-black text-amber-400">🥉 3rd</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Candidate Mobile Cards */}
            <div className="space-y-2.5">
              {processedRankings.map((item, index) => {
                const isUser = item.is_current_user;
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
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
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

                        <CandidateAvatar
                          src={item.avatar}
                          name={item.user_name}
                          rank={rankNum}
                          isUser={isUser}
                        />

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

          {/* DESKTOP VIEW: Standard Table */}
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
                      <td className="py-3.5 px-4 sm:px-6 shrink-0">
                        {rankNum === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-xs">
                            <Crown size={12} className="fill-slate-950" /> #1 Champion
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
                                <span className="px-1.5 py-0.2 bg-blue-600 text-white font-extrabold text-[9px] rounded uppercase shadow-2xs">
                                  YOU
                                </span>
                              )}
                              {item.is_benchmark && (
                                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 font-semibold text-[9px] rounded border border-slate-200">
                                  Topper Benchmark
                                </span>
                              )}
                            </div>
                            <span className="text-[10.5px] text-slate-400 block">
                              ID: EM-{String(item.attempt_id || item.user_id || index + 1).slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          itemLang === 'Hindi'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-blue-50 text-blue-900 border-blue-300'
                        }`}>
                          {itemLang === 'Hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right font-black text-slate-900">
                        <span className="text-sm font-bold text-[#2271b1]">{itemScore}</span>
                        <span className="text-xs text-slate-400 font-normal"> / {itemMax}</span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className="font-extrabold text-emerald-700">{itemAcc}%</span>
                          <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-0.5">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, itemAcc)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right text-slate-600 font-medium">
                        <div className="inline-flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          <span>{formatTime(itemTime)}</span>
                        </div>
                      </td>

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
        <div className="py-14 text-center space-y-2">
          <p className="text-xs font-bold text-slate-700">No candidates found</p>
        </div>
      )}
    </div>
  );
}
