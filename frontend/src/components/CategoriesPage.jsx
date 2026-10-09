'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';
import { getImageUrl } from '@/utils/image';
import {
  Search,
  FolderTree,
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
  BookOpen,
  FileText,
  Compass,
  Trophy,
  Award,
  Zap,
} from 'lucide-react';
import { API_BASE } from '@/utils/api';

// Theme styling dictionary for standard and known categories
const CATEGORY_STYLING = {
  'current-affair': { gradient: 'from-rose-600 via-orange-600 to-amber-700', badge: 'Daily News', icon: '📰', subText: 'Current Affairs & GK Updates', group: 'gk' },
  'current-affairs': { gradient: 'from-rose-600 via-orange-600 to-amber-700', badge: 'Daily News', icon: '📰', subText: 'Current Affairs & GK Updates', group: 'gk' },
  'syllabus': { gradient: 'from-blue-700 via-indigo-700 to-slate-900', badge: 'Exam Pattern', icon: '📑', subText: 'Govt Exam Syllabus & Guides', group: 'exams' },
  'articles': { gradient: 'from-emerald-600 via-teal-700 to-cyan-900', badge: 'Knowledge', icon: '📚', subText: 'Educational Articles & Insights', group: 'articles' },
  'article': { gradient: 'from-emerald-600 via-teal-700 to-cyan-900', badge: 'Knowledge', icon: '📚', subText: 'Educational Articles & Insights', group: 'articles' },
  'educational-resources': { gradient: 'from-indigo-600 via-purple-700 to-slate-900', badge: 'Study Material', icon: '🎓', subText: 'Study Notes & Exam Resources', group: 'articles' },
  'education': { gradient: 'from-cyan-600 via-blue-700 to-indigo-900', badge: 'Education', icon: '🏫', subText: 'Career Guidance & Resources', group: 'articles' },
  'gk': { gradient: 'from-amber-600 via-orange-600 to-red-700', badge: 'General Studies', icon: '💡', subText: 'Daily General Knowledge Notes', group: 'gk' },
  'general-knowledge': { gradient: 'from-amber-600 via-orange-600 to-red-700', badge: 'General Studies', icon: '💡', subText: 'Complete GK for Govt Exams', group: 'gk' },
  'ssc': { gradient: 'from-blue-600 via-cyan-700 to-teal-800', badge: 'Staff Selection', icon: '🏆', subText: 'CGL, CHSL, MTS & CPO Prep', group: 'exams' },
  'upsc': { gradient: 'from-slate-800 via-stone-800 to-zinc-950', badge: 'Civil Services', icon: '🏛️', subText: 'IAS, IPS, NDA & CDS Guides', group: 'exams' },
  'railway': { gradient: 'from-red-600 via-rose-700 to-pink-900', badge: 'RRB Exams', icon: '🚂', subText: 'NTPC, Group D & ALP Alerts', group: 'exams' },
  'bank': { gradient: 'from-teal-600 via-emerald-700 to-cyan-900', badge: 'Banking', icon: '🏦', subText: 'SBI, IBPS, PO & Clerk Prep', group: 'exams' },
  'defence': { gradient: 'from-emerald-700 via-green-800 to-stone-900', badge: 'Armed Forces', icon: '🛡️', subText: 'Army, Navy, Airforce & NDA', group: 'exams' },
  'biography': { gradient: 'from-purple-600 via-fuchsia-700 to-pink-900', badge: 'Inspiration', icon: '👤', subText: 'Life Stories of Great Leaders', group: 'articles' },
  'tips': { gradient: 'from-orange-500 via-amber-600 to-yellow-700', badge: 'Strategies', icon: '✨', subText: 'Exam Preparation & Time Tips', group: 'tips' },
  'exam-tips': { gradient: 'from-orange-500 via-amber-600 to-yellow-700', badge: 'Strategies', icon: '✨', subText: 'Proven Exam Crack Strategies', group: 'tips' },
  'funzone': { gradient: 'from-pink-600 via-rose-600 to-purple-800', badge: 'Brain Games', icon: '🎯', subText: 'Puzzles, Riddles & GK Trivia', group: 'tips' },
  'jobs': { gradient: 'from-blue-700 via-indigo-800 to-slate-900', badge: 'Recruitment', icon: '💼', subText: 'Latest Govt Job Vacancies', group: 'exams' },
  'admit-card': { gradient: 'from-violet-600 via-purple-700 to-indigo-900', badge: 'Hall Ticket', icon: '🎫', subText: 'Admit Card Direct Links', group: 'exams' },
  'admit-cards': { gradient: 'from-violet-600 via-purple-700 to-indigo-900', badge: 'Hall Ticket', icon: '🎫', subText: 'Admit Card Direct Links', group: 'exams' },
  'result': { gradient: 'from-emerald-600 via-teal-700 to-green-900', badge: 'Scorecards', icon: '📊', subText: 'Exam Results & Merit Lists', group: 'exams' },
  'results': { gradient: 'from-emerald-600 via-teal-700 to-green-900', badge: 'Scorecards', icon: '📊', subText: 'Exam Results & Merit Lists', group: 'exams' },
  'answer-key': { gradient: 'from-amber-600 via-orange-700 to-red-800', badge: 'Solutions', icon: '🔑', subText: 'Official Answer Keys & Papers', group: 'exams' },
  'cutoff-marks': { gradient: 'from-stone-700 via-zinc-800 to-slate-900', badge: 'Cutoffs', icon: '📈', subText: 'Category-wise Cutoff Analysis', group: 'exams' },
};

