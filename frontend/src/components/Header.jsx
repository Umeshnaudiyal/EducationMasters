'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Menu, X, Search, Keyboard, FileText, User, LogIn, LogOut,
  BookOpen, Award, Sparkles, ChevronRight, CornerDownLeft, Loader2,
  Clock, Flame, History, Trash2, ArrowUpRight, Zap
} from 'lucide-react';
import { LoginModal } from './Modals';

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
  { id: 'all', label: 'All', icon: Zap },
  { id: 'job', label: 'Jobs', icon: Award },
  { id: 'result', label: 'Results', icon: Sparkles },
  { id: 'admit-card', label: 'Admit Cards', icon: FileText },
  { id: 'blog', label: 'Articles', icon: BookOpen },
  { id: 'mcq', label: 'MCQs', icon: Keyboard },
];

export default function Header({ onOpenTypingModal, onOpenMockModal }) {
  const { data: session } = useSession();
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
    } catch (e) {}
  }, []);

  const saveRecentSearch = (text) => {
    if (!text || !text.trim()) return;
    try {
      const clean = text.trim();
      const updated = [clean, ...recentSearches.filter(s => s.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('em_recent_searches', JSON.stringify(updated));
    } catch (e) {}
  };

  const removeRecentSearch = (e, text) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter(s => s !== text);
      setRecentSearches(updated);
      localStorage.setItem('em_recent_searches', JSON.stringify(updated));
    } catch (e) {}
  };

  const clearAllRecentSearches = (e) => {
    e.stopPropagation();
    try {
      setRecentSearches([]);
      localStorage.removeItem('em_recent_searches');
    } catch (e) {}
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

  // Click outside to dismiss suggestions
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

  // Keyboard navigation inside search suggestions (Up, Down, Enter, Escape, Tab)
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
      <header className="bg-[#1b2b3a] text-white sticky top-0 z-40 shadow-md border-b border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">

          {/* 1. LEFT: Hamburger Menu Button + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-white hover:bg-slate-700/60 transition flex items-center justify-center cursor-pointer group"
              aria-label="Open Sidebar Menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </button>

            <Link href="/" className="font-bold text-lg sm:text-2xl text-white tracking-tight hover:opacity-95 transition flex items-center gap-2">
              <span className="whitespace-nowrap">Education Masters</span>
            </Link>
          </div>

          {/* ========================================================================= */}
          {/* 2. CENTER: ULTRA-ENHANCED ANIMATED GLOBAL SEARCH BAR */}
          {/* ========================================================================= */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-3" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              
              {/* Outer Animated Glow Frame with Ambient Gradient on Hover & Focus */}
              <div className="group relative flex items-center w-full bg-white rounded-full border border-slate-200/90 hover:border-cyan-400 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-cyan-400/20 shadow-sm hover:shadow-[0_0_22px_rgba(6,182,212,0.28)] hover:scale-[1.01] transition-all duration-300 ease-out overflow-hidden">
                
                {/* Left Magnifying Glass with Ambient Spin/Pulse Animation */}
                <div className="pl-3.5 pr-1.5 flex items-center justify-center text-slate-400 group-hover:text-cyan-500 group-focus-within:text-blue-600 transition-colors duration-200">
                  <Search className="w-4 h-4 transition-transform group-hover:scale-110 group-hover:-rotate-6 duration-200" />
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

                {/* Right Area: Clear Button, Spinner, Keyboard Shortcut Badge & Gradient Action Button */}
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

                  {/* Action Search Button with Gradient Animation */}
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:via-blue-600 hover:to-indigo-600 active:scale-95 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-xs transition-all duration-200 shrink-0"
                  >
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SUPERCHARGED COMMAND PALETTE POPOVER (GOOGLE + RAYCAST STYLE) */}
              {/* ========================================================================= */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  
                  {/* Top Filter Chips */}
                  <div className="px-3 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center space-x-1.5 overflow-x-auto whitespace-nowrap">
                    {FILTER_PILLS.map((pill) => {
                      const Icon = pill.icon;
                      const isActive = activeFilter === pill.id;
                      return (
                        <button
                          key={pill.id}
                          type="button"
                          onClick={() => setActiveFilter(pill.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1 transition ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/70'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{pill.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Suggestions Content Area */}
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
                              className={`px-4 py-2.5 cursor-pointer transition flex items-center justify-between gap-3 ${
                                isSelected ? 'bg-blue-50/90 border-l-4 border-blue-600' : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                                {activeFilter === 'all' && (
                                  <span
                                    className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded text-white shrink-0 shadow-2xs whitespace-nowrap inline-flex items-center justify-center leading-none"
                                    style={{ backgroundColor: item.badgeColor || '#2563eb', whiteSpace: 'nowrap', minWidth: 'max-content' }}
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
                      /* Zero Query: Show Recent Searches (if any) + Trending Topics */
                      <div className="p-2 space-y-3">
                        {recentSearches.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <span className="flex items-center gap-1"><History className="w-3 h-3" /> Recent Searches</span>
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
                                  className="px-3 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between cursor-pointer group text-xs text-slate-700"
                                >
                                  <span className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-slate-400" />
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
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-500" /> Trending Searches
                          </div>
                          <div className="space-y-0.5">
                            {POPULAR_SEARCHES.map((item, idx) => (
                              <div
                                key={idx}
                                onClick={() => navigateToUrl(item.url, item.title)}
                                className="px-3 py-2 rounded-lg hover:bg-blue-50 flex items-center justify-between cursor-pointer group transition"
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  <span
                                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white shadow-2xs whitespace-nowrap shrink-0 inline-flex items-center justify-center leading-none"
                                    style={{ backgroundColor: item.color, whiteSpace: 'nowrap', minWidth: 'max-content' }}
                                  >
                                    {item.badge}
                                  </span>
                                  <span className="text-xs text-slate-700 font-medium truncate">
                                    {item.title}
                                  </span>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer Row */}
                  <div
                    onClick={handleSearchSubmit}
                    className="px-4 py-2.5 bg-blue-50/90 hover:bg-blue-100/90 border-t border-blue-100 cursor-pointer text-xs font-semibold text-blue-700 flex items-center justify-between transition"
                  >
                    <span className="flex items-center space-x-1.5">
                      <Search className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        {searchQuery.trim()
                          ? `See all results for "${searchQuery}"`
                          : 'Press Enter to explore all government exams'}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1 text-[10px] text-blue-600 bg-white px-2 py-0.5 rounded shadow-2xs border border-blue-200">
                      <span>Enter</span>
                      <CornerDownLeft className="w-3 h-3" />
                    </span>
                  </div>

                </div>
              )}

            </form>
          </div>

          {/* 3. RIGHT: Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Mobile Search Trigger Icon */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="md:hidden p-2 text-white hover:bg-slate-700/60 rounded-lg transition"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Typing Test */}
            <Link
              href="/typing-test"
              className="bg-[#00c4d6] hover:bg-[#00b2c3] text-white font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded flex items-center gap-1 sm:gap-1.5 shadow-sm transition hover:scale-105"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Typing Test</span>
            </Link>

            {/* Mock Test */}
            <button
              onClick={onOpenMockModal}
              className="bg-[#ffb800] hover:bg-[#eaa800] text-slate-900 font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded flex items-center gap-1 sm:gap-1.5 shadow-sm transition hover:scale-105 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-900" />
              <span className="whitespace-nowrap">Mock Test</span>
            </button>

            {/* NextAuth Login / User Panel Link */}
            {session?.user ? (
              <Link
                href="/edu-admin"
                className="bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-semibold text-xs px-2.5 sm:px-3 py-1.5 rounded flex items-center gap-1.5 border border-emerald-500/30 hover:border-emerald-400 shadow-sm transition hover:scale-105 cursor-pointer"
                title="Go to User Panel"
              >
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="max-w-[110px] sm:max-w-[160px] truncate">{session.user.name || 'User Panel'}</span>
              </Link>
            ) : (
              <Link
                href="/edu-login"
                className="bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs px-3 sm:px-4 py-1.5 rounded flex items-center gap-1 shadow-sm transition hover:scale-105 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </Link>
            )}

          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 4. MOBILE FULL-SCREEN SEARCH OVERLAY */}
      {/* ========================================================================= */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden p-3 flex flex-col animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <form onSubmit={handleSearchSubmit} className="p-3 border-b border-slate-200 flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
              <input
                ref={mobileInputRef}
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, results, admit cards..."
                className="w-full text-sm text-slate-900 focus:outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="p-1 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="text-xs font-bold text-slate-600 px-2 py-1 bg-slate-100 rounded"
              >
                Cancel
              </button>
            </form>

            <div className="divide-y divide-slate-100 overflow-y-auto p-2">
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => navigateToUrl(item.url, item.title)}
                  className="p-3 hover:bg-slate-50 rounded-lg flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white whitespace-nowrap shrink-0 inline-flex items-center justify-center leading-none"
                      style={{ backgroundColor: item.badgeColor || '#2563eb', whiteSpace: 'nowrap', minWidth: 'max-content' }}
                    >
                      {item.badge}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 mt-1 truncate">{item.title}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. ANIMATED LEFT HAMBURGER SIDEBAR DRAWER */}
      <div 
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 bg-black/65 backdrop-blur-xs z-[60] transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside 
        className={`fixed top-0 left-0 bottom-0 w-80 sm:w-88 bg-[#162534] text-white z-[70] shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col justify-between overflow-y-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="p-4 border-b border-slate-700/80 flex items-center justify-between bg-[#111e2b]">
            <div className="flex items-center gap-2">
              <img src="/logo.webp" alt="Education Masters" className="h-10 w-auto object-contain" />
            </div>
            
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                Main Menu
              </h4>

              <Link 
                href="/" 
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-blue-600/20 hover:text-white transition"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Home Page</span>
              </Link>

              <Link 
                href="/jobs" 
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-emerald-600/20 hover:text-emerald-300 transition"
              >
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Latest Jobs (/jobs)</span>
              </Link>

              <Link 
                href="/admit-cards" 
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-blue-600/20 hover:text-blue-300 transition"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Admit Cards (/admit-cards)</span>
              </Link>

              <Link 
                href="/results" 
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 transition"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Exam Results (/results)</span>
              </Link>

              <Link 
                href="/typing-test" 
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-cyan-600/20 hover:text-cyan-300 transition"
              >
                <Keyboard className="w-4 h-4 text-cyan-400" />
                <span>Typing Test</span>
              </Link>

              {session?.user ? (
                <Link 
                  href="/edu-admin" 
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 hover:bg-emerald-900/40 transition"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span className="truncate">User Panel ({session.user.name})</span>
                </Link>
              ) : (
                <Link 
                  href="/edu-login" 
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-emerald-600/20 hover:text-emerald-300 transition"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>Login / Register Portal</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-[#111e2b] space-y-3">
          {session?.user ? (
            <button
              onClick={() => signOut()}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout ({session.user.name})</span>
            </button>
          ) : (
            <Link
              href="/edu-login"
              onClick={() => setIsSidebarOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>Login to Portal</span>
            </Link>
          )}

          <p className="text-[10px] text-center text-slate-400 font-medium">
            © {new Date().getFullYear()} Education Masters | DigitArtTech
          </p>
        </div>

      </aside>
    </>
  );
}
