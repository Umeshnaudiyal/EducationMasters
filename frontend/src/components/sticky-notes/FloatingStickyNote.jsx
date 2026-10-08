'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Share2,
  Bell,
  Archive,
  Pin,
  Minus,
  X,
  CheckCircle,
  ExternalLink,
  Check,
  Maximize2,
  Users,
} from 'lucide-react';
import { useStickyNotes } from '@/context/StickyNotesContext';
import { NOTE_COLOR_STYLES } from './StickyNotesDrawer';

export default function FloatingStickyNote() {
  const {
    selectedNote,
    closePoppedNote,
    isMinimized,
    toggleMinimizePoppedNote,
    userPinnedNoteId,
    togglePinNote,
    pinNote,
    unpinNote,
    viewedNoteIds,
    toggleViewed,
    markAsViewed,
    dismissNote,
    isDrawerOpen,
  } = useStickyNotes();

  const [copied, setCopied] = useState(false);
  const [bellActive, setBellActive] = useState(false);

  const isPinned = Boolean(
    selectedNote && userPinnedNoteId && String(userPinnedNoteId) === String(selectedNote._id)
  );

  // Dragging State
  const [position, setPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });
  const hasMovedRef = useRef(false);
  const cardRef = useRef(null);

  // Auto mark as viewed when opened
  useEffect(() => {
    if (selectedNote?._id) {
      markAsViewed(selectedNote._id);
    }
  }, [selectedNote?._id, markAsViewed]);

  // Handle Share (Copy text/link)
  const handleShare = async (e) => {
    e.stopPropagation();
    if (!selectedNote) return;
    const shareText = `${selectedNote.title}\n\n${selectedNote.content}\n\nEducation Masters Verified Notice`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Drag Handlers (Mouse + Touch)
  const handleStartDrag = useCallback((clientX, clientY, target) => {
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input')
    ) {
      return;
    }

    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    hasMovedRef.current = false;
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
    };
    setIsDragging(true);
  }, []);

  const handleMouseDown = useCallback((e) => {
    handleStartDrag(e.clientX, e.clientY, e.target);
  }, [handleStartDrag]);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      handleStartDrag(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }
  }, [handleStartDrag]);

  useEffect(() => {
    const handleMove = (clientX, clientY) => {
      if (!isDragging) return;
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }
      const cardWidth = cardRef.current?.offsetWidth || 320;
      const cardHeight = cardRef.current?.offsetHeight || 260;
      const newX = Math.max(6, Math.min(window.innerWidth - cardWidth - 6, dragRef.current.initialLeft + dx));
      const newY = Math.max(6, Math.min(window.innerHeight - cardHeight - 6, dragRef.current.initialTop + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  if (!selectedNote) return null;

  const colorTheme = NOTE_COLOR_STYLES[selectedNote.color] || NOTE_COLOR_STYLES.yellow;
  const isViewed = viewedNoteIds.has(String(selectedNote._id));

  // If minimized into a floating bottom pill (Movable anywhere on mobile & desktop!)
  if (isMinimized) {
    return (
      <div
        ref={cardRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={
          position.x !== null && position.y !== null
            ? { left: `${position.x}px`, top: `${position.y}px` }
            : { bottom: '16px', right: '16px' }
        }
        className={`fixed z-[96] flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-200/90 bg-white/95 px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-xl backdrop-blur-md animate-pop-in touch-manipulation select-none transition-shadow max-w-[calc(100vw-24px)] ${
          isDragging ? 'shadow-3xl cursor-grabbing scale-[1.02]' : 'cursor-grab hover:shadow-2xl'
        }`}
        onClick={() => {
          if (!hasMovedRef.current) {
            toggleMinimizePoppedNote();
          }
        }}
        title="Drag to move, click to expand sticky note"
      >
        <span className={`h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full ${colorTheme.dot} shadow-xs ring-2 ring-white shrink-0`} />
        <span className="text-[11px] sm:text-xs font-bold text-slate-800 line-clamp-1 max-w-[130px] sm:max-w-[180px]">
          {selectedNote.title}
        </span>
        {isPinned && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-800 shrink-0" title="Pinned note">
            <Pin size={9} className="rotate-45" />
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMinimizePoppedNote();
          }}
          className="rounded-full p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 touch-manipulation cursor-pointer"
          title="Expand"
        >
          <Maximize2 size={13} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            closePoppedNote();
          }}
          className="rounded-full p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 touch-manipulation cursor-pointer"
          title="Close"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  // Floating Window Responsive Container (Adapts seamlessly from phone to desktop)
  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={
        position.x !== null && position.y !== null
          ? { left: `${position.x}px`, top: `${position.y}px` }
          : {
              bottom: '16px',
              right: isDrawerOpen ? '500px' : '16px',
              transition: isDragging ? 'none' : 'right 0.28s ease',
            }
      }
      className={`fixed z-[96] w-[calc(100vw-24px)] sm:w-[370px] max-w-[390px] max-h-[85vh] flex flex-col rounded-[22px] sm:rounded-[24px] border border-amber-200/60 shadow-2xl backdrop-blur-md overflow-hidden animate-pop-in select-none transition-shadow touch-manipulation ${
        isDragging ? 'shadow-3xl cursor-grabbing scale-[1.01]' : 'cursor-default'
      } ${
        selectedNote.color === 'yellow'
          ? 'bg-[#fffdf2]'
          : selectedNote.color === 'purple'
          ? 'bg-[#fcfaff]'
          : selectedNote.color === 'blue'
          ? 'bg-[#f5faff]'
          : selectedNote.color === 'green'
          ? 'bg-[#f7fdf7]'
          : selectedNote.color === 'pink'
          ? 'bg-[#fff7f8]'
          : selectedNote.color === 'orange'
          ? 'bg-[#fffaf5]'
          : 'bg-[#f4fdff]'
      }`}
    >
      {/* Top Rounded Accent Bar */}
      <div
        className={`h-2 sm:h-2.5 w-full rounded-t-[22px] sm:rounded-t-[24px] shrink-0 ${
          selectedNote.color === 'yellow'
            ? 'bg-amber-400'
            : selectedNote.color === 'purple'
            ? 'bg-purple-500'
            : selectedNote.color === 'blue'
            ? 'bg-sky-500'
            : selectedNote.color === 'green'
            ? 'bg-emerald-500'
            : selectedNote.color === 'pink'
            ? 'bg-rose-500'
            : selectedNote.color === 'orange'
            ? 'bg-orange-500'
            : 'bg-cyan-500'
        }`}
      />

      <div className="p-3.5 sm:p-5 flex flex-col flex-1 overflow-hidden">
        {/* Top Control Bar with Circular Indicator & Actions */}
        <div className="flex items-center justify-between">
          {/* Top Left Circle Indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full shadow-inner ring-2 ring-white ${
                selectedNote.color === 'yellow'
                  ? 'bg-amber-400'
                  : selectedNote.color === 'purple'
                  ? 'bg-purple-500'
                  : selectedNote.color === 'blue'
                  ? 'bg-sky-500'
                  : selectedNote.color === 'green'
                  ? 'bg-emerald-500'
                  : selectedNote.color === 'pink'
                  ? 'bg-rose-500'
                  : selectedNote.color === 'orange'
                  ? 'bg-orange-500'
                  : 'bg-cyan-500'
              }`}
            />
            {selectedNote.type && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {selectedNote.type.replace('-', ' ')}
              </span>
            )}
          </div>

          {/* Top Right Action Icons (Matching Image 1: Share, Bell, Archive, Pin, Minimize, Close) */}
          <div className="flex items-center gap-1.5 text-slate-500">
            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="group relative flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5 hover:text-slate-800 transition-colors cursor-pointer"
              title="Share / Copy note"
            >
              {copied ? (
                <Check size={14} className="text-emerald-600 animate-scale-in" />
              ) : (
                <Share2 size={14} />
              )}
              {copied && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white whitespace-nowrap shadow-xs">
                  Copied!
                </span>
              )}
            </button>

            {/* Bell / Reminder Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setBellActive((prev) => !prev);
              }}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer ${
                bellActive
                  ? 'bg-amber-100 text-amber-800'
                  : 'hover:bg-black/5 hover:text-slate-800'
              }`}
              title={bellActive ? 'Reminder active' : 'Set reminder alert'}
            >
              <Bell size={14} />
            </button>

            {/* Archive / Dismiss */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissNote(selectedNote._id);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5 hover:text-slate-800 transition-colors cursor-pointer"
              title="Hide / Dismiss from view"
            >
              <Archive size={14} />
            </button>

            {/* Pin Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePinNote(selectedNote._id);
              }}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer ${
                isPinned ? 'text-amber-800 bg-amber-100 ring-1 ring-amber-300' : 'hover:bg-black/5 hover:text-slate-800'
              }`}
              title={
                isPinned
                  ? 'Pinned: Note will remain visible across page reloads (Click to unpin)'
                  : 'Pin note: Keep visible on screen even after refreshing'
              }
            >
              <Pin size={14} className={isPinned ? 'rotate-45' : ''} />
            </button>

            {/* Minimize (-) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMinimizePoppedNote();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5 hover:text-slate-800 transition-colors cursor-pointer"
              title="Minimize note"
            >
              <Minus size={15} />
            </button>

            {/* Close (X) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closePoppedNote();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer"
              title="Close note"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Note Body Area (Scrollable if long notice on small mobile screens) */}
        <div className="mt-3 sm:mt-4 select-text flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[55vh] sm:max-h-[60vh]">
          {/* Title */}
          <h2
            className={`text-base sm:text-lg font-bold tracking-tight leading-snug ${
              selectedNote.color === 'yellow'
                ? 'text-[#92400e]'
                : selectedNote.color === 'purple'
                ? 'text-[#581c87]'
                : selectedNote.color === 'blue'
                ? 'text-[#0369a1]'
                : selectedNote.color === 'green'
                ? 'text-[#15803d]'
                : selectedNote.color === 'pink'
                ? 'text-[#9f1239]'
                : selectedNote.color === 'orange'
                ? 'text-[#9a3412]'
                : 'text-[#0e7490]'
            }`}
          >
            {selectedNote.title}
          </h2>

          {/* Content */}
          <div
            className={`mt-2 sm:mt-2.5 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line ${
              selectedNote.color === 'yellow'
                ? 'text-[#a16207]'
                : selectedNote.color === 'purple'
                ? 'text-[#7e22ce]'
                : selectedNote.color === 'blue'
                ? 'text-[#0284c7]'
                : selectedNote.color === 'green'
                ? 'text-[#16a34a]'
                : selectedNote.color === 'pink'
                ? 'text-[#be123c]'
                : selectedNote.color === 'orange'
                ? 'text-[#c2410c]'
                : 'text-[#0891b2]'
            }`}
          >
            {selectedNote.content}
          </div>

          {/* Action Link (If provided) */}
          {selectedNote.linkUrl && (
            <div className="mt-3 sm:mt-3.5 pt-1 sm:pt-2">
              <Link
                href={selectedNote.linkUrl}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
              >
                <span>{selectedNote.linkLabel || 'Open Notice Link'}</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* Bottom Bar: Complete Checkmark Button & Relative Timestamp */}
        <div className="mt-3.5 sm:mt-5 flex items-center justify-between border-t border-black/5 pt-2.5 sm:pt-3 shrink-0">
          {/* Complete / Viewed Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleViewed(selectedNote._id);
            }}
            className={`flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              isViewed
                ? 'text-emerald-700'
                : 'text-amber-800/80 hover:text-amber-950'
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                isViewed
                  ? 'border-emerald-600 bg-emerald-500 text-white'
                  : 'border-amber-600/70 text-transparent'
              }`}
            >
              <Check size={11} className={isViewed ? 'opacity-100' : 'opacity-0'} />
            </span>
            <span>{isViewed ? 'Viewed' : 'Complete'}</span>
          </button>

          {/* Relative Timestamp & Drag corner dots */}
          <div className="flex items-center gap-2 text-[11px] font-medium text-amber-800/60">
            <span>less than a minute ago</span>
            {/* Dotted Grid Indicator */}
            <div className="grid grid-cols-2 gap-0.5 opacity-60">
              <span className="h-1 w-1 rounded-full bg-amber-800/70" />
              <span className="h-1 w-1 rounded-full bg-amber-800/70" />
              <span className="h-1 w-1 rounded-full bg-amber-800/70" />
              <span className="h-1 w-1 rounded-full bg-amber-800/70" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(12px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes scaleIn {
          0% {
            transform: scale(0.5);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-pop-in {
          animation: popIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
