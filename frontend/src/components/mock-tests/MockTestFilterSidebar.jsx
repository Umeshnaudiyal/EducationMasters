'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Layers,
  BookOpen,
  Sparkles,
  GraduationCap,
  Landmark,
  Shield,
  Compass,
  Cpu,
  Check,
  X,
  SlidersHorizontal,
} from 'lucide-react';

export default function MockTestFilterSidebar({
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  subjects = [],
  selectedSubject = 'all',
  onSelectSubject,
  searchQuery = '',
  onSearchChange,
  onResetFilters,
  totalCount = 0,
  className = '',
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const hasActiveFilters = selectedCategory !== 'all' || selectedSubject !== 'all' || Boolean(searchQuery);
  const activeCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedSubject !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  // Prevent background scroll when mobile filter drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  return (
    <aside className={`w-full max-w-full min-w-0 lg:w-60 xl:w-64 shrink-0 space-y-4 lg:sticky lg:top-20 self-start ${className}`}>
      
      {/* ========================================================================= */}
      {/* 1. COMPACT SEARCH BAR + MOBILE FILTER TRIGGER BUTTON */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-lg sm:rounded-xl p-1.5 min-[360px]:p-2 lg:p-3.5 shadow-2xs space-y-3 w-full max-w-full min-w-0">
        
        {/* Desktop Header Title (Desktop only) */}
        <div className="hidden lg:flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Filter Tests
            </h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Search Input Row + Mobile Filter Button */}
        <div className="flex items-center gap-1.5 min-[360px]:gap-2 w-full min-w-0">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search exam or subject..."
              className="w-full pl-7 min-[360px]:pl-8 pr-6 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 min-[360px]:left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Filter Sheet Trigger Button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className={`lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeCount > 0
                ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <SlidersHorizontal size={13} className={activeCount > 0 ? 'text-white' : 'text-sky-600'} />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="bg-white text-sky-700 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-extrabold ml-0.5">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP STREAM & SUBJECT FILTERS (Always visible on desktop) */}
        {/* ========================================================================= */}
        <div className="hidden lg:block space-y-3 pt-1 w-full max-w-full min-w-0">
          
          {/* 2. EXAM CATEGORY TABS (Desktop) */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
              Exam Streams
            </div>

            <div className="space-y-0.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-sky-600'
                    }`}
                  >
                    <span className="truncate text-left">{cat.name || cat.label}</span>
                    {cat.count !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1.5 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {cat.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. DYNAMIC SUBJECT FILTER (Desktop) */}
          {subjects && subjects.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Filter by Subject
                </span>
                {selectedSubject !== 'all' && (
                  <button
                    onClick={() => onSelectSubject('all')}
                    className="text-[10px] text-sky-600 hover:underline cursor-pointer"
                  >
                    All
                  </button>
                )}
              </div>

              <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                <button
                  onClick={() => onSelectSubject('all')}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    selectedSubject === 'all'
                      ? 'bg-slate-100 text-sky-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Subjects</span>
                  {selectedSubject === 'all' && <Check size={13} className="text-sky-600 shrink-0" />}
                </button>

                {subjects.map((sub) => {
                  const isSelected = selectedSubject === sub.slug || selectedSubject === sub._id;
                  return (
                    <button
                      key={sub.slug || sub._id}
                      onClick={() => onSelectSubject(isSelected ? 'all' : sub.slug || sub._id)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{sub.name}</span>
                      {isSelected ? (
                        <Check size={13} className="text-sky-600 shrink-0" />
                      ) : (
                        sub.count !== undefined && (
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                            {sub.count}
                          </span>
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. PASS / PRO PROMOTION WIDGET (Desktop only) */}
      {/* ========================================================================= */}
      <div className="hidden lg:block bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-3.5 shadow-xs space-y-2.5 w-full max-w-full min-w-0">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            EducationMasters Pass
          </span>
        </div>
        <p className="text-[11px] text-slate-300 leading-snug">
          Unlock 500+ full-length mock tests, sectional papers & All India Rankings across all exams.
        </p>
        <div className="pt-1">
          <a
            href="https://educationmasters.in"
            target="_blank"
            rel="noreferrer"
            className="block text-center bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xs transition cursor-pointer"
          >
            Explore Pass Benefits
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. PROFESSIONAL MOBILE FILTER SLIDE-UP BOTTOM SHEET */}
      {/* ========================================================================= */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop with subtle blur */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Slide-up Bottom Drawer */}
          <div className="relative w-full max-h-[85vh] bg-white rounded-t-2xl shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
            
            {/* Grab Handle */}
            <div className="pt-2 pb-1 flex justify-center cursor-pointer" onClick={() => setIsMobileOpen(false)}>
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* Drawer Header */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <SlidersHorizontal size={14} />
                </div>
                <div>
                  <h3 className="text-xs min-[360px]:text-sm font-bold text-slate-900">Filter Mock Tests</h3>
                  <p className="text-[10px] text-slate-500">
                    {totalCount} examination directories found
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="text-xs font-bold text-sky-600 hover:underline cursor-pointer px-1 py-0.5"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Close filters"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Filter Content */}
            <div className="p-3.5 overflow-y-auto space-y-4 flex-1">
              
              {/* Exam Streams Grid */}
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>Exam Streams</span>
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => onSelectCategory('all')}
                      className="text-[10.5px] text-sky-600 font-semibold"
                    >
                      All Streams
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => onSelectCategory(cat.id)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition cursor-pointer ${
                          isActive
                            ? 'bg-sky-600 text-white shadow-2xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        <span className="truncate">{cat.name || cat.label}</span>
                        {cat.count !== undefined && (
                          <span className={`text-[10px] font-bold ml-1 px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'text-slate-400'}`}>
                            {cat.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Subject Filters */}
              {subjects && subjects.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>Subjects</span>
                    {selectedSubject !== 'all' && (
                      <button
                        onClick={() => onSelectSubject('all')}
                        className="text-[10.5px] text-sky-600 font-semibold"
                      >
                        All Subjects
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                    <button
                      onClick={() => onSelectSubject('all')}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition cursor-pointer ${
                        selectedSubject === 'all'
                          ? 'bg-sky-50 text-sky-700 border border-sky-300 font-bold'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                    >
                      <span>All Subjects</span>
                      {selectedSubject === 'all' && <Check size={13} className="text-sky-600" />}
                    </button>

                    {subjects.map((sub) => {
                      const isSelected = selectedSubject === sub.slug || selectedSubject === sub._id;
                      return (
                        <button
                          key={sub.slug || sub._id}
                          onClick={() => onSelectSubject(isSelected ? 'all' : sub.slug || sub._id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50 text-sky-700 border border-sky-300 font-bold'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                          {isSelected ? (
                            <Check size={13} className="text-sky-600 shrink-0" />
                          ) : (
                            sub.count !== undefined && (
                              <span className="text-[10px] text-slate-400">{sub.count}</span>
                            )
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/90 flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="w-1/3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg shadow-2xs transition cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="flex-1 py-2 bg-[#00c5d2] hover:bg-[#00b0bd] text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Apply &amp; View {totalCount} Directories</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </aside>
  );
}
