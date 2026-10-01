'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import {
  AnimatedMenu,
  AnimatedSearch,
  AnimatedKeyboard,
  AnimatedFileText,
  AnimatedUser,
  AnimatedLogIn,
  AnimatedLogOut,
  AnimatedBookOpen,
  AnimatedAward,
  AnimatedSparkles,
  AnimatedZap,
  AnimatedHistory,
  AnimatedClock,
  AnimatedFlame,
  AnimatedArrowUpRight,
  AnimatedCornerDownLeft
} from './AnimatedIcons';
import { useAuthModal } from '@/context/AuthModalContext';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/apis/v1`
  : 'http://localhost:5001/apis/v1';

const ROTATING_PLACEHOLDERS = [
  'Search "Union Bank 2026 Result"...',
  'Search "UPSC Civil Services 2026"...',
  'Search "SSC CGL Tier 1 Admit Card"...',
  'Search "Railway RRB NTPC Exam"...',
  'Search "Daily GK & Current Affairs MCQ"...',
  'Search "State Police Recruitment"...'
];

const POPULAR_SEARCHES = [
  { title: 'Union Bank Recruitment 2026 Result', badge: 'Result', color: '#059669', url: '/result/union-bank-result-2026' },
  { title: 'UPSC Civil Services 2026 Notification', badge: 'Job', color: '#2563eb', url: '/job/upsc-recruitment-2026' },
  { title: 'SSC CGL Tier 1 Admit Card Download', badge: 'Admit Card', color: '#7c3aed', url: '/admit-cards' },
  { title: 'Railway RRB NTPC CBT-2 Exam Date', badge: 'Job', color: '#2563eb', url: '/jobs' },
  { title: 'Daily Current Affairs & GK MCQ Quiz', badge: 'MCQ', color: '#4f46e5', url: '/mcq-questions' },
];

const FILTER_PILLS = [
  { id: 'all', label: 'All', icon: AnimatedZap },
  { id: 'job', label: 'Jobs', icon: AnimatedAward },
  { id: 'result', label: 'Results', icon: AnimatedSparkles },
  { id: 'admit-card', label: 'Admit Cards', icon: AnimatedFileText },
  { id: 'blog', label: 'Articles', icon: AnimatedBookOpen },
  { id: 'mcq', label: 'MCQs', icon: AnimatedKeyboard },
];

export default function Header({ onOpenMockModal }) {
  const { data: session } = useSession();
  const { openAuthModal } = useAuthModal();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('em_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch (e) { }
  }, []);

  const saveRecentSearch = (text) => {
    if (!text || !text.trim()) return;
    try {
      const clean = text.trim();
      const updated = [clean, ...recentSearches.filter(s => s.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('em_recent_searches', JSON.stringify(updated));
    } catch (e) { }
  };

  const removeRecentSearch = (e, text) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter(s => s !== text);
      setRecentSearches(updated);
      localStorage.setItem('em_recent_searches', JSON.stringify(updated));
    } catch (e) { }
  };

  const clearAllRecentSearches = (e) => {
    e.stopPropagation();
    try {
      setRecentSearches([]);
      localStorage.removeItem('em_recent_searches');
    } catch (e) { }
  };

  // Rotating Placeholder Interval
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard Shortcut: Press '/' or 'Ctrl+K' / 'Cmd+K' to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchFocused(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Click outside to dismiss suggestions on desktop
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Live Search Query to Backend
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      setSelectedIndex(-1);
      return;
    }

    setIsLoadingSuggestions(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const filterParam = activeFilter === 'all' ? '' : `&type=${encodeURIComponent(activeFilter)}`;
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery.trim())}${filterParam}&suggestion=true&limit=8`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setSuggestions(data.data);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 150);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery, activeFilter]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      navigateToUrl(suggestions[selectedIndex].url, suggestions[selectedIndex].title);
      return;
    }
    if (!searchQuery.trim()) return;
    saveRecentSearch(searchQuery);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}${activeFilter !== 'all' ? `&type=${encodeURIComponent(activeFilter)}` : ''}`);
  };

  const navigateToUrl = (url, title = searchQuery) => {
    if (title) saveRecentSearch(title);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    if (url) {
      router.push(url);
    }
  };

  // Keyboard navigation inside search suggestions (Up, Down, Enter, Escape)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const max = suggestions.length > 0 ? suggestions.length : (recentSearches.length > 0 ? recentSearches.length : POPULAR_SEARCHES.length);
      setSelectedIndex((prev) => (prev + 1 < max ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const max = suggestions.length > 0 ? suggestions.length : (recentSearches.length > 0 ? recentSearches.length : POPULAR_SEARCHES.length);
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : max - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
      setIsMobileSearchOpen(false);
      inputRef.current?.blur();
    }
  };

  const highlightMatch = (text, matchStr) => {
    if (!text || !matchStr) return text;
    const cleanMatch = matchStr.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    if (!cleanMatch) return text;

    const parts = String(text).split(new RegExp(`(${cleanMatch})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === matchStr.toLowerCase() ? (
        <span key={i} className="font-extrabold text-blue-600 bg-blue-50 px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. TOP RESPONSIVE HEADER BAR */}
      {/* ========================================================================= */}
      <header className="bg-[#1b2b3a]/95 backdrop-blur-md text-white sticky top-0 z-40 shadow-sm border-b border-slate-700/60 transition-all">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">

          {/* LEFT: Hamburger Menu Button + Enhanced Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="group P-4 w-8.5 h-8.5  rounded-xl text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 active:scale-95 border border-slate-700/80 transition cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
              aria-label="Open Sidebar Menu"
              title="Open Navigation Menu"
            >
              <AnimatedMenu size={20} className="text-slate-200 group-hover:text-white transition-transform group-hover:scale-105" />
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 sm:gap-2 group min-w-0"
            >
              {/* Glowing EM Emblem */}
              {/* <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-[0_0_12px_rgba(6,182,212,0.35)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 ring-1 ring-white/20">
                <span className="text-white font-black text-[11px] sm:text-xs tracking-tighter leading-none">EM</span>
              </div> */}

              {/* Enhanced Typography */}
              <span className="font-extrabold text-[17px] min-[380px]:text-base sm:text-xl md:text-2xl text-white tracking-tight leading-none group-hover:text-cyan-200 transition-colors truncate">
                Education<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 font-black">Masters</span>
              </span>
            </Link>
          </div>

          {/* ========================================================================= */}
          {/* CENTER: DESKTOP SEARCH BAR (Exact Desktop Design) */}
          {/* ========================================================================= */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-3" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">

              {/* Outer Animated Glow Frame */}
              <div className="group relative flex items-center w-full bg-white rounded-full border border-slate-200/90 hover:border-cyan-400 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-cyan-400/20 shadow-sm hover:shadow-[0_0_22px_rgba(6,182,212,0.28)] hover:scale-[1.01] transition-all duration-300 ease-out overflow-hidden">

                {/* Left Magnifying Glass */}
                <div className="pl-3.5 pr-1.5 flex items-center justify-center text-slate-400 group-hover:text-cyan-500 group-focus-within:text-blue-600 transition-colors duration-200">
                  <AnimatedSearch size={16} />
                </div>

                {/* Animated Rotating Placeholder + Search Text Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  placeholder={ROTATING_PLACEHOLDERS[placeholderIndex]}
                  className="w-full py-2.5 px-2 text-xs sm:text-sm text-slate-900 bg-transparent placeholder-slate-400 focus:outline-none font-normal transition-opacity duration-300"
                />

                {/* Right Area: Clear Button, Spinner, Search Action Button */}
                <div className="flex items-center space-x-1.5 pr-1.5">
                  {isLoadingSuggestions && (
                    <Loader2 className="w-4 h-4 text-cyan-500 animate-spin mr-1" />
                  )}

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        inputRef.current?.focus();
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:rotate-90 rounded-full hover:bg-slate-100 transition duration-200"
                      title="Clear Search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="submit"
                    className="group bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:via-blue-600 hover:to-indigo-600 active:scale-95 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-xs transition-all duration-200 shrink-0 flex items-center gap-1.5"
                  >
                    <AnimatedSearch size={13} className="text-white/90" />
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {/* Desktop Command Palette Dropdown */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                  {/* Filter Chips */}
                  <div className="px-3 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center space-x-1.5 overflow-x-auto whitespace-nowrap">
                    {FILTER_PILLS.map((pill) => {
                      const Icon = pill.icon;
                      const isActive = activeFilter === pill.id;
                      return (
                        <button
                          key={pill.id}
                          type="button"
                          onClick={() => setActiveFilter(pill.id)}
                          className={`group px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1.5 transition ${isActive
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/70'
                            }`}
                        >
                          <Icon size={12} className="shrink-0" />
                          <span>{pill.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Suggestions List */}
                  <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                    {searchQuery.trim() ? (
                      suggestions.length > 0 ? (
                        suggestions.map((item, idx) => {
                          const isSelected = selectedIndex === idx;
                          return (
                            <div
                              key={item.id || idx}
                              onClick={() => navigateToUrl(item.url, item.title)}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={`px-4 py-2.5 cursor-pointer transition flex items-center justify-between gap-3 ${isSelected ? 'bg-blue-50/90 border-l-4 border-blue-600' : 'hover:bg-slate-50/80'
                                }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                                {activeFilter === 'all' && (
                                  <span
                                    className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded text-white shrink-0 shadow-2xs whitespace-nowrap inline-flex items-center justify-center leading-none"
                                    style={{ backgroundColor: item.badgeColor || '#2563eb', minWidth: 'max-content' }}
                                  >
                                    {item.badge || item.typeLabel}
                                  </span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                                    {highlightMatch(item.title, searchQuery)}
                                  </p>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {item.department && <span>{item.department} • </span>}
                                    <span>{item.metaText || item.subtitle}</span>
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-blue-600' : ''}`} />
                            </div>
                          );
                        })
                      ) : !isLoadingSuggestions ? (
                        <div className="px-4 py-6 text-center space-y-1.5">
                          <p className="text-xs font-semibold text-slate-800">No instant results for &ldquo;{searchQuery}&rdquo;</p>
                          <p className="text-[11px] text-slate-500">Press Enter to perform a global deep search across all categories</p>
                        </div>
                      ) : null
                    ) : (
                      /* Zero Query State: Recent Searches + Trending Topics */
                      <div className="p-2 space-y-3">
                        {recentSearches.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <span className="flex items-center gap-1.5"><AnimatedHistory size={13} className="text-slate-400" /> Recent Searches</span>
                              <button onClick={clearAllRecentSearches} className="hover:text-rose-500 transition">Clear all</button>
                            </div>
                            <div className="space-y-0.5">
                              {recentSearches.map((term, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setSearchQuery(term);
                                    inputRef.current?.focus();
                                  }}
                                  className="group px-3 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between cursor-pointer text-xs text-slate-700"
                                >
                                  <span className="flex items-center gap-2">
                                    <AnimatedClock size={13} className="text-slate-400" />
                                    <span>{term}</span>
                                  </span>
                                  <button
                                    onClick={(e) => removeRecentSearch(e, term)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <AnimatedFlame size={13} className="text-amber-500" /> Trending Searches
                          </div>
                          <div className="space-y-0.5">
                            {POPULAR_SEARCHES.map((item, idx) => (
                              <div
                                key={idx}
                                onClick={() => navigateToUrl(item.url, item.title)}
                                className="group px-3 py-2 rounded-lg hover:bg-blue-50 flex items-center justify-between cursor-pointer transition"
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  <span
                                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white shadow-2xs whitespace-nowrap shrink-0 inline-flex items-center justify-center leading-none"
                                    style={{ backgroundColor: item.color, minWidth: 'max-content' }}
                                  >
                                    {item.badge}
                                  </span>
                                  <span className="text-xs text-slate-700 font-medium truncate">
                                    {item.title}
                                  </span>
                                </div>
                                <AnimatedArrowUpRight size={14} className="text-slate-400 group-hover:text-blue-600 transition" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Footer */}
                  <div
                    onClick={handleSearchSubmit}
                    className="group px-4 py-2.5 bg-blue-50/90 hover:bg-blue-100/90 border-t border-blue-100 cursor-pointer text-xs font-semibold text-blue-700 flex items-center justify-between transition"
                  >
                    <span className="flex items-center space-x-1.5">
                      <AnimatedSearch size={14} className="text-blue-600" />
                      <span>
                        {searchQuery.trim()
                          ? `See all results for "${searchQuery}"`
                          : 'Press Enter to explore all government exams'}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1 text-[10px] text-blue-600 bg-white px-2 py-0.5 rounded shadow-2xs border border-blue-200">
                      <span>Enter</span>
                      <AnimatedCornerDownLeft size={12} />
                    </span>
                  </div>

                </div>
              )}

            </form>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT: ACTION BUTTONS (Polished & Refined Mobile + Desktop) */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* 1. Mobile Search Trigger Button */}
            <button
              onClick={() => {
                setIsMobileSearchOpen(true);
                setTimeout(() => mobileInputRef.current?.focus(), 150);
              }}
              className="group md:hidden w-8.5 h-8.5 rounded-xl text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 active:scale-95 border border-slate-700/80 transition cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
              aria-label="Search"
              title="Search Exams & Results"
            >
              <AnimatedSearch size={16} />
            </button>

            {/* 2. Typing Test CTA */}
            <Link
              href="/typing-test"
              className="group w-8.5 h-8.5 sm:w-auto sm:h-auto p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-tr from-[#00b4c6] to-[#00d8ec] hover:from-[#00a3b3] hover:to-[#00c4d6] text-white font-bold text-xs shadow-[0_2px_10px_rgba(0,196,214,0.35)] active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
              title="Typing Speed Test"
            >
              <AnimatedKeyboard size={15} className="text-white shrink-0" />
              <span className="whitespace-nowrap hidden sm:inline">Typing Test</span>
            </Link>

            {/* 3. Mock Test CTA */}
            <button
              onClick={onOpenMockModal}
              className="group w-8.5 h-8.5 sm:w-auto sm:h-auto p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24] hover:from-[#d97706] hover:to-[#f59e0b] text-slate-950 font-bold text-xs shadow-[0_2px_10px_rgba(251,191,36,0.35)] active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              title="Mock Test"
            >
              <AnimatedFileText size={15} className="text-slate-950 shrink-0" />
              <span className="whitespace-nowrap hidden sm:inline">Mock Test</span>
            </button>

            {/* 4. Login / User Panel Link */}
            {session?.user ? (
              <Link
                href="/edu-admin"
                className="group w-8.5 h-8.5 sm:w-auto sm:h-auto p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/30 shadow-[0_2px_10px_rgba(16,185,129,0.25)] active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                title={`Go to User Panel (${session.user.name || 'User'})`}
              >
                <AnimatedUser size={15} className="text-emerald-400 shrink-0" />
                <span className="hidden sm:inline max-w-[120px] md:max-w-[160px] truncate font-semibold text-xs">
                  {session.user.name || 'Panel'}
                </span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal({ mode: 'login' })}
                className="group px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-[0_2px_10px_rgba(16,185,129,0.35)] active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <AnimatedLogIn size={15} className="shrink-0" />
                <span>Login</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE SPOTLIGHT SEARCH MODAL (Apple / Raycast Style) */}
      {/* ========================================================================= */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[80] md:hidden p-2.5 sm:p-4 flex flex-col justify-start animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 animate-in zoom-in-95 duration-200">

            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="p-2.5 sm:p-3.5 border-b border-slate-200 flex items-center gap-2 bg-slate-50/90">
              <div className="p-1 text-blue-600 shrink-0">
                <AnimatedSearch size={18} />
              </div>
              <input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, results, admit cards, MCQs..."
                className="w-full text-xs sm:text-sm text-slate-900 bg-transparent focus:outline-none placeholder-slate-400 font-medium"
              />
              {isLoadingSuggestions && (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    mobileInputRef.current?.focus();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 bg-slate-200/80 hover:bg-slate-300 rounded-lg transition shrink-0"
              >
                Close
              </button>
            </form>

            {/* Filter Pills Chips */}
            <div className="px-2.5 py-2 bg-white border-b border-slate-100 flex items-center space-x-1.5 overflow-x-auto whitespace-nowrap">
              {FILTER_PILLS.map((pill) => {
                const Icon = pill.icon;
                const isActive = activeFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setActiveFilter(pill.id)}
                    className={`group px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1.5 transition shrink-0 ${isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                      }`}
                  >
                    <Icon size={12} className="shrink-0" />
                    <span>{pill.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Suggestions & Recent/Trending list */}
            <div className="divide-y divide-slate-100 overflow-y-auto p-2 flex-1">
              {searchQuery.trim() ? (
                suggestions.length > 0 ? (
                  suggestions.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      onClick={() => {
                        setIsMobileSearchOpen(false);
                        navigateToUrl(item.url, item.title);
                      }}
                      className="p-2.5 hover:bg-blue-50/80 active:bg-blue-100/70 rounded-xl flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <span
                          className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white whitespace-nowrap inline-flex items-center justify-center leading-none"
                          style={{ backgroundColor: item.badgeColor || '#2563eb' }}
                        >
                          {item.badge || item.typeLabel}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1 truncate">
                          {highlightMatch(item.title, searchQuery)}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.department && <span>{item.department} • </span>}
                          <span>{item.metaText || item.subtitle}</span>
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  ))
                ) : !isLoadingSuggestions ? (
                  <div className="py-8 text-center space-y-1.5">
                    <p className="text-xs font-bold text-slate-800">No instant results for &ldquo;{searchQuery}&rdquo;</p>
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="text-xs font-semibold text-blue-600 hover:underline pt-1"
                    >
                      Press to search all government exams &rarr;
                    </button>
                  </div>
                ) : null
              ) : (
                <div className="space-y-3 p-1">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><AnimatedHistory size={13} className="text-slate-400" /> Recent Searches</span>
                        <button onClick={clearAllRecentSearches} className="hover:text-rose-500 transition text-[10px]">Clear all</button>
                      </div>
                      <div className="space-y-0.5">
                        {recentSearches.map((term, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setSearchQuery(term);
                              mobileInputRef.current?.focus();
                            }}
                            className="group px-2.5 py-1.5 rounded-xl hover:bg-slate-100 flex items-center justify-between cursor-pointer text-xs text-slate-700 font-medium"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <AnimatedClock size={13} className="text-slate-400 shrink-0" />
                              <span className="truncate">{term}</span>
                            </span>
                            <button
                              onClick={(e) => removeRecentSearch(e, term)}
                              className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Searches */}
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AnimatedFlame size={13} className="text-amber-500" /> Trending Searches
                    </div>
                    <div className="space-y-1">
                      {POPULAR_SEARCHES.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setIsMobileSearchOpen(false);
                            navigateToUrl(item.url, item.title);
                          }}
                          className="group px-2.5 py-1.5 rounded-xl hover:bg-blue-50 active:bg-blue-100 flex items-center justify-between cursor-pointer transition"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 pr-2">
                            <span
                              className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white shadow-2xs whitespace-nowrap shrink-0 inline-flex items-center justify-center leading-none"
                              style={{ backgroundColor: item.color }}
                            >
                              {item.badge}
                            </span>
                            <span className="text-xs text-slate-700 font-medium truncate">
                              {item.title}
                            </span>
                          </div>
                          <AnimatedArrowUpRight size={13} className="text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Submit Action */}
            <div
              onClick={handleSearchSubmit}
              className="p-3 bg-blue-50 hover:bg-blue-100 border-t border-blue-100 cursor-pointer text-xs font-bold text-blue-700 flex items-center justify-between transition"
            >
              <span className="flex items-center gap-1.5 truncate">
                <AnimatedSearch size={14} className="text-blue-600 shrink-0" />
                <span className="truncate">
                  {searchQuery.trim()
                    ? `Explore all results for "${searchQuery}"`
                    : 'Explore all government exams'}
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-blue-600 shrink-0" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ANIMATED SLIDE-IN SIDEBAR DRAWER (Full Mobile Navigation) */}
      {/* ========================================================================= */}
      <div
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 bg-black/65 backdrop-blur-xs z-[60] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      />

      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#162534] text-white z-[70] shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col justify-between overflow-y-auto border-r border-slate-700/60 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div>
          {/* Drawer Top Header */}
          <div className="p-4 border-b border-slate-700/80 flex items-center justify-between bg-[#111e2b]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-white text-xs shadow-md">
                EM
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                Education<span className="text-cyan-400">Masters</span>
              </span>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Status Card */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/40">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
                  {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{session.user.name || 'Student'}</p>
                  <p className="text-[11px] text-emerald-400 truncate flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    <span>Logged In • Free Portal</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gradient-to-r from-blue-900/40 to-slate-800/60 border border-blue-500/20 rounded-2xl">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Free Student Portal</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Sign in for unlimited MCQs, AI diagnostics, & mock test tracking.</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen(false);
                      openAuthModal({ mode: 'login' });
                    }}
                    className="flex-1 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-lg text-center transition"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen(false);
                      openAuthModal({ mode: 'register' });
                    }}
                    className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg text-center transition"
                  >
                    Register
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-6">
            {/* 1. Exam Hub */}
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                Exams & Notifications
              </h4>

              <Link
                href="/"
                onClick={() => setIsSidebarOpen(false)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-blue-600/20 hover:text-white transition"
              >
                <AnimatedBookOpen size={18} className="text-cyan-400 shrink-0" />
                <span>Home Page</span>
              </Link>

              <Link
                href="/jobs"
                onClick={() => setIsSidebarOpen(false)}
                className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-emerald-600/20 hover:text-emerald-300 transition"
              >
                <div className="flex items-center gap-3">
                  <AnimatedAward size={18} className="text-emerald-400 shrink-0" />
                  <span>Latest Jobs</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Hot</span>
              </Link>

              <Link
                href="/admit-cards"
                onClick={() => setIsSidebarOpen(false)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-blue-600/20 hover:text-blue-300 transition"
              >
                <AnimatedFileText size={18} className="text-blue-400 shrink-0" />
                <span>Admit Cards</span>
              </Link>

              <Link
                href="/results"
                onClick={() => setIsSidebarOpen(false)}
                className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 transition"
              >
                <div className="flex items-center gap-3">
                  <AnimatedSparkles size={18} className="text-purple-400 shrink-0" />
                  <span>Exam Results</span>
                </div>
                <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">New</span>
              </Link>
            </div>

            {/* 2. Practice & Mock Tools */}
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                Practice & Preparation
              </h4>

              <Link
                href="/typing-test"
                onClick={() => setIsSidebarOpen(false)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-cyan-600/20 hover:text-cyan-300 transition"
              >
                <AnimatedKeyboard size={18} className="text-cyan-400 shrink-0" />
                <span>Typing Speed Test</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  if (onOpenMockModal) onOpenMockModal();
                }}
                className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-amber-600/20 hover:text-amber-300 transition text-left cursor-pointer"
              >
                <AnimatedFileText size={18} className="text-amber-400 shrink-0" />
                <span>Mock Tests</span>
              </button>

              <Link
                href="/mcq-questions"
                onClick={() => setIsSidebarOpen(false)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-indigo-600/20 hover:text-indigo-300 transition"
              >
                <AnimatedZap size={18} className="text-indigo-400 shrink-0" />
                <span>Daily GK & MCQs</span>
              </Link>
            </div>

            {/* 3. User Panel or Login portal */}
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                Account & Portal
              </h4>

              {session?.user ? (
                <Link
                  href="/edu-admin"
                  onClick={() => setIsSidebarOpen(false)}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 hover:bg-emerald-900/40 transition"
                >
                  <AnimatedUser size={18} className="text-emerald-400 shrink-0" />
                  <span className="truncate">Open User Panel ({session.user.name})</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    openAuthModal({ mode: 'login' });
                  }}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-emerald-600/20 hover:text-emerald-300 transition cursor-pointer text-left"
                >
                  <AnimatedLogIn size={18} className="text-emerald-400 shrink-0" />
                  <span>Login / Register Portal</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Bottom Bar */}
        <div className="p-4 border-t border-slate-800 bg-[#111e2b] space-y-3">
          {session?.user ? (
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                signOut();
              }}
              className="group w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
            >
              <AnimatedLogOut size={16} />
              <span>Logout ({session.user.name})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsSidebarOpen(false);
                openAuthModal({ mode: 'login' });
              }}
              className="group w-full py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
            >
              <AnimatedLogIn size={16} />
              <span>Sign In to Your Account</span>
            </button>
          )}

          <p className="text-[10px] text-center text-slate-400 font-medium">
            © {new Date().getFullYear()} Education Masters • All Rights Reserved
          </p>
        </div>

      </aside>
    </>
  );
}
