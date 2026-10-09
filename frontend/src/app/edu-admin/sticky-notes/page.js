'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Plus,
  Search,
  Pin,
  Trash2,
  Edit,
  Eye,
  Archive,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
  Grid,
  List,
  RefreshCw,
  Sparkles,
  X,
  Check,
  Tag,
  Clock,
  Layers,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { NOTE_COLOR_STYLES } from '@/components/sticky-notes/StickyNotesDrawer';
import { BACKEND_URL } from '@/utils/api';

const COLOR_OPTIONS = [
  { id: 'yellow', label: 'Warm Yellow', hex: '#fde047', dot: 'bg-amber-400' },
  { id: 'purple', label: 'Lavender Purple', hex: '#c084fc', dot: 'bg-purple-400' },
  { id: 'blue', label: 'Sky Blue', hex: '#38bdf8', dot: 'bg-sky-400' },
  { id: 'green', label: 'Mint Green', hex: '#4ade80', dot: 'bg-emerald-400' },
  { id: 'pink', label: 'Rose Pink', hex: '#fb7185', dot: 'bg-rose-400' },
  { id: 'orange', label: 'Peach Orange', hex: '#fb923c', dot: 'bg-orange-400' },
  { id: 'cyan', label: 'Ice Cyan', hex: '#22d3ee', dot: 'bg-cyan-400' },
];

const TYPE_OPTIONS = [
  { id: 'notice', label: 'Official Notice' },
  { id: 'exam-rule', label: 'Exam Rule / Directive' },
  { id: 'advisory', label: 'Candidate Advisory' },
  { id: 'urgent', label: 'Urgent Alert' },
  { id: 'announcement', label: 'General Announcement' },
];

