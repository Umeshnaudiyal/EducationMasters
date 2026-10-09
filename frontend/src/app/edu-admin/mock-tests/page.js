'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  BookOpen,
  LayoutGrid,
  List,
  Check,
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import { getAuthToken } from '@/utils/auth';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { toast } from '@/context/ToastContext';
import { BACKEND_URL } from '@/utils/api';

const API_BASE = BACKEND_URL;

export default function MockTestSeriesListPage() {
  const { data: session } = useSession();
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [examFilter, setExamFilter] = useState('all');
  const [exams, setExams] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    published: 0,
    draft: 0,
    pending: 0,
    trash: 0,
  });

  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const [serverMessage, setServerMessage] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, isLoading: false, isBulk: false });

  // Fetch exams for filter dropdown
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await fetch(`${API_BASE}/apis/v1/exams?limit=100`);
        const data = await res.json();
        if (data.success) {
          setExams(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load exams:', err);
      }
    };
    fetchExams();
  }, []);

  // Fetch Mock Test Series
  const fetchSeries = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: statusFilter,
      });
      if (activeSearch) params.set('search', activeSearch);
      if (examFilter && examFilter !== 'all') params.set('exam', examFilter);

      const res = await fetch(`${API_BASE}/apis/v1/mock-test-series?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setSeriesList(data.data || []);
        setTotal(data.total || 0);
        if (data.counts) {
          setCounts(data.counts);
        }
      } else {
        setSeriesList([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Error fetching mock test series:', err);
      setServerMessage({ type: 'error', text: 'Failed to load mock test series from server' });
    } finally {
      setLoading(false);
    }
  }, [page, activeSearch, statusFilter, examFilter]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveSearch(search.trim());
    setPage(1);
  };

  // Bulk selection handlers
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(seriesList.map((s) => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Apply Handler
  const handleBulkApply = async () => {
    if (!bulkAction) {
      setServerMessage({ type: 'error', text: 'Please select a bulk action.' });
      return;
    }
    if (selectedIds.length === 0) {
      setServerMessage({ type: 'error', text: 'Please select at least one series.' });
      return;
    }

    if (bulkAction === 'delete') {
      setDeleteModal({
        isOpen: true,
        item: null,
        isBulk: true,
        isLoading: false,
      });
      return;
    }

    try {
      setBulkLoading(true);
      const token = getAuthToken(session);
      const res = await fetch(`${API_BASE}/apis/v1/mock-test-series/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: bulkAction, ids: selectedIds }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const msg = data.message || 'Bulk action applied successfully.';
        setServerMessage({ type: 'success', text: msg });
        toast.success(msg);
        setSelectedIds([]);
        setBulkAction('');
        fetchSeries();
      } else {
        const errMsg = data.message || 'Bulk action failed.';
        setServerMessage({ type: 'error', text: errMsg });
        toast.error(errMsg);
      }
    } catch (err) {
      console.error('Bulk action error:', err);
      const errMsg = 'Error applying bulk action.';
      setServerMessage({ type: 'error', text: errMsg });
      toast.error(errMsg);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteModal((prev) => ({ ...prev, isLoading: true }));
      const token = getAuthToken(session);

      if (deleteModal.isBulk) {
        const res = await fetch(`${API_BASE}/apis/v1/mock-test-series/bulk-action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: 'delete', ids: selectedIds }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const msg = `${selectedIds.length} series deleted successfully.`;
          setServerMessage({ type: 'success', text: msg });
          toast.success(msg);
          setSelectedIds([]);
          fetchSeries();
        } else {
          const errMsg = data.message || 'Failed to delete series.';
          setServerMessage({ type: 'error', text: errMsg });
          toast.error(errMsg);
        }
      } else if (deleteModal.item) {
        const res = await fetch(`${API_BASE}/apis/v1/mock-test-series/${deleteModal.item._id}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const msg = `Mock Test Series "${deleteModal.item.title}" deleted successfully.`;
          setServerMessage({ type: 'success', text: msg });
          toast.success(msg);
          fetchSeries();
        } else {
          const errMsg = data.message || 'Failed to delete series.';
          setServerMessage({ type: 'error', text: errMsg });
          toast.error(errMsg);
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      const errMsg = 'Error connecting to server during deletion.';
      setServerMessage({ type: 'error', text: errMsg });
      toast.error(errMsg);
    } finally {
      setDeleteModal({ isOpen: false, item: null, isLoading: false, isBulk: false });
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const tabs = [
    { key: 'all', label: 'All', count: counts.all || total },
    { key: 'draft', label: 'Drafts', count: counts.draft || 0 },
    { key: 'published', label: 'Published', count: counts.published || 0 },
    { key: 'pending', label: 'Pending', count: counts.pending || 0 },
    { key: 'trash', label: 'Trashed', count: counts.trash || 0 },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full space-y-3 font-sans select-none text-slate-800 pb-16">
      {/* Toast Notification */}
      {serverMessage && (
        <div
          className={`p-2.5 rounded border text-xs flex items-start gap-2 animate-in fade-in duration-200 ${
            serverMessage.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}
        >
          {serverMessage.type === 'error' ? (
            <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 font-medium">{serverMessage.text}</span>
          <button
            type="button"
            onClick={() => setServerMessage(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header matching reference screenshot */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mock Test Series</h1>
        <Link
          href="/edu-admin/mock-tests/create"
          className="px-2.5 py-1 text-xs font-semibold text-[#2271b1] border border-[#2271b1] rounded hover:bg-[#2271b1] hover:text-white transition-colors flex items-center gap-1 bg-white shadow-2xs"
        >
          <Plus size={13} />
          <span>Add New</span>
        </Link>
        <Link
          href="/edu-admin/mock-tests/plans"
          className="px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-300 rounded hover:bg-slate-100 transition-colors flex items-center gap-1 bg-white shadow-2xs ml-auto sm:ml-0"
        >
          <CreditCard size={13} className="text-slate-500" />
          <span>Pricing Plans</span>
        </Link>
      </div>

      {/* Status Filter Counts Tabs (Matching screenshot All (900) | Drafts (27) | Published ...) */}
      <div className="flex items-center gap-2 text-xs text-slate-600 border-b border-slate-200 pb-2">
        {tabs.map((tab, idx) => {
          const isActive = statusFilter === tab.key;
          return (
            <React.Fragment key={tab.key}>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`hover:text-[#2271b1] transition-colors flex items-center gap-1 cursor-pointer ${
                  isActive ? 'text-[#2271b1] font-bold' : 'text-slate-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-slate-400 font-normal">({tab.count?.toLocaleString() || 0})</span>
              </button>
              {idx < tabs.length - 1 && <span className="text-slate-300">|</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Search & Bulk Actions Bar (Matching reference screenshot) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Left: Bulk Actions & Exam Dropdown Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-[#2271b1]"
          >
            <option value="">Bulk Actions</option>
            {statusFilter !== 'trash' ? (
              <>
                <option value="publish">Publish</option>
                <option value="draft">Move to Draft</option>
                <option value="delete">Move to Trash</option>
              </>
            ) : (
              <>
                <option value="publish">Restore</option>
                <option value="delete">Delete Permanently</option>
              </>
            )}
          </select>

          <button
            type="button"
            onClick={handleBulkApply}
            disabled={bulkLoading || selectedIds.length === 0}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 border border-slate-300 rounded text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            {bulkLoading ? 'Applying...' : 'Apply'}
          </button>

          {/* Exam Filter Dropdown */}
          <select
            value={examFilter}
            onChange={(e) => {
              setExamFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-[#2271b1]"
          >
            <option value="all">All Examinations</option>
            {exams.map((ex) => (
              <option key={ex._id} value={ex._id}>
                {ex.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchSeries}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            Filter
          </button>
        </div>

        {/* Right: Search Box Matching Screenshot */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Mock Tests..."
            className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1] w-48 sm:w-56"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-medium whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
          >
            Search Mock Tests
          </button>
        </form>
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#2271b1]" />
              <span className="text-xs font-semibold">Loading mock test series...</span>
            </div>
          </div>
        ) : seriesList.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Layers size={32} className="mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No Mock Test Series Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeSearch || examFilter !== 'all'
                ? 'Try clearing the search or changing the filter options.'
                : 'Click "+ Add New" to create your first comprehensive mock test series.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                  <th className="p-3 w-8 text-center">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={seriesList.length > 0 && selectedIds.length === seriesList.length}
                      className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                    />
                  </th>
                  <th className="p-3 w-16 text-center">Image</th>
                  <th className="p-3 min-w-[240px]">Series Title</th>
                  <th className="p-3 min-w-[140px]">Examination</th>
                  <th className="p-3 text-center min-w-[100px]">Tests</th>
                  <th className="p-3 text-center min-w-[90px]">Free Tests</th>
                  <th className="p-3 text-center min-w-[80px]">Plans</th>
                  <th className="p-3 text-center min-w-[100px]">Status</th>
                  <th className="p-3 text-right min-w-[110px]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {seriesList.map((series) => {
                  const isSelected = selectedIds.includes(series._id);
                  const resolvedImg = series.image ? getImageUrl(series.image, null) : null;
                  const isPublished = (series.status || '').toLowerCase().includes('pub');

                  return (
                    <tr
                      key={series._id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(series._id)}
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                        />
                      </td>

                      {/* Thumbnail */}
                      <td className="p-3 text-center">
                        <div className="w-14 h-10 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center mx-auto shadow-2xs">
                          {resolvedImg ? (
                            <img
                              src={resolvedImg}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <FileText size={18} className="text-slate-400" />
                          )}
                        </div>
                      </td>

                      {/* Title & Row Action Links */}
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/edu-admin/mock-tests/${series._id}/edit`}
                            className="font-bold text-slate-900 hover:text-[#2271b1] text-xs transition-colors line-clamp-1"
                          >
                            {series.title}
                          </Link>
                          {series.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-[#2271b1]">
                              {series.badge}
                            </span>
                          )}
                        </div>

                        {/* Inline Actions (Classic WordPress Hover Action Links) */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-1">
                          <Link
                            href={`/edu-admin/mock-tests/${series._id}/edit`}
                            className="text-[#0073aa] hover:underline font-normal"
                          >
                            Edit
                          </Link>
                          <span>|</span>
                          <Link
                            href={`/edu-admin/mock-tests/${series._id}/tests`}
                            className="text-emerald-700 hover:underline font-semibold"
                          >
                            Manage Tests ({series.total_tests || 0})
                          </Link>
                          <span>|</span>
                          <Link
                            href={`/mock-test/${series.slug}`}
                            target="_blank"
                            className="text-[#0073aa] hover:underline font-normal flex items-center gap-0.5"
                          >
                            <span>View</span>
                            <ExternalLink size={10} />
                          </Link>
                          <span>|</span>
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ isOpen: true, item: series, isLoading: false, isBulk: false })}
                            className="text-rose-600 hover:underline font-normal cursor-pointer"
                          >
                            Trash
                          </button>
                        </div>
                      </td>

                      {/* Examination */}
                      <td className="p-3 text-slate-600">
                        {series.examination_name ? (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
                            {series.examination_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Total Tests */}
                      <td className="p-3 text-center">
                        <Link
                          href={`/edu-admin/mock-tests/${series._id}/tests`}
                          className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                        >
                          <Layers size={11} className="text-[#2271b1]" />
                          <span>{series.total_tests || 0}</span>
                        </Link>
                      </td>

                      {/* Free Tests */}
                      <td className="p-3 text-center">
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          {series.free_tests_count || 0}
                        </span>
                      </td>

                      {/* Plans */}
                      <td className="p-3 text-center">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {series.plans?.length || 0} tiers
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPublished
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {series.status || 'Published'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-3 text-right text-slate-500 font-mono text-[11px]">
                        {formatDate(series.createdAt || series.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">
              Showing {seriesList.length} of {total} series
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-40 rounded text-slate-700 font-medium shadow-2xs cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 text-slate-600 font-bold">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-40 rounded text-slate-700 font-medium shadow-2xs cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null, isLoading: false, isBulk: false })}
        onConfirm={handleDelete}
        title={deleteModal.isBulk ? `Delete ${selectedIds.length} Series?` : `Delete "${deleteModal.item?.title}"?`}
        message="This will delete the mock test series and all child mock tests under it. This action cannot be undone."
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
