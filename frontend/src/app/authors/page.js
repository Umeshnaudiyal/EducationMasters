'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import GlobalLoader from '@/components/GlobalLoader';
import { TypingTestModal, MockTestModal } from '@/components/Modals';
import { getImageUrl } from '@/utils/image';
import allAuthorsData from '@/utils/authorsData.json';
import {
  User,
  Award,
  BookOpen,
  Briefcase,
  FileText,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Crown,
  Medal,
  Globe,
  Mail,
  Phone,
  ArrowRight,
  Users,
  Layers,
  ArrowUpDown,
  ExternalLink,
  X,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/apis/v1`
  : 'http://localhost:5001/apis/v1';

const LIMIT = 20;

const ROLE_OPTIONS = [
  { label: 'All Roles', value: 'all' },
  { label: 'Authors', value: 'author' },
  { label: 'Editors', value: 'editor' },
  { label: 'Admins', value: 'admin' },
  { label: 'Writers', value: 'writer' },
];

const SORT_OPTIONS = [
  { label: '🏆 Maximum Content First', value: 'total' },
  { label: '📝 Most Articles & Blogs', value: 'blogs' },
  { label: '💼 Most Govt. Jobs', value: 'jobs' },
  { label: '❓ Most Questions & MCQs', value: 'questions' },
  { label: '✨ Recently Joined', value: 'recent' },
  { label: '🔤 Name (A - Z)', value: 'name' },
];

// Consistent avatar initials generator
const getInitials = (name = '') => {
  if (!name) return 'EM';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return 'Sep 25';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

export default function AuthorsDirectoryPage() {
  const [authors, setAuthors] = useState([]);
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState('expiring');
  const [expiringJobs, setExpiringJobs] = useState([]);

  // Filtering & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sortBy, setSortBy] = useState('total');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAuthors, setTotalAuthors] = useState(0);

  // Modals
  const [isTypingModalOpen, setIsTypingModalOpen] = useState(false);
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Authors Data by Page
  useEffect(() => {
    let isMounted = true;

    async function fetchAuthorsByPage() {
      try {
        setLoading(true);

        const queryParams = new URLSearchParams({
          page: String(page),
          limit: String(LIMIT),
          sortBy: sortBy,
          role: selectedRole,
          search: debouncedSearch,
        });

        let res = await fetch(`${API_BASE}/authors?${queryParams.toString()}`);
        if (!res.ok) {
          res = await fetch(`${API_BASE}/users/authors?${queryParams.toString()}`);
        }

        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && json.data && Array.isArray(json.data.authors)) {
            setAuthors(json.data.authors || []);
            setPlatformStats(json.data.platformStats || null);
            setTotalPages(json.data.pagination?.totalPages || 1);
            setTotalAuthors(json.data.pagination?.totalAuthors || 0);
            return;
          }
        }

        // Full 351 real authors dataset fallback
        if (isMounted) {
          let list = [...allAuthorsData];

          // Filter by Role
          if (selectedRole !== 'all') {
            list = list.filter(
              (a) => a.role === selectedRole || (selectedRole === 'admin' && a.role === 'superadmin')
            );
          }

          // Filter by Search
          if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase().trim();
            list = list.filter(
              (a) =>
                (a.name && a.name.toLowerCase().includes(q)) ||
                (a.nicename && a.nicename.toLowerCase().includes(q)) ||
                (a.email && a.email.toLowerCase().includes(q)) ||
                (a.slug && a.slug.toLowerCase().includes(q)) ||
                (a.bio && a.bio.toLowerCase().includes(q))
            );
          }

          // Sort by Option
          if (sortBy === 'blogs') list.sort((a, b) => b.stats.blogs - a.stats.blogs);
          else if (sortBy === 'jobs') list.sort((a, b) => b.stats.jobs - a.stats.jobs);
          else if (sortBy === 'questions') list.sort((a, b) => b.stats.questions - a.stats.questions);
          else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
          else list.sort((a, b) => b.stats.total - a.stats.total);

          const total = list.length;
          const pages = Math.ceil(total / LIMIT) || 1;
          const startIndex = (page - 1) * LIMIT;
          const paginatedList = list.slice(startIndex, startIndex + LIMIT);

          setAuthors(paginatedList);
          setTotalAuthors(total);
          setTotalPages(pages);

          setPlatformStats({
            totalAuthors: allAuthorsData.length,
            activeAuthors: allAuthorsData.filter((a) => a.stats.total > 0).length,
            totalContentPublished: allAuthorsData.reduce((sum, a) => sum + a.stats.total, 0),
            totalBlogs: allAuthorsData.reduce((sum, a) => sum + a.stats.blogs, 0),
            totalJobs: allAuthorsData.reduce((sum, a) => sum + a.stats.jobs, 0),
            totalAdmitCards: allAuthorsData.reduce((sum, a) => sum + a.stats.admitCards, 0),
            totalResults: allAuthorsData.reduce((sum, a) => sum + a.stats.results, 0),
            totalQuestions: allAuthorsData.reduce((sum, a) => sum + a.stats.questions, 0),
          });
        }
      } catch (err) {
        console.error('Error fetching authors:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    async function fetchSidebarJobs() {
      try {
        const res = await fetch(`${API_BASE}/jobs/expiring-soon?limit=6`);
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data)) {
          setExpiringJobs(json.data);
        }
      } catch (err) {
        console.error('Error fetching expiring jobs:', err);
      }
    }

    fetchAuthorsByPage();
    fetchSidebarJobs();
  }, [page, sortBy, selectedRole, debouncedSearch]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const getPaginationItems = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const startItem = totalAuthors === 0 ? 0 : (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, totalAuthors);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. Header Navigation */}
      <Header
        onOpenTypingModal={() => setIsTypingModalOpen(true)}
      />

      {/* 2. Live Announcement Ticker */}
      <LiveTicker />

      {/* 3. Main Page Container with Standard 3-Column Layout Matching Production */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-5 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-5 items-start">
          
          {/* ============================================================== */}
          {/* LEFT COLUMN: AD BANNER & SPONSORED HIGHLIGHT (xl:col-span-2) */}
          {/* ============================================================== */}
          <aside className="hidden xl:block xl:col-span-2 sticky top-20">
            <div className="bg-[#e7f9ee] border border-[#a3e6be] rounded border-dashed p-4 min-h-[600px] flex flex-col items-center justify-between text-center relative overflow-hidden group">
              <div className="w-full flex items-center justify-between text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                <span>Available at</span>
                <span className="font-extrabold text-xs">GoDaddy</span>
              </div>

              <div className="my-auto space-y-4">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto shadow-md">
                  Go
                </div>
                <h4 className="font-black text-slate-900 text-base leading-tight">
                  GET A .AI DOMAIN NAME.
                </h4>
                <div className="text-2xl font-black text-emerald-800">.AI</div>
                <button className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-5 py-2 rounded transition shadow uppercase cursor-pointer">
                  Start Today
                </button>
              </div>

              <span className="text-[10px] text-slate-400">Sponsored Banner</span>
            </div>
          </aside>

          {/* ============================================================== */}
          {/* CENTER COLUMN: AUTHORS DIRECTORY, 5 STATS & 5-COL GRID (7/12) */}
          {/* ============================================================== */}
          <main className="col-span-12 lg:col-span-8 xl:col-span-7 space-y-4">
            
            {/* Breadcrumb at Middle (Directly above Center Content) */}
            <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium overflow-x-auto whitespace-nowrap pb-1">
              <Link href="/" className="hover:text-blue-600 text-blue-600 underline">
                Home
              </Link>
              <span>›</span>
              <span className="text-slate-900 font-bold">Authors</span>
              {page > 1 && <span className="text-slate-500 font-normal">› Page {page}</span>}
            </div>

            {/* DIRECTORY OVERVIEW CARD - MATCHING EXACT PRODUCTION CARD IN SCREENSHOT */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 relative overflow-hidden transition hover:shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>EducationMasters Authors & Contributors</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Verified educators, exam researchers, and content specialists powering educational updates across India.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full whitespace-nowrap shadow-2xs">
                  🏆 Ranked by Content
                </span>
              </div>

              {/* 5 Distinct Metric Chips in a Single Row Matching Production Screenshot */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-3 border-t border-slate-100">
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2.5 text-center">
                  <span className="text-[10.5px] text-slate-500 font-semibold block">Total Authors</span>
                  <span className="text-lg sm:text-xl font-bold text-slate-900 block mt-0.5">
                    {platformStats?.totalAuthors || 351}
                  </span>
                </div>

                <div className="bg-orange-50/90 border border-orange-200/80 rounded-xl p-2.5 text-center">
                  <span className="text-[10.5px] text-orange-700 font-semibold block">Govt. Jobs</span>
                  <span className="text-lg sm:text-xl font-bold text-orange-700 block mt-0.5">
                    {platformStats?.totalJobs?.toLocaleString() || '1,066+'}
                  </span>
                </div>

                <div className="bg-blue-50/90 border border-blue-200/80 rounded-xl p-2.5 text-center">
                  <span className="text-[10.5px] text-blue-700 font-semibold block">Blogs & Articles</span>
                  <span className="text-lg sm:text-xl font-bold text-blue-700 block mt-0.5">
                    {platformStats?.totalBlogs?.toLocaleString() || '2,906+'}
                  </span>
                </div>

                <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 text-center">
                  <span className="text-[10.5px] text-amber-800 font-semibold block">Admit Cards</span>
                  <span className="text-lg sm:text-xl font-bold text-amber-700 block mt-0.5">
                    {platformStats?.totalAdmitCards?.toLocaleString() || '120'}
                  </span>
                </div>

                <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-2.5 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10.5px] text-emerald-700 font-semibold block">Exam Results</span>
                  <span className="text-lg sm:text-xl font-bold text-emerald-700 block mt-0.5">
                    {platformStats?.totalResults?.toLocaleString() || '103'}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter, Search & Sorting Controls */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search author by name, username (@nicename), or email..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Role Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none">
                  {ROLE_OPTIONS.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => {
                        setSelectedRole(role.value);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                        selectedRole === role.value
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                    className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between text-[11.5px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
                <div>
                  Showing <strong className="text-slate-800">{startItem}-{endItem}</strong> of{' '}
                  <strong className="text-slate-800">{totalAuthors}</strong> authors (Page {page} of {totalPages})
                  {debouncedSearch && <span> for &ldquo;{debouncedSearch}&rdquo;</span>}
                </div>
                <div className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                  5 per row • 20 per page
                </div>
              </div>
            </div>

            {/* 4. Authors Grid - Exactly 5 Authors Per Row on Desktop */}
            {loading ? (
              <GlobalLoader
                text="Loading Authors Directory..."
                subtext={`Fetching page ${page} of ${totalPages} with real-time stats`}
                minHeight="min-h-[400px]"
              />
            ) : authors.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-2xl mx-auto">
                  🔍
                </div>
                <h3 className="text-base font-bold text-slate-800">No authors match your filter</h3>
                <p className="text-xs text-slate-500">Try changing your search query or selected role.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRole('all');
                    setSortBy('total');
                    setPage(1);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 items-stretch">
                {authors.map((author, index) => {
                  const authorRank = author.rank || (page - 1) * LIMIT + index + 1;
                  const isTop1 = authorRank === 1;
                  const isTop2 = authorRank === 2;
                  const isTop3 = authorRank === 3;
                  const avatarUrl = getImageUrl(author.image, null);
                  const authorSlug = author.slug || author.nicename || author._id;

                  return (
                    <article
                      key={author._id || index}
                      className={`group relative flex flex-col justify-between bg-white rounded-2xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden p-3 ${
                        isTop1
                          ? 'border-amber-300 ring-2 ring-amber-400/20 bg-gradient-to-b from-amber-50/30 via-white to-white'
                          : isTop2
                          ? 'border-slate-300 ring-2 ring-slate-400/15'
                          : isTop3
                          ? 'border-orange-200 ring-2 ring-orange-400/15'
                          : 'border-slate-200/80 hover:border-blue-400'
                      }`}
                    >
                      {/* Top Bar: Rank & Role Pill */}
                      <div className="flex items-center justify-between gap-1.5 pb-1">
                        {isTop1 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-2xs">
                            <Crown className="w-2.5 h-2.5" />
                            <span>#1 Top</span>
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-2xs">
                            <Medal className="w-2.5 h-2.5" />
                            <span>#2 Master</span>
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-2xs">
                            <Medal className="w-2.5 h-2.5" />
                            <span>#3 Senior</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            #{authorRank}
                          </span>
                        )}

                        <span
                          className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            author.role === 'admin' || author.role === 'superadmin'
                              ? 'bg-orange-100 text-orange-700'
                              : author.role === 'editor'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {author.role || 'Author'}
                        </span>
                      </div>

                      {/* Author Avatar - Square/Rounded-2xl with verified check matching screenshot */}
                      <div className="flex flex-col items-center text-center my-2 space-y-2">
                        <Link href={`/author/${authorSlug}`} className="relative group/avatar cursor-pointer">
                          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-blue-600 p-0.5 shadow-2xs group-hover/avatar:scale-105 transition-transform duration-300">
                            <div className="w-full h-full bg-white rounded-[14px] overflow-hidden flex items-center justify-center">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={author.name}
                                  className="w-full h-full object-cover rounded-[14px]"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextSibling) {
                                      e.currentTarget.nextSibling.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-full h-full rounded-[14px] bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-black text-lg flex items-center justify-center ${
                                  avatarUrl ? 'hidden' : 'flex'
                                }`}
                              >
                                {getInitials(author.name)}
                              </div>
                            </div>
                          </div>

                          {/* Orange Checkmark Badge Matching Screenshot */}
                          <div
                            className="absolute -bottom-1 -right-1 bg-orange-500 text-white rounded-full p-0.5 border-2 border-white shadow-xs"
                            title="Verified Author Profile"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        </Link>

                        {/* Name & Handle */}
                        <div className="w-full space-y-0.5">
                          <Link href={`/author/${authorSlug}`}>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate leading-snug">
                              {author.name}
                            </h3>
                          </Link>
                          <p className="text-[10px] text-slate-400 truncate">
                            @{author.nicename || authorSlug}
                          </p>
                        </div>

                        {/* Bio snippet */}
                        <p
                          className="text-[10.5px] text-slate-500 line-clamp-2 leading-relaxed h-7 text-center"
                          title={author.bio || 'Verified EducationMasters contributor.'}
                        >
                          {author.bio || 'Education specialist & verified content researcher.'}
                        </p>
                      </div>

                      {/* Mini Stat Chips (Matching Image 3 Theme Colors) */}
                      <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100 space-y-1.5 my-1">
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="text-slate-500 font-semibold">Total Posts:</span>
                          <span className="font-bold text-xs text-slate-900">
                            {author.stats?.total?.toLocaleString() || 0}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-[9.5px] text-center font-bold">
                          <div className="bg-blue-50/80 text-blue-700 p-1 rounded border border-blue-100/60">
                            <span className="text-[8px] text-blue-500 block uppercase font-normal">Blogs</span>
                            {author.stats?.blogs || 0}
                          </div>
                          <div className="bg-orange-50/80 text-orange-700 p-1 rounded border border-orange-100/60">
                            <span className="text-[8px] text-orange-500 block uppercase font-normal">Jobs</span>
                            {author.stats?.jobs || 0}
                          </div>
                          <div className="bg-emerald-50/80 text-emerald-700 p-1 rounded border border-emerald-100/60">
                            <span className="text-[8px] text-emerald-500 block uppercase font-normal">MCQs</span>
                            {author.stats?.questions || 0}
                          </div>
                        </div>
                      </div>

                      {/* Author Direct Links (Website, Email, Phone, Social) */}
                      {(author.website || author.email || author.phone || author.twitter || author.linkedin || author.facebook || author.instagram || author.youtube) && (
                        <div className="flex items-center justify-center gap-1.5 py-1.5 border-t border-slate-100/90 flex-wrap">
                          {author.website && (
                            <a
                              href={author.website.startsWith('http') ? author.website : `https://${author.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-5.5 h-5.5 rounded-md bg-slate-100/80 hover:bg-blue-100 text-slate-600 hover:text-blue-600 flex items-center justify-center transition hover:scale-110 shadow-2xs"
                              title={`Website: ${author.website}`}
                            >
                              <Globe className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {author.email && (
                            <a
                              href={`mailto:${author.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-5.5 h-5.5 rounded-md bg-slate-100/80 hover:bg-emerald-100 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition hover:scale-110 shadow-2xs"
                              title={`Email: ${author.email}`}
                            >
                              <Mail className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {author.phone && (
                            <a
                              href={`tel:${author.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-5.5 h-5.5 rounded-md bg-slate-100/80 hover:bg-orange-100 text-slate-600 hover:text-orange-600 flex items-center justify-center transition hover:scale-110 shadow-2xs"
                              title={`Phone: ${author.phone}`}
                            >
                              <Phone className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {author.twitter && (
                            <a
                              href={author.twitter.startsWith('http') ? author.twitter : `https://twitter.com/${author.twitter.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-5.5 h-5.5 rounded-md bg-slate-100/80 hover:bg-sky-100 text-slate-600 hover:text-sky-600 flex items-center justify-center transition hover:scale-110 shadow-2xs"
                              title="Twitter / X"
                            >
                              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                            </a>
                          )}
                          {author.linkedin && (
                            <a
                              href={author.linkedin.startsWith('http') ? author.linkedin : `https://linkedin.com/in/${author.linkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-5.5 h-5.5 rounded-md bg-slate-100/80 hover:bg-blue-100 text-slate-600 hover:text-blue-700 flex items-center justify-center transition hover:scale-110 shadow-2xs"
                              title="LinkedIn"
                            >
                              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.262-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                              </svg>
                            </a>
                          )}
                          {author.facebook && (
                            <a
                              href={author.facebook.startsWith('http') ? author.facebook : `https://facebook.com/${author.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-5.5 h-5.5 rounded-md bg-slate-100/80 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition hover:scale-110 shadow-2xs"
                              title="Facebook"
                            >
                              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              </svg>
                            </a>
                          )}
                          {author.instagram && (
                            <a
                              href={author.instagram.startsWith('http') ? author.instagram : `https://instagram.com/${author.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-5.5 h-5.5 rounded-md bg-slate-100/80 hover:bg-pink-100 text-slate-600 hover:text-pink-600 flex items-center justify-center transition hover:scale-110 shadow-2xs"
                              title="Instagram"
                            >
                              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                              </svg>
                            </a>
                          )}
                          {author.youtube && (
                            <a
                              href={author.youtube.startsWith('http') ? author.youtube : `https://youtube.com/${author.youtube}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-5.5 h-5.5 rounded-md bg-slate-100/80 hover:bg-red-100 text-slate-600 hover:text-red-600 flex items-center justify-center transition hover:scale-110 shadow-2xs"
                              title="YouTube"
                            >
                              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                              </svg>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Card Button */}
                      <div className="pt-2 mt-auto">
                        <Link
                          href={`/author/${authorSlug}`}
                          className="w-full inline-flex items-center justify-center gap-1 py-1.5 px-2.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-semibold rounded-lg transition-colors group-hover:bg-blue-600 group-hover:text-white shadow-2xs"
                        >
                          <span>View Profile</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* 5. PAGE-WISE PAGINATION BAR (Next Page / Previous Page / Numbered Controls) */}
            {!loading && totalPages > 1 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-5">
                <div className="text-xs text-slate-600 font-medium">
                  Showing <strong className="text-slate-900 font-bold">{startItem}</strong> to{' '}
                  <strong className="text-slate-900 font-bold">{endItem}</strong> of{' '}
                  <strong className="text-slate-900 font-bold">{totalAuthors}</strong> Total Authors
                </div>

                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden text-xs shadow-xs">
                  {/* Previous Page Button */}
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="px-3.5 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200 font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Page</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="hidden sm:inline-flex items-center">
                    {getPaginationItems(page, totalPages).map((item, idx) => {
                      if (item === '...') {
                        return (
                          <span
                            key={`dots-${idx}`}
                            className="px-3 py-2 text-slate-400 border-r border-slate-200 font-medium select-none"
                          >
                            ...
                          </span>
                        );
                      }

                      const isCurrent = item === page;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handlePageChange(item)}
                          className={`px-3.5 py-2 font-bold transition border-r border-slate-200 last:border-r-0 cursor-pointer ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Page Button */}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="px-3.5 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next Page</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </main>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: JOBS EXPIRING SOON & SPONSORED BANNER (3/12)    */}
          {/* ============================================================== */}
          <aside className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-5 sticky top-20">
            
            {/* Sidebar Tab Card Matching Production Screenshot */}
            <div className="bg-[#f0f2f5] border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
              <div className="flex items-center bg-[#e4e7ec] border-b border-slate-300">
                <button
                  onClick={() => setSidebarTab('expiring')}
                  className={`flex-1 py-3 px-3 text-center text-xs sm:text-sm whitespace-nowrap font-medium transition cursor-pointer ${
                    sidebarTab === 'expiring'
                      ? 'bg-[#f0f2f5] text-slate-900 font-bold'
                      : 'text-blue-600 hover:text-blue-700 font-semibold'
                  }`}
                >
                  Jobs Expiring Soon
                </button>
                <button
                  onClick={() => setSidebarTab('mcq')}
                  className={`flex-1 py-3 px-3 text-center text-xs sm:text-sm whitespace-nowrap font-medium transition cursor-pointer ${
                    sidebarTab === 'mcq'
                      ? 'bg-[#f0f2f5] text-slate-900 font-bold'
                      : 'text-blue-600 hover:text-blue-700 font-semibold'
                  }`}
                >
                  MCQ Questions
                </button>
              </div>

              <div className="p-3.5 bg-[#f0f2f5]">
                {sidebarTab === 'expiring' ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] sm:text-xs mb-2.5 pb-2 border-b border-slate-300 gap-1.5">
                      <span className="text-slate-700 font-medium whitespace-nowrap">
                        {expiringJobs.length || 6} Jobs expiring in 30 Days
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href="/jobs-expiring-in-30-days"
                          className="text-blue-600 font-semibold hover:underline whitespace-nowrap text-[11px] sm:text-xs"
                        >
                          View All
                        </Link>
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1 leading-none whitespace-nowrap shadow-2xs">
                          <span>📰</span>
                          <span>Jobs</span>
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-300/80">
                      {expiringJobs.map((item) => {
                        const miniMediaUrl = getImageUrl(item.featured_media || item.image);

                        return (
                          <Link
                            key={item._id}
                            href={`/job/${item.slug || item._id}`}
                            className="py-2.5 first:pt-0.5 last:pb-0.5 flex items-start gap-2.5 group transition"
                          >
                            <div className="w-20 h-14 bg-white rounded-lg border border-slate-300 overflow-hidden shrink-0 shadow-2xs">
                              <img
                                src={miniMediaUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                onError={(e) => {
                                  if (!e.currentTarget.dataset.fallback) {
                                    e.currentTarget.dataset.fallback = 'true';
                                    e.currentTarget.src = '/job-search.png';
                                  } else {
                                    e.currentTarget.style.display = 'none';
                                  }
                                }}
                              />
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                {item.title}
                              </h4>
                              <div className="text-[10.5px] text-slate-500 font-normal flex items-center justify-between mt-1">
                                <span>Last Date: {formatShortDate(item.app_ends)}</span>
                                <span className="text-blue-600 font-bold">Jobs</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600 py-6 text-center space-y-2">
                    <p className="font-bold text-slate-800 text-base">1000+ Subject-Wise MCQs</p>
                    <p className="text-xs text-slate-500">
                      Practice History, Polity, General Knowledge, and Current Affairs MCQs daily.
                    </p>
                    <Link
                      href="/mcq-questions"
                      className="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-xs"
                    >
                      Explore MCQs &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Authentic Corcoran School Sponsored Banner matching Screenshot */}
            <div className="bg-[#fff9e6] border border-[#fde68a] rounded-xl p-4 text-center relative overflow-hidden shadow-2xs">
              <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider mb-2">
                Sponsored Partner
              </div>
              <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2 shadow-xs">
                🎓
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                The Corcoran School
              </h4>
              <p className="text-[11px] text-slate-600 mt-1">
                Early education for tomorrow. Infant and Toddler programs now enrolling.
              </p>
              <button className="mt-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition shadow-xs cursor-pointer">
                Learn More
              </button>
            </div>

          </aside>

        </div>
      </div>

      {/* 6. Footer */}
      <Footer />

      {/* 7. Global Feature Modals */}
      <TypingTestModal
        isOpen={isTypingModalOpen}
        onClose={() => setIsTypingModalOpen(false)}
      />

      <MockTestModal
        isOpen={isMockModalOpen}
        onClose={() => setIsMockModalOpen(false)}
      />
    </div>
  );
}
