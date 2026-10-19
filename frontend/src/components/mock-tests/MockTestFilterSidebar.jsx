'use client';

import React from 'react';
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
  const hasActiveFilters = selectedCategory !== 'all' || selectedSubject !== 'all' || Boolean(searchQuery);

  return (
    <aside className={`w-full lg:w-60 xl:w-64 shrink-0 space-y-4 lg:sticky lg:top-20 self-start ${className}`}>
      
      {/* ========================================================================= */}
      {/* 1. FILTER HEADER & SEARCH BAR */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
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

        {/* Real-time Search Box */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search exam or subject..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. EXAM CATEGORY TABS (VERTICAL PILLS) */}
        {/* ========================================================================= */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
            Exam Streams
          </div>

          <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
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

        {/* ========================================================================= */}
        {/* 3. DYNAMIC SUBJECT FILTER (CHECKBOX / PILL LIST) */}
        {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* 4. PASS / PRO PROMOTION WIDGET */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-3.5 shadow-xs space-y-2.5">
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
    </aside>
  );
}
