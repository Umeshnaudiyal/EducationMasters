'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  X,
  ChevronDown,
  ChevronUp,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import AdminLoader from '@/components/admin/AdminLoader';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

const slugify = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function DepartmentsManagementPage() {
  const { data: session } = useSession();
  const isAuthor = session?.user?.role?.toLowerCase() === 'author' || session?.user?.role?.toLowerCase() === 'writer';

  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form State
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    media_id: 0,
    seo: {
      allow_indexing: true,
      meta_title: '',
      meta_keywords: '',
      meta_description: '',
    },
  });

  const [saving, setSaving] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showSeoSection, setShowSeoSection] = useState(true);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    title: '',
    isBulk: false,
    isLoading: false,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search.trim(),
      });

      const res = await fetch(`${BACKEND_URL}/apis/v1/departments?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success) {
        setDepartments(data.data || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      showToast('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDepartments();
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: editingDept ? prev.slug : slugify(val),
    }));
  };

  const handleMediaSelect = (mediaItem) => {
    if (mediaItem) {
      let selectedPath = '';
      if (typeof mediaItem === 'string') {
        selectedPath = mediaItem;
      } else if (mediaItem.file) {
        selectedPath = mediaItem.file;
      } else if (mediaItem.path && mediaItem.name) {
        const cleanPath = mediaItem.path.endsWith('/') ? mediaItem.path.slice(0, -1) : mediaItem.path;
        selectedPath = `${cleanPath}/${mediaItem.name}`;
      } else if (mediaItem.url) {
        selectedPath = mediaItem.url;
      } else {
        selectedPath = getImageUrl(mediaItem);
      }

      setFormData((prev) => ({
        ...prev,
        image: selectedPath,
        media_id: mediaItem.sql_id || 0,
      }));
    }
    setShowMediaModal(false);
  };

  const resetForm = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      media_id: 0,
      seo: {
        allow_indexing: true,
        meta_title: '',
        meta_keywords: '',
        meta_description: '',
      },
    });
  };

  const startEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name || '',
      slug: dept.slug || '',
      description: dept.description || '',
      image: dept.image || '',
      media_id: dept.media_id || 0,
      seo: {
        allow_indexing: dept.seo?.allow_indexing !== undefined ? dept.seo.allow_indexing : true,
        meta_title: dept.seo?.meta_title || '',
        meta_keywords: dept.seo?.meta_keywords || '',
        meta_description: dept.seo?.meta_description || '',
      },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Please enter a department name', 'error');
      return;
    }

    try {
      setSaving(true);
      const url = editingDept
        ? `${BACKEND_URL}/apis/v1/departments/${editingDept._id}`
        : `${BACKEND_URL}/apis/v1/departments`;
      const method = editingDept ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim() || slugify(formData.name),
          description: formData.description || null,
          image: formData.image || null,
          media_id: formData.media_id || 0,
          seo: formData.seo,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          editingDept
            ? 'Department updated successfully!'
            : 'Department created successfully!'
        );
        resetForm();
        fetchDepartments();
      } else {
        showToast(data.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error('Error saving department:', err);
      showToast('An unexpected error occurred', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (id, name) => {
    setDeleteModal({
      isOpen: true,
      id,
      title: name,
      isBulk: false,
      isLoading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      if (deleteModal.isBulk) {
        const res = await fetch(`${BACKEND_URL}/apis/v1/departments/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', ids: selectedIds }),
        });

        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Departments deleted successfully');
          setSelectedIds([]);
          setBulkAction('');
          fetchDepartments();
        } else {
          showToast(data.message || 'Bulk delete failed', 'error');
        }
      } else if (deleteModal.id) {
        const res = await fetch(`${BACKEND_URL}/apis/v1/departments/${deleteModal.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();

        if (data.success) {
          showToast('Department deleted successfully');
          if (editingDept && editingDept._id === deleteModal.id) resetForm();
          fetchDepartments();
        } else {
          showToast(data.message || 'Delete failed', 'error');
        }
      }
      setDeleteModal({ isOpen: false, id: null, title: '', isBulk: false, isLoading: false });
    } catch (err) {
      console.error('Error deleting department:', err);
      showToast('Error deleting department', 'error');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(departments.map((d) => d._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkApply = async () => {
    if (!bulkAction) {
      showToast('Please select a bulk action', 'error');
      return;
    }
    if (selectedIds.length === 0) {
      showToast('No departments selected', 'error');
      return;
    }

    if (bulkAction === 'delete') {
      setDeleteModal({
        isOpen: true,
        id: null,
        title: `${selectedIds.length} selected department(s)`,
        isBulk: true,
        isLoading: false,
      });
    }
  };

  const previewUrl = formData.image ? getImageUrl(formData.image) : null;

  return (
    <div className="w-full space-y-4 font-sans select-none text-slate-800 pb-16">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-12 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded shadow-lg text-xs font-semibold transition-all ${
            toast.type === 'error'
              ? 'bg-red-600 text-white shadow-red-500/20'
              : 'bg-slate-800 text-white shadow-slate-900/20'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} className="text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Departments</h1>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Search Departments"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 sm:w-56 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#f0f0f1] hover:bg-[#dcdcde] text-[#2c3338] text-xs font-semibold rounded border border-[#8c8f94] transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
          >
            Search Exams
          </button>
        </form>
      </div>

      {/* Two-Column WordPress Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Add / Edit Form */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900">
              {editingDept ? 'Edit Department' : 'Add New Department'}
            </h2>
            {editingDept && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] text-[#2271b1] hover:underline"
              >
                + Add New
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Featured Image Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">
                Featured Image
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(true)}
                  className="px-3 py-1.5 text-xs font-medium text-[#2271b1] border border-[#2271b1] rounded hover:bg-[#2271b1] hover:text-white transition-colors flex items-center gap-1 bg-white cursor-pointer shadow-2xs"
                >
                  <ImageIcon size={13} />
                  <span>{formData.image ? 'Change Image' : 'Add Image'}</span>
                </button>

                {formData.image && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, image: '', media_id: 0 }))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              {previewUrl && (
                <div className="mt-2 w-24 h-16 rounded border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Name Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g. Railway"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              />
              <p className="text-[10.5px] text-slate-400">
                The name is how it appears on your site.
              </p>
            </div>

            {/* Slug Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                }
                placeholder="e.g. railway"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              />
              <p className="text-[10.5px] text-slate-400">
                The &quot;slug&quot; is the URL-friendly version of the name. It is usually all lower case and contains only letters, numbers, and hyphens.
              </p>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief summary or description..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] resize-y"
              />
              <p className="text-[10.5px] text-slate-400">
                The description is not prominent by default; however, sometimes we may show it.
              </p>
            </div>

            {/* Collapsible SEO Tags Section (Matching Screenshot) */}
            <div className="border border-slate-200 rounded overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSeoSection(!showSeoSection)}
                className="w-full px-3 py-2 bg-[#f6f7f7] hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 transition-colors"
              >
                <span>SEO Tags Section</span>
                {showSeoSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showSeoSection && (
                <div className="p-3 bg-white space-y-3">
                  {/* Allow Indexing */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allow_indexing"
                      checked={formData.seo.allow_indexing}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seo: { ...prev.seo, allow_indexing: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <label htmlFor="allow_indexing" className="text-xs font-semibold text-slate-700 cursor-pointer">
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
                      value={formData.seo.meta_title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seo: { ...prev.seo, meta_title: e.target.value },
                        }))
                      }
                      placeholder="Custom SEO meta title"
                      className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                    />
                  </div>

                  {/* Meta Keywords */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      value={formData.seo.meta_keywords}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seo: { ...prev.seo, meta_keywords: e.target.value },
                        }))
                      }
                      placeholder="e.g. railway recruitment, rrb jobs"
                      className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                    />
                  </div>

                  {/* Meta Description */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Meta Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.seo.meta_description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seo: { ...prev.seo, meta_description: e.target.value },
                        }))
                      }
                      placeholder="Brief SEO meta summary..."
                      className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white text-xs font-semibold rounded shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingDept ? 'Update Department' : 'Add New Department'}</span>
                )}
              </button>

              {editingDept && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 bg-[#f0f0f1] hover:bg-[#dcdcde] text-[#2c3338] text-xs font-semibold rounded border border-[#8c8f94] transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Departments Table */}
        <div className="lg:col-span-8 space-y-3">
          {/* Top Filter & Bulk Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {!isAuthor ? (
              <div className="flex items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-[#2271b1]"
                >
                  <option value="">Bulk Actions</option>
                  <option value="delete">Delete</option>
                </select>
                <button
                  onClick={handleBulkApply}
                  className="px-3 py-1.5 bg-[#f0f0f1] hover:bg-[#dcdcde] text-[#2c3338] text-xs font-semibold rounded border border-[#8c8f94] transition-colors"
                >
                  Apply
                </button>
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                Read-Only (Author View)
              </div>
            )}

            <div className="text-xs text-slate-500 font-medium">
              {total} items
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-[#f6f7f7] border-b border-slate-200 text-slate-800 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        disabled={isAuthor}
                        checked={
                          departments.length > 0 &&
                          departments.every((d) => selectedIds.includes(d._id))
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                      />
                    </th>
                    <th className="py-2.5 px-2 w-10 text-slate-500 font-normal">#</th>
                    <th className="py-2.5 px-3 w-16 text-center font-semibold text-slate-800">Image</th>
                    <th className="py-2.5 px-4 font-semibold text-slate-800">Name</th>
                    <th className="py-2.5 px-4 font-semibold text-slate-800">Slug</th>
                    <th className="py-2.5 px-4 font-semibold text-slate-800">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center">
                        <AdminLoader
                          text="Loading Departments..."
                          subtext="Retrieving department directory from database"
                          minHeight="min-h-[260px]"
                        />
                      </td>
                    </tr>
                  ) : departments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No departments found.
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept, idx) => {
                      const isChecked = selectedIds.includes(dept._id);
                      const fullImageUrl = dept.image ? getImageUrl(dept.image) : null;

                      return (
                        <tr
                          key={dept._id || idx}
                          className={`hover:bg-[#f9f9f9] transition-colors group ${
                            isChecked ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              disabled={isAuthor}
                              checked={isChecked}
                              onChange={() => handleSelectOne(dept._id)}
                              className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                            />
                          </td>

                          {/* ID */}
                          <td className="py-2.5 px-2 text-slate-400 font-mono text-[11px]">
                            {dept.sql_id || (page - 1) * 10 + idx + 1}
                          </td>

                          {/* Image Thumbnail */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="w-10 h-7 mx-auto rounded border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center p-0.5">
                              {fullImageUrl ? (
                                <img
                                  src={fullImageUrl}
                                  alt={dept.name}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="text-[9px] text-slate-400 font-mono">No Image</span>
                              )}
                            </div>
                          </td>

                          {/* Name + Hover Actions */}
                          <td className="py-2.5 px-4">
                            <div className="font-bold text-[#2271b1] text-xs">
                              {dept.name}
                            </div>
                            {!isAuthor && (
                              <div className="flex items-center gap-2 mt-0.5 text-[10.5px] opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEdit(dept)}
                                  className="text-[#2271b1] hover:underline cursor-pointer"
                                >
                                  Edit
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                  onClick={() => openDeleteModal(dept._id, dept.name)}
                                  className="text-red-600 hover:underline cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Slug */}
                          <td className="py-2.5 px-4 text-slate-700 font-mono text-[11px]">
                            {dept.slug}
                          </td>

                          {/* Description */}
                          <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">
                            {dept.description ? dept.description : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination */}
            <div className="p-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Showing {Math.min((page - 1) * 10 + 1, total)} to{' '}
                {Math.min(page * 10, total)} of {total.toLocaleString()} results
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded border border-slate-300 text-slate-700 text-xs"
                >
                  «
                </button>

                {Array.from({ length: Math.min(pages, 9) }, (_, i) => {
                  let pageNum = i + 1;
                  if (pages > 9) {
                    if (page > 5) {
                      pageNum = page - 4 + i;
                      if (pageNum > pages) pageNum = pages - (8 - i);
                    }
                  }
                  if (pageNum < 1 || pageNum > pages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                        page === pageNum
                          ? 'bg-[#2271b1] text-white border-[#2271b1] font-bold'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded border border-slate-300 text-slate-700 text-xs"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={handleMediaSelect}
        targetType="featured"
      />

      {/* Reusable Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        isLoading={deleteModal.isLoading}
        itemName={deleteModal.title}
        type="danger"
        title={deleteModal.isBulk ? 'Permanently Delete Selected Departments?' : 'Permanently Delete Department?'}
        description={
          deleteModal.isBulk
            ? `Are you sure you want to permanently delete ${selectedIds.length} selected department(s)?`
            : 'Are you sure you want to permanently delete this department? This action cannot be undone.'
        }
        confirmText="Delete Department"
        onConfirm={handleConfirmDelete}
        onClose={() =>
          setDeleteModal({ isOpen: false, id: null, title: '', isBulk: false, isLoading: false })
        }
      />
    </div>
  );
}
