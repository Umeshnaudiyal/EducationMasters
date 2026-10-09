'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BACKEND_URL } from '@/utils/api';

const StickyNotesContext = createContext(null);

export function StickyNotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null); // The currently popped out floating sticky note
  const [isMinimized, setIsMinimized] = useState(false);
  const [viewedNoteIds, setViewedNoteIds] = useState(new Set());
  const [dismissedNoteIds, setDismissedNoteIds] = useState(new Set());

  const [userPinnedNoteId, setUserPinnedNoteId] = useState(null);

  // Load viewed, dismissed, and user pinned note IDs from localStorage on mount
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
      const storedPinned = localStorage.getItem('em_user_pinned_note_id');
      if (storedPinned) {
        setUserPinnedNoteId(storedPinned);
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

  const hasRestoredPinnedRef = useRef(false);

  // Restore user-pinned note on page reload ONLY if user explicitly pinned it previously
  useEffect(() => {
    if (hasRestoredPinnedRef.current) return;

    if (userPinnedNoteId && activeNotes.length > 0) {
      const pinnedNote = activeNotes.find((n) => String(n._id) === String(userPinnedNoteId));
      if (pinnedNote) {
        hasRestoredPinnedRef.current = true;
        setSelectedNote(pinnedNote);
      }
    }
  }, [userPinnedNoteId, activeNotes]);

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

  // Pin a note to the screen (persisted across refresh)
  const pinNote = useCallback((id) => {
    if (!id) return;
    const strId = String(id);
    setUserPinnedNoteId(strId);
    try {
      localStorage.setItem('em_user_pinned_note_id', strId);
    } catch (e) {
      console.error('Error saving pinned note:', e);
    }
  }, []);

  // Unpin a note from the screen
  const unpinNote = useCallback((id) => {
    setUserPinnedNoteId((current) => {
      if (!id || String(current) === String(id)) {
        try {
          localStorage.removeItem('em_user_pinned_note_id');
        } catch (e) {
          console.error('Error removing pinned note:', e);
        }
        return null;
      }
      return current;
    });
  }, []);

  const togglePinNote = useCallback((id) => {
    if (!id) return;
    const strId = String(id);
    setUserPinnedNoteId((current) => {
      if (String(current) === strId) {
        try {
          localStorage.removeItem('em_user_pinned_note_id');
        } catch (e) {}
        return null;
      } else {
        try {
          localStorage.setItem('em_user_pinned_note_id', strId);
        } catch (e) {}
        return strId;
      }
    });
  }, []);

  // Pop out a sticky note onto the main screen (does not auto-pin unless user clicks pin)
  const popOutNote = useCallback((note) => {
    setSelectedNote(note);
    setIsMinimized(false);
  }, []);

  const closePoppedNote = useCallback(() => {
    if (selectedNote) {
      unpinNote(selectedNote._id);
    }
    setSelectedNote(null);
    setIsMinimized(false);
  }, [selectedNote, unpinNote]);

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
    userPinnedNoteId,
    pinNote,
    unpinNote,
    togglePinNote,
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
