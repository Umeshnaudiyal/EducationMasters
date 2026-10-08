'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Info,
  ArrowLeft,
} from 'lucide-react';
import MediaLibraryModal from './MediaLibraryModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import JoditEditorWrapper from './JoditEditorWrapper';
import { getImageUrl } from '@/utils/image';
import { getAuthToken } from '@/utils/auth';
import { cleanHtmlContent, stripHtmlToPlainText } from '@/utils/cleanHtml';

function TaxonomyThumbnail({ src, alt, size = 14, className = 'w-9 h-9' }) {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = src ? getImageUrl(src, null) : null;

  useEffect(() => {
    setHasError(false);
  }, [src]);

  return (
    <div className={`${className} mx-auto rounded border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs`}>
      {resolvedUrl && !hasError ? (
        <img
          src={resolvedUrl}
          alt={alt || 'Thumbnail'}
          className="w-full h-full object-contain p-0.5"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <ImageIcon size={size} className="text-slate-300" />
      )}
    </div>
  );
}

export default function TaxonomyManager({
  title = 'Items',
  singularTitle = 'Item',
  apiEndpoint = '/api/v1/exams',
  columns = [],
  customFields = null, // Render function for extra fields (e.g. subject dropdown, state data)
  initialFormData = {},
  validateForm = null,
  showSeo = true,
  stateDataModalRenderer = null,
}) {
  const { data: session } = useSession();

  // Helper to reliably get valid JWT token
  const getActiveToken = useCallback(() => {
    return getAuthToken(session);
  }, [session]);

  // Data state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Selection & bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: '',
    description: '',
    seo: {
      allow_indexing: true,
      meta_title: '',
      meta_keywords: '',
      meta_description: '',
    },
    ...initialFormData,
  });

  // UI state
  const [formErrors, setFormErrors] = useState({});
  const [serverMessage, setServerMessage] = useState(null); // { type: 'error' | 'success', text: '' }
  const [saving, setSaving] = useState(false);
  const [isSeoOpen, setIsSeoOpen] = useState(true);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Auto-slug generation helper
  const slugify = (text) => {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Fetch Items
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: activeSearch,
      });

      const token = getActiveToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${apiEndpoint}?${query}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'x-bypass-cache': '1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();

      if (data.success) {
        setItems(data.data || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } else {
        setServerMessage({ type: 'error', text: data.message || 'Failed to load items' });
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setServerMessage({ type: 'error', text: 'Error connecting to server. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, page, limit, activeSearch, getActiveToken]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle form change
  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && !editingId && (!prev.slug || prev.slug === slugify(prev.name))) {
        updated.slug = slugify(value);
      }
      return updated;
    });

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (serverMessage?.type === 'error') {
      setServerMessage(null);
    }
  };

  const handleSeoChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [field]: value,
      },
    }));
  };

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      slug: '',
      image: '',
      description: '',
      seo: {
        allow_indexing: true,
        meta_title: '',
        meta_keywords: '',
        meta_description: '',
      },
      ...initialFormData,
    });
    setFormErrors({});
    setServerMessage(null);
  };

  // Edit item
  const handleEdit = (item) => {
    setEditingId(item._id);
    const rawMetaDesc = item.seo?.meta_description || item.meta_description || '';
    const rawMetaTitle = item.seo?.meta_title || item.meta_title || '';
    const rawMetaKeywords = item.seo?.meta_keywords || item.meta_keywords || '';
    const cleanDesc = cleanHtmlContent(item.description || '');

    setFormData({
      ...item,
      name: item.name || '',
      slug: item.slug || '',
      image: item.image || item.featured_media || '',
      description: cleanDesc,
      seo: {
        allow_indexing: item.seo?.allow_indexing ?? item.allow_indexing ?? true,
        meta_title: stripHtmlToPlainText(rawMetaTitle),
        meta_keywords: stripHtmlToPlainText(rawMetaKeywords),
        meta_description: stripHtmlToPlainText(rawMetaDesc),
      },
    });
    setFormErrors({});
    setServerMessage(null);
    setIsSeoOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit form
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setServerMessage(null);

    // Client-side validation
    const errors = {};
    if (!formData.name?.trim()) {
      errors.name = `${singularTitle} name is required`;
    }
    if (!formData.slug?.trim()) {
      errors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug.trim())) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (validateForm) {
      const customValidation = validateForm(formData);
      Object.assign(errors, customValidation);
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setServerMessage({
        type: 'error',
        text: 'Please review and fix the errors highlighted below.',
      });
      return;
    }

    // Sanitize payload to strip any HTML from SEO fields and clean description
    const payload = {
      ...formData,
      description: cleanHtmlContent(formData.description || ''),
      seo: {
        allow_indexing: formData.seo?.allow_indexing ?? true,
        meta_title: stripHtmlToPlainText(formData.seo?.meta_title || ''),
        meta_keywords: stripHtmlToPlainText(formData.seo?.meta_keywords || ''),
        meta_description: stripHtmlToPlainText(formData.seo?.meta_description || ''),
      },
    };
    if (formData.meta_description) {
      payload.meta_description = stripHtmlToPlainText(formData.meta_description);
    }
    if (formData.meta_title) {
      payload.meta_title = stripHtmlToPlainText(formData.meta_title);
    }

    try {
      setSaving(true);
      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${apiEndpoint}/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${apiEndpoint}`;

      const method = editingId ? 'PUT' : 'POST';
      const token = getActiveToken();

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setServerMessage({
          type: 'success',
          text: editingId
            ? `${singularTitle} updated successfully.`
            : `${singularTitle} created successfully.`,
        });
        resetForm();
        fetchItems();
      } else {
        if (data.errors) {
          setFormErrors(data.errors);
        }
        setServerMessage({
          type: 'error',
          text: data.message || `Failed to save ${singularTitle.toLowerCase()}. Please check the fields.`,
        });
      }
    } catch (err) {
      console.error('Save error:', err);
      setServerMessage({
        type: 'error',
        text: 'Network error occurred while saving. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Single delete trigger
  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  // Perform single delete
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      const token = getActiveToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${apiEndpoint}/${itemToDelete._id}`,
        {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setServerMessage({ type: 'success', text: `${singularTitle} deleted successfully.` });
        if (editingId === itemToDelete._id) resetForm();
        fetchItems();
      } else {
        setServerMessage({ type: 'error', text: data.message || 'Failed to delete item.' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      setServerMessage({ type: 'error', text: 'Error connecting to server while deleting.' });
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // Selection handlers
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(items.map((i) => i._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk action
  const handleBulkAction = async () => {
    if (!bulkAction) return;
    if (selectedIds.length === 0) {
      setServerMessage({ type: 'error', text: 'Please select items to perform bulk action.' });
      return;
    }

    if (bulkAction === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected items?`)) {
        return;
      }

      try {
        setBulkLoading(true);
        const token = getActiveToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${apiEndpoint}/bulk-action`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ action: 'delete', ids: selectedIds }),
          }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setServerMessage({ type: 'success', text: `Successfully deleted ${selectedIds.length} items.` });
          setSelectedIds([]);
          setBulkAction('');
          fetchItems();
        } else {
          setServerMessage({ type: 'error', text: data.message || 'Bulk delete failed.' });
        }
      } catch (err) {
        console.error('Bulk delete error:', err);
        setServerMessage({ type: 'error', text: 'Server error during bulk action.' });
      } finally {
        setBulkLoading(false);
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm.trim());
    setPage(1);
  };

  if (editingId) {
    return (
      <div className="space-y-5 w-full font-sans text-slate-800 pb-16 animate-in fade-in-50 duration-200">
        {/* Toast Alert Notification */}
        {serverMessage && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border animate-in slide-in-from-top-2 ${
              serverMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {serverMessage.type === 'error' ? (
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            )}
            <span>{serverMessage.text}</span>
            <button
              type="button"
              onClick={() => setServerMessage(null)}
              className="text-slate-400 hover:text-slate-700 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header with Back Button & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:px-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-[#2271b1] border border-slate-200 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs group"
              title={`Back to ${title} list`}
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200 text-slate-500 group-hover:text-[#2271b1]" />
              <span>Back to {title}</span>
            </button>

            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Edit {singularTitle}</span>
              </h1>
              {formData.slug && (
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  /{formData.slug}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2 bg-[#2271b1] hover:bg-[#135e96] active:bg-[#0a4b78] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-2"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              <span>Update {singularTitle}</span>
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
          {/* Row 1: Featured Image */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 pt-1">
            <label className="w-36 sm:w-44 text-xs sm:text-sm font-semibold text-slate-800 pt-1 shrink-0">
              Featured Image
            </label>
            <div className="flex-1 min-w-0 max-w-4xl space-y-3">
              {formData.image ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleChange('image', '')}
                      className="px-3 py-1.5 bg-white hover:bg-rose-50 text-[#0073aa] hover:text-rose-600 border border-[#2271b1]/40 hover:border-rose-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      Remove Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaModalOpen(true)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#2271b1] border border-slate-300 hover:border-[#2271b1] rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ImageIcon size={13} />
                      <span>Replace Image</span>
                    </button>
                  </div>

                  <div
                    className="w-full max-w-xl rounded-xl border border-slate-200 overflow-hidden shadow-xs bg-slate-50/70 cursor-pointer group relative"
                    onClick={() => setMediaModalOpen(true)}
                    title="Click to change image"
                  >
                    <img
                      src={getImageUrl(formData.image, null)}
                      alt={formData.name || 'Featured image'}
                      className="w-full h-auto max-h-[380px] object-contain mx-auto group-hover:scale-[1.01] transition-transform duration-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center pointer-events-none">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5">
                        <ImageIcon size={13} />
                        <span>Click to change image</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setMediaModalOpen(true)}
                    className="px-4 py-2 bg-white hover:bg-blue-50 text-[#2271b1] border border-blue-200 hover:border-[#2271b1] rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-2"
                  >
                    <ImageIcon size={15} />
                    <span>Choose Featured Image</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Name */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <label className="w-36 sm:w-44 text-xs sm:text-sm font-semibold text-slate-800 pt-2 shrink-0">
              Name <span className="text-rose-500">*</span>
            </label>
            <div className="flex-1 min-w-0 max-w-4xl space-y-1">
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={`Enter ${singularTitle.toLowerCase()} name`}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-lg text-slate-800 focus:outline-none transition-all ${
                  formErrors.name
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                    : 'border-slate-300 focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/15'
                }`}
              />
              {formErrors.name ? (
                <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{formErrors.name}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  The name is how it appears on your site.
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Slug */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <label className="w-36 sm:w-44 text-xs sm:text-sm font-semibold text-slate-800 pt-2 shrink-0">
              Slug <span className="text-rose-500">*</span>
            </label>
            <div className="flex-1 min-w-0 max-w-4xl space-y-1">
              <input
                type="text"
                value={formData.slug || ''}
                onChange={(e) => handleChange('slug', slugify(e.target.value))}
                placeholder={`e.g. ${formData.name ? slugify(formData.name) : 'slug-name'}`}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-lg text-slate-800 font-mono focus:outline-none transition-all ${
                  formErrors.slug
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                    : 'border-slate-300 focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/15'
                }`}
              />
              {formErrors.slug ? (
                <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{formErrors.slug}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  The &quot;slug&quot; is the URL-friendly version of the name. It is usually all lower case and contains only letters, numbers, and hyphens.
                </p>
              )}
            </div>
          </div>

          {/* Optional Custom Fields (for Topics/Topic Groups) */}
          {customFields && (
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <label className="w-36 sm:w-44 text-xs sm:text-sm font-semibold text-slate-800 pt-2 shrink-0">
                Category / Subject
              </label>
              <div className="flex-1 min-w-0 max-w-4xl">
                {customFields({ formData, setFormData, formErrors, setFormErrors, handleChange })}
              </div>
            </div>
          )}

          {/* Row 4: Description (Rich Text Editor) */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <label className="w-36 sm:w-44 text-xs sm:text-sm font-semibold text-slate-800 pt-2 shrink-0">
              Description
            </label>
            <div className="flex-1 min-w-0 max-w-4xl space-y-1.5">
              <JoditEditorWrapper
                value={formData.description || ''}
                onChange={(content) => handleChange('description', content)}
                height={300}
                placeholder={`Enter ${singularTitle.toLowerCase()} description...`}
              />
              <p className="text-[11px] text-slate-400">
                The description is not prominent by default; however, sometimes we may show it.
              </p>
            </div>
          </div>

          {/* Row 5: SEO Data */}
          {showSeo && (
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <label className="w-36 sm:w-44 text-xs sm:text-sm font-semibold text-slate-800 pt-2 shrink-0">
                SEO Data
              </label>
              <div className="flex-1 min-w-0 max-w-4xl border border-slate-300/90 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div
                  onClick={() => setIsSeoOpen(!isSeoOpen)}
                  className="px-4 py-2.5 bg-[#f8fafc] hover:bg-slate-100/80 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none transition-colors"
                >
                  <span className="text-xs font-bold text-slate-800">SEO Tags Section</span>
                  <span className="text-slate-500 hover:text-slate-800 text-base font-bold px-1">
                    {isSeoOpen ? '−' : '+'}
                  </span>
                </div>

                {isSeoOpen && (
                  <div className="p-4 sm:p-5 space-y-4 bg-white">
                    {/* Allow Indexing */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="edit_allow_indexing"
                        checked={formData.seo?.allow_indexing ?? true}
                        onChange={(e) => handleSeoChange('allow_indexing', e.target.checked)}
                        className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1] w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="edit_allow_indexing" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Allow Indexing:
                      </label>
                    </div>

                    {/* Meta Title */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.seo?.meta_title || ''}
                        onChange={(e) => handleSeoChange('meta_title', e.target.value)}
                        placeholder="Meta title for search engines"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                      />
                    </div>

                    {/* Meta Keywords */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Meta Keywords
                      </label>
                      <input
                        type="text"
                        value={formData.seo?.meta_keywords || ''}
                        onChange={(e) => handleSeoChange('meta_keywords', e.target.value)}
                        placeholder="keyword1, keyword2, tag3"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                      />
                    </div>

                    {/* Meta Description */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Meta Description
                      </label>
                      <textarea
                        rows={3}
                        value={formData.seo?.meta_description || ''}
                        onChange={(e) => handleSeoChange('meta_description', e.target.value)}
                        placeholder="Meta description snippet for search engines"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] resize-y"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Row 6: Actions */}
          <div className="flex items-center gap-3 pt-4 sm:pl-44 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#2271b1] hover:bg-[#135e96] active:bg-[#0a4b78] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              <span>Update {singularTitle}</span>
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Media Library Modal */}
        <MediaLibraryModal
          isOpen={mediaModalOpen}
          onClose={() => setMediaModalOpen(false)}
          onSelect={(media) => {
            const selectedUrl =
              media.url ||
              (media.path && media.name ? `${media.path}/${media.name}` : '') ||
              media.file ||
              getImageUrl(media, '');
            handleChange('image', selectedUrl);
            setMediaModalOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full select-none font-sans text-slate-800">
      {/* Toast Alert Notification */}
      {serverMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded shadow-xl text-xs font-semibold flex items-center gap-2 border animate-in slide-in-from-top-2 ${
            serverMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {serverMessage.type === 'error' ? (
            <AlertCircle size={14} className="text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          )}
          <span>{serverMessage.text}</span>
          <button
            type="button"
            onClick={() => setServerMessage(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header: Title + Right-aligned Search Form (Matching Blogs) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-normal text-slate-900 tracking-tight">{title}</h1>
        </div>

        {/* Top Right Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 self-end sm:self-auto">
          <input
            type="text"
            placeholder=""
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] w-44 sm:w-56"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-normal transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
          >
            Search {title}
          </button>
        </form>
      </div>

      {/* 2-Column Split Layout (Matching Classic WordPress / Blogs Density) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start pt-0.5">
        {/* Left Column: Form (4 Cols) */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-0.5">
            <h2 className="text-sm font-semibold text-slate-900">
              {editingId ? `Edit ${singularTitle}` : `Add New ${singularTitle}`}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] font-medium text-[#2271b1] hover:underline cursor-pointer"
              >
                + Add New Instead
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Custom fields slot (e.g. Subject selector for Topics) */}
            {customFields && customFields({ formData, setFormData, formErrors, setFormErrors, handleChange })}

            {/* Name Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={`e.g. ${singularTitle} Title`}
                className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded text-slate-800 focus:outline-none transition-colors ${
                  formErrors.name
                    ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-50/20'
                    : 'border-slate-300 focus:border-[#2271b1]'
                }`}
              />
              {formErrors.name ? (
                <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{formErrors.name}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The name is how it appears on your site.
                </p>
              )}
            </div>

            {/* Slug Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Slug <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.slug || ''}
                onChange={(e) => handleChange('slug', slugify(e.target.value))}
                placeholder={`e.g. ${singularTitle.toLowerCase()}-slug`}
                className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded text-slate-800 focus:outline-none transition-colors font-mono ${
                  formErrors.slug
                    ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-50/20'
                    : 'border-slate-300 focus:border-[#2271b1]'
                }`}
              />
              {formErrors.slug ? (
                <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{formErrors.slug}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The "slug" is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens.
                </p>
              )}
            </div>

            {/* Featured Image */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Featured Image
              </label>
              <div className="flex items-center gap-2.5">
                <TaxonomyThumbnail
                  src={formData.image}
                  alt="Preview"
                  size={20}
                  className="w-14 h-14 rounded"
                />

                <div className="space-y-1 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMediaModalOpen(true)}
                    className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] border border-[#2271b1] rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <ImageIcon size={12} />
                    <span>{formData.image ? 'Change Image' : 'Choose Image'}</span>
                  </button>
                  {formData.image && (
                    <button
                      type="button"
                      onClick={() => handleChange('image', '')}
                      className="text-[11px] text-rose-600 hover:underline block cursor-pointer"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Write a brief overview..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-[#2271b1] resize-y"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">
                The description is not prominent by default; however, some themes may show it.
              </p>
            </div>

            {/* SEO Tag Accordion */}
            {showSeo && (
              <div className="border border-slate-300 rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsSeoOpen(!isSeoOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-[#f6f7f7] hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span>SEO Tag</span>
                    <span className="text-[10px] font-normal text-slate-500">(Meta & Indexing)</span>
                  </span>
                  {isSeoOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {isSeoOpen && (
                  <div className="p-3 space-y-2.5 bg-white border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Allow search engines to show this in search results?
                      </label>
                      <select
                        value={formData.seo?.allow_indexing ? 'yes' : 'no'}
                        onChange={(e) => handleSeoChange('allow_indexing', e.target.value === 'yes')}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-700 focus:outline-none focus:border-[#2271b1]"
                      >
                        <option value="yes">Yes (Recommended)</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        SEO Title
                      </label>
                      <input
                        type="text"
                        value={formData.seo?.meta_title || ''}
                        onChange={(e) => handleSeoChange('meta_title', e.target.value)}
                        placeholder="Meta title for search engines"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-700 focus:outline-none focus:border-[#2271b1]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        SEO Keywords
                      </label>
                      <input
                        type="text"
                        value={formData.seo?.meta_keywords || ''}
                        onChange={(e) => handleSeoChange('meta_keywords', e.target.value)}
                        placeholder="keyword1, keyword2, tag3"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-700 focus:outline-none focus:border-[#2271b1]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        SEO Description
                      </label>
                      <textarea
                        rows={2}
                        value={formData.seo?.meta_description || ''}
                        onChange={(e) => handleSeoChange('meta_description', e.target.value)}
                        placeholder="Meta description snippet for search engines"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-700 focus:outline-none focus:border-[#2271b1] resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-3.5 py-1.5 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white rounded text-xs font-medium transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {saving && <Loader2 size={12} className="animate-spin" />}
                <span>{editingId ? `Update ${singularTitle}` : `Add New ${singularTitle}`}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Data Table (8 Cols) */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-2">
          {/* Table Container matching Blogs */}
          <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
            {/* Table Header Toolbar: Bulk Actions + Showing Count */}
            <div className="p-2 bg-[#f6f7f7] border-b border-slate-300 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-700 font-normal focus:outline-none focus:border-[#2271b1]"
                >
                  <option value="">Bulk Actions</option>
                  <option value="delete">Delete</option>
                </select>
                <button
                  type="button"
                  onClick={handleBulkAction}
                  disabled={bulkLoading || selectedIds.length === 0}
                  className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-300 rounded text-xs font-normal transition-colors cursor-pointer shadow-2xs"
                >
                  {bulkLoading && <Loader2 size={11} className="animate-spin mr-1 inline" />}
                  <span>Apply</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={fetchItems}
                  title="Refresh Table"
                  className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                </button>
                <span>
                  Showing {items.length > 0 ? (page - 1) * limit + 1 : 0}-
                  {Math.min(page * limit, total)} of {total}
                </span>
              </div>
            </div>

            {/* Mobile View: Touch-Friendly Clean Cards */}
            <div className="block md:hidden divide-y divide-slate-200">
              {loading ? (
                <div className="py-8 px-3 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={15} className="animate-spin text-[#2271b1]" />
                    <span>Loading {title.toLowerCase()}...</span>
                  </div>
                </div>
              ) : items.length === 0 ? (
                <div className="py-8 px-3 text-center text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-600">No {title.toLowerCase()} found</p>
                  <p className="text-[11px] text-slate-400">
                    {activeSearch ? 'Try a different search query' : `Add your first ${singularTitle.toLowerCase()} using the form`}
                  </p>
                </div>
              ) : (
                items.map((item) => {
                  const isSelected = selectedIds.includes(item._id);
                  const isEditing = editingId === item._id;

                  return (
                    <div
                      key={item._id}
                      className={`p-3 space-y-2 bg-white text-xs ${
                        isEditing ? 'bg-blue-50/50' : isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item._id)}
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1] mt-1 shrink-0"
                        />
                        <TaxonomyThumbnail
                          src={item.image}
                          alt={item.name}
                          size={16}
                          className="w-12 h-12 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-bold text-[#0073aa] hover:underline cursor-pointer text-xs leading-snug"
                            onClick={() => handleEdit(item)}
                          >
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                            Slug: {item.slug}
                          </div>
                          {!columns.some((col) => (col.header || '').toLowerCase() === 'description') && item.description && (
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                              {stripHtmlToPlainText(item.description)}
                            </p>
                          )}
                          {columns.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-600">
                              {columns.map((col, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <span className="font-semibold text-slate-500">{col.header}:</span>
                                  <span>{col.render ? col.render(item) : item[col.accessor]}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom action buttons */}
                      <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          title={`Edit ${singularTitle}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                        >
                          <Edit2 size={11} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(item)}
                          title={`Delete ${singularTitle}`}
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs transition-colors shadow-2xs cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table: 100% Exact Desktop Layout (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-[#f6f7f7] border-b border-slate-300 text-xs font-semibold text-slate-800">
                  <tr>
                    <th className="py-2 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        onChange={toggleSelectAll}
                        checked={items.length > 0 && selectedIds.length === items.length}
                        className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                      />
                    </th>
                    <th className="py-2 px-3 w-14 text-center">Image</th>
                    <th className="py-2 px-3">Name</th>
                    {columns.map((col, idx) => (
                      <th key={idx} className={`py-2 px-3 ${col.className || ''}`}>
                        {col.header}
                      </th>
                    ))}
                    <th className="py-2 px-3">Slug</th>
                    <th className="py-2 px-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5 + columns.length} className="py-8 px-3 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 size={15} className="animate-spin text-[#2271b1]" />
                          <span>Loading {title.toLowerCase()}...</span>
                        </div>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={5 + columns.length} className="py-8 px-3 text-center text-slate-400">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-600">No {title.toLowerCase()} found</p>
                          <p className="text-[11px] text-slate-400">
                            {activeSearch ? 'Try a different search query' : `Add your first ${singularTitle.toLowerCase()} using the form`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const isSelected = selectedIds.includes(item._id);
                      const isEditing = editingId === item._id;

                      return (
                        <tr
                          key={item._id}
                          className={`hover:bg-[#f6f7f7] transition-colors ${
                            isEditing
                              ? 'bg-blue-50/50'
                              : isSelected
                              ? 'bg-amber-50/40'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(item._id)}
                              className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                            />
                          </td>

                          <td className="py-2 px-3 text-center align-middle">
                            <TaxonomyThumbnail
                              src={item.image}
                              alt={item.name}
                              size={14}
                              className="w-9 h-9"
                            />
                          </td>

                          <td className="py-2 px-3 align-middle">
                            <div className="font-semibold text-slate-900 hover:text-[#2271b1] cursor-pointer" onClick={() => handleEdit(item)}>
                              {item.name}
                            </div>
                            {!columns.some((col) => (col.header || '').toLowerCase() === 'description') && item.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 max-w-xs">
                                {stripHtmlToPlainText(item.description)}
                              </p>
                            )}
                          </td>

                          {/* Dynamic custom columns */}
                          {columns.map((col, idx) => (
                            <td key={idx} className={`py-2 px-3 align-middle ${col.className || ''}`}>
                              {col.render ? col.render(item) : item[col.accessor]}
                            </td>
                          ))}

                          <td className="py-2 px-3 align-middle font-mono text-[11px] text-slate-500">
                            {item.slug}
                          </td>

                          <td className="py-2 px-3 align-middle text-right pr-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                title={`Edit ${singularTitle}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-[11px] font-normal transition-colors shadow-2xs cursor-pointer"
                              >
                                <Edit2 size={11} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmDelete(item)}
                                title={`Delete ${singularTitle}`}
                                className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] transition-colors shadow-2xs cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer matching Blogs */}
            <div className="p-2.5 bg-[#f6f7f7] border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
              <div>
                Showing page <strong className="text-slate-800">{page}</strong> of{' '}
                <strong className="text-slate-800">{pages}</strong> ({total.toLocaleString()} total {title.toLowerCase()})
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded border border-slate-300 transition-colors text-slate-700 shadow-2xs cursor-pointer"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="px-2 font-semibold text-slate-700 text-xs">{page}</span>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="p-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded border border-slate-300 transition-colors text-slate-700 shadow-2xs cursor-pointer"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={(media) => {
          const selectedUrl = media.url || (media.path && media.name ? `${media.path}/${media.name}` : '') || media.file || getImageUrl(media, '');
          handleChange('image', selectedUrl);
          setMediaModalOpen(false);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title={`Delete ${singularTitle}?`}
        itemName={itemToDelete?.name}
        description={`Are you sure you want to permanently delete this ${singularTitle.toLowerCase()}? This action cannot be undone.`}
        confirmText="Yes, Delete"
      />

      {/* Optional State Data Modal */}
      {stateDataModalRenderer && stateDataModalRenderer()}
    </div>
  );
}
