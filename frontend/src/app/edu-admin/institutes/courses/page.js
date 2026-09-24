'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  BookOpen,
  GraduationCap,
  ChevronLeft
} from 'lucide-react';
import AdminLoader from '@/components/admin/AdminLoader';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { getAuthToken } from '@/utils/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

const slugify = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function CoursesManagementPage() {
  const { data: session } = useSession();
  // Course List & Pagination
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(700);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(70);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Selected for Bulk Action
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    title: '',
    isBulk: false,
    isLoading: false,
  });

  // Create / Edit Form State
  const [courseName, setCourseName] = useState('');
  const [courseSlug, setCourseSlug] = useState('');
  const [courseInfo, setCourseInfo] = useState('');
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Toast Alerts
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search.trim(),
      });

      const token = getAuthToken(session);
      const res = await fetch(`${BACKEND_URL}/apis/v1/courses?${queryParams}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'x-bypass-cache': '1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();

      if (data.success) {
        setCourses(data.data || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      showToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, session]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setCourseName(val);
    if (!editingCourseId) {
      setCourseSlug(slugify(val));
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(courses.map((c) => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseName.trim()) {
      showToast('Course name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const token = getAuthToken(session);
      const payload = {
        name: courseName.trim(),
        slug: courseSlug.trim() || slugify(courseName),
        info: courseInfo.trim(),
      };

      const url = editingCourseId
        ? `${BACKEND_URL}/apis/v1/courses/${editingCourseId}`
        : `${BACKEND_URL}/apis/v1/courses`;

      const method = editingCourseId ? 'PUT' : 'POST';

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
          editingCourseId ? 'Course updated successfully' : 'Course created successfully'
        );
        resetForm();
        fetchCourses();
      } else {
        showToast(data.message || 'Failed to save course', 'error');
      }
    } catch (err) {
      console.error('Error saving course:', err);
      showToast('Error saving course', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (course) => {
    setEditingCourseId(course._id);
    setCourseName(course.name || '');
    setCourseSlug(course.slug || '');
    setCourseInfo(course.info || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingCourseId(null);
    setCourseName('');
    setCourseSlug('');
    setCourseInfo('');
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
      const token = getAuthToken(session);
      if (deleteModal.isBulk) {
        const res = await fetch(`${BACKEND_URL}/apis/v1/courses/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: 'delete', ids: selectedIds }),
        });

        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Courses deleted successfully');
          setSelectedIds([]);
          setBulkAction('');
          fetchCourses();
        } else {
          showToast(data.message || 'Bulk delete failed', 'error');
        }
      } else if (deleteModal.id) {
        const res = await fetch(`${BACKEND_URL}/apis/v1/courses/${deleteModal.id}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();

        if (data.success) {
          showToast('Course deleted successfully');
          fetchCourses();
        } else {
          showToast(data.message || 'Failed to delete course', 'error');
        }
      }
      setDeleteModal({ isOpen: false, id: null, title: '', isBulk: false, isLoading: false });
    } catch (err) {
      console.error('Error deleting course:', err);
      showToast('Error deleting course', 'error');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleBulkApply = async () => {
    if (!bulkAction) {
      showToast('Please select a bulk action', 'error');
      return;
    }
    if (selectedIds.length === 0) {
      showToast('No courses selected', 'error');
      return;
    }

    if (bulkAction === 'delete') {
      setDeleteModal({
        isOpen: true,
        id: null,
        title: `${selectedIds.length} selected course(s)`,
        isBulk: true,
        isLoading: false,
      });
    }
  };

  return (
    <div className="w-full space-y-4 font-sans select-none text-slate-800 pb-12">
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
        <div className="flex items-center gap-2.5">
          <Link
            href="/edu-admin/institutes"
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded shadow-2xs transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Back to Institutes"
          >
            <ChevronLeft size={15} />
            <span>Back</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Courses</h1>
        </div>

        <Link
          href="/edu-admin/institutes"
          className="text-xs text-[#2271b1] hover:underline font-medium"
        >
          All Institutes
        </Link>
      </div>

      {/* Main 2-Column Layout (Matching Screenshot #3) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Add / Edit New Course Form */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900">
              {editingCourseId ? 'Edit Course' : 'Add New Course'}
            </h2>
            {editingCourseId && (
              <button
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-0.5"
              >
                <X size={12} />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
            {/* Name */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Name</label>
              <input
                type="text"
                value={courseName}
                onChange={handleNameChange}
                placeholder="Course Name"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                required
              />
              <p className="text-[11px] text-slate-400">The name is how it appears on your site.</p>
            </div>

            {/* Slug */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Slug</label>
              <input
                type="text"
                value={courseSlug}
                onChange={(e) => setCourseSlug(e.target.value)}
                placeholder="course-slug"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
              />
              <p className="text-[11px] text-slate-400 leading-tight">
                The &ldquo;slug&rdquo; is the URL-friendly version of the name. It is usually all lower
                case and contains only letters, numbers, and hyphens.
              </p>
            </div>

            {/* Information */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Information</label>
              <textarea
                rows={4}
                value={courseInfo}
                onChange={(e) => setCourseInfo(e.target.value)}
                placeholder="Course Information / Description..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
              />
              <p className="text-[11px] text-slate-400 leading-tight">
                The information is not prominent by default; however, sometimes can be shown to public.
              </p>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold rounded shadow-2xs transition-colors flex items-center gap-1.5"
              >
                {submitting && <RefreshCw size={12} className="animate-spin" />}
                <span>{editingCourseId ? 'Update Course' : 'Add New Course'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Search, Bulk Actions & Courses Table (Matching Screenshot #3) */}
        <div className="md:col-span-8 space-y-3">
          {/* Top Search & Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Bulk Actions */}
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

            {/* Search Box & Item Counter */}
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Search Courses"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-44 sm:w-52 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#f0f0f1] hover:bg-[#dcdcde] text-[#2c3338] text-xs font-semibold rounded border border-[#8c8f94] transition-colors whitespace-nowrap"
                >
                  Search Posts
                </button>
              </form>
              <span className="text-xs text-slate-500 font-normal whitespace-nowrap">
                {total.toLocaleString()} items
              </span>
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-[#f6f7f7] border-b border-slate-200 text-slate-800 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          courses.length > 0 &&
                          courses.every((c) => selectedIds.includes(c._id))
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                      />
                    </th>
                    <th className="py-2.5 px-2 w-10 text-slate-500 font-normal">#</th>
                    <th className="py-2.5 px-4 font-semibold text-slate-800">Name</th>
                    <th className="py-2.5 px-4 font-semibold text-slate-800">Slug</th>
                    <th className="py-2.5 px-4 font-semibold text-slate-800">Information</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center">
                        <AdminLoader
                          text="Loading Courses..."
                          subtext="Fetching course categories and branches from database"
                          minHeight="min-h-[260px]"
                        />
                      </td>
                    </tr>
                  ) : courses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No courses found.
                      </td>
                    </tr>
                  ) : (
                    courses.map((course, idx) => {
                      const isChecked = selectedIds.includes(course._id);

                      return (
                        <tr
                          key={course._id || idx}
                          className={`hover:bg-[#f9f9f9] transition-colors group ${
                            isChecked ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSelectOne(course._id)}
                              className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-slate-400 font-mono text-[11px]">
                            {course.sql_id || (page - 1) * 10 + idx + 1}
                          </td>

                          {/* Name + Hover Actions */}
                          <td className="py-2.5 px-4">
                            <div className="font-bold text-[#2271b1] text-xs">
                              {course.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10.5px] opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEdit(course)}
                                className="text-[#2271b1] hover:underline"
                              >
                                Edit
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => openDeleteModal(course._id, course.name)}
                                className="text-red-600 hover:underline cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>

                          {/* Slug */}
                          <td className="py-2.5 px-4 text-slate-700 font-mono text-[11px]">
                            {course.slug}
                          </td>

                          {/* Information */}
                          <td className="py-2.5 px-4 text-slate-500">
                            {course.info ? (
                              <span className="line-clamp-1">{course.info}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
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

                {/* Page number buttons */}
                {Array.from({ length: Math.min(pages, 8) }, (_, i) => {
                  let pageNum = i + 1;
                  if (pages > 8) {
                    if (page > 5) {
                      pageNum = page - 4 + i;
                      if (pageNum > pages) pageNum = pages - (7 - i);
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

                {pages > 8 && page < pages - 4 && (
                  <>
                    <span className="px-1 text-slate-400">..</span>
                    <button
                      onClick={() => setPage(pages - 1)}
                      className="px-2.5 py-1 text-xs rounded border bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                    >
                      {pages - 1}
                    </button>
                    <button
                      onClick={() => setPage(pages)}
                      className="px-2.5 py-1 text-xs rounded border bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                    >
                      {pages}
                    </button>
                  </>
                )}

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

          {/* Footer Notice Note (Exact screenshot text) */}
          <div className="text-[11px] text-slate-500 leading-relaxed pt-1">
            Deleting a course does not delete the institutes who are having that course. Instead,
            institutes that were only assigned to the deleted course are set free from that course.
          </div>
        </div>
      </div>

      {/* Reusable Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        isLoading={deleteModal.isLoading}
        itemName={deleteModal.title}
        type="danger"
        title={deleteModal.isBulk ? 'Permanently Delete Selected Courses?' : 'Permanently Delete Course?'}
        description={
          deleteModal.isBulk
            ? `Are you sure you want to permanently delete ${selectedIds.length} selected course(s)?`
            : 'Are you sure you want to permanently delete this course? This action cannot be undone.'
        }
        confirmText="Delete Course"
        onConfirm={handleConfirmDelete}
        onClose={() =>
          setDeleteModal({ isOpen: false, id: null, title: '', isBulk: false, isLoading: false })
        }
      />
    </div>
  );
}
