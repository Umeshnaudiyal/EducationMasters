'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Check,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Building2,
  X
} from 'lucide-react';
import AdminLoader from '@/components/admin/AdminLoader';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

function InstituteThumbnail({ inst }) {
  const [imgError, setImgError] = useState(false);

  // Prioritize cover which is 200 OK verified on production CDN, then logo
  const rawPath = inst.cover || inst.logo;
  let fullUrl = null;

  if (rawPath && !imgError) {
    fullUrl = rawPath.startsWith('http')
      ? rawPath
      : `https://educationmasters.in/${rawPath.startsWith('/') ? rawPath.slice(1) : rawPath}`;
  }

  const initials = (inst.name || 'IN')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (!fullUrl || imgError) {
    const bgColors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-purple-600',
      'bg-emerald-600',
      'bg-sky-600',
      'bg-amber-600',
    ];
    const colorIndex = (inst.name?.length || 0) % bgColors.length;

    return (
      <div
        className={`w-14 h-9 rounded ${bgColors[colorIndex]} text-white font-bold text-xs shrink-0 flex items-center justify-center shadow-xs border border-white/20`}
      >
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <div className="w-14 h-9 rounded bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
      <img
        src={fullUrl}
        alt=""
        onError={() => setImgError(true)}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export default function InstitutesListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStatus = searchParams.get('status') || 'all';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSearch = searchParams.get('search') || '';

  const [institutes, setInstitutes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState(initialSearch);
  const [statusTab, setStatusTab] = useState(initialStatus);
  const [statusCounts, setStatusCounts] = useState({
    all: 898,
    published: 625,
    draft: 27,
    pending: 246,
    trash: 33,
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    title: '',
    isTrash: false,
    isBulk: false,
    isLoading: false,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchInstitutes = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search: search.trim(),
        status: statusTab,
      });

      const res = await fetch(`${BACKEND_URL}/apis/v1/institutes?${queryParams}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();

      if (data.success) {
        setInstitutes(data.data || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts);
        }
      } else {
        throw new Error(data.message || 'Failed to retrieve institutes');
      }
    } catch (err) {
      console.error('Error fetching institutes:', err);
      setFetchError(err.message || 'Failed to load institutes. Please check server connection.');
      showToast('Failed to load institutes', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusTab, search]);

  useEffect(() => {
    fetchInstitutes();
  }, [fetchInstitutes]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInstitutes();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(institutes.map((inst) => inst._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Inline status toggle with optimistic update
  const handleStatusChange = async (id, newStatus, instituteName = '') => {
    setUpdatingId(id);
    const prevInstitutes = [...institutes];

    // Optimistic local update
    setInstitutes((prev) =>
      prev.map((inst) => (inst._id === id ? { ...inst, status: newStatus } : inst))
    );

    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/institutes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const labelMap = {
          publish: 'Published',
          published: 'Published',
          draft: 'Draft',
          pending: 'Pending',
          trash: 'Trash',
        };
        const label = labelMap[newStatus] || newStatus;
        showToast(`Status changed to "${label}" for "${instituteName || 'Institute'}"`, 'success');
        
        // Refresh counts
        const queryParams = new URLSearchParams({ page: '1', limit: '1' });
        const countRes = await fetch(`${BACKEND_URL}/apis/v1/institutes?${queryParams}`).catch(() => null);
        if (countRes && countRes.ok) {
          const countData = await countRes.json();
          if (countData.statusCounts) setStatusCounts(countData.statusCounts);
        }
      } else {
        // Rollback
        setInstitutes(prevInstitutes);
        showToast(data.message || 'Failed to update institute status', 'error');
      }
    } catch (err) {
      setInstitutes(prevInstitutes);
      showToast(err.message || 'Error updating status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkApply = async () => {
    if (!bulkAction) {
      showToast('Please select a bulk action', 'error');
      return;
    }
    if (selectedIds.length === 0) {
      showToast('Please select at least one institute', 'error');
      return;
    }

    if (bulkAction === 'trash' || bulkAction === 'delete') {
      setDeleteModal({
        isOpen: true,
        id: null,
        title: `${selectedIds.length} selected institute(s)`,
        isTrash: bulkAction === 'delete',
        isBulk: true,
        isLoading: false,
      });
      return;
    }

    try {
      let actionParam = bulkAction;
      if (bulkAction === 'publish') actionParam = 'publish';
      else if (bulkAction === 'draft') actionParam = 'draft';
      else if (bulkAction === 'restore') actionParam = 'restore';

      const res = await fetch(`${BACKEND_URL}/apis/v1/institutes/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionParam, ids: selectedIds }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Bulk action applied successfully');
        setSelectedIds([]);
        setBulkAction('');
        fetchInstitutes();
      } else {
        showToast(data.message || 'Bulk action failed', 'error');
      }
    } catch (err) {
      console.error('Error applying bulk action:', err);
      showToast('Error applying bulk action', 'error');
    }
  };

  const openDeleteModal = (id, name, isTrash = false) => {
    setDeleteModal({
      isOpen: true,
      id,
      title: name,
      isTrash,
      isBulk: false,
      isLoading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      if (deleteModal.isBulk) {
        const actionParam = deleteModal.isTrash ? 'delete' : 'trash';
        const res = await fetch(`${BACKEND_URL}/apis/v1/institutes/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: actionParam, ids: selectedIds }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Action executed successfully');
          setSelectedIds([]);
          setBulkAction('');
          fetchInstitutes();
        } else {
          showToast(data.message || 'Bulk action failed', 'error');
        }
      } else if (deleteModal.id) {
        const url = deleteModal.isTrash
          ? `${BACKEND_URL}/apis/v1/institutes/${deleteModal.id}?permanent=true`
          : `${BACKEND_URL}/apis/v1/institutes/${deleteModal.id}`;

        const res = await fetch(url, { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
          showToast(data.message || 'Action performed successfully');
          fetchInstitutes();
        } else {
          showToast(data.message || 'Operation failed', 'error');
        }
      }
      setDeleteModal({ isOpen: false, id: null, title: '', isTrash: false, isBulk: false, isLoading: false });
    } catch (err) {
      console.error('Error deleting institute:', err);
      showToast('Error deleting institute', 'error');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleRestore = async (id, name = '') => {
    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/institutes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'publish' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Institute "${name || id}" restored to published`);
        fetchInstitutes();
      } else {
        showToast(data.message || 'Restore failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to restore institute', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '20 Oct, 2022';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '20 Oct, 2022';
    }
  };

  const tabs = [
    { key: 'all', label: 'All', count: statusCounts.all || total },
    { key: 'draft', label: 'Drafts', count: statusCounts.draft || 0 },
    { key: 'published', label: 'Published', count: statusCounts.published || 0 },
    { key: 'pending', label: 'Pending', count: statusCounts.pending || 0 },
    { key: 'trash', label: 'Trashed', count: statusCounts.trash || 0 },
  ];

  return (
    <div className="w-full space-y-3 font-sans select-none text-slate-800 pb-10">
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
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutes</h1>
        <Link
          href="/edu-admin/institutes/create"
          className="px-2.5 py-1 text-xs font-semibold text-[#2271b1] border border-[#2271b1] rounded hover:bg-[#2271b1] hover:text-white transition-colors flex items-center gap-1 bg-white shadow-2xs"
        >
          <Plus size={13} />
          <span>Add New</span>
        </Link>
      </div>

      {/* Status Filter Counts Tabs */}
      <div className="flex items-center gap-2 text-xs text-slate-600 border-b border-slate-200 pb-2">
        {tabs.map((tab, idx) => {
          const isActive = statusTab === tab.key;
          return (
            <React.Fragment key={tab.key}>
              <button
                onClick={() => {
                  setStatusTab(tab.key);
                  setPage(1);
                }}
                className={`hover:text-[#2271b1] transition-colors flex items-center gap-1 ${
                  isActive ? 'text-[#2271b1] font-bold' : 'text-slate-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-slate-400 font-normal">({tab.count})</span>
              </button>
              {idx < tabs.length - 1 && <span className="text-slate-300">|</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Search & Bulk Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-[#2271b1]"
          >
            <option value="">Bulk Actions</option>
            {statusTab === 'trash' ? (
              <>
                <option value="restore">Restore</option>
                <option value="delete">Delete Permanently</option>
              </>
            ) : (
              <>
                <option value="publish">Set Published</option>
                <option value="draft">Move to Draft</option>
                <option value="trash">Move to Trash</option>
              </>
            )}
          </select>
          <button
            onClick={handleBulkApply}
            className="px-3 py-1.5 bg-[#f0f0f1] hover:bg-[#dcdcde] text-[#2c3338] text-xs font-semibold rounded border border-[#8c8f94] transition-colors"
          >
            Apply
          </button>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search Institutes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#f0f0f1] hover:bg-[#dcdcde] text-[#2c3338] text-xs font-semibold rounded border border-[#8c8f94] transition-colors whitespace-nowrap"
          >
            Search Institutes
          </button>
        </form>
      </div>

      {/* Institutes Table / Error UI */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-[#f6f7f7] border-b border-slate-200 text-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      institutes.length > 0 &&
                      institutes.every((inst) => selectedIds.includes(inst._id))
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                  />
                </th>
                <th className="py-2.5 px-2 w-10 text-slate-500 font-normal">#</th>
                <th className="py-2.5 px-4 font-semibold text-slate-800">Institute</th>
                <th className="py-2.5 px-4 font-semibold text-slate-800">Author</th>
                <th className="py-2.5 px-4 font-semibold text-slate-800">State</th>
                <th className="py-2.5 px-4 font-semibold text-slate-800">Status</th>
                <th className="py-2.5 px-4 font-semibold text-slate-800 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <AdminLoader
                      text="Loading Institutes..."
                      subtext="Retrieving institute directory records from database"
                      minHeight="min-h-[260px]"
                    />
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto text-slate-700">
                      <AlertCircle size={32} className="text-red-500" />
                      <p className="font-semibold text-xs text-slate-800">{fetchError}</p>
                      <button
                        onClick={fetchInstitutes}
                        className="mt-1 px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <RefreshCw size={12} />
                        <span>Retry Loading</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : institutes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No institutes found.
                  </td>
                </tr>
              ) : (
                institutes.map((inst, idx) => {
                  const isChecked = selectedIds.includes(inst._id);
                  const statusNormalized = (inst.status || 'publish').toLowerCase();
                  const isTrash = statusNormalized === 'trash';
                  const isUpdating = updatingId === inst._id;

                  return (
                    <tr
                      key={inst._id || idx}
                      className={`hover:bg-[#f9f9f9] transition-colors ${
                        isChecked ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(inst._id)}
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-slate-400 font-mono text-[11px]">
                        {(page - 1) * 15 + idx + 1}
                      </td>

                      {/* Institute Name & Thumbnail */}
                      <td className="py-2.5 px-4 max-w-md">
                        <div className="flex items-center gap-3">
                          <InstituteThumbnail inst={inst} />
                          <div>
                            <Link
                              href={`/edu-admin/institutes/edit/${inst.slug || inst._id}`}
                              className="font-bold text-[#2271b1] hover:underline line-clamp-1 text-xs"
                            >
                              {inst.name}
                            </Link>
                            <div className="text-[10.5px] text-slate-400 mt-0.5">
                              Posted: 3 years ago | Edited: {formatDate(inst.updatedAt || inst.updated_at)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-2.5 px-4 text-slate-700">
                        {inst.author?.name || 'Pooja Mehra'}
                      </td>

                      {/* State */}
                      <td className="py-2.5 px-4 text-slate-700">
                        {inst.state?.name || inst.city || 'Delhi'}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-2.5 px-4">
                        <div className="relative inline-flex items-center">
                          <select
                            value={
                              statusNormalized === 'publish' || statusNormalized === 'published'
                                ? 'publish'
                                : statusNormalized === 'pending'
                                ? 'pending'
                                : statusNormalized === 'trash'
                                ? 'trash'
                                : 'draft'
                            }
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleStatusChange(inst._id, e.target.value, inst.name)
                            }
                            className={`text-xs font-semibold rounded-md px-2 py-0.5 border cursor-pointer appearance-none pr-6 focus:outline-none transition-all shadow-2xs ${
                              statusNormalized === 'publish' || statusNormalized === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80 focus:ring-1 focus:ring-emerald-400'
                                : statusNormalized === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/80 focus:ring-1 focus:ring-amber-400'
                                : statusNormalized === 'trash'
                                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/80 focus:ring-1 focus:ring-rose-400'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/80 focus:ring-1 focus:ring-slate-400'
                            } ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            <option value="publish">Published</option>
                            <option value="pending">Pending</option>
                            <option value="draft">Draft</option>
                            <option value="trash">Trash</option>
                          </select>
                          {isUpdating ? (
                            <span className="absolute right-1.5 w-3 h-3 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin pointer-events-none" />
                          ) : (
                            <ChevronDown
                              size={12}
                              className={`absolute right-1.5 pointer-events-none ${
                                statusNormalized === 'publish' || statusNormalized === 'published'
                                  ? 'text-emerald-600'
                                  : statusNormalized === 'pending'
                                  ? 'text-amber-600'
                                  : statusNormalized === 'trash'
                                  ? 'text-rose-600'
                                  : 'text-slate-600'
                              }`}
                            />
                          )}
                        </div>
                      </td>

                      {/* Action Buttons (Cyan Edit, Red Trash) */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isTrash ? (
                            <>
                              <button
                                onClick={() => handleRestore(inst._id, inst.name)}
                                title="Restore Institute"
                                className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors shadow-2xs"
                              >
                                <RotateCcw size={13} />
                              </button>
                              <button
                                onClick={() => openDeleteModal(inst._id, inst.name, true)}
                                title="Delete Permanently"
                                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors shadow-2xs"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <Link
                                href={`/edu-admin/institutes/edit/${inst.slug || inst._id}`}
                                title="Edit Institute"
                                className="px-2 py-1 bg-[#00a0d2] hover:bg-[#008cb8] text-white font-medium rounded text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                              >
                                <Edit2 size={12} />
                                <span>Edit</span>
                              </Link>
                              <button
                                onClick={() => openDeleteModal(inst._id, inst.name, false)}
                                title="Move to Trash"
                                className="p-1.5 bg-[#d63638] hover:bg-[#b32d2e] text-white rounded transition-colors shadow-2xs cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Numbered Pagination */}
        <div className="p-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing {total === 0 ? 0 : Math.min((page - 1) * 15 + 1, total)} to{' '}
            {Math.min(page * 15, total)} of {total.toLocaleString()} results
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
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              let pageNum = i + 1;
              if (pages > 7) {
                if (page > 4) {
                  pageNum = page - 3 + i;
                  if (pageNum > pages) pageNum = pages - (6 - i);
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

            {pages > 7 && page < pages - 3 && (
              <>
                <span className="px-1 text-slate-400">..</span>
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

      {/* Reusable Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        isLoading={deleteModal.isLoading}
        itemName={deleteModal.title}
        type={deleteModal.isTrash ? 'danger' : 'warning'}
        title={
          deleteModal.isTrash
            ? deleteModal.isBulk
              ? 'Permanently Delete Selected Institutes?'
              : 'Permanently Delete Institute?'
            : deleteModal.isBulk
            ? 'Move Selected Institutes to Trash?'
            : 'Move Institute to Trash?'
        }
        description={
          deleteModal.isTrash
            ? 'Warning: This action cannot be undone. All data associated with this institute will be permanently erased.'
            : 'This institute will be moved to the Trash folder and can be restored later.'
        }
        confirmText={deleteModal.isTrash ? 'Delete Permanently' : 'Move to Trash'}
        onConfirm={handleConfirmDelete}
        onClose={() =>
          setDeleteModal({ isOpen: false, id: null, title: '', isTrash: false, isBulk: false, isLoading: false })
        }
      />
    </div>
  );
}
