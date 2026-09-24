'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import GlobalLoader from '@/components/GlobalLoader';
import StateLink from '@/components/StateLink';
import { getImageUrl } from '@/utils/image';
import {
  MapPin,
  Landmark,
  Users,
  Award,
  Briefcase,
  FileText,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  Building2,
  GraduationCap,
  Globe,
  Sprout,
  Calculator,
  BookOpen,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/apis/v1`
  : 'http://localhost:5001/apis/v1';

// Subject list configuration with authentic PNG icons stored in /public
const STATE_SUBJECTS = [
  { name: 'General Knowledge', slug: 'general-knowledge', iconSrc: '/gk.png' },
  { name: 'History', slug: 'history', iconSrc: '/history.png' },
  { name: 'Geography', slug: 'geography', iconSrc: '/geography.png' },
  { name: 'Politics & Polity', slug: 'polity', iconSrc: '/politics.png' },
  { name: 'Economics', slug: 'economics', iconSrc: '/economics.png' },
  { name: 'Science', slug: 'science', iconSrc: '/science.png' },
  { name: 'Mathematics', slug: 'mathematics', iconSrc: '/maths.png' },
  { name: 'English', slug: 'english', iconSrc: '/english.png' },
  { name: 'Hindi', slug: 'hindi', iconSrc: '/hindi.png' },
  { name: 'Computer & IT', slug: 'computer', iconSrc: '/computer.png' },
  { name: 'Agriculture', slug: 'agriculture', iconSrc: '/agriculture.png' },
  { name: 'Reasoning', slug: 'reasoning', iconSrc: '/reasoning.png' },
  { name: 'Sociology', slug: 'sociology', iconSrc: '/sociology.png' },
  { name: 'Humanities', slug: 'humanities', iconSrc: '/humanities.png' },
  { name: 'Philosophy', slug: 'philosophy', iconSrc: '/philosophy.png' },
  { name: 'General Awareness', slug: 'knowledge', iconSrc: '/knowledge.png' },
];

export default function StateProfilePage() {
  const params = useParams();
  const rawSlug = params?.slug ? decodeURIComponent(params.slug) : '';
  const slug = rawSlug;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [jobsLimit, setJobsLimit] = useState(8);
  const [sidebarTab, setSidebarTab] = useState('expiring');
  const [expiringJobs, setExpiringJobs] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!slug) return;

    let isMounted = true;
    async function fetchStateData() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE}/states/public/${encodeURIComponent(slug)}`);
        const json = await res.json();
        if (isMounted) {
          if (json.success && json.data) {
            setData(json.data);
          } else {
            setError(json.message || 'State profile information not found');
          }
        }
      } catch (err) {
        console.error('Error fetching state profile:', err);
        if (isMounted) setError('Failed to load state profile. Please try again.');
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

    fetchStateData();
    fetchSidebarJobs();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const state = data?.state || {};
  const stats = data?.stats || { jobs: 0, admitCards: 0, results: 0, mcqs: 500, districts: 0 };
  const allJobs = data?.jobs || [];
  const districts = data?.districts || [];
  const admitCards = data?.admitCards || [];
  const results = data?.results || [];

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Active Now';
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
    if (!dateStr) return 'Sep 30';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? dateStr
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Filter jobs based on search & category pill
  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      const matchesSearch =
        !jobSearch ||
        job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
        (job.dept && job.dept.toLowerCase().includes(jobSearch.toLowerCase()));

      if (!matchesSearch) return false;

      if (jobFilter === 'all') return true;
      if (jobFilter === 'psc') return /psc|public service|civil|group/i.test(job.title + (job.dept || ''));
      if (jobFilter === 'police') return /police|constable|si|warder/i.test(job.title + (job.dept || ''));
      if (jobFilter === 'teaching') return /teacher|tet|professor|school|college/i.test(job.title + (job.dept || ''));
      if (jobFilter === 'court') return /court|judicial|legal|stenographer/i.test(job.title + (job.dept || ''));
      return true;
    });
  }, [allJobs, jobSearch, jobFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-orange-600 selection:text-white">
      {/* 1. Header & Live Ticker */}
      <Header />
      <LiveTicker />

      {/* 2. Main Page Container with Standard 3-Column Layout */}
      <div className="max-w-[1550px] mx-auto px-3 sm:px-4 py-6 flex-1 w-full bg-white">
        {loading ? (
          <GlobalLoader
            text={`Loading ${slug.replace(/-/g, ' ')} Portal...`}
            subtext="Fetching state government jobs, general knowledge MCQs, districts and exam alerts"
            minHeight="min-h-[500px]"
          />
        ) : error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold">
              ✕
            </div>
            <h2 className="text-xl font-bold text-slate-900">{error}</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              The state page you requested could not be located. Please check the spelling or explore other state portals.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs sm:text-sm rounded-lg transition shadow-xs"
            >
              <span>Back to Home</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ============================================================== */}
            {/* 1. LEFT COLUMN: SKYSCRAPER AD SPACE (xl:col-span-2) */}
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
                  <button className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-5 py-2 rounded transition shadow uppercase">
                    Start Today
                  </button>
                </div>

                <span className="text-[10px] text-slate-400">Sponsored Banner</span>
              </div>
            </aside>

            {/* ============================================================== */}
            {/* 2. CENTER COLUMN: CLEAN STREAM WITHOUT BOXES (7/12) */}
            {/* ============================================================== */}
            <main className="col-span-12 lg:col-span-8 xl:col-span-7 space-y-8">
              {/* Breadcrumb Aligned with Content */}
              <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Link href="/" className="hover:text-blue-600 text-blue-600 underline">
                  Home
                </Link>
                <span>›</span>
                <span className="text-slate-500">States</span>
                <span>›</span>
                <span className="text-slate-800 font-bold">{state.name || slug}</span>
              </div>

              {/* 1. CLEAN STATE HERO HEADER (NO BOXES, EDITORIAL FLOW) */}
              <div className="border-b border-slate-200 pb-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 font-bold text-xs px-3 py-0.5 rounded-full">
                    <span>🏛️</span>
                    <span>State Portal &bull; {state.name}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px] px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 size={12} />
                    <span>Verified Guide 2026</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                  {state.name} Government Job Preparation &amp; GK 2026
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {state.about_state ||
                    `${state.name} government job vacancies, online recruitment notifications, state-level competitive exam updates, syllabus, and subject-wise General Knowledge questions.`}
                </p>

                {/* Inline Clean Metadata Line */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2 text-xs text-slate-600 font-medium">
                  <span>🏛️ <strong>Capital:</strong> {state.capital || 'Capital City'}</span>
                  <span>|</span>
                  <span>👤 <strong>CM:</strong> {state.chief_minister || 'Hon’ble CM'}</span>
                  <span>|</span>
                  <span>🎖️ <strong>Governor:</strong> {state.governor || 'Hon’ble Governor'}</span>
                  <span>|</span>
                  <span>👥 <strong>Population:</strong> {state.population || '8.45+ Cr'}</span>
                  <span>|</span>
                  <span>📍 <strong>Districts:</strong> {districts.length > 0 ? districts.length : 26}</span>
                </div>

                {/* Quick Anchor Links */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <a
                    href="#jobs-section"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg transition"
                  >
                    <span>Latest Jobs ({stats.jobs})</span>
                  </a>
                  <Link
                    href={`/state/${state.slug || slug}/mcq-questions/`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition"
                  >
                    <span>Practice State GK MCQs ({stats.mcqs}+)</span>
                  </Link>
                  <a
                    href="#districts-section"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                  >
                    <span>View Districts</span>
                  </a>
                </div>
              </div>

              {/* 2. SUBJECT-WISE GENERAL KNOWLEDGE (CLEAN CIRCULAR ICONS, NO BOXES) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <img src="/gk.png" alt="GK" className="w-6 h-6 object-contain" />
                    <span>Subject Wise {state.name} General Knowledge</span>
                  </h2>
                  <Link
                    href={`/state/${state.slug || slug}/mcq-questions/`}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>All MCQs</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed -mt-1">
                  Practice chapter-wise and subject-wise General Knowledge MCQs with verified answers and explanations for {state.name} state recruitment exams.
                </p>

                {/* Clean Circular Subject Icons Grid (4 columns, non-boxy) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5 pt-2">
                  {STATE_SUBJECTS.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/state/${state.slug || slug}/mcq-questions?subject=${sub.slug}`}
                      className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-xl transition group"
                    >
                      {/* Authentic Circular Icon */}
                      <div className="w-11 h-11 rounded-full p-1 bg-white border border-slate-200 group-hover:border-blue-400 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center shrink-0 shadow-2xs">
                        <img
                          src={sub.iconSrc}
                          alt={sub.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            if (!e.currentTarget.dataset.fallback) {
                              e.currentTarget.dataset.fallback = 'true';
                              e.currentTarget.src = '/gk.png';
                            }
                          }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                        {sub.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 3. LATEST STATE GOVERNMENT JOBS 2026 (JOBS CONTENT STREAM LAYOUT) */}
              <div id="jobs-section" className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <img src="/jobs.png" alt="Jobs" className="w-6 h-6 object-contain" />
                    <span>{state.name} Latest Job 2026</span>
                  </h2>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded self-start sm:self-auto">
                    {filteredJobs.length} Notifications Found
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed -mt-1">
                  Live government recruitment notifications, eligibility, age limits, and online application links for {state.name}.
                </p>

                {/* Instant Live Search Input & Filter Pills */}
                <div className="space-y-2.5 pt-1">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="text"
                      placeholder={`Search ${state.name} jobs by title or department (e.g. APPSC, Police, High Court)...`}
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <button
                      onClick={() => setJobFilter('all')}
                      className={`px-3 py-1 rounded font-semibold transition cursor-pointer whitespace-nowrap ${jobFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                      All Jobs
                    </button>
                    <button
                      onClick={() => setJobFilter('psc')}
                      className={`px-3 py-1 rounded font-semibold transition cursor-pointer whitespace-nowrap ${jobFilter === 'psc'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                      PSC / Civil Services
                    </button>
                    <button
                      onClick={() => setJobFilter('police')}
                      className={`px-3 py-1 rounded font-semibold transition cursor-pointer whitespace-nowrap ${jobFilter === 'police'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                      Police &amp; Defense
                    </button>
                    <button
                      onClick={() => setJobFilter('teaching')}
                      className={`px-3 py-1 rounded font-semibold transition cursor-pointer whitespace-nowrap ${jobFilter === 'teaching'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                      Teaching &amp; TET
                    </button>
                    <button
                      onClick={() => setJobFilter('court')}
                      className={`px-3 py-1 rounded font-semibold transition cursor-pointer whitespace-nowrap ${jobFilter === 'court'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                      High Court &amp; Judicial
                    </button>
                  </div>
                </div>

                {/* Job Stream identical to Jobs Page */}
                <div className="divide-y divide-slate-200 pt-1">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.slice(0, jobsLimit).map((job) => {
                      const mediaUrl = getImageUrl(job.featured_media || job.image);

                      return (
                        <article
                          key={job._id}
                          className="py-5 first:pt-2 last:pb-0 flex flex-col sm:flex-row gap-4 sm:gap-5 group"
                        >
                          {/* Left Thumbnail Image */}
                          <div className="w-full sm:w-60 h-40 border border-slate-200 rounded-sm overflow-hidden bg-slate-50 shrink-0 relative">
                            <img
                              src={mediaUrl}
                              alt={job.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                if (!e.currentTarget.dataset.fallback) {
                                  e.currentTarget.dataset.fallback = 'true';
                                  e.currentTarget.src = '/job-search.png';
                                }
                              }}
                            />
                          </div>

                          {/* Right Job Details */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <Link href={`/job/${job.slug || job._id}`}>
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                                  {job.title}
                                </h3>
                              </Link>

                              {/* Meta Info Line */}
                              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500 font-medium mt-1">
                                <span>By <strong className="text-slate-700 font-medium">Education Masters</strong></span>
                                <span>|</span>
                                <span>In <strong className="text-slate-800 font-medium">Jobs</strong></span>
                                <span>|</span>
                                <span>{formatDate(job.created_at || job.createdAt)}</span>
                                <span>|</span>
                                <StateLink state={job.state} dept={job.dept || state.name} defaultStateName={state.name} defaultStateSlug={state.slug} />
                              </div>

                              {/* Excerpt */}
                              <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                                {job.description?.replace(/<[^>]*>?/gm, '') || `Apply online for ${job.title}. Check complete eligibility, fees, vacancy details, and official notification.`}
                              </p>
                            </div>

                            {/* Last Date Highlight */}
                            <div className="mt-3 text-xs text-slate-700 flex items-center justify-between">
                              <span>
                                Last Date: <strong className="text-slate-900 font-semibold">{formatDate(job.app_ends)}</strong>
                              </span>
                              <Link
                                href={`/job/${job.slug || job._id}`}
                                className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-0.5"
                              >
                                <span>Apply Online</span>
                                <span>&rarr;</span>
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center text-xs text-slate-500">
                      No jobs matching your query in {state.name}.
                    </div>
                  )}
                </div>

                {/* Load More Button */}
                {filteredJobs.length > 8 && (
                  <div className="pt-4 text-center border-t border-slate-200">
                    {jobsLimit < filteredJobs.length ? (
                      <button
                        type="button"
                        onClick={() => setJobsLimit((prev) => Math.min(prev + 8, filteredJobs.length))}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 py-2 px-5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                      >
                        <span>Load More ({filteredJobs.length - jobsLimit} More Jobs)</span>
                        <ChevronDown size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setJobsLimit(8)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 py-2 px-5 rounded-lg bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                      >
                        <span>Show Less</span>
                        <ChevronUp size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 4. ADMIT CARDS & RESULTS STREAM (CLEAN ROWS) */}
              {(admitCards.length > 0 || results.length > 0) && (
                <div className="space-y-4 pt-2">
                  <div className="border-b border-slate-200 pb-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                      <img src="/id-card.png" alt="Admit Card" className="w-5 h-5 object-contain" />
                      <span>{state.name} Admit Cards &amp; Declared Results</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Admit Cards */}
                    {admitCards.length > 0 && (
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <span>🎫 Latest Admit Cards</span>
                        </h3>
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg p-2 bg-slate-50/40">
                          {admitCards.map((item) => (
                            <Link
                              key={item._id}
                              href={`/admit-card/${item.slug || item._id}`}
                              className="py-2.5 px-2 flex items-center justify-between hover:bg-white rounded transition group"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 truncate">
                                  {item.title}
                                </h4>
                                <span className="text-[10.5px] text-slate-500">
                                  {formatDate(item.createdAt || item.created_at)}
                                </span>
                              </div>
                              <span className="text-[11px] font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                                Download &rarr;
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Results */}
                    {results.length > 0 && (
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <span>📊 Declared Exam Results</span>
                        </h3>
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg p-2 bg-slate-50/40">
                          {results.map((item) => (
                            <Link
                              key={item._id}
                              href={`/result/${item.slug || item._id}`}
                              className="py-2.5 px-2 flex items-center justify-between hover:bg-white rounded transition group"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <h4 className="text-xs font-semibold text-slate-900 group-hover:text-emerald-600 truncate">
                                  {item.title}
                                </h4>
                                <span className="text-[10.5px] text-slate-500">
                                  {formatDate(item.createdAt || item.created_at)}
                                </span>
                              </div>
                              <span className="text-[11px] font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                                Merit List &rarr;
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. DISTRICTS GUIDE */}
              <div id="districts-section" className="space-y-3 pt-2">
                <div className="border-b border-slate-200 pb-2">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="text-orange-600" size={18} />
                    <span>Districts of {state.name}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    District collectorate, local police recruitment, and municipal vacancies across {state.name}.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {districts.length > 0 ? (
                    districts.map((dist) => (
                      <span
                        key={dist._id || dist.name}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 font-medium text-xs rounded transition"
                      >
                        {dist.name}
                      </span>
                    ))
                  ) : (
                    ['Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa', 'Tirupati', 'Nandyal', 'Nellore', 'Kakinada', 'Eluru', 'Bapatla', 'Palnadu', 'Konaseema', 'Anakapalli', 'Alluri Sitharama Raju', 'Parvathipuram Manyam', 'Sri Sathya Sai', 'Annamayya', 'NTR'].map((d) => (
                      <span
                        key={d}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 font-medium text-xs rounded transition"
                      >
                        {d}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* 6. STATE RECRUITMENT OVERVIEW */}
              {state.job_description && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    About {state.name} Government Jobs &amp; Exam Strategy
                  </h2>
                  <div
                    className="prose prose-sm text-slate-600 text-xs sm:text-sm leading-relaxed max-w-none [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>strong]:text-slate-900"
                    dangerouslySetInnerHTML={{ __html: state.job_description }}
                  />
                </div>
              )}
            </main>

            {/* ============================================================== */}
            {/* 3. RIGHT COLUMN: SIDEBAR WIDGETS & RECRUITMENT BOARDS (3/12) */}
            {/* ============================================================== */}
            <aside className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-5 sticky top-20">
              {/* Sidebar Widget with Tabs: Jobs Expiring Soon / MCQ Questions */}
              <div className="bg-[#f0f2f5] border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                <div className="flex items-center bg-[#e4e7ec] border-b border-slate-300">
                  <button
                    onClick={() => setSidebarTab('expiring')}
                    className={`flex-1 py-3 px-3 text-center text-xs sm:text-sm whitespace-nowrap font-medium transition cursor-pointer ${sidebarTab === 'expiring'
                      ? 'bg-[#f0f2f5] text-slate-900 font-bold'
                      : 'text-blue-600 hover:text-blue-700 font-semibold'
                      }`}
                  >
                    Jobs Expiring Soon
                  </button>
                  <button
                    onClick={() => setSidebarTab('mcq')}
                    className={`flex-1 py-3 px-3 text-center text-xs sm:text-sm whitespace-nowrap font-medium transition cursor-pointer ${sidebarTab === 'mcq'
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
                          {expiringJobs.length} Jobs expiring in 30 Days
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link
                            href="/jobs"
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
                      <p className="font-bold text-slate-800 text-base">{state.name} &amp; National MCQs</p>
                      <p className="text-xs text-slate-500">
                        Practice History, Polity, General Knowledge, and Current Affairs MCQs daily.
                      </p>
                      <Link
                        href={`/state/${state.slug || slug}/mcq-questions/`}
                        className="inline-block mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-xs"
                      >
                        Explore {state.name} MCQs &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* State Major Recruitment Boards Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="text-blue-600">🏛️</span>
                  <span>Top Exam Boards in {state.name}</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{state.name} Public Service Commission</span>
                    <span className="text-[10.5px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">PSC</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{state.name} Police Recruitment Board</span>
                    <span className="text-[10.5px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Police</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">High Court of {state.name}</span>
                    <span className="text-[10.5px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Judicial</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{state.name} Teacher Eligibility Test (TET)</span>
                    <span className="text-[10.5px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Teaching</span>
                  </div>
                </div>
              </div>

              {/* Visual Sponsored Banner */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs group">
                <div className="p-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider">
                    Sponsored Banner
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">Ad</span>
                </div>
                <div className="relative overflow-hidden">
                  <img
                    src="/school-sponsored-banner.jpg"
                    alt="The Corcoran School - Early Education & Admissions"
                    className="w-full h-auto object-cover group-hover:scale-102 transition duration-300"
                  />
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
}
