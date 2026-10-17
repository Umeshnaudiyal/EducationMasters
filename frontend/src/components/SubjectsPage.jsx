'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import { getImageUrl } from '@/utils/image';
import { SUBJECTS_LIST } from '@/utils/mcqTaxonomies';
import {
  Search,
  BookOpen,
  ChevronRight,
  X,
  Sparkles,
  ArrowRight,
  Layers,
  GraduationCap,
  Flame,
  CheckCircle2,
  Share2,
  ExternalLink,
  Laptop,
  Atom,
  Languages,
  Filter
} from 'lucide-react';
import { API_BASE } from '@/utils/api';

// Curated Category Tabs for MCQ Subjects
const CATEGORY_TABS = [
  { id: 'all', label: 'All Subjects', shortLabel: 'All', icon: Layers },
  { id: 'gk', label: 'General Studies', shortLabel: 'General Studies', icon: Sparkles },
  { id: 'tech', label: 'Computer & IT', shortLabel: 'Computer & IT', icon: Laptop },
  { id: 'science', label: 'Science & Maths', shortLabel: 'Science & Maths', icon: Atom },
  { id: 'languages', label: 'Languages', shortLabel: 'Languages', icon: Languages },
  { id: 'teaching', label: 'Teaching Exams', shortLabel: 'Teaching', icon: GraduationCap },
];

