'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import { formatTimeAgo, formatDate } from '@/utils/date';
import AdminLoader from '@/components/admin/AdminLoader';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { getAuthToken } from '@/utils/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function ResultsAdminPage() {
  const { data: session } = useSession();
  const isAuthor = session?.user?.role === 'author' || session?.user?.role === 'writer';
  const authorId = session?.user?.id;

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [bulkAction, setBulkAction] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    title: '',
    isBulk: false,
    isLoading: false,
  });
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    draft: 0,
    published: 0,
    pending: 0,
    trash: 0,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search,
        status: statusTab,
      };

      if (isAuthor && authorId) {
        params.author = authorId;
      }

      const queryParams = new URLSearchParams(params);
      const token = getAuthToken(session);

      const res = await fetch(`${BACKEND_URL}/apis/v1/results?${queryParams}`, {
        cache: 'no-store',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-bypass-cache': '1',
        },
      });
      const data = await res.json();

      if (data.success && data.data) {
        setResults(data.data || []);
        setTotal(data.total || data.count || 0);
        setPages(data.pages || Math.ceil((data.total || 0) / 15) || 1);
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts);
        }
      }
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const params = { limit: 1 };
      if (isAuthor && authorId) {
        params.author = authorId;
      }
      const token = getAuthToken(session);
      const res = await fetch(`${BACKEND_URL}/apis/v1/results?${new URLSearchParams(params)}`, {
        cache: 'no-store',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-bypass-cache': '1',
        },
      });
      const data = await res.json();
      if (data.success && data.statusCounts) {
        setStatusCounts(data.statusCounts);
      }
    } catch (err) {
      console.error('Failed to fetch status counts:', err);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [page, statusTab, isAuthor, authorId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResults();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(results.map((r) => r._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Inline Status Change (Toggle / Dropdown)
  const handleStatusChange = async (id, newStatus, postTitle = '') => {
    setUpdatingId(id);
    const prevResults = [...results];
    const prevItem = results.find((r) => r._id === id);

    // Optimistic UI update
    setResults((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
    );

    try {
      const token = getAuthToken(session);
      const res = await fetch(`${BACKEND_URL}/apis/v1/results/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const statusMap = {
          publish: 'Published',
          published: 'Published',
          active: 'Published',
          draft: 'Draft',
          pending: 'Pending',
          pending_review: 'Pending',
          trash: 'Trash',
        };
        const label = statusMap[newStatus] || newStatus;
        showToast(`Status changed to "${label}" for "${postTitle || 'Result'}"`, 'success');
        fetchStatusCounts();
      } else {
        setResults(prevResults);
        showToast(data.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      setResults(prevResults);
      showToast(err.message || 'Error updating status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteModal = (id, title) => {
    setDeleteModal({
      isOpen: true,
      id,
      title,
      isBulk: false,
      isLoading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const token = getAuthToken(session);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (deleteModal.isBulk) {
        for (const id of selectedIds) {
          await fetch(`${BACKEND_URL}/apis/v1/results/${id}`, { method: 'DELETE', headers });
        }
        showToast(`Moved ${selectedIds.length} result(s) to trash`, 'success');
        setSelectedIds([]);
      } else if (deleteModal.id) {
        await fetch(`${BACKEND_URL}/apis/v1/results/${deleteModal.id}`, { method: 'DELETE', headers });
        showToast(`Moved "${deleteModal.title}" to trash`, 'success');
      }
      setDeleteModal({ isOpen: false, id: null, title: '', isBulk: false, isLoading: false });
      fetchResults();
    } catch (err) {
      console.error('Failed to delete result:', err);
      showToast('Failed to delete result', 'error');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleBulkApply = async () => {
    const token = getAuthToken(session);
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    if (bulkAction === 'trash' && selectedIds.length > 0) {
      setDeleteModal({
        isOpen: true,
        id: null,
        title: `${selectedIds.length} selected result post(s)`,
        isBulk: true,
        isLoading: false,
      });
    } else if (bulkAction === 'publish' && selectedIds.length > 0) {
      for (const id of selectedIds) {
        await fetch(`${BACKEND_URL}/apis/v1/results/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: 'publish' }),
        });
      }
      setSelectedIds([]);
      showToast(`Published ${selectedIds.length} items`, 'success');
      fetchResults();
    } else if (bulkAction === 'draft' && selectedIds.length > 0) {
      for (const id of selectedIds) {
        await fetch(`${BACKEND_URL}/apis/v1/results/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: 'draft' }),
        });
      }
      setSelectedIds([]);
      showToast(`Drafted ${selectedIds.length} items`, 'success');
      fetchResults();
    }
  };

  const tabs = [
    { key: 'all', label: 'All', count: statusCounts.all || 0 },
    { key: 'draft', label: 'Drafts', count: statusCounts.draft || 0 },
    { key: 'published', label: 'Published', count: statusCounts.published || 0 },
    { key: 'pending', label: 'Pending', count: statusCounts.pending || 0 },
    { key: 'trash', label: 'Trashed', count: statusCounts.trash || 0 },
  ];

  return (
    <div className="space-y-3 w-full select-none font-sans text-slate-800">
      {/* Toast Alert */}
      {toast.message && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded shadow-xl text-xs font-semibold flex items-center gap-2 border animate-in slide-in-from-top-2 ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={14} className="text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header: Results + Add New Button */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-normal text-slate-900 tracking-tight">Results</h1>
        <Link
          href="/edu-admin/result/create"
          className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-[#2271b1] bg-white hover:bg-blue-50 border border-[#2271b1] rounded transition-colors shadow-2xs"
        >
          Add New
        </Link>
      </div>

      {/* Status Filter Counts Row + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-2">
        {/* Status Count Links */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 flex-wrap">
          {tabs.map((tab, idx) => (
            <React.Fragment key={tab.key}>
              <button
                onClick={() => {
                  setStatusTab(tab.key);
                  setPage(1);
                }}
                className={`hover:text-[#2271b1] transition-colors flex items-center gap-1 cursor-pointer ${
                  statusTab === tab.key ? 'text-[#2271b1] font-semibold' : 'text-slate-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-slate-500 font-normal">({tab.count?.toLocaleString()})</span>
              </button>
              {idx < tabs.length - 1 && <span className="text-slate-300">|</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Results"
            className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-[#2271b1] shadow-2xs w-48 md:w-56"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-normal transition-colors shadow-2xs cursor-pointer"
          >
            Search Results
          </button>
        </form>
      </div>

      {/* Bulk Actions Controls */}
      <div className="flex items-center gap-1.5 pt-1">
        <select
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
          className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-[#2271b1] shadow-2xs"
        >
          <option value="">Bulk Actions</option>
          <option value="publish">Set as Published</option>
          <option value="draft">Set as Draft</option>
          <option value="trash">Move to Trash</option>
        </select>
        <button
          onClick={handleBulkApply}
          disabled={!bulkAction || selectedIds.length === 0}
          className="px-2.5 py-1 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-300 rounded text-xs font-normal transition-colors shadow-2xs cursor-pointer"
        >
          Apply
        </button>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-12">
            <AdminLoader text="Loading Result Posts..." subtext="Retrieving examination results and merit lists" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No result posts found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f6f7f7] border-b border-slate-300 text-slate-700 font-bold">
                  <th className="p-2.5 w-8 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === results.length && results.length > 0}
                      className="rounded border-slate-300 text-[#2271b1] focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="p-2.5">Result Post</th>
                  <th className="p-2.5 w-36">Author</th>
                  <th className="p-2.5 w-44">Department</th>
                  <th className="p-2.5 w-32">Status</th>
                  <th className="p-2.5 w-28 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {results.map((item) => {
                  const mediaUrl = item.featured_media ? getImageUrl(item.featured_media) : null;
                  const authorName = item.author?.name || item.author?.nicename || 'Admin';
                  const deptName =
                    item.department?.name ||
                    (typeof item.department === 'string' ? item.department : null) ||
                    item.dept ||
                    '—';

                  const isPublished =
                    item.status === 'publish' ||
                    item.status === 'published' ||
                    item.status === 'active';
                  const isDraft = item.status === 'draft';
                  const isPending = item.status === 'pending' || item.status === 'pending_review';
                  const isTrash = item.status === 'trash';

                  const normalizedStatus = isPublished
                    ? 'publish'
                    : isPending
                    ? 'pending'
                    : isTrash
                    ? 'trash'
                    : 'draft';

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Checkbox */}
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item._id)}
                          onChange={() => toggleSelect(item._id)}
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Result Post (Image + Title + Metadata) */}
                      <td className="p-2.5">
                        <div className="flex items-start gap-2.5">
                          {/* Featured Media Thumbnail */}
                          <Link
                            href={`/result/${item.slug || item._id}`}
                            target="_blank"
                            title="Preview Result"
                            className="w-12 h-9 rounded bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity"
                          >
                            {mediaUrl ? (
                              <img
                                src={mediaUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={14} className="text-slate-400" />
                            )}
                          </Link>

                          {/* Title & Dates */}
                          <div className="space-y-0.5">
                            <Link
                              href={`/result/${item.slug || item._id}`}
                              target="_blank"
                              title="Preview Result"
                              className="font-bold text-[#0073aa] hover:text-[#005177] hover:underline line-clamp-1 cursor-pointer"
                            >
                              {item.title}
                            </Link>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <span>
                                Posted: {item.created_at ? formatTimeAgo(item.created_at) : '1 month ago'}
                              </span>
                              <span>|</span>
                              <span>
                                Edited:{' '}
                                {item.updated_at
                                  ? formatDate(item.updated_at)
                                  : item.created_at
                                  ? formatDate(item.created_at)
                                  : 'Recently'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="p-2.5 text-slate-600 font-medium">
                        {authorName}
                      </td>

                      {/* Department */}
                      <td className="p-2.5 text-slate-600">
                        {deptName !== '—' ? (
                          <span className="text-[#0073aa] font-medium hover:underline cursor-pointer">
                            {deptName}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status Dropdown Button to Shift Between Statuses */}
                      <td className="p-2.5">
                        <div className="relative inline-flex items-center">
                          <select
                            value={normalizedStatus}
                            disabled={updatingId === item._id}
                            onChange={(e) =>
                              handleStatusChange(item._id, e.target.value, item.title)
                            }
                            className={`text-xs font-semibold rounded-md px-2.5 py-1 border cursor-pointer appearance-none pr-6.5 focus:outline-none transition-all shadow-2xs ${
                              isPublished
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80 focus:ring-1 focus:ring-emerald-400'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/80 focus:ring-1 focus:ring-amber-400'
                                : isTrash
                                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/80 focus:ring-1 focus:ring-rose-400'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/80 focus:ring-1 focus:ring-slate-400'
                            } ${updatingId === item._id ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            {!isAuthor && <option value="publish">Published</option>}
                            <option value="pending">Pending</option>
                            <option value="draft">Draft</option>
                            <option value="trash">Trash</option>
                          </select>
                          {updatingId === item._id ? (
                            <span className="absolute right-2 w-3 h-3 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin pointer-events-none" />
                          ) : (
                            <ChevronDown
                              size={12}
                              className={`absolute right-1.5 pointer-events-none ${
                                isPublished
                                  ? 'text-emerald-600'
                                  : isPending
                                  ? 'text-amber-600'
                                  : isTrash
                                  ? 'text-rose-600'
                                  : 'text-slate-600'
                              }`}
                            />
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/edu-admin/result/edit/${item.slug || item._id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-[#00a0d2] hover:bg-[#008cb7] text-white rounded transition-colors shadow-2xs"
                            title="Edit Result"
                          >
                            <Edit size={11} />
                            <span>Edit</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(item._id, item.title)}
                            className="inline-flex items-center p-1 text-white bg-[#dc3232] hover:bg-[#c92c2c] rounded transition-colors shadow-2xs cursor-pointer"
                            title="Delete Result"
                          >
                            <Trash2 size={12} />
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

        {/* Pagination Footer */}
        <div className="px-3.5 py-2.5 bg-[#f6f7f7] border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing page <span className="font-bold">{page}</span> of{' '}
            <span className="font-bold">{pages}</span> ({total.toLocaleString()} total posts)
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-300 rounded text-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-medium">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="p-1 bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-300 rounded text-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Professional Reusable Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        isLoading={deleteModal.isLoading}
        itemName={deleteModal.title}
        title={deleteModal.isBulk ? 'Move Selected Results to Trash?' : 'Move Result Post to Trash?'}
        description={
          deleteModal.isBulk
            ? 'Are you sure you want to move all selected result posts to trash? You can restore them anytime from the Trashed tab.'
            : 'Are you sure you want to move this result post to trash? It will no longer be visible on the live website.'
        }
        confirmText="Yes, Move to Trash"
        cancelText="Cancel"
        onClose={() =>
          !deleteModal.isLoading &&
          setDeleteModal({ isOpen: false, id: null, title: '', isBulk: false, isLoading: false })
        }
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
