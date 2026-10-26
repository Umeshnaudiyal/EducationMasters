'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Briefcase,
  ArrowRight,
  BookOpen,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  HelpCircle,
} from 'lucide-react';
import StateLink from '@/components/StateLink';
import DepartmentLink from '@/components/DepartmentLink';
import { INDIAN_STATES_DATA } from '@/utils/indianStatesData';
import { getImageUrl } from '@/utils/image';
import { API_BASE } from '@/utils/api';

const LIMIT = 12;

export default function StateJobsClient({ stateSlug, initialState = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get('search') || '';

  const [jobs, setJobs] = useState([]);
  const [expiringJobs, setExpiringJobs] = useState([]);
  const [sidebarMcqs, setSidebarMcqs] = useState([]);
  const [loadingMcqs, setLoadingMcqs] = useState(false);
  const [sidebarMcqAnswers, setSidebarMcqAnswers] = useState({});
  const [revealedSidebarAnswers, setRevealedSidebarAnswers] = useState({});
  const [stateProfile, setStateProfile] = useState(
    initialState ? { state: initialState } : null
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [rightTab, setRightTab] = useState(searchParams.get('tab') || 'mcq');
  const [showFullJobDesc, setShowFullJobDesc] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);

  // Compute Canonical State Info
  const stateCanonical = useMemo(() => {
    const found = INDIAN_STATES_DATA.find(
      (s) =>
        s.slug === stateSlug ||
        s.name.toLowerCase() === stateSlug.toLowerCase() ||
        (s.aliases && s.aliases.includes(stateSlug))
    );
    return (
      found || {
        name: stateSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        slug: stateSlug,
      }
    );
  }, [stateSlug]);

  const stateDisplayName = stateProfile?.state?.name || stateCanonical.name;

  // Load state profile
  useEffect(() => {
    const loadStateInfo = async () => {
      try {
        const profileRes = await fetch(`${API_BASE}/states/public/${encodeURIComponent(stateSlug)}`)
          .then((r) => r.json())
          .catch(() => null);

        if (profileRes?.success && profileRes.data) {
          setStateProfile(profileRes.data);
        }
      } catch (err) {
        console.error('Error loading state profile:', err);
      }
    };
    loadStateInfo();
  }, [stateSlug]);

  // Fetch Jobs function
  const fetchJobs = useCallback(
    async (pageNum, search) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: LIMIT.toString(),
          state: stateSlug,
        });

        if (search && search.trim()) {
          params.append('search', search.trim());
        }

        const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.data) {
          setJobs(data.data);
          setTotalPages(data.pages || 1);
          setTotalJobs(data.total || 0);
        } else {
          setJobs([]);
          setTotalPages(1);
          setTotalJobs(0);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    },
    [stateSlug]
  );

  const fetchExpiringJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs/expiring-soon?limit=6&days=30&state=${encodeURIComponent(stateSlug)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setExpiringJobs(data.data);
      } else {
        setExpiringJobs([]);
      }
    } catch (err) {
      console.error('Error fetching expiring jobs:', err);
      setExpiringJobs([]);
    }
  }, [stateSlug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchJobs(page, searchQuery);
  }, [page, searchQuery, fetchJobs]);

  useEffect(() => {
    fetchExpiringJobs();
  }, [fetchExpiringJobs]);

  const fetchSidebarMcqs = useCallback(async () => {
    try {
      setLoadingMcqs(true);
      const targetStateName = stateProfile?.state?.name || stateCanonical.name || stateSlug;

      // 1. Try fetching by state name or slug
      let res = await fetch(`${API_BASE}/questions?limit=5&state=${encodeURIComponent(stateSlug)}`);
      let data = await res.json();

      // If empty, try by display name
      if ((!data.success || !Array.isArray(data.data) || data.data.length === 0) && targetStateName) {
        res = await fetch(`${API_BASE}/questions?limit=5&state=${encodeURIComponent(targetStateName)}`);
        data = await res.json();
      }

      // If still empty, fall back to General Knowledge
      if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
        res = await fetch(`${API_BASE}/questions?limit=5&subject=general-knowledge`);
        data = await res.json();
      }

      // If still empty, fetch standard pool
      if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
        res = await fetch(`${API_BASE}/questions?limit=5`);
        data = await res.json();
      }

      if (data.success && Array.isArray(data.data)) {
        setSidebarMcqs(data.data.slice(0, 5));
      } else {
        setSidebarMcqs([]);
      }
    } catch (err) {
      console.error('Error fetching sidebar MCQs:', err);
      setSidebarMcqs([]);
    } finally {
      setLoadingMcqs(false);
    }
  }, [stateSlug, stateProfile, stateCanonical]);

  useEffect(() => {
    fetchSidebarMcqs();
  }, [fetchSidebarMcqs]);

  const cleanContent = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getCorrectIndex = (q) => {
    let correctIndex = -1;
    if (Array.isArray(q.options)) {
      correctIndex = q.options.findIndex((opt) => opt && opt.is_correct);
    }
    if (correctIndex === -1 && q.correct_answer) {
      const match = String(q.correct_answer).match(/Option\s*([0-9]+)/i);
      if (match) {
        correctIndex = parseInt(match[1], 10) - 1;
      } else if (['A', 'B', 'C', 'D'].includes(String(q.correct_answer).trim().toUpperCase())) {
        correctIndex = String(q.correct_answer).trim().toUpperCase().charCodeAt(0) - 65;
      }
    }
    return correctIndex;
  };

  const handleSelectSidebarOption = (qId, optIdx) => {
    setSidebarMcqAnswers((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
    setRevealedSidebarAnswers((prev) => ({
      ...prev,
      [qId]: true,
    }));
  };

  const toggleRevealSidebarAnswer = (qId) => {
    setRevealedSidebarAnswers((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setSearchInput('');
    setPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sep 30, 2026';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? dateStr
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return 'Sep 14';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? dateStr
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getPaginationItems = (current, total) => {
    if (total <= 9) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, 6, '...', total - 1, total];
    }
    if (current >= total - 3) {
      return [1, 2, '...', total - 5, total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 2, current - 1, current, current + 1, current + 2, '...', total];
  };

  const startItem = totalJobs === 0 ? 0 : (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, totalJobs);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      <Header />

      {/* Main Container with Ad Slits */}
      <div className="max-w-[1550px] mx-auto px-3 sm:px-4 py-6 flex-1 w-full bg-white">
        {/* 4-COLUMN RESPONSIVE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* 1. LEFT SKYSCRAPER AD SPACE */}
          <aside className="hidden xl:block xl:col-span-2 sticky top-20">
            <div className="bg-[#e7f9ee] border border-[#a3e6be] rounded border-dashed p-4 min-h-[600px] flex flex-col items-center justify-between text-center relative overflow-hidden group">
              <div className="w-full flex items-center justify-between text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                <span>Available at</span>
                <span className="font-bold text-xs">GoDaddy</span>
              </div>

              <div className="my-auto space-y-4">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto shadow-md">
                  Go
                </div>
                <h4 className="font-black text-slate-900 text-base leading-tight">
                  GET A .AI DOMAIN NAME.
                </h4>
                <div className="text-2xl font-black text-emerald-800">.AI</div>
                <button className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-5 py-2 rounded transition shadow uppercase">
                  Start Today
                </button>
              </div>

              <span className="text-[10px] text-slate-400">Sponsored Banner</span>
            </div>
          </aside>

          {/* 2. MAIN JOBS STREAM */}
          <main className="col-span-1 lg:col-span-8 xl:col-span-7 space-y-4">

            {/* Breadcrumb */}
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1 font-medium flex-wrap">
              <Link href="/" className="hover:text-blue-600 text-blue-600 underline">
                Home
              </Link>
              <span>›</span>
              <Link href="/state" className="hover:text-blue-600 text-blue-600 underline">
                State Government Portals
              </Link>
              <span>›</span>
              <Link href={`/state/${stateSlug}`} className="hover:text-blue-600 text-blue-600 underline">
                {stateDisplayName}
              </Link>
              <span>›</span>
              <span className="text-slate-800 font-bold">Jobs</span>
            </div>

            {/* Plain White Title Header (Normal Black Heading) */}
            <div className="border-b border-slate-200 pb-3">
              <h1 className="text-2xl sm:text-2xl font-semibold text-slate-900 tracking-tight leading-tight">
                {stateProfile?.state?.jobs_title?.trim() || `${stateDisplayName} Government Jobs 2026`}
              </h1>
              {stateProfile?.state?.jobs_subtitle?.trim() && (
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {stateProfile.state.jobs_subtitle.trim()}
                </p>
              )}
            </div>

            {/* Active search filter banner if user filtered by search */}
            {searchQuery && (
              <div className="flex items-center justify-between bg-blue-50/60 border border-blue-200/60 rounded-lg px-3 py-2 text-xs text-blue-900">
                <span>
                  Showing results for &ldquo;<strong>{searchQuery}</strong>&rdquo; in {stateDisplayName}
                </span>
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Dynamic State Job Description / Recruitment Guidelines Card */}
            {stateProfile?.state?.job_description && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <FileText size={14} className="text-blue-600" />
                    <span>{stateDisplayName} Government Recruitment &amp; Vacancy Guidelines</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFullJobDesc(!showFullJobDesc)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{showFullJobDesc ? 'Show Less' : 'Read Overview'}</span>
                    {showFullJobDesc ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
                <div className={`p-4 text-xs sm:text-sm text-slate-700 leading-relaxed transition-all ${showFullJobDesc ? '' : 'max-h-36 overflow-hidden relative'
                  }`}>
                  <div
                    className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-li:my-0.5"
                    dangerouslySetInnerHTML={{ __html: stateProfile.state.job_description }}
                  />
                  {!showFullJobDesc && (
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => setShowFullJobDesc(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold bg-white/95 px-3.5 py-1 rounded-full border border-blue-200 shadow-2xs hover:shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Read Full {stateDisplayName} Guidelines</span>
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Jobs List */}
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="bg-white p-4 border-b border-slate-200 animate-pulse flex flex-col sm:flex-row gap-4"
                  >
                    <div className="w-full sm:w-72 h-44 bg-slate-200 rounded shrink-0"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              /* Empty State */
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-3 my-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                  <Briefcase size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  No active job recruitments found for {stateDisplayName}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  There are currently no active vacancies published for {stateDisplayName}. Check out all national &amp; central government recruitments or practice GK MCQs.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
                  <Link
                    href="/jobs"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Briefcase size={12} />
                    <span>View All India Jobs</span>
                  </Link>
                  <Link
                    href={`/state/${stateSlug}/mcq-questions/`}
                    className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen size={12} />
                    <span>Practice {stateDisplayName} GK</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {jobs.map((job) => {
                  const mediaUrl = getImageUrl(job.featured_media);

                  return (
                    <article
                      key={job._id}
                      className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 sm:gap-5 group"
                    >
                      {/* Left Thumbnail Image */}
                      <div className="w-full sm:w-72 h-44 sm:h-44 border border-slate-200 rounded-sm overflow-hidden bg-slate-50 shrink-0 relative">
                        <img
                          src={mediaUrl}
                          alt={job.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

                      {/* Right Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link href={`/job/${job.slug || job._id}`}>
                            <h2 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                              {job.title}
                            </h2>
                          </Link>

                          {/* Meta Information Line */}
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500 font-medium mt-1">
                            <span>
                              By{' '}
                              <Link
                                href={`/author/${job.author?.nicename || job.author?.name || 'DigitalDeepak'}`}
                                className="text-slate-700 font-medium hover:text-blue-600 hover:underline"
                              >
                                {job.author?.name || 'Mohit'}
                              </Link>
                            </span>
                            <span>|</span>
                            <DepartmentLink job={job} />
                            <span>|</span>
                            <span>{formatDate(job.created_at || job.createdAt)}</span>
                            <span>|</span>
                            <StateLink state={job.state} dept={job.dept} defaultStateSlug={stateSlug} hideDeptFallback={true} />
                          </div>

                          {/* Excerpt Snippet */}
                          <p className="text-xs sm:text-sm text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                            {job.description?.replace(/<[^>]*>?/gm, '') ||
                              `Apply online for ${job.title}. Check complete eligibility, fees, vacancy details, and official notification.`}
                          </p>
                        </div>

                        {/* Last Date Highlight */}
                        <div className="mt-4 text-xs text-slate-700">
                          Last Date:{' '}
                          <span className="text-slate-900 font-semibold">
                            {formatDate(job.app_ends || job.dates?.last_date)}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalJobs > 0 && (
              <div className="pt-6 pb-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs sm:text-sm text-slate-500 font-medium">
                  Showing {startItem} to {endItem} of {totalJobs} results
                </div>

                <div className="inline-flex items-center rounded-md border border-slate-200 bg-white overflow-hidden text-xs sm:text-sm shadow-xs">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200 transition font-medium"
                    aria-label="Previous Page"
                  >
                    ‹
                  </button>

                  {getPaginationItems(page, totalPages).map((item, index) => {
                    if (item === '...') {
                      return (
                        <span
                          key={`dots-${index}`}
                          className="px-3 py-1.5 text-slate-400 border-r border-slate-200 font-medium select-none"
                        >
                          ...
                        </span>
                      );
                    }

                    const isCurrent = item === page;
                    return (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`px-3 py-1.5 transition border-r border-slate-200 last:border-r-0 ${isCurrent
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-blue-600 hover:bg-slate-50 font-medium'
                          }`}
                      >
                        {item}
                      </button>
                    );
                  })}

                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition font-medium"
                    aria-label="Next Page"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* 3. RIGHT SIDEBAR WIDGET */}
          <aside className="col-span-1 lg:col-span-4 xl:col-span-3 space-y-6 sticky top-20">
            <div className="bg-[#f0f2f5] border border-slate-300 rounded-lg overflow-hidden">
              <div className="flex items-center bg-[#e4e7ec] border-b border-slate-300">
                <button
                  onClick={() => setRightTab('expiring')}
                  className={`flex-1 py-3.5 px-3 text-center text-xs sm:text-sm whitespace-nowrap font-normal transition ${rightTab === 'expiring'
                    ? 'bg-[#f0f2f5] text-slate-900 rounded-tl-lg font-medium'
                    : 'text-blue-600 hover:text-blue-700 font-medium'
                    }`}
                >
                  Jobs Expiring Soon
                </button>
                <button
                  onClick={() => setRightTab('mcq')}
                  className={`flex-1 py-3.5 px-3 text-center text-xs sm:text-sm whitespace-nowrap font-normal transition ${rightTab === 'mcq'
                    ? 'bg-[#f0f2f5] text-slate-900 rounded-tr-lg font-medium'
                    : 'text-blue-600 hover:text-blue-700 font-medium'
                    }`}
                >
                  MCQ Questions
                </button>
              </div>

              <div className="p-4 bg-[#f0f2f5]">
                {rightTab === 'expiring' ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] sm:text-xs mb-3 pb-2.5 border-b border-slate-300 gap-1.5">
                      <span className="text-slate-700 font-normal whitespace-nowrap">
                        {expiringJobs.length > 0
                          ? `${expiringJobs.length} ${stateDisplayName} Jobs expiring in 30 Days`
                          : `0 ${stateDisplayName} Jobs expiring in 30 Days`}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/jobs-expiring-in-30-days?state=${encodeURIComponent(stateSlug)}`}
                          className="text-blue-600 font-normal hover:underline whitespace-nowrap text-[11px] sm:text-xs"
                        >
                          View All
                        </Link>
                        <span className="bg-blue-600 text-white text-[10px] sm:text-[11px] font-normal px-1.5 py-0.5 rounded inline-flex items-center gap-1 leading-none whitespace-nowrap shadow-2xs">
                          <span>📰</span>
                          <span>Jobs</span>
                        </span>
                      </div>
                    </div>

                    {expiringJobs.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500 font-medium">
                        No active expiring jobs found for {stateDisplayName}.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-300">
                        {expiringJobs.map((item) => {
                          const miniMediaUrl = getImageUrl(item.featured_media);

                          return (
                            <Link
                              key={item._id}
                              href={`/job/${item.slug || item._id}`}
                              className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3.5 group transition"
                            >
                              <div className="w-28 sm:w-32 h-20 bg-white rounded border border-slate-300 overflow-hidden shrink-0 shadow-2xs">
                                <img
                                  src={miniMediaUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

                              <div className="flex-1 min-w-0 flex flex-col justify-between h-20">
                                <h4 className="text-xs sm:text-sm font-normal text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                  {item.title}
                                </h4>
                                <div className="text-xs text-slate-500 font-normal flex items-center justify-between mt-auto">
                                  <span>Last Date: {formatShortDate(item.app_ends)}</span>
                                  <span>Jobs</span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Header bar matching Jobs Expiring style */}
                    <div className="flex items-center justify-between text-[11px] sm:text-xs mb-3 pb-2.5 border-b border-slate-300 gap-1.5">
                      <span className="text-slate-800 font-medium whitespace-nowrap flex items-center gap-1">
                        <span>🎯</span>
                        <span>{stateDisplayName} Practice MCQs</span>
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/state/${stateSlug}/mcq-questions/`}
                          className="text-blue-600 font-normal hover:underline whitespace-nowrap text-[11px] sm:text-xs"
                        >
                          View All
                        </Link>
                        <span className="bg-emerald-600 text-white text-[10px] sm:text-[11px] font-normal px-1.5 py-0.5 rounded inline-flex items-center gap-1 leading-none whitespace-nowrap shadow-2xs">
                          <span>📚</span>
                          <span>MCQs</span>
                        </span>
                      </div>
                    </div>

                    {loadingMcqs ? (
                      /* Skeletons */
                      <div className="space-y-3">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="bg-white rounded-lg p-3 border border-slate-200 animate-pulse space-y-2">
                            <div className="h-3.5 bg-slate-200 rounded w-5/6"></div>
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              <div className="h-6 bg-slate-100 rounded"></div>
                              <div className="h-6 bg-slate-100 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : sidebarMcqs.length === 0 ? (
                      /* Fallback Empty */
                      <div className="py-6 text-center text-xs text-slate-500 font-medium space-y-2">
                        <p>No questions currently loaded for {stateDisplayName}.</p>
                        <Link
                          href={`/state/${stateSlug}/mcq-questions/`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                        >
                          <span>Explore All GK Questions</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    ) : (
                      /* 5 Interactive MCQs */
                      <div className="space-y-3">
                        {sidebarMcqs.map((q, idx) => {
                          const qId = q._id || q.sql_id || idx;
                          const correctIdx = getCorrectIndex(q);
                          const userPick = sidebarMcqAnswers[qId];
                          const hasAnswered = typeof userPick === 'number';
                          const isRevealed = !!revealedSidebarAnswers[qId];
                          const isUserCorrect = hasAnswered && userPick === correctIdx;
                          const letters = ['A', 'B', 'C', 'D'];

                          return (
                            <div
                              key={qId}
                              className="bg-white rounded-lg p-3 border border-slate-300 shadow-2xs space-y-2.5 transition hover:border-slate-400"
                            >
                              {/* Top Bar with Question Number & State Tag */}
                              <div className="flex items-center justify-between gap-1.5 text-[10px]">
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 font-bold px-1.5 py-0.5 rounded shadow-2xs">
                                  Q{idx + 1}
                                </span>
                                <span className="text-slate-400 font-medium truncate max-w-[150px]">
                                  {q.topic_name || q.subject_name || `${stateDisplayName} GK`}
                                </span>
                              </div>

                              {/* Question Content */}
                              <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 leading-snug">
                                {cleanContent(q.content || 'Practice Question')}
                              </h4>

                              {/* 4 Options Grid */}
                              {Array.isArray(q.options) && q.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                                  {q.options.slice(0, 4).map((opt, optIdx) => {
                                    const letter = letters[optIdx] || String.fromCharCode(65 + optIdx);
                                    const isThisCorrect = optIdx === correctIdx;
                                    const isThisUserPick = userPick === optIdx;

                                    let optClass = 'bg-slate-50/70 hover:bg-blue-50/50 border-slate-200 text-slate-700 hover:border-blue-300';
                                    let badgeClass = 'bg-slate-200 text-slate-700 font-bold';

                                    if (hasAnswered || isRevealed) {
                                      if (isThisCorrect) {
                                        optClass = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-medium ring-1 ring-emerald-300/60';
                                        badgeClass = 'bg-emerald-600 text-white font-bold';
                                      } else if (isThisUserPick && !isThisCorrect) {
                                        optClass = 'bg-rose-50 border-rose-300 text-rose-900 font-medium';
                                        badgeClass = 'bg-rose-600 text-white font-bold';
                                      }
                                    }

                                    return (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        onClick={() => handleSelectSidebarOption(qId, optIdx)}
                                        className={`w-full p-1.5 rounded border text-left text-xs transition flex items-center gap-1.5 cursor-pointer leading-tight ${optClass}`}
                                      >
                                        <span className={`w-4 h-4 rounded text-[9px] flex items-center justify-center shrink-0 ${badgeClass}`}>
                                          {letter}
                                        </span>
                                        <span className="truncate flex-1">{opt.text}</span>
                                        {(hasAnswered || isRevealed) && isThisCorrect && (
                                          <CheckCircle2 size={12} className="text-emerald-600 shrink-0 ml-auto" />
                                        )}
                                        {hasAnswered && isThisUserPick && !isThisCorrect && (
                                          <XCircle size={12} className="text-rose-600 shrink-0 ml-auto" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Bottom Action / Feedback Row */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                                <div>
                                  {hasAnswered ? (
                                    isUserCorrect ? (
                                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Correct!
                                      </span>
                                    ) : (
                                      <span className="font-bold text-rose-600 flex items-center gap-1">
                                        <XCircle size={12} />
                                        <span>Ans: Option {correctIdx >= 0 ? letters[correctIdx] : 'Correct'}</span>
                                      </span>
                                    )
                                  ) : isRevealed && correctIdx >= 0 ? (
                                    <span className="font-bold text-emerald-700">
                                      Ans: Option {letters[correctIdx]}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Click option to test</span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleRevealSidebarAnswer(qId)}
                                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer transition text-[11px]"
                                >
                                  {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                                  <span>{isRevealed ? 'Hide' : 'Answer'}</span>
                                </button>
                              </div>

                              {/* Explanation Callout if Revealed */}
                              {isRevealed && (q.ans_info || q.explanation) && (
                                <div className="mt-1.5 p-2 rounded bg-amber-50/80 border border-amber-200 text-[11px] text-amber-950 leading-relaxed">
                                  <span className="font-bold text-amber-900">Explanation: </span>
                                  <span>{cleanContent(q.ans_info || q.explanation)}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Load More Button -> Direct navigation to state MCQ page */}
                        <div className="pt-2">
                          <Link
                            href={`/state/${stateSlug}/mcq-questions/`}
                            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs hover:shadow transition flex items-center justify-center gap-2 group cursor-pointer"
                          >
                            <BookOpen size={14} className="shrink-0" />
                            <span>Load More {stateDisplayName} MCQs</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform shrink-0" />
                          </Link>
                          <p className="text-[10px] text-slate-500 text-center mt-1.5">
                            Practice full {stateDisplayName} General Knowledge MCQs with verified answers
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* In-Sidebar Banner Ad Slot */}
            <div className="bg-[#e7f9ee] border border-[#a3e6be] rounded border-dashed p-4 text-center relative overflow-hidden">
              <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mb-2">
                Sponsored Banner
              </div>
              <h4 className="font-bold text-slate-800 text-xs">
                Book a Helicopter in Greece
              </h4>
              <p className="text-[11px] text-slate-600 mt-1">
                Luxury charters &amp; private flight tours available online.
              </p>
              <button className="mt-3 bg-black hover:bg-zinc-800 text-white font-bold text-xs px-4 py-1.5 rounded transition shadow-sm">
                Book Now
              </button>
            </div>
          </aside>

        </div>
      </div>

      <Footer />
    </div>
  );
}
