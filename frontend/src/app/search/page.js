'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LiveTicker from '@/components/LiveTicker';
import {
  Search, ExternalLink, Calendar, Building,
  FileText, Sparkles, Filter, ChevronRight, X, ArrowRight,
  Flame, Keyboard, Award, CheckCircle2, Zap, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/apis/v1`
  : 'http://localhost:5001/apis/v1';

const TRENDING_EXAMS = [
  { title: 'UPSC Civil Services 2026', type: 'Job', badgeColor: '#2563eb', query: 'UPSC' },
  { title: 'Union Bank 2026 Result', type: 'Result', badgeColor: '#059669', query: 'Union Bank' },
  { title: 'SSC CGL Tier 1 Admit Card', type: 'Admit Card', badgeColor: '#7c3aed', query: 'SSC CGL' },
  { title: 'Railway RRB NTPC CBT-2', type: 'Job', badgeColor: '#2563eb', query: 'Railway' },
  { title: 'Indian Army Agniveer 2026', type: 'Job', badgeColor: '#2563eb', query: 'Army' },
  { title: 'Daily Current Affairs Quiz', type: 'MCQ', badgeColor: '#4f46e5', query: 'Current Affairs' },
];

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialType);
  const [results, setResults] = useState([]);
  const [counts, setCounts] = useState({ all: 0, jobs: 0, results: 0, 'admit-cards': 0, blogs: 0, mcqs: 0 });
  const [total, setTotal] = useState(0);
  const [tookMs, setTookMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const debounceRef = React.useRef(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActiveTab(initialType);
  }, [initialType]);

  useEffect(() => {
    if (initialQuery.trim()) {
      fetchSearchResults(initialQuery, activeTab);
    } else {
      setResults([]);
      setTotal(0);
      setLoading(false);
    }
  }, [initialQuery, activeTab]);

  const fetchSearchResults = async (searchQ, type) => {
    setLoading(true);
    try {
      const typeParam = type === 'all' ? '' : `&type=${encodeURIComponent(type)}`;
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQ)}${typeParam}&limit=35`);
      const data = await res.json();

      if (data.success) {
        setResults(data.data || []);
        setCounts(data.counts || { all: 0, jobs: 0, results: 0, 'admit-cards': 0, blogs: 0, mcqs: 0 });
        setTotal(data.total || 0);
        setTookMs(data.tookMs || 12);
      } else {
        setResults([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Search fetch error:', err);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) return;

    debounceRef.current = setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(val.trim())}&type=${encodeURIComponent(activeTab)}`);
    }, 450);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${encodeURIComponent(activeTab)}`);
  };

  const handleTrendingClick = (trendingQuery) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery(trendingQuery);
    router.push(`/search?q=${encodeURIComponent(trendingQuery)}&type=all`);
  };

  const highlightMatch = (text, matchStr) => {
    if (!text || !matchStr) return text;
    const cleanMatch = matchStr.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    if (!cleanMatch) return text;

    const parts = String(text).split(new RegExp(`(${cleanMatch})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === matchStr.toLowerCase() ? (
        <span key={i} className="font-extrabold text-slate-900 bg-amber-100 px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const tabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'jobs', label: 'Jobs', count: counts.jobs },
    { id: 'results', label: 'Results', count: counts.results },
    { id: 'admit-cards', label: 'Admit Cards', count: counts['admit-cards'] },
    { id: 'blogs', label: 'Articles', count: counts.blogs },
    { id: 'mcqs', label: 'MCQs', count: counts.mcqs },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfd] text-slate-800 font-sans">
      <Header />
      <LiveTicker />

      {/* Main Search Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* 1. Google-Style Refinement Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center max-w-2xl w-full">
            <div className="relative flex items-center w-full bg-white rounded-full border border-slate-300 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 shadow-sm transition-all duration-200">
              <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                placeholder="Search jobs, results, admit cards, syllabus, MCQs..."
                className="w-full px-3 py-3 text-sm text-slate-900 bg-transparent focus:outline-none placeholder-slate-400 font-normal"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    router.push('/search?q=&type=' + activeTab);
                  }}
                  className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs px-5 py-2.5 rounded-full mr-1.5 shadow-sm transition duration-150"
              >
                Search
              </button>
            </div>
          </form>

          {/* Search Statistics line */}
          {initialQuery && (
            <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
              <span>About {total.toLocaleString()} results ({tookMs / 1000} seconds)</span>
            </div>
          )}
        </div>

        {/* 2. Filter Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 mb-6 overflow-x-auto whitespace-nowrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  router.push(`/search?q=${encodeURIComponent(initialQuery)}&type=${encodeURIComponent(tab.id)}`);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition ${isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. 2-Column Responsive Layout (Results Left, Ads & Widgets Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT RESULTS COLUMN */}
          <div className="col-span-1 lg:col-span-8 space-y-6">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="space-y-2 animate-pulse bg-white p-4 rounded-lg border border-slate-100">
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-5">
                {results.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="group bg-white p-4 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col space-y-1.5"
                  >
                    {/* Breadcrumb Path & Badge */}
                    <div className="flex items-center space-x-2 text-xs text-slate-500 min-w-0">
                      {activeTab === 'all' && (
                        <span
                          className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded text-white shadow-2xs whitespace-nowrap shrink-0 inline-flex items-center justify-center tracking-wide leading-none"
                          style={{ backgroundColor: item.badgeColor || '#2563eb', whiteSpace: 'nowrap', minWidth: 'max-content' }}
                        >
                          {item.badge || item.typeLabel}
                        </span>
                      )}
                      <span className="text-slate-400 font-normal truncate min-w-0 flex-1">
                        educationmasters.in › {item.type} › {item.slug || item.id}
                      </span>
                    </div>

                    {/* Clickable Result Title */}
                    <h3 className="text-base sm:text-lg font-bold text-[#1a0dab] hover:underline leading-snug">
                      <Link href={item.url}>
                        {highlightMatch(item.title, initialQuery)}
                      </Link>
                    </h3>

                    {/* Subtitle & Department Info */}
                    <p className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-1.5">
                      {item.department && <span>{item.department} • </span>}
                      {item.subtitle && <span>{item.subtitle} • </span>}
                      <span className="text-slate-500 font-normal">{item.metaText}</span>
                    </p>

                    {/* Snippet / Description */}
                    {item.description && (
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed font-normal pt-0.5">
                        {highlightMatch(item.description.replace(/<[^>]*>/g, '').substring(0, 180), initialQuery)}...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center max-w-md mx-auto space-y-3 bg-white p-8 rounded-2xl border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  No results found for &ldquo;{initialQuery}&rdquo;
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                  Check your spelling or try more general keywords like <span className="font-semibold text-slate-700">UPSC</span>, <span className="font-semibold text-slate-700">SSC</span>, <span className="font-semibold text-slate-700">Bank</span>, or <span className="font-semibold text-slate-700">Result</span>.
                </p>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-xs transition"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR COLUMN: ADS & PROMOTIONAL WIDGETS */}
          <aside className="col-span-1 lg:col-span-4 space-y-5 sticky top-20">

            {/* 1. Google Ads Style Sponsored Card (300x250 Ratio) */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  Sponsored • Ad
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Verified Portal</span>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  100% Free Government Exam Mock Tests & Speed Typing
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Practice with over 15,000+ topic-wise questions, latest exam pattern mock tests, and English/Hindi typing assessments.
                </p>
              </div>

              <div className="pt-1 flex items-center space-x-2">
                <Link
                  href="/typing-test"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-center font-bold text-xs py-2 rounded-lg transition shadow-2xs"
                >
                  Typing Test
                </Link>
                <Link
                  href="/mcq-questions"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 text-center font-bold text-xs py-2 rounded-lg transition shadow-2xs"
                >
                  Mock Tests
                </Link>
              </div>
            </div>

            {/* 2. Trending Searches & Exams Card */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Trending Searches 2026
                </h4>
              </div>

              <div className="space-y-2">
                {TRENDING_EXAMS.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleTrendingClick(item.query)}
                    className="p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer group transition border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span
                        className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded text-white shadow-2xs whitespace-nowrap shrink-0 inline-flex items-center justify-center leading-none"
                        style={{ backgroundColor: item.badgeColor, whiteSpace: 'nowrap', minWidth: 'max-content' }}
                      >
                        {item.type}
                      </span>
                      <span className="text-xs text-slate-700 font-medium group-hover:text-blue-600 truncate">
                        {item.title}
                      </span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                  </div>
                ))}
              </div>
            </div>



            {/* 4. Social Community Channel Follow Card */}
            <div className="bg-[#e6f7ef] border border-[#a3e6c5] rounded-xl p-4 text-center space-y-2">
              <p className="text-xs font-bold text-emerald-900">
                Join our Telegram & WhatsApp for Instant Job & Result Alerts:
              </p>
              <div className="flex items-center justify-center space-x-2 pt-1">
                <a
                  href="https://whatsapp.com/channel/0029Vb6sjZz0wajwDXcd5B0U"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-2xs transition"
                >
                  <span>WhatsApp</span>
                </a>
                <a
                  href="https://t.me/educationmastersin"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-2xs transition"
                >
                  <span>Telegram</span>
                </a>
              </div>
            </div>

          </aside>

        </div>

      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Loading search...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