export default function AdminStickyNotesPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: 'yellow',
    type: 'notice',
    status: 'active',
    priority: 'normal',
    isPinned: false,
    audience: 'All Candidates',
    linkUrl: '',
    linkLabel: '',
    tags: '',
  });

  // Fetch all notes
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/sticky-notes?all=true&status=all`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotes(data.data);
      }
    } catch (err) {
      console.error('Failed to load sticky notes:', err);
      showToast('Failed to fetch sticky notes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      color: 'yellow',
      type: 'notice',
      status: 'active',
      priority: 'normal',
      isPinned: false,
      audience: 'All Candidates',
      linkUrl: '',
      linkLabel: '',
      tags: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title || '',
      content: note.content || '',
      color: note.color || 'yellow',
      type: note.type || 'notice',
      status: note.status || 'active',
      priority: note.priority || 'normal',
      isPinned: Boolean(note.isPinned),
      audience: note.audience || 'All Candidates',
      linkUrl: note.linkUrl || '',
      linkLabel: note.linkLabel || '',
      tags: Array.isArray(note.tags) ? note.tags.join(', ') : note.tags || '',
    });
    setIsModalOpen(true);
  };

  // Submit Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Please fill in both title and content', 'error');
      return;
    }

    setSubmitting(true);
    const token = session?.user?.accessToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : '');

    try {
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      const url = editingNote
        ? `${BACKEND_URL}/apis/v1/sticky-notes/${editingNote._id}`
        : `${BACKEND_URL}/apis/v1/sticky-notes`;

      const method = editingNote ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          editingNote
            ? 'Sticky note updated successfully'
            : 'Sticky note created successfully',
          'success'
        );
        setIsModalOpen(false);
        fetchNotes();
      } else {
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      console.error('Error submitting sticky note:', err);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Note
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sticky note?')) return;
    const token = session?.user?.accessToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : '');

    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/sticky-notes/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast('Sticky note deleted', 'success');
        setNotes((prev) => prev.filter((n) => n._id !== id));
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch (err) {
      console.error('Error deleting sticky note:', err);
      showToast('Failed to delete note', 'error');
    }
  };

  // Toggle Pin
  const handleTogglePin = async (note) => {
    const token = session?.user?.accessToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : '');
    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/sticky-notes/${note._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          note.isPinned ? 'Note unpinned from top' : 'Note pinned to top',
          'success'
        );
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Archive
  const handleToggleArchive = async (note) => {
    const token = session?.user?.accessToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : '');
    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/sticky-notes/${note._id}/archive`, {
        method: 'PATCH',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Status updated', 'success');
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
      const matchesColor = colorFilter === 'all' || n.color === colorFilter;
      const matchesType = typeFilter === 'all' || n.type === typeFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        n.title?.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q) ||
        n.audience?.toLowerCase().includes(q) ||
        n.tags?.some((t) => t.toLowerCase().includes(q));
      return matchesStatus && matchesColor && matchesType && matchesSearch;
    });
  }, [notes, search, statusFilter, colorFilter, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: notes.length,
      active: notes.filter((n) => n.status === 'active').length,
      archived: notes.filter((n) => n.status === 'archived').length,
      pinned: notes.filter((n) => n.isPinned).length,
      totalViews: notes.reduce((acc, curr) => acc + (curr.viewCount || 0), 0),
    };
  }, [notes]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shadow-2xs">
              <Pin size={18} className="rotate-45" />
            </span>
            <h1 className="text-xl font-black text-slate-900">
              Sticky Notes & Directives
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Publish visual sticky notices, verified exam guidelines, and advisories for examinees.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchNotes}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            title="Reload data"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-[#0b66c3]' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex h-9 items-center gap-2 rounded-xl bg-[#0b66c3] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#0954a5] transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Sticky Note</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Notes</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Layers size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{stats.total}</p>
          <span className="text-[10px] font-medium text-slate-400">Created across all categories</span>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Active Published</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900">{stats.active}</p>
          <span className="text-[10px] font-medium text-emerald-700">Visible to students</span>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Pinned Directives</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Pin size={14} className="rotate-45" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900">{stats.pinned}</p>
          <span className="text-[10px] font-medium text-amber-700">Pinned to top radar</span>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">Total Views</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Eye size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-900">{stats.totalViews}</p>
          <span className="text-[10px] font-medium text-blue-700">Student readership</span>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, content, or tag..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0b66c3] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="draft">Draft</option>
          </select>

          {/* Color Filter */}
          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">All Colors</option>
            {COLOR_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none hidden sm:block"
          >
            <option value="all">All Types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle (Grid / List) */}
        <div className="flex items-center gap-1 self-end md:self-auto border border-slate-200 rounded-xl p-1 bg-slate-50">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-[#0b66c3] shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Grid Preview Mode"
          >
            <Grid size={14} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              viewMode === 'table'
                ? 'bg-white text-[#0b66c3] shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Table List Mode"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* 4. Content Area (Grid or Table) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-[#0b66c3]" />
          <span className="mt-2.5 text-xs font-medium">Loading sticky notes...</span>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Pin size={20} />
          </div>
          <p className="text-sm font-bold text-slate-700">No sticky notes match your filters</p>
          <p className="mt-1 text-xs text-slate-400">
            Try adjusting your search query or create a new sticky note.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0b66c3] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0954a5]"
          >
            <Plus size={14} />
            <span>Create First Note</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Rich Pastel Sticky Cards) */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNotes.map((note) => {
            const colorTheme = NOTE_COLOR_STYLES[note.color] || NOTE_COLOR_STYLES.yellow;

            return (
              <div
                key={note._id}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${colorTheme.bg} ${colorTheme.border}`}
              >
                {/* Card Top Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {note.isPinned && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/10 text-slate-900" title="Pinned to top">
                          <Pin size={11} className="rotate-45" />
                        </span>
                      )}
                      <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">
                        {note.type.replace('-', ' ')}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        note.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : note.status === 'archived'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {note.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className={`mt-2 text-sm font-extrabold line-clamp-2 ${colorTheme.title}`}>
                    {note.title}
                  </h3>

                  {/* Content */}
                  <p
                    className={`mt-2 text-xs font-medium line-clamp-5 leading-relaxed whitespace-pre-line ${colorTheme.snippet}`}
                  >
                    {note.content}
                  </p>
                </div>

                {/* Card Bottom Meta & Actions */}
                <div className="mt-4 border-t border-black/5 pt-3">
                  <div className="flex items-center justify-between text-[11px] font-medium opacity-80 mb-3">
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span className="truncate max-w-[100px]">
                        {note.audience || 'All'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye size={12} />
                      <span>{note.viewCount || 0} views</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between gap-1 border-t border-black/5 pt-2">
                    {/* Pin Toggle */}
                    <button
                      type="button"
                      onClick={() => handleTogglePin(note)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                        note.isPinned
                          ? 'bg-amber-200 text-amber-900'
                          : 'hover:bg-black/5 text-slate-600'
                      }`}
                      title={note.isPinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin size={13} className={note.isPinned ? 'rotate-45' : ''} />
                    </button>

                    {/* Archive Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(note)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                        note.status === 'archived'
                          ? 'bg-purple-200 text-purple-900'
                          : 'hover:bg-black/5 text-slate-600'
                      }`}
                      title={note.status === 'archived' ? 'Unarchive' : 'Archive'}
                    >
                      <Archive size={13} />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(note)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/5 text-slate-700 transition-colors cursor-pointer"
                      title="Edit note"
                    >
                      <Edit size={13} />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(note._id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-rose-500 hover:text-white text-rose-600 transition-colors cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (Compact Data Table) */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Color / Pin</th>
                <th className="px-4 py-3">Title & Content</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredNotes.map((note) => {
                const colorOpt = COLOR_OPTIONS.find((c) => c.id === note.color) || COLOR_OPTIONS[0];

                return (
                  <tr key={note._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-4 w-4 rounded-full ${colorOpt.dot} shadow-2xs ring-1 ring-black/5`}
                          title={colorOpt.label}
                        />
                        {note.isPinned && (
                          <Pin size={12} className="text-amber-600 rotate-45" title="Pinned" />
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      <h4 className="font-bold text-slate-900 truncate">{note.title}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{note.content}</p>
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 capitalize">
                        {note.type.replace('-', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">{note.audience || 'All'}</td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800">{note.viewCount || 0}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          note.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : note.status === 'archived'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {note.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(note)}
                          className="p-1 text-slate-400 hover:text-amber-600 rounded cursor-pointer"
                          title="Pin/Unpin"
                        >
                          <Pin size={14} className={note.isPinned ? 'rotate-45 text-amber-600' : ''} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleArchive(note)}
                          className="p-1 text-slate-400 hover:text-purple-600 rounded cursor-pointer"
                          title="Archive"
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(note)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(note._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CREATE / EDIT STICKY NOTE MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-pop-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Pin size={15} className="rotate-45" />
                </span>
                <h2 className="text-base font-black text-slate-900">
                  {editingNote ? 'Edit Sticky Note' : 'Create New Sticky Note'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Color Swatches */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Note Pastel Theme
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, color: c.id }))}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        formData.color === c.id
                          ? 'border-slate-800 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`h-3.5 w-3.5 rounded-full ${c.dot}`} />
                      <span>{c.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. UPSC Prelims 2026 Instructions"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-[#0b66c3] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Content / Directive Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Write full guidelines, instructions, or notice details..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:border-[#0b66c3] focus:bg-white focus:outline-none leading-relaxed"
                />
              </div>

              {/* Row: Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notice Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Publish Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="active">Active (Published)</option>
                    <option value="archived">Archived</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Row: Audience & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Audience / Target Group
                  </label>
                  <input
                    type="text"
                    value={formData.audience}
                    onChange={(e) => setFormData((prev) => ({ ...prev, audience: e.target.value }))}
                    placeholder="e.g. All Candidates, Railway Aspirants"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Row: Optional Action Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Action Link URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="e.g. /admit-cards or https://..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link Button Label
                  </label>
                  <input
                    type="text"
                    value={formData.linkLabel}
                    onChange={(e) => setFormData((prev) => ({ ...prev, linkLabel: e.target.value }))}
                    placeholder="e.g. View Rules PDF"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pinned Toggle Checkbox */}
              <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isPinned: e.target.checked }))}
                  className="h-4 w-4 rounded accent-[#0b66c3] cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Pin note to top of sticky radar
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Pinned notes will appear first in the examinee sticky sidebar.
                  </span>
                </div>
              </label>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#0b66c3] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0954a5] transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : editingNote
                    ? 'Update Sticky Note'
                    : 'Publish Sticky Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