// Curated Master Baseline Categories
const MASTER_CATEGORIES = [
  { id: 'current-affairs', name: 'Current Affairs', slug: 'current-affairs', description: 'Daily national, international current affairs and important GK updates.' },
  { id: 'syllabus', name: 'Syllabus', slug: 'syllabus', description: 'Latest government exam syllabus, selection process and detailed subject patterns.' },
  { id: 'articles', name: 'Articles', slug: 'articles', description: 'Comprehensive educational articles, career insights, and in-depth guides.' },
  { id: 'general-knowledge', name: 'General Knowledge', slug: 'general-knowledge', description: 'Subject-wise and topic-wise general knowledge notes for all exams.' },
  { id: 'educational-resources', name: 'Educational Resources', slug: 'educational-resources', description: 'Handpicked study materials, PDF notes, and preparatory guides.' },
  { id: 'education', name: 'Education', slug: 'education', description: 'Educational news, admission notifications, and academic articles.' },
  { id: 'ssc', name: 'SSC', slug: 'ssc', description: 'Complete study guides for SSC CGL, CHSL, MTS, CPO, and Stenographer.' },
  { id: 'upsc', name: 'UPSC', slug: 'upsc', description: 'Preparation strategies and guides for UPSC Civil Services, NDA, and CDS.' },
  { id: 'railway', name: 'Railway', slug: 'railway', description: 'RRB NTPC, Group D, ALP, and Technician recruitment syllabus and notes.' },
  { id: 'bank', name: 'Bank', slug: 'bank', description: 'Banking recruitment materials for SBI PO, Clerk, IBPS PO, and RBI Assistant.' },
  { id: 'defence', name: 'Defence', slug: 'defence', description: 'Indian Army, Navy, Air Force, AFCAT, and NDA preparation articles.' },
  { id: 'biography', name: 'Biography', slug: 'biography', description: 'Inspiring life stories and biographies of great leaders and scientists.' },
  { id: 'exam-tips', name: 'Exam Tips', slug: 'exam-tips', description: 'Expert strategies, time management techniques, and exam crack formulas.' },
  { id: 'funzone', name: 'Funzone', slug: 'funzone', description: 'Interactive learning, interesting facts, brain teasers, and general trivia.' },
  { id: 'jobs', name: 'Latest Jobs', slug: 'jobs', description: 'All central and state government job notifications and vacancy updates.' },
  { id: 'admit-cards', name: 'Admit Cards', slug: 'admit-cards', description: 'Official direct download links for government exam hall tickets.' },
  { id: 'results', name: 'Exam Results', slug: 'results', description: 'Prompt exam result declarations, merit lists, and scorecards.' },
  { id: 'answer-key', name: 'Answer Keys', slug: 'answer-key', description: 'Official response sheets and answer keys for competitive examinations.' },
];