// Theme colors and icons for subjects without custom images
const SUBJECT_STYLING = {
  'accounts': { gradient: 'from-amber-600 to-orange-700', badge: 'Commerce', icon: '📊', subText: 'MCQ GK Questions' },
  'biology': { gradient: 'from-emerald-600 to-teal-800', badge: 'Science', icon: '🧬', subText: 'MCQ GK Questions' },
  'bootstrap': { gradient: 'from-purple-600 to-indigo-800', badge: 'Frontend', icon: '🎨', subText: 'MCQ Questions' },
  'business': { gradient: 'from-slate-700 to-slate-900', badge: 'Commerce', icon: '💼', subText: 'MCQ GK Questions' },
  'c-and-c-plus-plus': { gradient: 'from-blue-700 to-indigo-900', badge: 'Programming', icon: '💻', subText: 'MCQ Questions' },
  'computer': { gradient: 'from-cyan-700 to-blue-900', badge: 'IT & Tech', icon: '🖥️', subText: 'MCQ GK Questions' },
  'ctet': { gradient: 'from-emerald-700 to-green-900', badge: 'Teaching', icon: '🎓', subText: 'Central Teacher Eligibility' },
  'economics': { gradient: 'from-yellow-600 to-amber-800', badge: 'Social Science', icon: '📈', subText: 'MCQ GK Questions' },
  'english': { gradient: 'from-rose-600 to-red-800', badge: 'Language', icon: '📖', subText: 'MCQ GK Questions' },
  'environment-science': { gradient: 'from-green-600 to-emerald-800', badge: 'Ecology', icon: '🌱', subText: 'MCQ GK Questions' },
  'general-knowledge': { gradient: 'from-red-600 to-amber-700', badge: 'General Studies', icon: '💡', subText: 'MCQ GK Questions' },
  'geography': { gradient: 'from-teal-600 to-cyan-800', badge: 'General Studies', icon: '🌍', subText: 'MCQ GK Questions' },
  'government-scheme': { gradient: 'from-orange-600 to-amber-700', badge: 'Current Affairs', icon: '🏛️', subText: '100+ MCQ Questions' },
  'hindi': { gradient: 'from-orange-700 to-red-800', badge: 'Language', icon: '🔤', subText: 'MCQ GK Questions' },
  'history': { gradient: 'from-amber-700 to-stone-900', badge: 'General Studies', icon: '📜', subText: '1000+ MCQ Questions' },
  'html-and-css': { gradient: 'from-orange-600 to-rose-700', badge: 'Web Tech', icon: '🌐', subText: 'MCQ Questions' },
  'invention': { gradient: 'from-violet-600 to-purple-800', badge: 'Science', icon: '🔬', subText: 'Discoveries & MCQs' },
  'javascript': { gradient: 'from-amber-500 to-yellow-600', badge: 'Programming', icon: '⚡', subText: 'MCQ Questions' },
  'mathematics': { gradient: 'from-blue-600 to-indigo-800', badge: 'Aptitude', icon: '🔢', subText: 'Formulae & MCQs' },
  'ms-excel': { gradient: 'from-emerald-700 to-green-900', badge: 'MS Office', icon: '📊', subText: 'Excel MCQ Questions' },
  'ms-powerpoint': { gradient: 'from-orange-600 to-red-800', badge: 'MS Office', icon: '📑', subText: 'PowerPoint MCQs' },
  'ms-word': { gradient: 'from-blue-700 to-blue-900', badge: 'MS Office', icon: '📝', subText: 'Word MCQ Questions' },
  'mysql': { gradient: 'from-blue-700 to-cyan-900', badge: 'Database', icon: '🗄️', subText: 'SQL MCQ Questions' },
  'php': { gradient: 'from-indigo-600 to-purple-800', badge: 'Backend', icon: '🐘', subText: 'MCQ Questions' },
  'polity': { gradient: 'from-blue-800 to-slate-900', badge: 'Constitution', icon: '⚖️', subText: 'Indian Polity MCQs' },
  'python': { gradient: 'from-blue-600 to-yellow-600', badge: 'Programming', icon: '🐍', subText: 'MCQ Questions' },
  'reasoning': { gradient: 'from-purple-700 to-indigo-900', badge: 'Mental Ability', icon: '🧠', subText: 'Logic & Reasoning MCQs' },
  'science': { gradient: 'from-emerald-600 to-teal-800', badge: 'General Science', icon: '🧪', subText: 'Physics, Chem & Bio' },
  'sports-gk': { gradient: 'from-emerald-500 to-green-700', badge: 'Sports', icon: '🏆', subText: 'Games & Tournaments' },
  'statewise-first-cm-list': { gradient: 'from-orange-600 to-red-700', badge: 'Indian States', icon: '🏛️', subText: 'State Chief Ministers' },
  '1st-cm-list': { gradient: 'from-orange-600 to-red-700', badge: 'Indian States', icon: '🏛️', subText: 'State Chief Ministers' },
  'tanks': { gradient: 'from-amber-700 to-yellow-900', badge: 'Defence', icon: '🛡️', subText: 'Indian Defence MCQs' },
  'utet': { gradient: 'from-emerald-700 to-teal-900', badge: 'Teaching', icon: '🎓', subText: 'UK Teacher Eligibility' },
  'uttarakhand-fair': { gradient: 'from-amber-600 to-orange-800', badge: 'UK Special', icon: '🎪', subText: 'Fairs & Festivals' }
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showLeftAd, setShowLeftAd] = useState(true);

  // Fetch subjects from backend and merge with static registry
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/subject?limit=100`);
        const json = await res.json();

        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          // Map DB subjects
          const dbSubjects = json.data.map((item) => ({
            id: item._id,
            name: item.name,
            slug: item.slug,
            image: item.image || '',
            description: item.description || '',
            sql_id: item.sql_id || 0,
          }));

          // Merge with registry to ensure all taxonomy subjects exist
          const merged = [...dbSubjects];
          SUBJECTS_LIST.forEach((taxItem) => {
            const exists = merged.some(
              (s) => s.slug === taxItem.slug || s.name.toLowerCase() === taxItem.name.toLowerCase()
            );
            if (!exists) {
              merged.push({
                id: taxItem.slug,
                name: taxItem.name,
                slug: taxItem.slug,
                image: '',
                description: '',
                sql_id: 99,
              });
            }
          });

          // Sort alphabetically by name
          merged.sort((a, b) => a.name.localeCompare(b.name));
          setSubjects(merged);
        } else {
          // Fallback to static subjects list
          setSubjects(
            SUBJECTS_LIST.map((item, idx) => ({
              id: item.slug,
              name: item.name,
              slug: item.slug,
              image: '',
              description: '',
              sql_id: idx + 1,
            }))
          );
        }
      } catch (err) {
        console.error('Error loading subjects:', err);
        setSubjects(
          SUBJECTS_LIST.map((item, idx) => ({
            id: item.slug,
            name: item.name,
            slug: item.slug,
            image: '',
            description: '',
            sql_id: idx + 1,
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Dynamic count for each category filter
  const getCategoryCount = (catId) => {
    if (catId === 'all') return subjects.length;
    if (catId === 'gk') {
      return subjects.filter((s) =>
        ['general-knowledge', 'history', 'geography', 'polity', 'economics', 'environment-science', 'sports-gk', 'government-scheme', 'statewise-first-cm-list', '1st-cm-list', 'uttarakhand-fair', 'accounts', 'business', 'tanks'].includes(s.slug)
      ).length;
    }
    if (catId === 'tech') {
      return subjects.filter((s) =>
        ['computer', 'c-and-c-plus-plus', 'html-and-css', 'javascript', 'python', 'php', 'mysql', 'bootstrap', 'ms-word', 'ms-excel', 'ms-powerpoint'].includes(s.slug)
      ).length;
    }
    if (catId === 'science') {
      return subjects.filter((s) =>
        ['science', 'biology', 'mathematics', 'reasoning', 'invention'].includes(s.slug)
      ).length;
    }
    if (catId === 'languages') {
      return subjects.filter((s) =>
        ['english', 'hindi'].includes(s.slug)
      ).length;
    }
    if (catId === 'teaching') {
      return subjects.filter((s) =>
        ['ctet', 'utet'].includes(s.slug)
      ).length;
    }
    return 0;
  };

  // Filter subjects based on search query and category
  const filteredSubjects = useMemo(() => {
    let list = subjects;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          (SUBJECT_STYLING[s.slug]?.badge || '').toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'all') {
      if (activeCategory === 'gk') {
        list = list.filter((s) =>
          ['general-knowledge', 'history', 'geography', 'polity', 'economics', 'environment-science', 'sports-gk', 'government-scheme', 'statewise-first-cm-list', '1st-cm-list', 'uttarakhand-fair', 'accounts', 'business', 'tanks'].includes(s.slug)
        );
      } else if (activeCategory === 'tech') {
        list = list.filter((s) =>
          ['computer', 'c-and-c-plus-plus', 'html-and-css', 'javascript', 'python', 'php', 'mysql', 'bootstrap', 'ms-word', 'ms-excel', 'ms-powerpoint'].includes(s.slug)
        );
      } else if (activeCategory === 'languages') {
        list = list.filter((s) => ['english', 'hindi'].includes(s.slug));
      } else if (activeCategory === 'science') {
        list = list.filter((s) => ['science', 'biology', 'mathematics', 'reasoning', 'invention'].includes(s.slug));
      } else if (activeCategory === 'teaching') {
        list = list.filter((s) => ['ctet', 'utet'].includes(s.slug));
      }
    }

    return list;
  }, [subjects, searchQuery, activeCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans">
      <Header />
      <LiveTicker />

      {/* Main Page Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">

        {/* 2-Column Responsive Layout (Compact Left Sidebar + Full-Width Main Content) */}
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">

          {/* ================= COMPACT LEFT SIDEBAR (FILTERS & SPONSORED AD) ================= */}
          <aside className="w-full lg:w-56 xl:w-60 shrink-0 space-y-4 lg:sticky lg:top-20 self-start">
            
            {/* Category Filter Box */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Filter className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Categories
                  </h2>
                </div>
                {(activeCategory !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setActiveCategory('all');
                      setSearchQuery('');
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Category Buttons List */}
              <div className="space-y-1">
                {CATEGORY_TABS.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  const count = getCategoryCount(cat.id);

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{cat.label}</span>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Left Sponsored Ad */}
            {showLeftAd && (
              <div className="bg-slate-900 text-white rounded-xl overflow-hidden shadow-sm relative group">
                <button
                  onClick={() => setShowLeftAd(false)}
                  className="absolute top-1.5 right-1.5 text-slate-400 hover:text-white z-10 bg-black/40 p-1 rounded"
                  title="Close Ad"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="p-2 text-center border-b border-slate-800">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Sponsored Ad</span>
                </div>
                <div className="p-3 space-y-2.5 text-center">
                  <p className="text-xs font-semibold leading-snug text-slate-100">
                    Latest Government Exam & Career Updates 2026
                  </p>
                  <div className="w-full h-32 bg-gradient-to-b from-blue-950 to-slate-900 rounded-lg flex items-center justify-center border border-blue-900/50 p-2">
                    <span className="text-[10px] text-blue-200 font-medium leading-tight">100% Verified Job Alerts & Preparation</span>
                  </div>
                  <a
                    href="https://educationmasters.in"
                    target="_blank"
                    rel="noreferrer"
                    className="block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1.5 px-2 rounded-lg transition"
                  >
                    Explore Updates
                  </a>
                </div>
              </div>
            )}
          </aside>

          {/* ================= MAIN SUBJECTS SECTION (FULL REMAINING WIDTH) ================= */}
          <section className="flex-1 min-w-0 space-y-4">

            {/* Top Breadcrumbs */}
            <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1 overflow-x-auto whitespace-nowrap">
              <Link href="/" className="hover:text-blue-600 font-normal">Home</Link>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-slate-700 font-medium">Subjects</span>
            </nav>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Subjects
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Select a subject to practice chapter-wise & topic-wise MCQ questions with answers
                </p>
              </div>

              {/* Real-time Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subject..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Category Filter Pills (Mobile view only) */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all text-xs cursor-pointer ${
                    activeCategory === tab.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.shortLabel || tab.label} ({getCategoryCount(tab.id)})
                </button>
              ))}
            </div>

            {/* Loading State Skeleton */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4.5 pt-1">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3 animate-pulse space-y-2">
                    <div className="w-full aspect-[650/315] bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : filteredSubjects.length === 0 ? (
              /* Empty State */
              <div className="py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-slate-700 font-semibold text-sm">No subjects found matching &quot;{searchQuery}&quot;</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Reset search & filters
                </button>
              </div>
            ) : (
              /* ================= SUBJECTS GRID ================= */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4.5 pt-1">
                {filteredSubjects.map((sub) => {
                  const styling = SUBJECT_STYLING[sub.slug] || {
                    gradient: 'from-blue-600 to-indigo-800',
                    badge: 'Subject',
                    icon: '📚',
                    subText: 'MCQ Questions'
                  };

                  const imageUrl = sub.image ? getImageUrl(sub.image) : null;

                  return (
                    <Link
                      key={sub.id || sub.slug}
                      href={`/mcq-questions/${sub.slug}`}
                      className="group flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      {/* Top Thumbnail Image or Branded Card Banner */}
                      <div className="relative w-full aspect-[650/315] bg-white overflow-hidden flex items-center justify-center border-b border-slate-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={sub.name}
                            loading="lazy"
                            className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                            onError={(e) => {
                              // On broken image, switch to fallback banner
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}

                        {/* Fallback Illustrated Banner matching live site graphics */}
                        <div
                          className={`w-full h-full p-2.5 sm:p-3 bg-gradient-to-br ${styling.gradient} text-white flex flex-col justify-between ${
                            imageUrl ? 'hidden' : 'flex'
                          }`}
                        >
                          {/* Top Corner Icon & Badge */}
                          <div className="flex items-center justify-between">
                            <span className="text-xl sm:text-2xl drop-shadow">{styling.icon}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-black/30 backdrop-blur-[2px] px-1.5 py-0.5 rounded text-white/90">
                              {styling.badge}
                            </span>
                          </div>

                          {/* Center Big Label */}
                          <div className="my-auto py-1">
                            <h3 className="text-xs sm:text-sm md:text-base font-black text-white leading-tight drop-shadow-md truncate">
                              {sub.name}
                            </h3>
                            <p className="text-[10px] sm:text-[11px] text-white/80 font-medium leading-tight line-clamp-1">
                              {styling.subText}
                            </p>
                          </div>

                          {/* Bottom Branding */}
                          <div className="flex items-center justify-between text-[9px] text-white/70 pt-1 border-t border-white/20">
                            <span>Education Masters</span>
                            <span className="font-semibold text-amber-300 group-hover:translate-x-0.5 transition">MCQ →</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Title Bar */}
                      <div className="p-2.5 sm:p-3 bg-white border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                          {sub.name}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0 ml-1" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Bottom SEO Summary Box */}
            <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600 leading-relaxed">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                Subject-Wise Multiple Choice Questions (MCQ) for Competitive Exams
              </h3>
              <p>
                Practice thousands of verified multiple choice questions with detailed explanations covering History, Geography, Indian Polity, General Science, Economics, Computer Knowledge, Quantitative Aptitude, Reasoning, and State GK. Designed specifically for SSC CGL/CHSL, UPSC Civil Services, State PCS, Railway RRB, Banking, CTET/UTET, and Police Bharti exams.
              </p>
            </div>

          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
