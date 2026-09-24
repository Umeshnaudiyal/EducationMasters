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

export default function AdmitCardsAdminPage() {
  const { data: session } = useSession();
  const isAuthor = session?.user?.role === 'author' || session?.user?.role === 'writer';
  const authorId = session?.user?.id;

  const [admitCards, setAdmitCards] = useState([]);
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
    all: 119,
    draft: 1,
    published: 106,
    pending: 12,
    trash: 24,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };

  const fetchAdmitCards = async () => {
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

      const res = await fetch(`${BACKEND_URL}/apis/v1/admit-cards?${queryParams}`, {
        cache: 'no-store',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-bypass-cache': '1',
        },
      });
      const data = await res.json();

      if (data.success && data.data) {
        setAdmitCards(data.data || []);
        setTotal(data.total || data.count || 0);
        setPages(data.pages || Math.ceil((data.total || 0) / 15) || 1);
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts);
        }
      }
    } catch (err) {
      console.error('Error fetching admit cards:', err);
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
      const res = await fetch(`${BACKEND_URL}/apis/v1/admit-cards?${new URLSearchParams(params)}`, {
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
    fetchAdmitCards();
  }, [page, statusTab, isAuthor, authorId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAdmitCards();
  };

  const handleStatusChange = async (id, newStatus, postTitle = '') => {
    setUpdatingId(id);
    const prevAdmitCards = [...admitCards];

    // Optimistic UI update
    setAdmitCards((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status: newStatus } : a))
    );

    try {
      const token = getAuthToken(session);
      const res = await fetch(`${BACKEND_URL}/apis/v1/admit-cards/${id}`, {
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
        showToast(`Status changed to "${label}" for "${postTitle || 'Admit Card'}"`, 'success');
        fetchStatusCounts();
      } else {
        setAdmitCards(prevAdmitCards);
        showToast(data.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      setAdmitCards(prevAdmitCards);
      showToast(err.message || 'Error updating status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(admitCards.map((a) => a._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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
          await fetch(`${BACKEND_URL}/apis/v1/admit-cards/${id}`, { method: 'DELETE', headers });
        }
        showToast(`Moved ${selectedIds.length} admit card(s) to trash`, 'success');
        setSelectedIds([]);
      } else if (deleteModal.id) {
        await fetch(`${BACKEND_URL}/apis/v1/admit-cards/${deleteModal.id}`, { method: 'DELETE', headers });
        showToast(`Moved "${deleteModal.title}" to trash`, 'success');
      }
      setDeleteModal({ isOpen: false, id: null, title: '', isBulk: false, isLoading: false });
      fetchAdmitCards();
    } catch (err) {
      console.error('Failed to delete admit card:', err);
      showToast('Failed to delete admit card', 'error');
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
        title: `${selectedIds.length} selected admit card(s)`,
        isBulk: true,
        isLoading: false,
      });
    } else if (bulkAction === 'publish' && selectedIds.length > 0) {
      for (const id of selectedIds) {
        await fetch(`${BACKEND_URL}/apis/v1/admit-cards/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: 'publish' }),
        });
      }
      setSelectedIds([]);
      showToast(`Published ${selectedIds.length} items`, 'success');
      fetchAdmitCards();
    } else if (bulkAction === 'draft' && selectedIds.length > 0) {
      for (const id of selectedIds) {
        await fetch(`${BACKEND_URL}/apis/v1/admit-cards/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: 'draft' }),
        });
      }
      setSelectedIds([]);
      showToast(`Drafted ${selectedIds.length} items`, 'success');
      fetchAdmitCards();
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

      {/* Top Header: Admit Cards + Add New Button */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-normal text-slate-900 tracking-tight">Admit Cards</h1>
        <Link
          href="/edu-admin/admit-card/create"
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

        {/* Top Right Search Posts Input Box */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 self-end md:self-auto">
          <input
            type="text"
            placeholder=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] w-44 sm:w-56 shadow-2xs"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-normal transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
          >
            Search Jobs
          </button>
        </form>
      </div>

      {/* Bulk Actions Toolbar */}
      <div className="flex items-center justify-between gap-2 py-0.5">
        <div className="flex items-center gap-1.5">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 font-normal focus:outline-none focus:border-[#2271b1] shadow-2xs min-w-[130px]"
          >
            <option value="">Bulk Actions</option>
            <option value="trash">Move to Trash</option>
          </select>
          <button
            type="button"
            onClick={handleBulkApply}
            className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-normal transition-colors shadow-2xs cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Data Table Matching Reference Screenshot Columns: [ ] | # | Job Post | Author | Department | Status | Action */}
      <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-[#f6f7f7] border-b border-slate-300 text-xs font-semibold text-slate-800">
              <tr>
                <th className="py-2 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === admitCards.length && admitCards.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                  />
                </th>
                <th className="py-2 px-3 w-10 text-center">#</th>
                <th className="py-2 px-3 min-w-[340px]">Job Post</th>
                <th className="py-2 px-3 min-w-[140px]">Author</th>
                <th className="py-2 px-3 min-w-[130px]">Department</th>
                <th className="py-2 px-3 min-w-[90px]">Status</th>
                <th className="py-2 px-3 text-right min-w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 bg-white">
                    <AdminLoader text="Loading Admit Cards..." subtext="Retrieving hall tickets and examination notices" />
                  </td>
                </tr>
              ) : admitCards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No admit cards found.
                  </td>
                </tr>
              ) : (
                admitCards.map((a) => {
                  const authorName = a.author?.name || a.author?.nicename || 'Admin';
                  const deptDisplay = a.department?.name || a.dept || '—';
                  const rawStatus = (a.status || 'publish').toLowerCase();
                  const isPublished = rawStatus === 'publish' || rawStatus === 'published' || rawStatus === 'active';
                  const isDraft = rawStatus === 'draft';
                  const isPending = rawStatus === 'pending' || rawStatus === 'pending_review';
                  const isTrash = rawStatus === 'trash';

                  return (
                    <tr key={a._id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(a._id)}
                          onChange={() => toggleSelect(a._id)}
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                        />
                      </td>

                      {/* Thumbnail */}
                      <td className="py-2.5 px-3 text-center">
                        <Link
                          href={`/admit-card/${a.slug || a._id}`}
                          target="_blank"
                          title="Preview Admit Card"
                          className="w-12 h-8 bg-slate-100 border border-slate-200 rounded flex items-center justify-center overflow-hidden mx-auto hover:opacity-90 transition-opacity block"
                        >
                          {a.featured_media ? (
                            <img
                              src={getImageUrl(a.featured_media)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={14} className="text-slate-400" />
                          )}
                        </Link>
                      </td>

                      {/* Job Post Title + Dynamic Relative Date */}
                      <td className="py-2.5 px-3">
                        <div className="space-y-0.5">
                          <Link
                            href={`/admit-card/${a.slug || a._id}`}
                            target="_blank"
                            title="Preview Admit Card"
                            className="font-semibold text-slate-900 hover:text-[#2271b1] transition-colors leading-snug line-clamp-2 block"
                          >
                            {a.title}
                          </Link>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                            <span>Posted: {formatTimeAgo(a.created_at)}</span>
                            <span>|</span>
                            <span>Edited: {formatDate(a.updated_at || a.created_at)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-2.5 px-3 text-xs text-slate-700 whitespace-nowrap">
                        {authorName}
                      </td>

                      {/* Department */}
                      <td className="py-2.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                        {deptDisplay}
                      </td>

                      {/* Status Dropdown Button */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="relative inline-flex items-center">
                          <select
                            value={
                              isPublished
                                ? 'publish'
                                : isPending
                                ? 'pending'
                                : isTrash
                                ? 'trash'
                                : 'draft'
                            }
                            disabled={updatingId === a._id}
                            onChange={(e) =>
                              handleStatusChange(a._id, e.target.value, a.title)
                            }
                            className={`text-xs font-semibold rounded-md px-2.5 py-0.5 border cursor-pointer appearance-none pr-6 focus:outline-none transition-all shadow-2xs ${
                              isPublished
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80 focus:ring-1 focus:ring-emerald-400'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/80 focus:ring-1 focus:ring-amber-400'
                                : isTrash
                                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/80 focus:ring-1 focus:ring-rose-400'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/80 focus:ring-1 focus:ring-slate-400'
                            } ${updatingId === a._id ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            {!isAuthor && <option value="publish">Published</option>}
                            <option value="pending">Pending</option>
                            <option value="draft">Draft</option>
                            <option value="trash">Trash</option>
                          </select>
                          {updatingId === a._id ? (
                            <span className="absolute right-1.5 w-3 h-3 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin pointer-events-none" />
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

                      {/* Action Buttons: Blue Edit Pen + Red Delete Trash */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/edu-admin/admit-card/edit/${a.slug || a._id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#0073aa] hover:bg-[#005a87] text-white rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                            title="Edit Admit Card"
                          >
                            <Edit size={11} />
                            <span>Edit</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(a._id, a.title)}
                            className="inline-flex items-center justify-center w-6 h-6 bg-[#d63638] hover:bg-[#b32d2e] text-white rounded shadow-2xs transition-colors cursor-pointer"
                            title="Move to Trash"
                          >
                            <Trash2 size={11} />
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

        {/* Table Footer with Pagination */}
        {pages > 1 && (
          <div className="bg-[#f6f7f7] px-3 py-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, total)} of {total} admit cards
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-2 py-0.5 bg-white border border-slate-300 rounded font-medium">
                {page} / {pages}
              </span>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(p + 1, pages))}
                className="p-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reusable Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        isLoading={deleteModal.isLoading}
        itemName={deleteModal.title}
        title={deleteModal.isBulk ? 'Move Selected Items to Trash?' : 'Move Admit Card to Trash?'}
        description={
          deleteModal.isBulk
            ? `Are you sure you want to move ${selectedIds.length} selected admit card(s) to trash?`
            : 'Are you sure you want to move this admit card to trash? You can restore it later from the Trashed tab.'
        }
        confirmText="Move to Trash"
        onConfirm={handleConfirmDelete}
        onClose={() =>
          setDeleteModal({ isOpen: false, id: null, title: '', isBulk: false, isLoading: false })
        }
      />
    </div>
  );
}
