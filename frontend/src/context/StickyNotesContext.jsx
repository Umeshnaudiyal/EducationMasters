'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

const StickyNotesContext = createContext(null);

const BACKEND_URL = typeof window !== 'undefined'
  ? ''
  : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001');

export function StickyNotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null); // The currently popped out floating sticky note
  const [isMinimized, setIsMinimized] = useState(false);
  const [viewedNoteIds, setViewedNoteIds] = useState(new Set());
  const [dismissedNoteIds, setDismissedNoteIds] = useState(new Set());

  // Load viewed & dismissed IDs from localStorage on mount
  useEffect(() => {
    try {
      const storedViewed = localStorage.getItem('em_viewed_sticky_notes');
      if (storedViewed) {
        setViewedNoteIds(new Set(JSON.parse(storedViewed)));
      }
      const storedDismissed = localStorage.getItem('em_dismissed_sticky_notes');
      if (storedDismissed) {
        setDismissedNoteIds(new Set(JSON.parse(storedDismissed)));
      }
    } catch (err) {
      console.error('Error reading sticky note preferences from localStorage:', err);
    }
  }, []);

  // Fetch all sticky notes from backend
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/sticky-notes?all=true`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotes(data.data);
      }
    } catch (err) {
      console.error('Failed to load sticky notes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Active notes excluding user dismissed ones
  const activeNotes = useMemo(() => {
    return notes.filter(
      (n) => n.status !== 'archived' && !dismissedNoteIds.has(String(n._id))
    );
  }, [notes, dismissedNoteIds]);

  const autoPoppedRef = useRef(false);

  // Auto-pop pinned note ONLY ONCE on initial load if none selected yet
  useEffect(() => {
    if (autoPoppedRef.current) return;

    // Check if user already dismissed or closed the auto-pinned note this session
    try {
      if (sessionStorage.getItem('em_pinned_note_closed')) {
        autoPoppedRef.current = true;
        return;
      }
    } catch (e) {
      // ignore
    }

    if (activeNotes.length > 0) {
      const pinned = activeNotes.find((n) => n.isPinned);
      if (pinned) {
        autoPoppedRef.current = true;
        setSelectedNote(pinned);
      }
    }
  }, [activeNotes]);

  // Archived notes
  const archivedNotes = useMemo(() => {
    return notes.filter((n) => n.status === 'archived');
  }, [notes]);

  // Unread count
  const unreadCount = useMemo(() => {
    return activeNotes.filter((n) => !viewedNoteIds.has(String(n._id))).length;
  }, [activeNotes, viewedNoteIds]);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  // Pop out a sticky note onto the main screen
  const popOutNote = useCallback((note) => {
    setSelectedNote(note);
    setIsMinimized(false);
  }, []);

  const closePoppedNote = useCallback(() => {
    setSelectedNote(null);
    setIsMinimized(false);
    autoPoppedRef.current = true;
    try {
      sessionStorage.setItem('em_pinned_note_closed', 'true');
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleMinimizePoppedNote = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  // Mark a note as viewed (persisted in localStorage + backend view count)
  const markAsViewed = useCallback((id) => {
    if (!id) return;
    const strId = String(id);
    setViewedNoteIds((prev) => {
      const next = new Set(prev);
      next.add(strId);
      try {
        localStorage.setItem('em_viewed_sticky_notes', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error('Error saving viewed note:', e);
      }
      return next;
    });

    // Call backend increment view count non-blocking
    fetch(`${BACKEND_URL}/apis/v1/sticky-notes/${id}/view`, {
      method: 'POST',
    }).catch(() => {});
  }, []);

  // Toggle viewed status
  const toggleViewed = useCallback((id) => {
    if (!id) return;
    const strId = String(id);
    setViewedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(strId)) {
        next.delete(strId);
      } else {
        next.add(strId);
        // Call backend view count
        fetch(`${BACKEND_URL}/apis/v1/sticky-notes/${id}/view`, {
          method: 'POST',
        }).catch(() => {});
      }
      try {
        localStorage.setItem('em_viewed_sticky_notes', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error('Error toggling viewed note:', e);
      }
      return next;
    });
  }, []);

  // Dismiss / delete a note from the user's view (persisted in localStorage)
  const dismissNote = useCallback((id) => {
    if (!id) return;
    const strId = String(id);
    setDismissedNoteIds((prev) => {
      const next = new Set(prev);
      next.add(strId);
      try {
        localStorage.setItem('em_dismissed_sticky_notes', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error('Error saving dismissed note:', e);
      }
      return next;
    });

    // If the dismissed note is currently popped out, close it
    setSelectedNote((current) => (current && String(current._id) === strId ? null : current));
  }, []);

  // Reset all dismissed notes
  const restoreDismissedNotes = useCallback(() => {
    setDismissedNoteIds(new Set());
    try {
      localStorage.removeItem('em_dismissed_sticky_notes');
    } catch (e) {
      console.error(e);
    }
  }, []);

  const value = {
    notes,
    activeNotes,
    archivedNotes,
    unreadCount,
    loading,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    selectedNote,
    isMinimized,
    popOutNote,
    closePoppedNote,
    toggleMinimizePoppedNote,
    viewedNoteIds,
    markAsViewed,
    toggleViewed,
    dismissNote,
    dismissedNoteIds,
    restoreDismissedNotes,
    refetchNotes: fetchNotes,
  };

  return (
    <StickyNotesContext.Provider value={value}>
      {children}
    </StickyNotesContext.Provider>
  );
}

export function useStickyNotes() {
  const context = useContext(StickyNotesContext);
  if (!context) {
    throw new Error('useStickyNotes must be used within a StickyNotesProvider');
  }
  return context;
}
