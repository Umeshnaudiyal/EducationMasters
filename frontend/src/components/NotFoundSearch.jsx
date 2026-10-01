'use client';

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  Award,
  FileText,
  BookOpen,
  Keyboard
} from 'lucide-react';

const TRENDING_TAGS = [
  { label: 'UPSC Civil Services 2026', query: 'UPSC', type: 'job', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'SSC CGL Tier-1 2026', query: 'SSC CGL', type: 'job', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { label: 'Railway RRB NTPC Exam', query: 'Railway NTPC', type: 'job', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'Union Bank Result 2026', query: 'Union Bank Result', type: 'result', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'SSC CHSL Admit Card', query: 'SSC Admit Card', type: 'admit-card', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { label: 'Daily GK & Current Affairs', query: 'Current Affairs', type: 'mcq', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { label: 'Free Online Typing Speed Test', query: 'Typing Test', type: 'typing', isLink: '/typing-test', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
];

const FILTER_TABS = [
  { id: 'all', label: 'All Exams', icon: Zap },
  { id: 'job', label: 'Jobs & Vacancies', icon: Award },
  { id: 'result', label: 'Results', icon: Sparkles },
  { id: 'admit-card', label: 'Admit Cards', icon: FileText },
  { id: 'mcq', label: 'MCQs & GK', icon: Keyboard },
];

const NotFoundSearch = forwardRef(function NotFoundSearch(props, ref) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }));

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;
    const typeParam = activeTab === 'all' ? '' : `&type=${encodeURIComponent(activeTab)}`;
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}${typeParam}`);
  };

  const handleTagClick = (tag) => {
    if (tag.isLink) {
      router.push(tag.isLink);
      return;
    }
    const typeParam = tag.type === 'all' ? '' : `&type=${encodeURIComponent(tag.type)}`;
    router.push(`/search?q=${encodeURIComponent(tag.query)}${typeParam}`);
  };

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto -mt-6 relative z-20">
      
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/90 backdrop-blur-xl relative">
        
        {/* Glow Accent under card */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 rounded-full" />

        {/* Section Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 inline-block mb-1">
              Find Any Notification
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Search India&apos;s Largest Exam Database
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Over 15,000+ Verified Posts</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="relative group">
          <div
            className={`flex items-center gap-3 w-full bg-slate-50 border-2 ${
              isFocused ? 'border-blue-600 bg-white ring-4 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'
            } rounded-2xl px-4 py-3 sm:py-3.5 transition-all shadow-inner`}
          >
            <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-blue-600' : 'text-slate-400'}`} />
            
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type exam name, post, admit card or question keyword..."
              className="w-full bg-transparent text-slate-900 text-sm sm:text-base font-medium placeholder-slate-400 focus:outline-none"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-md bg-slate-200/60"
              >
                Clear
              </button>
            )}

            <button
              type="submit"
              disabled={!searchTerm.trim()}
              className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Trending Search Suggestions */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Popular & Trending Today:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {TRENDING_TAGS.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-2xs hover:shadow-xs cursor-pointer ${tag.color}`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

      </div>

    </section>
  );
});

export default NotFoundSearch;
