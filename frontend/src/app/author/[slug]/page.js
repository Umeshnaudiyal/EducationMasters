'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import GlobalLoader from '@/components/GlobalLoader';
import { getImageUrl } from '@/utils/image';
import {
  User,
  BookOpen,
  Briefcase,
  FileText,
  Award,
  Globe,
  Calendar,
  Share2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Layers,
  Clock,
  ArrowRight,
  TrendingUp,
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/apis/v1`
  : 'http://localhost:5001/apis/v1';

// Theme configuration for content categories (Vibrant Sunset Orange, Royal Blue, Amber Gold, Emerald Green)
const CATEGORY_THEMES = {
  jobs: {
    name: 'Govt. Jobs',
    color: '#ea580c',
    gradientFrom: '#f97316',
    gradientTo: '#ea580c',
    bg: 'bg-orange-50/80',
    text: 'text-orange-700',
    border: 'border-orange-200/80',
    hoverBorder: 'hover:border-orange-400',
    iconBg: 'bg-orange-100 text-orange-600',
    glow: 'rgba(234, 88, 12, 0.45)',
    icon: Briefcase,
  },
  blogs: {
    name: 'Blogs & Articles',
    color: '#2563eb',
    gradientFrom: '#3b82f6',
    gradientTo: '#1d4ed8',
    bg: 'bg-blue-50/80',
    text: 'text-blue-700',
    border: 'border-blue-200/80',
    hoverBorder: 'hover:border-blue-400',
    iconBg: 'bg-blue-100 text-blue-600',
    glow: 'rgba(37, 99, 235, 0.45)',
    icon: BookOpen,
  },
  'admit-cards': {
    name: 'Admit Cards',
    color: '#d97706',
    gradientFrom: '#fbbf24',
    gradientTo: '#d97706',
    bg: 'bg-amber-50/80',
    text: 'text-amber-800',
    border: 'border-amber-200/80',
    hoverBorder: 'hover:border-amber-400',
    iconBg: 'bg-amber-100 text-amber-700',
    glow: 'rgba(217, 119, 6, 0.45)',
    icon: Award,
  },
  results: {
    name: 'Exam Results',
    color: '#059669',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
    bg: 'bg-emerald-50/80',
    text: 'text-emerald-700',
    border: 'border-emerald-200/80',
    hoverBorder: 'hover:border-emerald-400',
    iconBg: 'bg-emerald-100 text-emerald-600',
    glow: 'rgba(5, 150, 105, 0.45)',
    icon: FileText,
  },
};

export default function AuthorPage() {
  const params = useParams();
  const rawSlug = params?.slug ? decodeURIComponent(params.slug) : '';
  const slug = rawSlug;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('expiring');
  const [expiringJobs, setExpiringJobs] = useState([]);
  const [isChartAnimated, setIsChartAnimated] = useState(false);

  // Pagination / Load More states (5 initial items)
  const [blogLimit, setBlogLimit] = useState(5);
  const [jobLimit, setJobLimit] = useState(5);
  const [admitLimit, setAdmitLimit] = useState(5);
  const [resultLimit, setResultLimit] = useState(5);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!slug) return;

    let isMounted = true;
    async function fetchAuthorData() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE}/users/author/${encodeURIComponent(slug)}`);
        const json = await res.json();
        if (isMounted) {
          if (json.success && json.data) {
            setData(json.data);
            setTimeout(() => setIsChartAnimated(true), 150);
          } else {
            setError(json.message || 'Author profile not found');
          }
        }
      } catch (err) {
        console.error('Error fetching author profile:', err);
        if (isMounted) setError('Failed to load author profile. Please try again.');
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

    fetchAuthorData();
    fetchSidebarJobs();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const author = data?.author || {};
  const stats = data?.stats || { blogs: 0, jobs: 0, admitCards: 0, results: 0, total: 0 };
  const rawChartData = data?.chartData || [];
  const recent = data?.recent || { blogs: [], jobs: [], admitCards: [], results: [] };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
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

  // Pie / Donut Chart Geometry Calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.292

  // Format chart data with refined theme colors & geometry
  const chartItems = useMemo(() => {
    const list = rawChartData.map((item) => {
      const theme = CATEGORY_THEMES[item.type] || CATEGORY_THEMES.jobs;
      return {
        ...item,
        name: theme.name,
        color: theme.color,
        gradientFrom: theme.gradientFrom,
        gradientTo: theme.gradientTo,
        bg: theme.bg,
        text: theme.text,
        border: theme.border,
        iconBg: theme.iconBg,
        glow: theme.glow,
        IconComponent: theme.icon,
      };
    });
    return list;
  }, [rawChartData]);

  const pieSegments = useMemo(() => {
    const validData = chartItems.filter((item) => item.count > 0);
    const totalCount = validData.reduce((acc, item) => acc + item.count, 0);

    if (totalCount === 0) {
      return [];
    }

    let currentOffset = 0;
    return validData.map((item) => {
      const proportion = item.count / totalCount;
      const strokeLength = proportion * circumference;
      const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
      const strokeDashoffset = -currentOffset;
      currentOffset += strokeLength;

      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
        proportion: Math.round(proportion * 100),
      };
    });
  }, [chartItems, circumference]);

  const activeHudItem = hoveredSlice
    ? pieSegments.find((s) => s.type === hoveredSlice) || pieSegments[0]
    : pieSegments[0] || {
        name: 'Govt. Jobs',
        count: stats.jobs || stats.total,
        percent: stats.total > 0 ? Math.round(((stats.jobs || stats.total) / stats.total) * 100) : 100,
        proportion: stats.total > 0 ? Math.round(((stats.jobs || stats.total) / stats.total) * 100) : 100,
        color: '#ea580c',
        gradientFrom: '#f97316',
        gradientTo: '#ea580c',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
      };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Dynamic Keyframe Styles for Pie Chart & Micro-animations */}
      <style jsx global>{`
        @keyframes chartDraw {
          0% {
            stroke-dasharray: 0 339.292;
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        .animate-chart-draw {
          animation: chartDraw 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* 1. Header & Live Ticker */}
      <Header />
      <LiveTicker />

      {/* 2. Main Page Container with 3-Column Grid on Extra Large screens */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-5 flex-1 w-full">
        {loading ? (
          /* Global High-End Branded Loader */
          <GlobalLoader
            text="Loading Author Profile..."
            subtext={`Fetching @${slug}'s publications, distribution stats, and exam updates`}
            minHeight="min-h-[480px]"
          />
        ) : error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold">
              ✕
            </div>
            <h2 className="text-xl font-bold text-slate-900">{error}</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              The author profile you are looking for may have been updated or moved.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-lg transition shadow-xs"
            >
              <span>Back to Home</span>
            </Link>
          </div>
        ) : (
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
                  <button className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-5 py-2 rounded transition shadow uppercase">
                    Start Today
                  </button>
                </div>

                <span className="text-[10px] text-slate-400">Sponsored Banner</span>
              </div>
            </aside>

            {/* ============================================================== */}
            {/* CENTER COLUMN: AUTHOR HERO, PIE CHART & CONTENT STREAM (7/12) */}
            {/* ============================================================== */}
            <main className="col-span-12 lg:col-span-8 xl:col-span-7 space-y-4">
              {/* Breadcrumb at Middle (Directly above Center Content) */}
              <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium overflow-x-auto whitespace-nowrap pb-1">
                <Link href="/" className="hover:text-blue-600 text-blue-600 underline">
                  Home
                </Link>
                <span>›</span>
                <span className="text-slate-500">Authors</span>
                <span>›</span>
                <span className="text-slate-900 font-bold">{author.name || slug || 'Author Profile'}</span>
              </div>

              {/* AUTHOR HERO CARD - CLEAN & SEAMLESS */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 relative overflow-hidden transition hover:shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Author Avatar with verified badge */}
                  <div className="relative shrink-0 group">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-blue-600 p-0.5 shadow-sm group-hover:scale-105 transition-transform duration-300">
                      <div className="w-full h-full bg-white rounded-[14px] overflow-hidden flex items-center justify-center">
                        <img
                          src={getImageUrl(author.image, '/user-avatar.png')}
                          alt={author.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (!e.currentTarget.dataset.fallback) {
                              e.currentTarget.dataset.fallback = 'true';
                              e.currentTarget.src = '/user-avatar.png';
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div
                      className="absolute -bottom-1 -right-1 bg-orange-500 text-white p-1 rounded-full border-2 border-white shadow-xs"
                      title="Verified Education Author"
                    >
                      <CheckCircle2 size={13} />
                    </div>
                  </div>

                  {/* Author Info & Bio */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                        {author.name}
                      </h1>
                      <span className="bg-orange-50 text-orange-700 border border-orange-200/80 font-bold text-[11px] px-2.5 py-0.5 rounded-full capitalize">
                        {author.role || 'Author'}
                      </span>
                      {author.nicename && (
                        <span className="text-xs text-slate-500 font-medium">@{author.nicename}</span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {author.bio ||
                        `I am ${author.name}, a student and Content Writer at Education Masters, passionate about creating informative, SEO-friendly, and student-focused educational content. I specialize in writing about government jobs, entrance exams, admissions, results, and career guidance to help students make informed academic and career decisions.`}
                    </p>

                    {/* Social Media Links */}
                    <div className="flex items-center gap-2.5 pt-1 text-slate-500 flex-wrap">
                      {author.website && (
                        <a
                          href={author.website.startsWith('http') ? author.website : `https://${author.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-slate-100/80 hover:bg-orange-50 text-slate-600 hover:text-orange-600 border border-slate-200/70 flex items-center justify-center transition hover:scale-105"
                          title="Official Website"
                        >
                          <Globe size={13} />
                        </a>
                      )}
                      {author.twitter && (
                        <a
                          href={author.twitter.startsWith('http') ? author.twitter : `https://twitter.com/${author.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-slate-100/80 hover:bg-sky-50 text-slate-600 hover:text-sky-500 border border-slate-200/70 flex items-center justify-center transition hover:scale-105"
                          title="Twitter / X"
                        >
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                      )}
                      {author.facebook && (
                        <a
                          href={author.facebook.startsWith('http') ? author.facebook : `https://facebook.com/${author.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-slate-100/80 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200/70 flex items-center justify-center transition hover:scale-105"
                          title="Facebook"
                        >
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </a>
                      )}
                      {author.linkedin && (
                        <a
                          href={author.linkedin.startsWith('http') ? author.linkedin : `https://linkedin.com/in/${author.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-slate-100/80 hover:bg-blue-50 text-slate-600 hover:text-blue-800 border border-slate-200/70 flex items-center justify-center transition hover:scale-105"
                          title="LinkedIn"
                        >
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.262-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                        </a>
                      )}
                      {author.instagram && (
                        <a
                          href={author.instagram.startsWith('http') ? author.instagram : `https://instagram.com/${author.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-slate-100/80 hover:bg-pink-50 text-slate-600 hover:text-pink-600 border border-slate-200/70 flex items-center justify-center transition hover:scale-105"
                          title="Instagram"
                        >
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5 Distinct Metric Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2.5 text-center">
                    <span className="text-[10.5px] text-slate-500 font-semibold block">Total Published</span>
                    <span className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 block">{stats.total}</span>
                  </div>
                  <div className="bg-orange-50/80 border border-orange-200/80 rounded-xl p-2.5 text-center">
                    <span className="text-[10.5px] text-orange-700 font-semibold block">Govt. Jobs</span>
                    <span className="text-lg sm:text-xl font-black text-orange-700 mt-0.5 block">{stats.jobs}</span>
                  </div>
                  <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-2.5 text-center">
                    <span className="text-[10.5px] text-blue-700 font-semibold block">Blogs &amp; Articles</span>
                    <span className="text-lg sm:text-xl font-black text-blue-700 mt-0.5 block">{stats.blogs}</span>
                  </div>
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-center">
                    <span className="text-[10.5px] text-amber-800 font-semibold block">Admit Cards</span>
                    <span className="text-lg sm:text-xl font-black text-amber-800 mt-0.5 block">{stats.admitCards}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 text-center">
                    <span className="text-[10.5px] text-emerald-700 font-semibold block">Exam Results</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5 block">{stats.results}</span>
                  </div>
                </div>
              </div>

              {/* ======================================================= */}
              {/* HARMONIOUS ANIMATED PIE / DONUT CHART SECTION */}
              {/* ======================================================= */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-2xs">
                      <PieChartIcon size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        Content Publishing Distribution
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Visual breakdown of articles, recruitment notices &amp; exam updates
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200/70 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                    {stats.total} Total Contributions
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Left: Dynamic Animated Donut Chart */}
                  <div className="col-span-1 md:col-span-5 flex flex-col items-center justify-center relative py-1">
                    <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
                      <svg
                        viewBox="0 0 140 140"
                        className="w-full h-full -rotate-90 transform transition-transform duration-700"
                      >
                        {/* Defined Linear Gradients with Vibrant Orange & Complementary Hues */}
                        <defs>
                          <linearGradient id="grad-jobs" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#ea580c" />
                          </linearGradient>
                          <linearGradient id="grad-blogs" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                          </linearGradient>
                          <linearGradient id="grad-admit-cards" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#d97706" />
                          </linearGradient>
                          <linearGradient id="grad-results" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                        </defs>

                        {/* Background Track Circle */}
                        <circle
                          cx="70"
                          cy="70"
                          r={radius}
                          fill="transparent"
                          stroke="#f1f5f9"
                          strokeWidth="13"
                        />

                        {/* Animated Category Slices */}
                        {pieSegments.length > 0 ? (
                          pieSegments.map((segment) => {
                            const isHovered = hoveredSlice === segment.type;
                            return (
                              <circle
                                key={segment.type}
                                cx="70"
                                cy="70"
                                r={radius}
                                fill="transparent"
                                stroke={`url(#grad-${segment.type})`}
                                strokeWidth={isHovered ? '18' : '13.5'}
                                strokeDasharray={segment.strokeDasharray}
                                strokeDashoffset={segment.strokeDashoffset}
                                strokeLinecap="round"
                                className="cursor-pointer transition-all duration-500 ease-out animate-chart-draw"
                                style={{
                                  filter: isHovered ? `drop-shadow(0 0 8px ${segment.glow || segment.color})` : 'none',
                                }}
                                onMouseEnter={() => setHoveredSlice(segment.type)}
                                onMouseLeave={() => setHoveredSlice(null)}
                              />
                            );
                          })
                        ) : (
                          <circle
                            cx="70"
                            cy="70"
                            r={radius}
                            fill="transparent"
                            stroke="url(#grad-jobs)"
                            strokeWidth="13.5"
                            strokeDasharray={`${circumference} 0`}
                          />
                        )}
                      </svg>

                      {/* Interactive Center HUD Display with floating animation */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-3 transition-all duration-300"
                        style={{ animation: 'floatSlow 4s ease-in-out infinite' }}
                      >
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none transition-all duration-300">
                          {activeHudItem.count}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 mt-1 truncate max-w-[105px]">
                          {activeHudItem.name}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1 border transition-all duration-300 ${
                            activeHudItem.bg || 'bg-orange-50'
                          } ${activeHudItem.text || 'text-orange-700'} ${activeHudItem.border || 'border-orange-200'}`}
                        >
                          {activeHudItem.proportion || activeHudItem.percent || 100}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Legend Breakdown with Cohesive Cards */}
                  <div className="col-span-1 md:col-span-7 space-y-2.5">
                    {chartItems.map((item) => {
                      const isHovered = hoveredSlice === item.type;

                      return (
                        <div
                          key={item.type}
                          onMouseEnter={() => setHoveredSlice(item.type)}
                          onMouseLeave={() => setHoveredSlice(null)}
                          className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-between ${
                            isHovered
                              ? `${item.bg} ${item.border} shadow-xs scale-[1.015]`
                              : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: item.color }}
                            />
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                                {item.name}
                              </h4>
                              <span className="text-[11px] text-slate-500 font-normal">
                                {item.count} Published Entries
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs sm:text-sm font-black text-slate-900 block">
                              {item.percent}%
                            </span>
                            <div className="w-16 sm:w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${item.percent}%`,
                                  background: `linear-gradient(to right, ${item.gradientFrom}, ${item.gradientTo})`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ======================================================= */}
              {/* CONTENT SHOWCASE (DUAL-STREAM WITH 5 ITEMS & LOAD MORE) */}
              {/* ======================================================= */}
              <div className="space-y-5">
                {/* Dual Column Stream: Blogs & Jobs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {/* 1. RECENT BLOGS POSTED */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-3.5 bg-blue-50/60 border-b border-blue-100/80 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <span className="text-blue-600">📝</span>
                        <span>Recent Blogs Posted</span>
                      </h3>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200">
                        {stats.blogs} Blogs
                      </span>
                    </div>

                    {/* Scrollable Container */}
                    <div className="divide-y divide-slate-100 p-1.5 max-h-[440px] overflow-y-auto scrollbar-thin">
                      {recent.blogs && recent.blogs.length > 0 ? (
                        recent.blogs.slice(0, blogLimit).map((blog) => (
                          <Link
                            key={blog._id}
                            href={`/${blog.slug || blog._id}`}
                            className="p-2.5 flex items-start gap-2.5 hover:bg-slate-50/80 rounded-xl transition group"
                          >
                            <div className="w-18 h-13 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                              <img
                                src={getImageUrl(blog.featured_media || blog.image)}
                                alt={blog.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                onError={(e) => {
                                  if (!e.currentTarget.dataset.fallback) {
                                    e.currentTarget.dataset.fallback = 'true';
                                    e.currentTarget.src = '/job-search.png';
                                  }
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                {blog.title}
                              </h4>
                              <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-1 font-normal">
                                <span>📅 {formatDate(blog.createdAt || blog.created_at)}</span>
                                <span className="text-blue-600 font-medium">Articles</span>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="py-10 text-center text-xs text-slate-500">No blogs posted yet</div>
                      )}
                    </div>

                    {/* Load More Button for Blogs */}
                    {recent.blogs && recent.blogs.length > 5 && (
                      <div className="p-2 bg-slate-50/50 border-t border-slate-100 text-center">
                        {blogLimit < recent.blogs.length ? (
                          <button
                            type="button"
                            onClick={() => setBlogLimit((prev) => Math.min(prev + 5, recent.blogs.length))}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 py-1 px-3 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                          >
                            <span>Load More ({recent.blogs.length - blogLimit} More)</span>
                            <ChevronDown size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setBlogLimit(5)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 py-1 px-3 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          >
                            <span>Show Less</span>
                            <ChevronUp size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. RECENT JOBS POSTED */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-3.5 bg-orange-50/60 border-b border-orange-100/80 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <span className="text-orange-600">💼</span>
                        <span>Recent Jobs Posted</span>
                      </h3>
                      <span className="text-[11px] font-bold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-full border border-orange-200">
                        {stats.jobs} Jobs
                      </span>
                    </div>

                    {/* Scrollable Container */}
                    <div className="divide-y divide-slate-100 p-1.5 max-h-[440px] overflow-y-auto scrollbar-thin">
                      {recent.jobs && recent.jobs.length > 0 ? (
                        recent.jobs.slice(0, jobLimit).map((job) => (
                          <Link
                            key={job._id}
                            href={`/job/${job.slug || job._id}`}
                            className="p-2.5 flex items-start gap-2.5 hover:bg-slate-50/80 rounded-xl transition group"
                          >
                            <div className="w-18 h-13 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                              <img
                                src={getImageUrl(job.featured_media || job.image)}
                                alt={job.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                onError={(e) => {
                                  if (!e.currentTarget.dataset.fallback) {
                                    e.currentTarget.dataset.fallback = 'true';
                                    e.currentTarget.src = '/job-search.png';
                                  }
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                                {job.title}
                              </h4>
                              <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-1 font-normal">
                                <span>Last Date: {formatShortDate(job.app_ends)}</span>
                                <span className="text-orange-600 font-medium">Jobs</span>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="py-10 text-center text-xs text-slate-500">No jobs posted yet</div>
                      )}
                    </div>

                    {/* Load More Button for Jobs */}
                    {recent.jobs && recent.jobs.length > 5 && (
                      <div className="p-2 bg-slate-50/50 border-t border-slate-100 text-center">
                        {jobLimit < recent.jobs.length ? (
                          <button
                            type="button"
                            onClick={() => setJobLimit((prev) => Math.min(prev + 5, recent.jobs.length))}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 py-1 px-3 rounded-lg hover:bg-orange-50 transition cursor-pointer"
                          >
                            <span>Load More ({recent.jobs.length - jobLimit} More)</span>
                            <ChevronDown size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setJobLimit(5)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 py-1 px-3 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          >
                            <span>Show Less</span>
                            <ChevronUp size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Row 2: Admit Cards & Results (if available) */}
                {(recent.admitCards?.length > 0 || recent.results?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    {/* Admit Cards */}
                    {recent.admitCards?.length > 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                        <div className="p-3.5 bg-amber-50/60 border-b border-amber-100/80 flex items-center justify-between">
                          <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                            <span className="text-amber-600">🎫</span>
                            <span>Recent Admit Cards</span>
                          </h3>
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                            {stats.admitCards} Admit Cards
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100 p-1.5 max-h-[440px] overflow-y-auto scrollbar-thin">
                          {recent.admitCards.slice(0, admitLimit).map((item) => (
                            <Link
                              key={item._id}
                              href={`/admit-card/${item.slug || item._id}`}
                              className="p-2.5 flex items-start gap-2.5 hover:bg-slate-50/80 rounded-xl transition group"
                            >
                              <div className="w-18 h-13 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                                <img
                                  src={getImageUrl(item.featured_media || item.image)}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  onError={(e) => {
                                    if (!e.currentTarget.dataset.fallback) {
                                      e.currentTarget.dataset.fallback = 'true';
                                      e.currentTarget.src = '/job-search.png';
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug">
                                  {item.title}
                                </h4>
                                <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-1 font-normal">
                                  <span>📅 {formatDate(item.createdAt || item.created_at)}</span>
                                  <span className="text-amber-700 font-medium">Admit Card</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>

                        {recent.admitCards.length > 5 && (
                          <div className="p-2 bg-slate-50/50 border-t border-slate-100 text-center">
                            {admitLimit < recent.admitCards.length ? (
                              <button
                                type="button"
                                onClick={() => setAdmitLimit((prev) => Math.min(prev + 5, recent.admitCards.length))}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 py-1 px-3 rounded-lg hover:bg-amber-50 transition cursor-pointer"
                              >
                                <span>Load More ({recent.admitCards.length - admitLimit} More)</span>
                                <ChevronDown size={13} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setAdmitLimit(5)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 py-1 px-3 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                              >
                                <span>Show Less</span>
                                <ChevronUp size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Results */}
                    {recent.results?.length > 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                        <div className="p-3.5 bg-emerald-50/60 border-b border-emerald-100/80 flex items-center justify-between">
                          <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                            <span className="text-emerald-600">📊</span>
                            <span>Recent Results</span>
                          </h3>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                            {stats.results} Results
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100 p-1.5 max-h-[440px] overflow-y-auto scrollbar-thin">
                          {recent.results.slice(0, resultLimit).map((item) => (
                            <Link
                              key={item._id}
                              href={`/result/${item.slug || item._id}`}
                              className="p-2.5 flex items-start gap-2.5 hover:bg-slate-50/80 rounded-xl transition group"
                            >
                              <div className="w-18 h-13 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                                <img
                                  src={getImageUrl(item.featured_media || item.image)}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  onError={(e) => {
                                    if (!e.currentTarget.dataset.fallback) {
                                      e.currentTarget.dataset.fallback = 'true';
                                      e.currentTarget.src = '/job-search.png';
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
                                  {item.title}
                                </h4>
                                <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-1 font-normal">
                                  <span>📅 {formatDate(item.createdAt || item.created_at)}</span>
                                  <span className="text-emerald-600 font-medium">Result</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>

                        {recent.results.length > 5 && (
                          <div className="p-2 bg-slate-50/50 border-t border-slate-100 text-center">
                            {resultLimit < recent.results.length ? (
                              <button
                                type="button"
                                onClick={() => setResultLimit((prev) => Math.min(prev + 5, recent.results.length))}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 py-1 px-3 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                              >
                                <span>Load More ({recent.results.length - resultLimit} More)</span>
                                <ChevronDown size={13} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setResultLimit(5)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 py-1 px-3 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                              >
                                <span>Show Less</span>
                                <ChevronUp size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </main>

            {/* ============================================================== */}
            {/* RIGHT COLUMN: SIDEBAR (lg:col-span-4 xl:col-span-3) */}
            {/* ============================================================== */}
            <aside className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-5 sticky top-20">
              {/* Sidebar Widget with Tabs: Jobs Expiring Soon / MCQ Questions */}
              <div className="bg-[#f0f2f5] border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
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
                      <p className="font-bold text-slate-800 text-base">1000+ Subject-Wise MCQs</p>
                      <p className="text-xs text-slate-500">
                        Practice History, Polity, General Knowledge, and Current Affairs MCQs daily.
                      </p>
                      <Link
                        href="/mcq-questions"
                        className="inline-block mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-xs"
                      >
                        Explore MCQs &rarr;
                      </Link>
                    </div>
                  )}
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
                    alt="The Corcoran School - Infant and Toddler Space Filling Fast"
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