const DEFAULT_EXPIRING_JOBS = [
  {
    id: 1,
    title: 'UDD Uttarakhand Recruitment 2026 - Apply Offline for 12 Posts',
    slug: 'udd-uttarakhand-recruitment-2026',
    lastDate: 'Oct 05',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 2,
    title: 'Mumbai Port Authority Junior Professional Intern Recruitment 2026',
    slug: 'mumbai-port-authority-junior-professional-intern-recruitment-2026',
    lastDate: 'Oct 06',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 3,
    title: 'UKSSSC Inter Level Group C Recruitment 2026 Notification Out',
    slug: 'uksssc-inter-level-group-c-recruitment-2026',
    lastDate: 'Oct 07',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 4,
    title: 'SSC CHSL Recruitment 2026 Notification Out - Apply Online',
    slug: 'ssc-chsl-recruitment-2026',
    lastDate: 'Oct 07',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 5,
    title: 'MECL Non Executive Recruitment 2026 - Apply Online for 120 Posts',
    slug: 'mecl-non-executive-recruitment-2026',
    lastDate: 'Oct 08',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80',
  },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const [sidebarTab, setSidebarTab] = useState('expiring');
  const [expiringJobs, setExpiringJobs] = useState(DEFAULT_EXPIRING_JOBS);
  const [showLeftAd, setShowLeftAd] = useState(true);

  // Fetch categories from backend & merge with master baseline list
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/categories?all=true`);
        const json = await res.json();

        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const dbCategories = json.data.map((item) => ({
            id: item._id,
            name: item.name,
            slug: item.slug,
            image: item.image || (item.featured_media ? item.featured_media.path || item.featured_media.file : ''),
            description: item.description || '',
            count: item.count || 0,
          }));

          // Merge with master baseline to guarantee full coverage
          const merged = [...dbCategories];
          MASTER_CATEGORIES.forEach((master) => {
            const exists = merged.some(
              (c) =>
                c.slug === master.slug ||
                c.name.toLowerCase() === master.name.toLowerCase()
            );
            if (!exists) {
              merged.push({
                id: master.slug,
                name: master.name,
                slug: master.slug,
                image: '',
                description: master.description,
                count: 0,
              });
            }
          });

          // Sort alphabetically by name
          merged.sort((a, b) => a.name.localeCompare(b.name));
          setCategories(merged);
        } else {
          setCategories(MASTER_CATEGORIES);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
        setCategories(MASTER_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    const fetchSidebarJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/expiring-soon?limit=6`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = json.data.map((item, idx) => ({
            id: item._id || idx,
            title: item.title,
            slug: item.slug || `job-${idx}`,
            lastDate: item.app_ends
              ? new Date(item.app_ends).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                })
              : 'As Scheduled',
            category: 'Jobs',
            image: getImageUrl(
              item.featured_media,
              DEFAULT_EXPIRING_JOBS[idx % DEFAULT_EXPIRING_JOBS.length].image
            ),
          }));
          setExpiringJobs(mapped);
        }
      } catch (e) {
        console.warn('Sidebar jobs fetch fallback:', e);
      }
    };

    fetchCategories();
    fetchSidebarJobs();
  }, []);

  // Filter categories by search term and category group
  const filteredCategories = useMemo(() => {
    let list = categories;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q) ||
          (CATEGORY_STYLING[c.slug]?.badge || '').toLowerCase().includes(q) ||
          (CATEGORY_STYLING[c.slug]?.subText || '').toLowerCase().includes(q)
      );
    }

    if (activeGroup !== 'all') {
      list = list.filter((c) => {
        const styling = CATEGORY_STYLING[c.slug];
        if (activeGroup === 'exams') {
          return (
            styling?.group === 'exams' ||
            ['syllabus', 'ssc', 'upsc', 'railway', 'bank', 'defence', 'jobs', 'admit-card', 'admit-cards', 'result', 'results', 'answer-key', 'cutoff-marks'].includes(c.slug)
          );
        }
        if (activeGroup === 'gk') {
          return (
            styling?.group === 'gk' ||
            ['current-affair', 'current-affairs', 'gk', 'general-knowledge'].includes(c.slug)
          );
        }
        if (activeGroup === 'articles') {
          return (
            styling?.group === 'articles' ||
            ['articles', 'article', 'educational-resources', 'education', 'biography'].includes(c.slug)
          );
        }
        if (activeGroup === 'tips') {
          return (
            styling?.group === 'tips' ||
            ['tips', 'exam-tips', 'funzone'].includes(c.slug)
          );
        }
        return true;
      });
    }

    return list;
  }, [categories, searchQuery, activeGroup]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans">
      <Header />
      <LiveTicker />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
        {/* 3-Column Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* ================= LEFT SKYSCRAPER AD CONTAINER ================= */}
          {showLeftAd && (
            <aside className="hidden xl:block xl:col-span-2 sticky top-20 self-start z-10">
              <div className="w-[160px] mx-auto bg-slate-900 text-white rounded overflow-hidden shadow-sm relative group">
                <button
                  onClick={() => setShowLeftAd(false)}
                  className="absolute top-1 right-1 text-slate-400 hover:text-white z-10 bg-black/40 p-0.5 rounded cursor-pointer"
                  title="Close Ad"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="p-3 text-center border-b border-slate-800">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                    Sponsored Ad
                  </span>
                </div>
                <div className="p-4 space-y-3 text-center">
                  <p className="text-xs font-semibold leading-snug text-slate-100">
                    Latest Government Exam & Career Updates 2026
                  </p>
                  <div className="w-full h-44 bg-gradient-to-b from-blue-950 to-slate-900 rounded flex items-center justify-center border border-blue-900/50 p-2">
                    <span className="text-[11px] text-blue-200 font-medium leading-tight">
                      100% Verified Job Alerts & Preparation
                    </span>
                  </div>
                  <a
                    href="https://educationmasters.in"
                    target="_blank"
                    rel="noreferrer"
                    className="block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-2 rounded transition"
                  >
                    Explore Updates
                  </a>
                </div>
              </div>
            </aside>
          )}

          {/* ================= CENTER MAIN CATEGORIES SECTION ================= */}
          <section className="col-span-1 lg:col-span-8 xl:col-span-7 space-y-4 min-w-0">
            {/* Top Breadcrumbs */}
            <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1 overflow-x-auto whitespace-nowrap">
              <Link href="/" className="hover:text-blue-600 font-normal">
                Home
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-slate-700 font-medium">Categories</span>
            </nav>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Categories
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Browse by category for educational articles, syllabus, current affairs, GK notes & exam updates
                </p>
              </div>

              {/* Real-time Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
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
            </div>

            {/* Quick Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { id: 'all', label: `All (${categories.length})` },
                { id: 'exams', label: 'Exams & Syllabus' },
                { id: 'gk', label: 'Current Affairs & GK' },
                { id: 'articles', label: 'Articles & Study Resources' },
                { id: 'tips', label: 'Career & Preparation Tips' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGroup(tab.id)}
                  className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all text-xs cursor-pointer ${
                    activeGroup === tab.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Loading State Skeleton */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3 animate-pulse space-y-2"
                  >
                    <div className="w-full aspect-[16/10] bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : filteredCategories.length === 0 ? (
              /* Empty State */
              <div className="py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                <FolderTree className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-slate-700 font-semibold text-sm">
                  No categories found matching &quot;{searchQuery}&quot;
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveGroup('all');
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Reset search & filters
                </button>
              </div>
            ) : (
              /* ================= CATEGORIES GRID ================= */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4.5 pt-1">
                {filteredCategories.map((cat) => {
                  const styling = CATEGORY_STYLING[cat.slug] || {
                    gradient: 'from-blue-600 via-indigo-700 to-slate-900',
                    badge: 'Category',
                    icon: '📁',
                    subText: cat.description || 'Explore Posts & Updates',
                  };

                  const imageUrl = cat.image ? getImageUrl(cat.image) : null;
                  const targetHref =
                    cat.slug === 'jobs'
                      ? '/jobs'
                      : cat.slug === 'admit-cards' || cat.slug === 'admit-card'
                      ? '/admit-cards'
                      : cat.slug === 'results' || cat.slug === 'result'
                      ? '/results'
                      : `/category/${cat.slug}`;

                  return (
                    <Link
                      key={cat.id || cat.slug}
                      href={targetHref}
                      className="group flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      {/* Top Thumbnail Image or Branded Fallback Card Banner */}
                      <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}

                        {/* Fallback Illustrated Card Banner */}
                        <div
                          className={`w-full h-full p-2.5 sm:p-3 bg-gradient-to-br ${styling.gradient} text-white flex flex-col justify-between ${
                            imageUrl ? 'hidden' : 'flex'
                          }`}
                        >
                          {/* Top Corner Icon & Badge */}
                          <div className="flex items-center justify-between">
                            <span className="text-xl sm:text-2xl drop-shadow">
                              {styling.icon}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-black/30 backdrop-blur-[2px] px-1.5 py-0.5 rounded text-white/90">
                              {styling.badge}
                            </span>
                          </div>

                          {/* Center Big Label */}
                          <div className="my-auto py-1">
                            <h3 className="text-xs sm:text-sm md:text-base font-black text-white leading-tight drop-shadow-md truncate">
                              {cat.name}
                            </h3>
                            <p className="text-[10px] sm:text-[11px] text-white/80 font-medium leading-tight line-clamp-1">
                              {styling.subText}
                            </p>
                          </div>

                          {/* Bottom Branding */}
                          <div className="flex items-center justify-between text-[9px] text-white/70 pt-1 border-t border-white/20">
                            <span>Education Masters</span>
                            <span className="font-semibold text-amber-300 group-hover:translate-x-0.5 transition">
                              Explore →
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Title Bar */}
                      <div className="p-2.5 sm:p-3 bg-white border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                          {cat.name}
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
                Explore Top Educational Categories & Exam Preparation Guides
              </h3>
              <p>
                Stay ahead in your competitive examination journey with our curated category directory. Explore dedicated categories for Government Exam Syllabus, Daily Current Affairs, General Knowledge, SSC, UPSC Civil Services, Railway Recruitment, Banking Exams, Defence Preparation, Exam Tips, and Educational Resources with free access to syllabus outlines, guides, and important updates.
              </p>
            </div>
          </section>

          {/* ================= RIGHT SIDEBAR WIDGET ================= */}
          <aside className="col-span-1 lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 self-start z-10 space-y-4 max-h-none lg:max-h-[calc(100vh-5.5rem)] overflow-visible lg:overflow-y-auto mt-6 lg:mt-0">
            <div className="bg-[#f8f9fa] border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              {/* Tab Header - 2 Equal 50% Tabs */}
              <div className="flex border-b border-slate-200 -mx-3.5 -mt-3.5 mb-3.5 bg-[#e9ecef]/50 rounded-t-lg overflow-hidden">
                <button
                  onClick={() => setSidebarTab('expiring')}
                  className={`flex-1 py-3 px-2 text-center text-xs sm:text-sm transition cursor-pointer ${
                    sidebarTab === 'expiring'
                      ? 'bg-[#e9ecef] text-slate-900 border-r border-slate-200 font-bold'
                      : 'bg-white/60 text-[#2563eb] hover:bg-white border-r border-slate-200 font-semibold'
                  }`}
                >
                  Jobs Expiring Soon
                </button>
                <button
                  onClick={() => setSidebarTab('mcq')}
                  className={`flex-1 py-3 px-2 text-center text-xs sm:text-sm transition cursor-pointer ${
                    sidebarTab === 'mcq'
                      ? 'bg-[#e9ecef] text-slate-900 font-bold'
                      : 'bg-white/60 text-[#2563eb] hover:bg-white font-semibold'
                  }`}
                >
                  MCQ Questions
                </button>
              </div>

              {sidebarTab === 'expiring' ? (
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-2 px-0.5">
                    <span className="font-normal text-slate-600">
                      25 Jobs are expiring in 30 Days
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <Link
                        href="/jobs-expiring-in-30-days"
                        className="text-[#2563eb] font-medium hover:underline"
                      >
                        View All
                      </Link>
                      <span className="bg-[#2563eb] text-white text-[11px] font-semibold px-2 py-0.5 rounded flex items-center space-x-1">
                        <svg
                          className="w-3 h-3 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                        </svg>
                        <span>Jobs</span>
                      </span>
                    </div>
                  </div>
                  <hr className="border-slate-200 mb-3.5" />

                  {/* Expiring Jobs List Rows */}
                  <div className="space-y-3">
                    {expiringJobs.slice(0, 6).map((job, idx) => (
                      <div key={job.id || idx}>
                        <Link
                          href={`/job/${job.slug}`}
                          className="flex items-start space-x-3 group block transition"
                        >
                          <div className="w-[95px] h-[65px] shrink-0 rounded border border-slate-200 overflow-hidden bg-white">
                            <img
                              src={job.image}
                              alt={job.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                if (!e.currentTarget.dataset.fallback) {
                                  e.currentTarget.dataset.fallback = 'true';
                                  e.currentTarget.src = '/logo.webp';
                                } else {
                                  e.currentTarget.style.display = 'none';
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="text-xs sm:text-sm font-normal text-slate-900 group-hover:text-blue-600 line-clamp-2 leading-snug">
                              {job.title}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                              <span className="text-slate-500 font-normal">
                                Last Date:{' '}
                                <span className="text-slate-600">
                                  {job.lastDate}
                                </span>
                              </span>
                              <span className="text-[#2563eb] font-medium">
                                Jobs
                              </span>
                            </div>
                          </div>
                        </Link>
                        {idx < 5 && <hr className="border-slate-200/80 my-3" />}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* MCQ Tab Content */
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-2 px-0.5">
                    <span className="font-normal text-slate-600">
                      Daily Practice Questions
                    </span>
                    <Link
                      href="/mcq-questions"
                      className="text-[#2563eb] font-medium hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <hr className="border-slate-200 mb-3.5" />

                  <div className="space-y-3 text-xs">
                    <div className="py-2 border-b border-slate-200 space-y-1">
                      <span className="text-[10px] font-semibold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded">
                        Indian Polity
                      </span>
                      <p className="font-medium text-slate-800 leading-snug">
                        Who presides over the joint sitting of the Parliament in India?
                      </p>
                    </div>
                    <div className="py-2 border-b border-slate-200 space-y-1">
                      <span className="text-[10px] font-semibold text-amber-600 uppercase bg-amber-50 px-1.5 py-0.5 rounded">
                        Current Affairs
                      </span>
                      <p className="font-medium text-slate-800 leading-snug">
                        Which state government recently launched the Youth Employment Scheme?
                      </p>
                    </div>
                    <div className="py-2 space-y-1">
                      <span className="text-[10px] font-semibold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">
                        General Science
                      </span>
                      <p className="font-medium text-slate-800 leading-snug">
                        What is the SI unit of electric current intensity?
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Green Channel Join Banner Box matching Live Site */}
            <div className="bg-[#e6f7ef] border border-[#a3e6c5] rounded-lg p-3 text-center space-y-1.5">
              <p className="text-xs font-semibold text-emerald-900">
                सरकारी नौकरियों और GK अपडेट्स के लिए हमारे ग्रुप्स से जुड़ें:
              </p>
              <div className="flex items-center justify-center space-x-2 pt-1">
                <a
                  href="https://whatsapp.com/channel/0029Vb6sjZz0wajwDXcd5B0U"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1 shadow-2xs transition"
                >
                  <span>WhatsApp</span>
                </a>
                <a
                  href="https://t.me/educationmastersin"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1 shadow-2xs transition"
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
