'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  FolderTree,
  Plus,
  Search,
  Trash2,
  Edit3,
  Check,
  ExternalLink,
  ImageIcon,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List as ListIcon,
  ListOrdered,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import AdminLoader from '@/components/admin/AdminLoader';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

// Helper to auto-generate clean URL slug
const slugify = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function CategoriesPage() {
  const { data: session } = useSession();
  const isAuthor = session?.user?.role === 'author' || session?.user?.role === 'writer';
  // Category List & Pagination
  const [categories, setCategories] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected for Bulk Action
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form State (Create / Edit)
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [featuredMedia, setFeaturedMedia] = useState(null);

  // SEO Accordion State
  const [seoOpen, setSeoOpen] = useState(true);
  const [allowIndexing, setAllowIndexing] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    cat: null,
    isBulk: false,
    isLoading: false,
  });

  // Quick Edit inline state
  const [quickEditingId, setQuickEditingId] = useState(null);
  const [quickName, setQuickName] = useState('');
  const [quickSlug, setQuickSlug] = useState('');

  const descTextareaRef = useRef(null);

  // Fetch all parent options (for dropdown)
  const fetchParentOptions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/categories?all=true`);
      const data = await res.json();
      if (data.success && data.data) {
        setParentOptions(data.data);
      }
    } catch (err) {
      console.error('Error fetching parent categories:', err);
    }
  };

  // Fetch categories with pagination & search
  const fetchCategories = async (pageNum = 1, searchVal = '') => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: pageNum.toString(),
        limit: '15',
        search: searchVal.trim(),
      });
      const res = await fetch(`${BACKEND_URL}/apis/v1/categories?${query}`);
      const data = await res.json();

      if (data.success) {
        setCategories(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.pages || 1);
        setPage(data.page || 1);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setMessage({ type: 'error', text: 'Failed to load categories from server' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentOptions();
  }, []);

  useEffect(() => {
    fetchCategories(page, searchQuery);
  }, [page, searchQuery]);

  // Handle Name Input with auto-slug
  const handleNameChange = (val) => {
    setName(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  // Handle Slug Input
  const handleSlugChange = (val) => {
    setSlug(val);
    setAutoSlug(false);
  };

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setAutoSlug(true);
    setParentId('');
    setDescription('');
    setFeaturedMedia(null);
    setAllowIndexing(true);
    setMetaTitle('');
    setMetaKeywords('');
    setMetaDescription('');
  };

  // Start Editing
  const startEdit = (cat) => {
    setEditingId(cat._id);
    setName(cat.name || '');
    setSlug(cat.slug || '');
    setAutoSlug(false);
    setParentId(cat.parent?._id || cat.parent || '');
    setDescription(cat.description || '');
    setFeaturedMedia(cat.featured_media || null);
    setAllowIndexing(cat.allow_indexing !== false);
    setMetaTitle(cat.meta_title || '');
    setMetaKeywords(cat.meta_keywords || '');
    setMetaDescription(cat.meta_description || '');

    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Create / Edit Category
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Category name is required' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const payload = {
      name: name.trim(),
      slug: slug.trim() ? slugify(slug) : slugify(name),
      parent: parentId || null,
      description: description || '',
      featured_media: featuredMedia?._id || null,
      allow_indexing: allowIndexing,
      meta_title: metaTitle,
      meta_keywords: metaKeywords,
      meta_description: metaDescription,
    };

    try {
      const url = editingId
        ? `${BACKEND_URL}/apis/v1/categories/${editingId}`
        : `${BACKEND_URL}/apis/v1/categories`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: editingId ? 'Category updated successfully!' : 'Category created successfully!',
        });
        resetForm();
        fetchCategories(editingId ? page : 1, searchQuery);
        fetchParentOptions();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save category' });
      }
    } catch (err) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: 'Network error while saving category' });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (cat) => {
    if (cat.slug === 'uncategorized' || cat.name?.toLowerCase() === 'uncategorized') {
      setMessage({ type: 'error', text: 'The default "Uncategorized" category cannot be deleted.' });
      return;
    }
    setDeleteModal({
      isOpen: true,
      cat,
      isBulk: false,
      isLoading: false,
    });
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      if (deleteModal.isBulk) {
        const res = await fetch(`${BACKEND_URL}/apis/v1/categories/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selectedIds) }),
        });
        const data = await res.json();
        if (data.success) {
          setMessage({
            type: 'success',
            text: `${data.deletedCount || selectedIds.size} categories deleted.`,
          });
          setSelectedIds(new Set());
          setBulkAction('');
          fetchCategories(1, searchQuery);
          fetchParentOptions();
        } else {
          setMessage({ type: 'error', text: data.message || 'Bulk delete failed' });
        }
      } else if (deleteModal.cat) {
        const res = await fetch(`${BACKEND_URL}/apis/v1/categories/${deleteModal.cat._id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (data.success) {
          setMessage({ type: 'success', text: `Category "${deleteModal.cat.name}" deleted.` });
          if (editingId === deleteModal.cat._id) resetForm();
          fetchCategories(page, searchQuery);
          fetchParentOptions();
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to delete category' });
        }
      }
      setDeleteModal({ isOpen: false, cat: null, isBulk: false, isLoading: false });
    } catch (err) {
      console.error('Delete error:', err);
      setMessage({ type: 'error', text: 'Error deleting category' });
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Bulk Actions
  const handleBulkAction = async () => {
    if (selectedIds.size === 0) {
      setMessage({ type: 'error', text: 'Please select at least one category.' });
      return;
    }

    if (bulkAction !== 'delete') {
      setMessage({ type: 'error', text: 'Please select a valid bulk action.' });
      return;
    }

    setDeleteModal({
      isOpen: true,
      cat: null,
      isBulk: true,
      isLoading: false,
    });
  };

  // Quick Edit Handlers
  const startQuickEdit = (cat) => {
    setQuickEditingId(cat._id);
    setQuickName(cat.name || '');
    setQuickSlug(cat.slug || '');
  };

  const cancelQuickEdit = () => {
    setQuickEditingId(null);
    setQuickName('');
    setQuickSlug('');
  };

  const saveQuickEdit = async (id) => {
    if (!quickName.trim()) {
      alert('Category name is required.');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickName.trim(),
          slug: quickSlug.trim() ? slugify(quickSlug) : slugify(quickName),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuickEditingId(null);
        fetchCategories(page, searchQuery);
        fetchParentOptions();
      } else {
        alert(data.message || 'Failed to update category');
      }
    } catch (err) {
      console.error('Quick edit error:', err);
      alert('Network error updating category');
    }
  };

  // Selection Checkboxes
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === categories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(categories.map((c) => c._id)));
    }
  };

  // Description Rich Editor Helpers
  const insertFormatting = (tag) => {
    const textarea = descTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);
    let replacement = '';

    if (tag === 'b') replacement = `<strong>${selectedText || 'bold text'}</strong>`;
    else if (tag === 'i') replacement = `<em>${selectedText || 'italic text'}</em>`;
    else if (tag === 'p') replacement = `<p>${selectedText || 'Paragraph text'}</p>`;
    else if (tag === 'ul') replacement = `<ul>\n  <li>${selectedText || 'List item'}</li>\n</ul>`;
    else if (tag === 'ol') replacement = `<ol>\n  <li>${selectedText || 'Numbered item'}</li>\n</ol>`;
    else if (tag === 'center') replacement = `<div style="text-align: center;">${selectedText || 'Centered'}</div>`;
    else if (tag === 'right') replacement = `<div style="text-align: right;">${selectedText || 'Right'}</div>`;
    else if (tag === 'justify') replacement = `<div style="text-align: justify;">${selectedText || 'Justified'}</div>`;

    const newText = description.substring(0, start) + replacement + description.substring(end);
    setDescription(newText);
  };

  // Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  };

  return (
    <div className="space-y-3 w-full min-w-0 select-none font-sans text-slate-800">
      {/* Page Title */}
      <div className="pb-1">
        <h1 className="text-xl font-normal text-slate-900 tracking-tight">Categories</h1>
      </div>

      {/* Global Feedback Banner */}
      {message && (
        <div
          className={`p-3 rounded border text-xs flex items-center justify-between shadow-2xs animate-in fade-in duration-150 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* 2-Column Split: Left Form + Right Data Table matching WordPress UI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: ADD / EDIT CATEGORY FORM */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-5 rounded border border-slate-300 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-bold text-slate-900">
              {editingId ? 'Edit Category' : 'Add New Category'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-[#2271b1] hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Featured Image */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Featured Image</label>
              {featuredMedia ? (
                <div className="relative w-32 h-24 rounded border border-slate-300 bg-slate-100 overflow-hidden shadow-2xs group">
                  <img
                    src={getImageUrl(featuredMedia)}
                    alt="Category Featured"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (!e.currentTarget.dataset.fallback) {
                        e.currentTarget.dataset.fallback = 'true';
                        e.currentTarget.src = '/logo.webp';
                      } else {
                        e.currentTarget.style.display = 'none';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowMediaModal(true)}
                      className="px-2 py-1 bg-white text-slate-800 rounded text-[10px] font-semibold hover:bg-slate-100 shadow"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeaturedMedia(null)}
                      className="p-1 bg-rose-600 text-white rounded hover:bg-rose-700 shadow"
                      title="Remove Image"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowMediaModal(true)}
                    className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-[#2271b1] text-[#2271b1] rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ImageIcon size={14} />
                    <span>Add Image</span>
                  </button>
                </div>
              )}
            </div>

            {/* Name Field */}
            <div className="space-y-1">
              <label htmlFor="cat-name" className="block text-xs font-semibold text-slate-800">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="cat-name"
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] shadow-2xs"
              />
              <p className="text-[11px] text-slate-400">The name is how it appears on your site.</p>
            </div>

            {/* Slug Field */}
            <div className="space-y-1">
              <label htmlFor="cat-slug" className="block text-xs font-semibold text-slate-800">
                Slug
              </label>
              <input
                id="cat-slug"
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-[#2271b1] shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 leading-tight">
                The “slug” is the URL-friendly version of the name. It is usually all lower case and contains only letters, numbers, and hyphens.
              </p>
            </div>

            {/* Parent Category Field */}
            <div className="space-y-1">
              <label htmlFor="cat-parent" className="block text-xs font-semibold text-slate-800">
                Parent Category
              </label>
              <select
                id="cat-parent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] shadow-2xs"
              >
                <option value="">None</option>
                {parentOptions
                  .filter((p) => !editingId || p._id !== editingId)
                  .map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-slate-400 leading-tight">
                Categories, unlike tags, can have a hierarchy. You might have a Jazz category, and under that have children categories for Bebop and Big Band. Totally optional.
              </p>
            </div>

            {/* Description Field with Formatting Toolbar */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">Description</label>
              <div className="border border-slate-300 rounded overflow-hidden shadow-2xs bg-white">
                {/* Editor Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-1 bg-[#f6f7f7] border-b border-slate-200 text-slate-600">
                  <button
                    type="button"
                    onClick={() => insertFormatting('b')}
                    className="p-1 hover:bg-slate-200 rounded"
                    title="Bold"
                  >
                    <Bold size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('i')}
                    className="p-1 hover:bg-slate-200 rounded"
                    title="Italic"
                  >
                    <Italic size={12} />
                  </button>
                  <div className="h-3 w-px bg-slate-300 mx-0.5" />
                  <button
                    type="button"
                    onClick={() => insertFormatting('left')}
                    className="p-1 hover:bg-slate-200 rounded"
                    title="Align Left"
                  >
                    <AlignLeft size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('center')}
                    className="p-1 hover:bg-slate-200 rounded"
                    title="Align Center"
                  >
                    <AlignCenter size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('right')}
                    className="p-1 hover:bg-slate-200 rounded"
                    title="Align Right"
                  >
                    <AlignRight size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('justify')}
                    className="p-1 hover:bg-slate-200 rounded"
                    title="Justify"
                  >
                    <AlignJustify size={12} />
                  </button>
                  <div className="h-3 w-px bg-slate-300 mx-0.5" />
                  <button
                    type="button"
                    onClick={() => insertFormatting('ul')}
                    className="p-1 hover:bg-slate-200 rounded"
                    title="Bullet List"
                  >
                    <ListIcon size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('ol')}
                    className="p-1 hover:bg-slate-200 rounded"
                    title="Numbered List"
                  >
                    <ListOrdered size={12} />
                  </button>
                </div>
                <textarea
                  ref={descTextareaRef}
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter category description..."
                  className="w-full p-2.5 bg-white text-xs text-slate-800 focus:outline-none resize-none font-sans"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                The description is not prominent by default; however, sometimes we may show it.
              </p>
            </div>

            {/* SEO Tags Section (Accordion) */}
            <div className="border border-slate-300 rounded overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setSeoOpen(!seoOpen)}
                className="w-full px-3 py-2 bg-[#f6f7f7] border-b border-slate-300 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <span>SEO Tags Section</span>
                <span>{seoOpen ? '—' : '+'}</span>
              </button>

              {seoOpen && (
                <div className="p-3 bg-white space-y-3">
                  {/* Allow Indexing */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700">Allow Indexing:</label>
                    <input
                      type="checkbox"
                      checked={allowIndexing}
                      onChange={(e) => setAllowIndexing(e.target.checked)}
                      className="rounded text-[#2271b1] focus:ring-[#2271b1]"
                    />
                  </div>

                  {/* Meta Title */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">Meta Title</label>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                    />
                  </div>

                  {/* Meta Keywords */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">Meta Keywords</label>
                    <input
                      type="text"
                      value={metaKeywords}
                      onChange={(e) => setMetaKeywords(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                    />
                  </div>

                  {/* Meta Description */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">Meta Description</label>
                    <textarea
                      rows={2}
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white rounded text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingId ? 'Update Category' : 'Add New Category'}</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: CATEGORIES TABLE & CONTROLS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-3">
          {/* Top Controls: Bulk Actions & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded border border-slate-300 shadow-2xs">
            {/* Left Bulk Actions (Hidden for Authors) */}
            {!isAuthor ? (
              <div className="flex items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#2271b1]"
                >
                  <option value="">Bulk Actions</option>
                  <option value="delete">Delete</option>
                </select>
                <button
                  type="button"
                  onClick={handleBulkAction}
                  disabled={bulkLoading || !bulkAction}
                  className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
                >
                  {bulkLoading ? 'Applying...' : 'Apply'}
                </button>
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                Read-Only (Author View)
              </div>
            )}

            {/* Right Search Input & Count */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
                {total.toLocaleString()} items
              </span>
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories..."
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#2271b1] w-36 sm:w-44 shadow-2xs"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-white hover:bg-blue-50 border border-[#2271b1] text-[#2271b1] rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  Search Posts
                </button>
              </form>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded border border-slate-300 shadow-2xs overflow-hidden min-h-[350px]">
            {loading ? (
              <div className="p-12">
                <AdminLoader text="Loading categories from database..." />
              </div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <FolderTree size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No categories found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {searchQuery ? 'Try clearing your search query.' : 'Create your first category.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-[#f6f7f7] text-slate-800 font-bold border-b border-slate-300 select-none">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === categories.length && categories.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded text-[#2271b1]"
                        />
                      </th>
                      <th className="p-2.5 w-12 text-center text-slate-500">#</th>
                      <th className="p-2.5 w-20 text-center">Image</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5 w-44">Slug</th>
                      <th className="p-2.5 w-56">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {categories.map((cat, idx) => {
                      const isSelected = selectedIds.has(cat._id);
                      const isQuickEditing = quickEditingId === cat._id;
                      const isDefaultUncategorized =
                        cat.slug === 'uncategorized' || cat.name.toLowerCase() === 'uncategorized';

                      if (isQuickEditing) {
                        return (
                          <tr key={cat._id} className="bg-blue-50/70 p-3 border-y border-blue-200">
                            <td colSpan={6} className="p-3 space-y-2.5">
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Quick Edit: {cat.name}
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                                    Name
                                  </label>
                                  <input
                                    type="text"
                                    value={quickName}
                                    onChange={(e) => setQuickName(e.target.value)}
                                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                                    Slug
                                  </label>
                                  <input
                                    type="text"
                                    value={quickSlug}
                                    onChange={(e) => setQuickSlug(e.target.value)}
                                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-[#2271b1]"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={cancelQuickEdit}
                                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs text-slate-700"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveQuickEdit(cat._id)}
                                  className="px-4 py-1 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-xs font-bold"
                                >
                                  Update
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={cat._id}
                          className={`group hover:bg-[#f6f7f7] transition-colors ${
                            isSelected ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(cat._id)}
                              className="rounded text-[#2271b1]"
                            />
                          </td>

                          {/* ID / sql_id */}
                          <td className="p-2.5 text-center text-slate-400 font-mono text-[11px]">
                            {cat.sql_id || idx + 1 + (page - 1) * 10}
                          </td>

                          {/* Thumbnail / No Image Badge */}
                          <td className="p-2.5 text-center">
                            {cat.featured_media ? (
                              <div className="w-10 h-8 rounded bg-slate-100 overflow-hidden mx-auto border border-slate-200">
                                <img
                                  src={getImageUrl(cat.featured_media)}
                                  alt={cat.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    if (!e.currentTarget.dataset.fallback) {
                                      e.currentTarget.dataset.fallback = 'true';
                                      e.currentTarget.src = '/logo.webp';
                                    } else {
                                      e.currentTarget.style.display = 'none';
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-7 rounded bg-slate-100 text-slate-400 text-[9px] font-medium border border-slate-200 flex items-center justify-center mx-auto">
                                No Image
                              </div>
                            )}
                          </td>

                          {/* Name + Action Links on Hover */}
                          <td className="p-2.5">
                            <div className="space-y-1">
                              <p
                                onClick={() => !isAuthor && startEdit(cat)}
                                className={`font-bold text-[#0073aa] ${!isAuthor ? 'hover:underline cursor-pointer' : ''}`}
                              >
                                {cat.name}
                              </p>

                              {/* Action links */}
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!isAuthor && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => startEdit(cat)}
                                      className="text-[#0073aa] hover:underline cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    <span>|</span>
                                    <button
                                      type="button"
                                      onClick={() => startQuickEdit(cat)}
                                      className="text-[#0073aa] hover:underline cursor-pointer"
                                    >
                                      Quick Edit
                                    </button>
                                    {!isDefaultUncategorized && (
                                      <>
                                        <span>|</span>
                                        <button
                                          type="button"
                                          onClick={() => openDeleteModal(cat)}
                                          className="text-rose-600 hover:underline cursor-pointer"
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )}
                                    <span>|</span>
                                  </>
                                )}
                                <Link
                                  href={`/category/${cat.slug}`}
                                  target="_blank"
                                  className="text-[#0073aa] hover:underline"
                                >
                                  View
                                </Link>
                              </div>
                            </div>
                          </td>

                          {/* Slug */}
                          <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                            {cat.slug || '—'}
                          </td>

                          {/* Description */}
                          <td className="p-2.5 text-slate-500 max-w-xs truncate">
                            {cat.description ? (
                              <span
                                title={cat.description.replace(/<[^>]+>/g, '')}
                                className="text-slate-600 truncate block"
                              >
                                {cat.description.replace(/<[^>]+>/g, '')}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom Pagination & Help Notice matching Screenshot */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                Showing {Math.min((page - 1) * 10 + 1, total)} to{' '}
                {Math.min(page * 10, total)} of {total.toLocaleString()} results
              </span>

              {/* Numbered Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .map((p, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && p - prevPage > 1;

                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <span className="px-1 text-slate-400">..</span>}
                          <button
                            type="button"
                            onClick={() => setPage(p)}
                            className={`min-w-[28px] px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                              page === p
                                ? 'bg-[#2271b1] text-white'
                                : 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Help Notice */}
            <p className="text-[11px] text-slate-400 leading-normal">
              Deleting a category does not delete the posts in that category. Instead, posts that were only assigned to the deleted category are set to the default category Uncategorised. The default category cannot be deleted.
            </p>
          </div>
        </div>
      </div>

      {/* Media Library Modal Integration */}
      <MediaLibraryModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        targetType="featured"
        onSelect={(media) => {
          setFeaturedMedia(media);
          setShowMediaModal(false);
        }}
      />

      {/* Reusable Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        isLoading={deleteModal.isLoading}
        itemName={deleteModal.cat ? deleteModal.cat.name : deleteModal.isBulk ? `${selectedIds.size} categories` : ''}
        type="danger"
        title={deleteModal.isBulk ? 'Permanently Delete Selected Categories?' : 'Delete Category?'}
        description={
          deleteModal.isBulk
            ? `Are you sure you want to permanently delete the ${selectedIds.size} selected categories? Posts assigned to them will be moved to Uncategorized.`
            : `Are you sure you want to delete category "${deleteModal.cat?.name}"? Posts assigned to this category will be moved to Uncategorized.`
        }
        confirmText="Delete Category"
        onConfirm={handleConfirmDelete}
        onClose={() =>
          setDeleteModal({ isOpen: false, cat: null, isBulk: false, isLoading: false })
        }
      />
    </div>
  );
}
