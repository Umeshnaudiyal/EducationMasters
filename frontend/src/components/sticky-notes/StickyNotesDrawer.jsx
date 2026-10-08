'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Users,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Pin,
  Sparkles,
  Maximize2,
  Clock,
  Filter,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { useStickyNotes } from '@/context/StickyNotesContext';
import {
  AnimatedPin,
  AnimatedRadio,
  AnimatedZap,
  AnimatedRefresh,
  AnimatedCheckSquare,
} from '@/components/AnimatedIcons';

// Helper for relative timestamps
function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Recently';
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'less than a minute ago';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Pastel Card Color Styles
export const NOTE_COLOR_STYLES = {
  yellow: {
    bg: 'bg-[#fff5cc]',
    hoverBg: 'hover:bg-[#ffefa8]',
    border: 'border-[#fde68a]',
    text: 'text-[#713f12]',
    title: 'text-[#854d0e]',
    snippet: 'text-[#a16207]',
    accent: '#eab308',
    dot: 'bg-amber-400',
    topBar: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  purple: {
    bg: 'bg-[#f1e8ff]',
    hoverBg: 'hover:bg-[#e9dbff]',
    border: 'border-[#ddd6fe]',
    text: 'text-[#4c1d95]',
    title: 'text-[#581c87]',
    snippet: 'text-[#7e22ce]',
    accent: '#a855f7',
    dot: 'bg-purple-400',
    topBar: 'bg-purple-400',
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  blue: {
    bg: 'bg-[#e0f2fe]',
    hoverBg: 'hover:bg-[#bae6fd]',
    border: 'border-[#bae6fd]',
    text: 'text-[#075985]',
    title: 'text-[#0369a1]',
    snippet: 'text-[#0284c7]',
    accent: '#0284c7',
    dot: 'bg-sky-400',
    topBar: 'bg-sky-400',
    badge: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  green: {
    bg: 'bg-[#e8fbe8]',
    hoverBg: 'hover:bg-[#d4f7d4]',
    border: 'border-[#bbf7d0]',
    text: 'text-[#14532d]',
    title: 'text-[#15803d]',
    snippet: 'text-[#16a34a]',
    accent: '#22c55e',
    dot: 'bg-emerald-400',
    topBar: 'bg-emerald-400',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  pink: {
    bg: 'bg-[#ffe4e6]',
    hoverBg: 'hover:bg-[#fecdd3]',
    border: 'border-[#fecdd3]',
    text: 'text-[#881337]',
    title: 'text-[#9f1239]',
    snippet: 'text-[#be123c]',
    accent: '#f43f5e',
    dot: 'bg-rose-400',
    topBar: 'bg-rose-400',
    badge: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  orange: {
    bg: 'bg-[#ffedd5]',
    hoverBg: 'hover:bg-[#fed7aa]',
    border: 'border-[#fed7aa]',
    text: 'text-[#7c2d12]',
    title: 'text-[#9a3412]',
    snippet: 'text-[#c2410c]',
    accent: '#f97316',
    dot: 'bg-orange-400',
    topBar: 'bg-orange-400',
    badge: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  cyan: {
    bg: 'bg-[#cffafe]',
    hoverBg: 'hover:bg-[#a5f3fc]',
    border: 'border-[#a5f3fc]',
    text: 'text-[#155e75]',
    title: 'text-[#0e7490]',
    snippet: 'text-[#0891b2]',
    accent: '#06b6d4',
    dot: 'bg-cyan-400',
    topBar: 'bg-cyan-400',
    badge: 'bg-cyan-100 text-cyan-900 border-cyan-300',
  },
};

export default function StickyNotesDrawer() {
  const {
    isDrawerOpen,
    closeDrawer,
    activeNotes,
    archivedNotes,
    loading,
    popOutNote,
    viewedNoteIds,
    toggleViewed,
    dismissNote,
    dismissedNoteIds,
    restoreDismissedNotes,
    refetchNotes,
  } = useStickyNotes();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Filter notes
  const displayedNotes = useMemo(() => {
    const list = activeTab === 'active' ? activeNotes : archivedNotes;
    return list.filter((note) => {
      const matchesType = typeFilter === 'all' || note.type === typeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        note.title?.toLowerCase().includes(q) ||
        note.content?.toLowerCase().includes(q) ||
        note.tags?.some((t) => t.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [activeTab, activeNotes, archivedNotes, typeFilter, searchQuery]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[95] overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Right Drawer Panel (Pinned explicitly to the right edge) */}
      <div className="fixed top-0 right-0 bottom-0 h-full w-full sm:w-[440px] md:w-[480px] max-w-full flex flex-col bg-white shadow-2xl transition-transform animate-slide-in-right z-10 border-l border-slate-200">
        {/* 1. Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shadow-2xs">
              <Pin size={17} className="rotate-45" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">Sticky notes</h2>
              <p className="text-[11px] font-medium text-slate-500">
                Official notices & verified examinee directives
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refetchNotes}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Refresh notes"
            >
              <AnimatedRefresh size={15} />
            </button>
            <button
              type="button"
              onClick={closeDrawer}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
              title="Close sidebar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 2. Tabs (Active | Archived) */}
        <div className="flex items-center gap-6 border-b border-slate-200 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`relative pb-3 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'active'
                ? 'text-[#0b66c3]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Active</span>
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
              {activeNotes.length}
            </span>
            {activeTab === 'active' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0b66c3] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archived')}
            className={`relative pb-3 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'archived'
                ? 'text-[#0b66c3]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Archived</span>
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
              {archivedNotes.length}
            </span>
            {activeTab === 'archived' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0b66c3] rounded-full" />
            )}
          </button>
        </div>

        {/* 3. Search Bar */}
        <div className="px-5 pt-3.5 pb-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-8 text-xs font-medium text-slate-800 placeholder-slate-400 transition-all focus:border-[#0b66c3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b66c3]/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* 4. Filter Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-5 py-1.5 no-scrollbar">
          {['all', 'notice', 'exam-rule', 'advisory', 'urgent', 'announcement'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition-all cursor-pointer shrink-0 ${
                typeFilter === type
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'all' ? 'All Notes' : type.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* 5. Notes Cards Grid (Matching Reference Image 2) */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-3.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#0b66c3]" />
              <span className="mt-2 text-xs font-medium">Loading sticky notes...</span>
            </div>
          ) : displayedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Pin size={22} />
              </div>
              <p className="text-xs font-bold text-slate-700">No sticky notes found</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {searchQuery
                  ? `No matches for "${searchQuery}"`
                  : activeTab === 'archived'
                  ? 'No archived notes'
                  : 'No active notes currently available'}
              </p>
              {dismissedNoteIds.size > 0 && activeTab === 'active' && (
                <button
                  type="button"
                  onClick={restoreDismissedNotes}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Restore {dismissedNoteIds.size} dismissed notes</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {displayedNotes.map((note) => {
                const colorTheme = NOTE_COLOR_STYLES[note.color] || NOTE_COLOR_STYLES.yellow;
                const isViewed = viewedNoteIds.has(String(note._id));

                return (
                  <div
                    key={note._id}
                    onClick={() => {
                      popOutNote(note);
                      // On smaller screens, close drawer when opening pop-out
                      if (typeof window !== 'undefined' && window.innerWidth < 640) {
                        closeDrawer();
                      }
                    }}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${colorTheme.bg} ${colorTheme.hoverBg} ${colorTheme.border}`}
                  >
                    {/* Top Pin / Indicator */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {note.isPinned && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900/10 text-slate-900">
                            <Pin size={10} className="rotate-45" />
                          </span>
                        )}
                        <h3 className={`text-sm font-extrabold truncate ${colorTheme.title}`}>
                          {note.title}
                        </h3>
                      </div>

                      {/* Quick Actions on Hover */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                      >
                        {/* Toggle Viewed */}
                        <button
                          type="button"
                          onClick={() => toggleViewed(note._id)}
                          className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors cursor-pointer ${
                            isViewed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-black/5 hover:bg-black/10 text-slate-600'
                          }`}
                          title={isViewed ? 'Mark as unread' : 'Mark as viewed'}
                        >
                          <CheckCircle2 size={13} />
                        </button>

                        {/* Dismiss / Delete from view */}
                        <button
                          type="button"
                          onClick={() => dismissNote(note._id)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-slate-600 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                          title="Hide/Delete from my view"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Content Snippet */}
                    <p
                      className={`mt-2 text-xs font-medium line-clamp-4 leading-relaxed whitespace-pre-line ${colorTheme.snippet}`}
                    >
                      {note.content}
                    </p>

                    {/* Bottom Metadata (Audience + Relative Time) */}
                    <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-2.5 text-[11px] font-medium opacity-85">
                      <div className="flex items-center gap-1">
                        <Users size={12} className="opacity-70" />
                        <span className="truncate max-w-[90px]">
                          {note.audience || 'All'}
                        </span>
                      </div>

                      <span className="text-[10px] font-semibold opacity-75">
                        {formatRelativeTime(note.createdAt)}
                      </span>
                    </div>

                    {/* Viewed Indicator Ribbon */}
                    {isViewed && (
                      <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                        <CheckCircle2 size={11} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. Footer Information & Reset */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3 flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-slate-500">
            Click any note to open full sticky window
          </span>

          {dismissedNoteIds.size > 0 && (
            <button
              type="button"
              onClick={restoreDismissedNotes}
              className="text-[11px] font-bold text-[#0b66c3] hover:underline cursor-pointer"
            >
              Restore hidden ({dismissedNoteIds.size})
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
