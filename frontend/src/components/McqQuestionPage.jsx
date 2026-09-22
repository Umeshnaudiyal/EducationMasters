'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import { getImageUrl } from '@/utils/image';
import {
  SUBJECTS_LIST,
  STATES_LIST,
  EXAMS_LIST,
  getTaxonomyInfo,
} from '@/utils/mcqTaxonomies';
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Share2,
  CheckCircle2,
  Eye,
  EyeOff,
  BookOpen,
  Send,
  MessageCircle,
  Globe,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

const DISCOVER_TAGS = [
  { name: 'Educational Resources', icon: '📰' },
  { name: 'Primary & Secondary Schooling (K-12)', icon: '📰' },
  { name: 'Fun & Trivia', icon: '📰' },
  { name: 'Knowledge Management', icon: '📚' },
  { name: 'Competitive Exam Prep', icon: '🎯' },
  { name: 'Current Affairs 2026', icon: '⚡' },
];

const formatShortDate = (dateStr) => {
  if (!dateStr) return 'Sep 25';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

export default function McqQuestionPage({
  initialSlug = 'general-knowledge',
  initialSubjectName = 'General Knowledge',
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPageParam = parseInt(searchParams.get('page') || '1', 10);
  const langParam = searchParams.get('lang') || 'English';

  const [currentSlug, setCurrentSlug] = useState(initialSlug);
  const [taxonomy, setTaxonomy] = useState(() => getTaxonomyInfo(initialSlug));
  const [language, setLanguage] = useState(langParam);
  const [page, setPage] = useState(currentPageParam);
  const [pageSize] = useState(28);

  const [questions, setQuestions] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expiringJobs, setExpiringJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [rightTab, setRightTab] = useState('expiring');

  const [openSubjects, setOpenSubjects] = useState(true);
  const [openStates, setOpenStates] = useState(true);
  const [openExams, setOpenExams] = useState(true);
  const [showMoreIntro, setShowMoreIntro] = useState(false);

  const [userAnswers, setUserAnswers] = useState({});
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [shareUrl, setShareUrl] = useState('');

  // Hydration-safe share URL resolution
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, [currentSlug, page]);

  // Reactive sync when route parameter or initialSlug changes
  useEffect(() => {
    if (initialSlug && initialSlug !== currentSlug) {
      setCurrentSlug(initialSlug);
      setPage(1);
    }
  }, [initialSlug]);

  // Update taxonomy dynamically whenever slug changes
  useEffect(() => {
    const tax = getTaxonomyInfo(currentSlug);
    setTaxonomy(tax);
  }, [currentSlug]);

  // Dynamic Browser Tab Title & Meta SEO Update
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const qCountPrefix = totalQuestions > 0 ? `${totalQuestions}+ ` : '3800+ ';
      document.title = `${qCountPrefix}${taxonomy.name} Questions | GK Questions MCQ | gk mcq questions with answers in ${language}`;

      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', taxonomy.description);

      // Update canonical link
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', `https://educationmasters.in/${currentSlug}/mcq-questions/`);
    }
  }, [taxonomy, currentSlug, totalQuestions, language]);

  const handleSelectTaxonomy = (targetSlug) => {
    if (targetSlug === currentSlug) return;
    setCurrentSlug(targetSlug);
    setPage(1);
    setUserAnswers({});
    setRevealedAnswers({});
    router.push(`/${targetSlug}/mcq-questions`);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
        });

        // Pass appropriate filter based on whether it's an exam, state, or subject
        if (taxonomy.type === 'exam') {
          queryParams.set('exam', taxonomy.rawName || taxonomy.slug);
        } else if (taxonomy.type === 'state') {
          queryParams.set('state', taxonomy.rawName || taxonomy.slug);
        } else {
          queryParams.set('subject', taxonomy.slug);
        }

        if (language && language !== 'all') {
          queryParams.set('language', language);
        }

        const res = await fetch(`${BACKEND_URL}/apis/v1/questions?${queryParams.toString()}`);
        const data = await res.json();

        if (isMounted && data.success) {
          setQuestions(data.data || []);
          const total = data.pagination?.total || data.counts?.all || 0;
          setTotalQuestions(total);
          setTotalPages(data.pagination?.pages || Math.ceil(total / pageSize) || 1);
        }
      } catch (err) {
        console.error('Error loading questions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [taxonomy, currentSlug, page, language, pageSize]);

  useEffect(() => {
    let isMounted = true;
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/apis/v1/jobs/expiring-soon?limit=6`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setExpiringJobs(data.data);
        } else {
          const fallbackRes = await fetch(`${BACKEND_URL}/apis/v1/jobs?limit=6&status=publish`);
          const fallbackData = await fallbackRes.json();
          if (isMounted && fallbackData.success) {
            setExpiringJobs(fallbackData.data || []);
          }
        }
      } catch (err) {
        console.error('Error loading sidebar jobs:', err);
      } finally {
        if (isMounted) setLoadingJobs(false);
      }
    };
    fetchJobs();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 180, behavior: 'smooth' });
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const toggleViewAnswer = (questionId) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleShareClick = (platform) => {
    const targetUrl = shareUrl || (typeof window !== 'undefined' ? window.location.href : `https://educationmasters.in/${currentSlug}/mcq-questions/`);
    const titleText = `${totalQuestions || 3800}+ ${taxonomy.name} MCQ Questions with Answers | Education Masters`;

    let shareLink = '';
    switch (platform) {
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(titleText)}`;
        break;
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${titleText} ${targetUrl}`)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(targetUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(titleText)}`;
        break;
      case 'reddit':
        shareLink = `https://reddit.com/submit?url=${encodeURIComponent(targetUrl)}&title=${encodeURIComponent(titleText)}`;
        break;
      default:
        break;
    }
    if (shareLink && typeof window !== 'undefined') {
      window.open(shareLink, '_blank', 'noopener,noreferrer');
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

  const startItem = totalQuestions === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalQuestions);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900">
      {/* 1. Header & Live Ticker */}
      <Header />
      <LiveTicker />

      {/* 2. Main Page Layout with Skyscraper Sidebar & 3-Column Content */}
      <div className="max-w-[1550px] mx-auto px-3 sm:px-4 py-6 flex-1 w-full bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ============================================================== */}
          {/* LEFT COLUMN: Featured Partner Banner + High-Contrast Sidebar   */}
          {/* ============================================================== */}
          <aside className="col-span-1 lg:col-span-3 space-y-3 sticky top-20">
            {/* Compact Sleek Featured Partner Banner */}
            <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-slate-50 border border-blue-200 rounded-lg p-2.5 flex items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-cyan-500 text-white rounded-lg flex items-center justify-center text-base shrink-0 shadow-xs">
                  🎓
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[9px] text-blue-700 font-bold uppercase tracking-wider leading-none mb-0.5">
                    <span>Partner</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-blue-900 font-extrabold">Education</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs truncate leading-tight">
                    Top Industry Experts
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate leading-none mt-0.5">
                    Placement assistance
                  </p>
                </div>
              </div>
              <Link
                href="/jobs"
                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded transition shadow-2xs uppercase shrink-0"
              >
                Apply
              </Link>
            </div>

            {/* Accordion 1: Subjectwise MCQ (Midnight Navy Theme) */}
            <div className="bg-white rounded-lg border border-slate-300 shadow-xs overflow-hidden transition-all">
              <div
                onClick={() => setOpenSubjects(!openSubjects)}
                className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white px-3.5 py-2.5 font-bold text-xs sm:text-sm flex items-center justify-between cursor-pointer hover:from-[#1e293b] hover:to-[#334155] transition select-none shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-sky-500/20 flex items-center justify-center border border-sky-400/30">
                    <BookOpen size={13} className="text-sky-300" />
                  </div>
                  <span className="tracking-wide">Subjectwise MCQ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-sky-400/20 text-sky-300 border border-sky-400/40 px-1.5 py-0.5 rounded leading-none">
                    {SUBJECTS_LIST.length}
                  </span>
                  {openSubjects ? <ChevronUp size={14} className="text-slate-300" /> : <ChevronDown size={14} className="text-slate-300" />}
                </div>
              </div>
              {openSubjects && (
                <div className="max-h-[190px] overflow-y-auto divide-y divide-slate-100 text-xs font-semibold bg-slate-50/30">
                  {SUBJECTS_LIST.map((sub) => {
                    const isSelected = taxonomy.type === 'subject' && currentSlug === sub.slug;
                    return (
                      <Link
                        key={sub.slug}
                        href={`/${sub.slug}/mcq-questions`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleSelectTaxonomy(sub.slug);
                        }}
                        className={`w-full text-left px-3.5 py-2 transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 text-sky-900 font-black border-l-4 border-sky-600 pl-3.5 shadow-2xs'
                            : 'text-slate-700 hover:bg-sky-50/60 hover:text-sky-700 hover:pl-4 font-medium'
                        }`}
                      >
                        <span>{sub.name}</span>
                        {isSelected && <ChevronRight size={13} className="text-sky-600 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accordion 2: Statewise Prepration (Deep Emerald Theme) */}
            <div className="bg-white rounded-lg border border-slate-300 shadow-xs overflow-hidden transition-all">
              <div
                onClick={() => setOpenStates(!openStates)}
                className="bg-gradient-to-r from-[#064e3b] to-[#047857] text-white px-3.5 py-2.5 font-bold text-xs sm:text-sm flex items-center justify-between cursor-pointer hover:from-[#047857] hover:to-[#059669] transition select-none shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-emerald-400/20 flex items-center justify-center border border-emerald-300/30">
                    <Layers size={13} className="text-emerald-200" />
                  </div>
                  <span className="tracking-wide">Statewise Prepration</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-emerald-300/20 text-emerald-100 border border-emerald-300/40 px-1.5 py-0.5 rounded leading-none">
                    {STATES_LIST.length}
                  </span>
                  {openStates ? <ChevronUp size={14} className="text-slate-200" /> : <ChevronDown size={14} className="text-slate-200" />}
                </div>
              </div>
              {openStates && (
                <div className="max-h-[190px] overflow-y-auto divide-y divide-slate-100 text-xs font-semibold bg-slate-50/30">
                  {STATES_LIST.map((st) => {
                    const isSelected = taxonomy.type === 'state' && currentSlug === st.slug;
                    return (
                      <Link
                        key={st.slug}
                        href={`/${st.slug}/mcq-questions`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleSelectTaxonomy(st.slug);
                        }}
                        className={`w-full text-left px-3.5 py-2 transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-950 font-black border-l-4 border-emerald-600 pl-3.5 shadow-2xs'
                            : 'text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-800 hover:pl-4 font-medium'
                        }`}
                      >
                        <span>{st.name}</span>
                        {isSelected && <ChevronRight size={13} className="text-emerald-600 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accordion 3: Govt. Examwise MCQ (Royal Violet Theme) */}
            <div className="bg-white rounded-lg border border-slate-300 shadow-xs overflow-hidden transition-all">
              <div
                onClick={() => setOpenExams(!openExams)}
                className="bg-gradient-to-r from-[#3b0764] to-[#581c87] text-white px-3.5 py-2.5 font-bold text-xs sm:text-sm flex items-center justify-between cursor-pointer hover:from-[#581c87] hover:to-[#6b21a8] transition select-none shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-400/20 flex items-center justify-center border border-amber-300/30">
                    <Sparkles size={13} className="text-amber-300" />
                  </div>
                  <span className="tracking-wide">Govt. Examwise MCQ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-amber-400/20 text-amber-200 border border-amber-400/40 px-1.5 py-0.5 rounded leading-none">
                    {EXAMS_LIST.length}
                  </span>
                  {openExams ? <ChevronUp size={14} className="text-slate-200" /> : <ChevronDown size={14} className="text-slate-200" />}
                </div>
              </div>
              {openExams && (
                <div className="max-h-[180px] overflow-y-auto divide-y divide-slate-100 text-xs font-semibold bg-slate-50/30">
                  {EXAMS_LIST.map((ex) => {
                    const isSelected = taxonomy.type === 'exam' && currentSlug === ex.slug;
                    return (
                      <Link
                        key={ex.slug}
                        href={`/${ex.slug}/mcq-questions`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleSelectTaxonomy(ex.slug);
                        }}
                        className={`w-full text-left px-3.5 py-2 transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-purple-50 text-purple-950 font-black border-l-4 border-purple-600 pl-3.5 shadow-2xs'
                            : 'text-slate-700 hover:bg-purple-50/60 hover:text-purple-800 hover:pl-4 font-medium'
                        }`}
                      >
                        <span>{ex.name}</span>
                        {isSelected && <ChevronRight size={13} className="text-purple-600 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* ============================================================== */}
          {/* CENTER COLUMN: Perfectly Placed Breadcrumbs + Beautiful Content */}
          {/* ============================================================== */}
          <main className="col-span-1 lg:col-span-6 xl:col-span-6 space-y-4">

            {/* Dynamic Breadcrumbs Tailored for Exams / States / Subjects */}
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5 font-medium overflow-x-auto whitespace-nowrap">
              <Link href="/" className="hover:text-blue-600 text-blue-600 underline">
                Home
              </Link>
              <span>›</span>
              <Link href={taxonomy.breadcrumbCatLink || '/mcq-questions'} className="hover:text-blue-600 text-slate-500">
                {taxonomy.breadcrumbCategory}
              </Link>
              <span>›</span>
              <span className="text-slate-800 font-bold">{taxonomy.name}</span>
            </div>

            {/* Top Title & Language Switcher Header */}
            <div className="border-b border-slate-200 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                    {totalQuestions > 0 ? `${totalQuestions}+` : '3800+'}{' '}
                    {taxonomy.name} Questions | GK Questions MCQ | gk mcq questions with answers in {language}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                    {taxonomy.subtitle} in {language}
                  </p>
                </div>

                {/* Language Switcher Badge */}
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'English' ? 'Hindi' : 'English')}
                  className="shrink-0 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs sm:text-sm rounded border border-blue-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs self-start"
                >
                  <Globe size={14} />
                  <span>{language === 'English' ? 'हिन्दी' : 'English'}</span>
                </button>
              </div>

              {/* Social Share Bar (Hydration-Safe Click Handlers) */}
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 flex-wrap">
                <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
                  <Share2 size={13} className="text-blue-600" /> Share:
                </span>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={() => handleShareClick('telegram')}
                  className="w-7 h-7 rounded-full bg-[#0088cc] text-white flex items-center justify-center hover:opacity-90 transition shadow-2xs hover:scale-105 cursor-pointer"
                  title="Share on Telegram"
                >
                  <Send size={12} className="-ml-0.5" />
                </button>

                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleShareClick('whatsapp')}
                  className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-90 transition shadow-2xs hover:scale-105 cursor-pointer"
                  title="Share on WhatsApp"
                >
                  <MessageCircle size={13} />
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => handleShareClick('facebook')}
                  className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition shadow-2xs hover:scale-105 cursor-pointer"
                  title="Share on Facebook"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H7.9v-2.89h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.89h-2.34V21.9C18.34 21.12 22 16.99 22 12z" />
                  </svg>
                </button>

                {/* LinkedIn */}
                <button
                  type="button"
                  onClick={() => handleShareClick('linkedin')}
                  className="w-7 h-7 rounded-full bg-[#0A66C2] text-white flex items-center justify-center hover:opacity-90 transition shadow-2xs hover:scale-105 cursor-pointer"
                  title="Share on LinkedIn"
                >
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.66a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
                  </svg>
                </button>

                {/* Twitter / X */}
                <button
                  type="button"
                  onClick={() => handleShareClick('twitter')}
                  className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center hover:opacity-90 transition shadow-2xs hover:scale-105 cursor-pointer"
                  title="Share on X"
                >
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>

                {/* Reddit */}
                <button
                  type="button"
                  onClick={() => handleShareClick('reddit')}
                  className="w-7 h-7 rounded-full bg-[#FF4500] text-white flex items-center justify-center hover:opacity-90 transition shadow-2xs hover:scale-105 cursor-pointer"
                  title="Share on Reddit"
                >
                  <span className="font-black text-[11px]">r/</span>
                </button>
              </div>
            </div>

            {/* Dynamic Intro / SEO Callout Box with High Contrast */}
            <div className="bg-[#f8fafc] border-l-4 border-blue-600 border-y border-r border-slate-200 rounded p-4 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2 mb-4 shadow-2xs">
              <p className="font-semibold text-slate-900 text-sm sm:text-base">
                <span className="text-blue-600 underline cursor-pointer">{taxonomy.name}</span>{' '}
                Questions with Answers in {language} – Best for Competitive Exams{' '}
                <span className="inline-block bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded ml-1">
                  {taxonomy.tag}
                </span>
              </p>
              <p className="text-slate-600 font-normal">
                {taxonomy.description} Test your preparation, practice solved objective questions, and improve your accuracy for competitive examinations.
              </p>
              {showMoreIntro && (
                <div className="pt-2 border-t border-slate-200 text-slate-600 space-y-1.5 animate-in fade-in">
                  <p>
                    All multiple choice questions feature verified answers, detailed step-by-step explanations, and
                    important reference notes. Test your knowledge, track accuracy, and boost your exam scores today.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowMoreIntro(!showMoreIntro)}
                className="text-blue-600 font-semibold hover:underline cursor-pointer inline-block text-xs"
              >
                {showMoreIntro ? 'Show less' : 'Show more...'}
              </button>
            </div>

            {/* Loading Indicator */}
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs sm:text-sm text-slate-600 font-medium">Loading {taxonomy.name} questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <BookOpen size={36} className="mx-auto text-slate-400" />
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">No questions found for {taxonomy.name}</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Try selecting another category from the left menu or switching the language filter.
                </p>
              </div>
            ) : (
              /* MCQ Questions List with Dynamic In-Feed Ad Spacing */
              <div className="space-y-6">
                {questions.map((q, idx) => {
                  const qId = q._id || q.sql_id || idx;
                  const questionNum = totalQuestions > 0 ? totalQuestions - ((page - 1) * pageSize + idx) : idx + 1;
                  const selectedOpt = userAnswers[qId];
                  const isRevealed = revealedAnswers[qId];

                  let correctIndex = -1;
                  if (Array.isArray(q.options)) {
                    correctIndex = q.options.findIndex((opt) => opt.is_correct);
                  }
                  if (correctIndex === -1 && q.correct_answer) {
                    const match = String(q.correct_answer).match(/Option\s*([0-9]+)/i);
                    if (match) correctIndex = parseInt(match[1], 10) - 1;
                    else if (['A', 'B', 'C', 'D'].includes(String(q.correct_answer).trim().toUpperCase())) {
                      correctIndex = String(q.correct_answer).trim().toUpperCase().charCodeAt(0) - 65;
                    }
                  }

                  // In-Feed Ad after #3, then every 7 questions (#10, #17, #24...)
                  const showAdAfter = (idx + 1 === 3) || (idx + 1 > 3 && (idx + 1 - 3) % 7 === 0);

                  return (
                    <React.Fragment key={qId}>
                      {/* Single Question Box with High Contrast */}
                      <div className="space-y-3 pb-5 border-b border-slate-200 last:border-b-0">
                        {/* Question Title */}
                        <div className="flex items-start gap-2">
                          <h2 className="text-base sm:text-[17px] font-bold text-slate-900 leading-snug">
                            <span className="text-slate-900 mr-1">{questionNum}.</span>
                            {q.content || 'Question content'}
                          </h2>
                        </div>

                        {/* 2-Column Options Grid with High Contrast Borders */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {Array.isArray(q.options) &&
                            q.options.slice(0, 4).map((opt, optIdx) => {
                              const letter = String.fromCharCode(65 + optIdx);
                              const isChecked = selectedOpt === optIdx;
                              const isOptionCorrect = optIdx === correctIndex;
                              const showCorrectHighlight = isRevealed && isOptionCorrect;
                              const showWrongHighlight = isRevealed && isChecked && !isOptionCorrect;

                              return (
                                <label
                                  key={optIdx}
                                  onClick={() => handleSelectOption(qId, optIdx)}
                                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs sm:text-sm cursor-pointer transition select-none ${
                                    showCorrectHighlight
                                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-500'
                                      : showWrongHighlight
                                      ? 'bg-rose-50 border-rose-400 text-rose-950 font-medium'
                                      : isChecked
                                      ? 'bg-blue-50/80 border-blue-600 text-blue-900 font-semibold ring-1 ring-blue-600'
                                      : 'bg-white border-slate-300 text-slate-800 hover:border-blue-400 hover:bg-slate-50/80 font-normal'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`question-opt-${qId}`}
                                    checked={isChecked}
                                    onChange={() => handleSelectOption(qId, optIdx)}
                                    className="accent-blue-600 w-4 h-4 cursor-pointer shrink-0"
                                  />
                                  <span className="min-w-0 break-words leading-tight">
                                    <strong className="mr-1 text-slate-900 font-bold">{letter}.</strong>
                                    {opt.text}
                                  </span>
                                </label>
                              );
                            })}
                        </div>

                        {/* View Answer / Explanation Action Bar */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => toggleViewAnswer(qId)}
                            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition cursor-pointer py-1"
                          >
                            {isRevealed ? (
                              <>
                                <EyeOff size={15} />
                                <span>Hide Answer</span>
                              </>
                            ) : (
                              <>
                                <Eye size={15} />
                                <span>View Answer</span>
                              </>
                            )}
                          </button>

                          {q.examination_names && q.examination_names.length > 0 && (
                            <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200">
                              {q.examination_names[0]}
                            </span>
                          )}
                        </div>

                        {/* Collapsible Answer & Explanation Box */}
                        {isRevealed && (
                          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3.5 text-xs sm:text-sm text-emerald-950 space-y-1.5 animate-in fade-in">
                            <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                              <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                              <span>
                                Correct Answer: Option{' '}
                                {correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : 'N/A'}{' '}
                                {correctIndex >= 0 && q.options?.[correctIndex]?.text
                                  ? `(${q.options[correctIndex].text})`
                                  : ''}
                              </span>
                            </div>
                            {q.ans_info && (
                              <p className="text-slate-700 text-xs sm:text-sm pl-6 pt-1 border-t border-emerald-200/80 leading-relaxed font-normal">
                                <strong className="text-emerald-900 font-semibold">Explanation:</strong> {q.ans_info}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ======================================================= */}
                      {/* IN-FEED AD SPACE (After Question #3, #10, #17, #24...)  */}
                      {/* ======================================================= */}
                      {showAdAfter && (
                        <div className="my-5 p-4 bg-[#f8fafc] rounded-lg border border-slate-200 space-y-3 shadow-2xs">
                          {/* Top "Discover more" Row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
                              Discover more
                            </span>
                            {DISCOVER_TAGS.slice(0, 3).map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-white px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-50 transition cursor-pointer"
                              >
                                <span>{tag.icon}</span>
                                <span>{tag.name}</span>
                              </span>
                            ))}
                          </div>

                          {/* Sponsored Mockup Banner */}
                          <div className="p-3 bg-white rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                                EM
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-xs sm:text-sm">
                                  Practice 15,000+ Free Mock Tests & Quizzes
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Instant score analysis, all-India rank & detailed solutions.
                                </p>
                              </div>
                            </div>
                            <Link
                              href="/mock-test"
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition shadow-xs shrink-0 self-start sm:self-auto inline-block"
                            >
                              Start Free Test
                            </Link>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* ============================================================== */}
            {/* HIGH-CONTRAST PROFESSIONAL PAGINATION BAR                      */}
            {/* ============================================================== */}
            {totalPages > 1 && (
              <div className="pt-6 pb-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left Result Counter text */}
                <div className="text-xs sm:text-sm text-slate-500 font-medium">
                  Showing {startItem} to {endItem} of {totalQuestions} results
                </div>

                {/* Right Pagination Button Group */}
                <div className="inline-flex items-center rounded-md border border-slate-200 bg-white overflow-hidden text-xs sm:text-sm shadow-xs">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200 transition font-medium"
                    title="Previous page"
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
                        type="button"
                        onClick={() => handlePageChange(item)}
                        className={`px-3 py-1.5 transition border-r border-slate-200 last:border-r-0 font-medium ${
                          isCurrent
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-blue-600 hover:bg-slate-50'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition font-medium"
                    title="Next page"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: Tabbed Sidebar with Visible Images               */}
          {/* ============================================================== */}
          <aside className="col-span-1 lg:col-span-3 space-y-6 sticky top-20">
            <div className="bg-[#f0f2f5] border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
              {/* Tabs matching Syllabus Page */}
              <div className="flex items-center bg-[#e4e7ec] border-b border-slate-300">
                <button
                  type="button"
                  onClick={() => setRightTab('expiring')}
                  className={`flex-1 py-3.5 px-3 text-center text-xs sm:text-sm whitespace-nowrap transition ${
                    rightTab === 'expiring'
                      ? 'bg-[#f0f2f5] text-slate-900 rounded-tl-lg font-medium'
                      : 'text-blue-600 hover:text-blue-700 font-medium'
                  }`}
                >
                  Jobs Expiring Soon
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab('mcq')}
                  className={`flex-1 py-3.5 px-3 text-center text-xs sm:text-sm whitespace-nowrap transition ${
                    rightTab === 'mcq'
                      ? 'bg-[#f0f2f5] text-slate-900 rounded-tr-lg font-medium'
                      : 'text-blue-600 hover:text-blue-700 font-medium'
                  }`}
                >
                  Discover More
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4 bg-[#f0f2f5]">
                {rightTab === 'expiring' ? (
                  <div>
                    {/* Subheader */}
                    <div className="flex items-center justify-between text-[11px] sm:text-xs mb-3 pb-2.5 border-b border-slate-300 gap-1.5">
                      <span className="text-slate-700 font-normal whitespace-nowrap">
                        {expiringJobs.length > 0 ? `${expiringJobs.length} Jobs are expiring soon` : '28 Jobs are expiring in 30 Days'}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link href="/jobs" className="text-blue-600 font-normal hover:underline whitespace-nowrap text-[11px] sm:text-xs">
                          View All
                        </Link>
                        <span className="bg-blue-600 text-white text-[10px] sm:text-[11px] font-normal px-1.5 py-0.5 rounded inline-flex items-center gap-1 leading-none whitespace-nowrap shadow-2xs">
                          <span>📰</span>
                          <span>Jobs</span>
                        </span>
                      </div>
                    </div>

                    {/* Jobs List with PROPER VISIBLE RECTANGULAR THUMBNAILS */}
                    {loadingJobs ? (
                      <div className="py-8 text-center text-xs text-slate-500 font-medium">Loading latest jobs...</div>
                    ) : expiringJobs.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 font-medium">No recent jobs available</div>
                    ) : (
                      <div className="divide-y divide-slate-300">
                        {expiringJobs.map((item) => {
                          const miniMediaUrl = getImageUrl(item.featured_media || item.image);

                          return (
                            <Link
                              key={item._id || item.slug}
                              href={`/job/${item.slug || item._id}`}
                              className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3 group transition block"
                            >
                              {/* Large visible thumbnail container */}
                              <div className="w-24 sm:w-28 h-16 sm:h-18 bg-white rounded border border-slate-300 overflow-hidden shrink-0 shadow-2xs">
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

                              {/* Job Details */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between h-16 sm:h-18">
                                <h4 className="text-xs sm:text-sm font-normal text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                  {item.title}
                                </h4>
                                <div className="text-xs text-slate-500 font-normal flex items-center justify-between mt-auto">
                                  <span>Last Date: {formatShortDate(item.app_ends || item.dates?.last_date)}</span>
                                  <span className="text-blue-600 font-semibold text-[11px]">Jobs</span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Discover More Tab Content */
                  <div className="space-y-2 py-1">
                    <div className="divide-y divide-slate-200 text-xs font-semibold">
                      {[
                        { label: 'Education Resources', href: '/category/education' },
                        { label: 'General Knowledge Hub', href: '/general-knowledge/mcq-questions' },
                        { label: 'Government Exam Syllabus', href: '/syllabus' },
                        { label: 'Current Affairs & Articles', href: '/articles' },
                        { label: 'Online Typing Speed Test', href: '/typing-test' },
                        { label: 'Mock Test Series 2026', href: '/mock-test' },
                      ].map((item, i) => (
                        <Link
                          key={i}
                          href={item.href}
                          className="py-2.5 px-2 flex items-center justify-between text-slate-700 hover:text-blue-600 hover:bg-white/60 transition rounded"
                        >
                          <span>{item.label}</span>
                          <ChevronRight size={13} className="text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sponsored Helicopter Banner matching Syllabus Page */}
            <div className="bg-[#e7f9ee] border border-[#a3e6be] rounded border-dashed p-4 text-center relative overflow-hidden shadow-2xs">
              <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mb-1.5">
                Sponsored Banner
              </div>
              <h4 className="font-bold text-slate-800 text-xs">
                Book a Helicopter in Greece
              </h4>
              <p className="text-[11px] text-slate-600 mt-1">
                Luxury charters &amp; private flight tours available online.
              </p>
              <button
                type="button"
                className="mt-3 bg-black hover:bg-zinc-800 text-white font-bold text-xs px-4 py-1.5 rounded transition shadow-2xs"
              >
                Book Now
              </button>
            </div>
          </aside>

        </div>
      </div>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
}
