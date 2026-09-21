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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function JobsAdminPage() {
  const { data: session } = useSession();
  const isAuthor = session?.user?.role === 'author' || session?.user?.role === 'writer';
  const authorId = session?.user?.id;

  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
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
    all: 2905,
    draft: 138,
    published: 2669,
    pending: 93,
    trash: 105,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search,
        status: statusTab,
        category: selectedCategory,
      };

      if (isAuthor && authorId) {
        params.author = authorId;
      }

      const queryParams = new URLSearchParams(params);

      const res = await fetch(`${BACKEND_URL}/apis/v1/jobs?${queryParams}`);
      const data = await res.json();

      if (data.success && data.data) {
        setJobs(data.data || []);
        setTotal(data.total || data.count || 0);
        setPages(data.pages || Math.ceil((data.total || 0) / 15) || 1);
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts);
        }
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
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
      const res = await fetch(`${BACKEND_URL}/apis/v1/jobs?${new URLSearchParams(params)}`);
      const data = await res.json();
      if (data.success && data.statusCounts) {
        setStatusCounts(data.statusCounts);
      }
    } catch (err) {
      console.error('Failed to fetch status counts:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, statusTab, isAuthor, authorId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleStatusChange = async (id, newStatus, postTitle = '') => {
    setUpdatingId(id);
    const prevJobs = [...jobs];

    // Optimistic UI update
    setJobs((prev) =>
      prev.map((j) => (j._id === id ? { ...j, status: newStatus } : j))
    );

    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
        showToast(`Status changed to "${label}" for "${postTitle || 'Job'}"`, 'success');
        fetchStatusCounts();
      } else {
        setJobs(prevJobs);
        showToast(data.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      setJobs(prevJobs);
      showToast(err.message || 'Error updating status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(jobs.map((j) => j._id));
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
      if (deleteModal.isBulk) {
        for (const id of selectedIds) {
          await fetch(`${BACKEND_URL}/apis/v1/jobs/${id}`, { method: 'DELETE' });
        }
        showToast(`Moved ${selectedIds.length} job(s) to trash`, 'success');
        setSelectedIds([]);
      } else if (deleteModal.id) {
        await fetch(`${BACKEND_URL}/apis/v1/jobs/${deleteModal.id}`, { method: 'DELETE' });
        showToast(`Moved "${deleteModal.title}" to trash`, 'success');
      }
      setDeleteModal({ isOpen: false, id: null, title: '', isBulk: false, isLoading: false });
      fetchJobs();
    } catch (err) {
      console.error('Failed to delete job:', err);
      showToast('Failed to delete job post.', 'error');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleBulkApply = async () => {
    if (bulkAction === 'trash' && selectedIds.length > 0) {
      setDeleteModal({
        isOpen: true,
        id: null,
        title: `${selectedIds.length} selected job post(s)`,
        isBulk: true,
        isLoading: false,
      });
    } else if (bulkAction === 'publish' && selectedIds.length > 0) {
      for (const id of selectedIds) {
        await fetch(`${BACKEND_URL}/apis/v1/jobs/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'publish' }),
        });
      }
      setSelectedIds([]);
      showToast(`Published ${selectedIds.length} items`, 'success');
      fetchJobs();
    } else if (bulkAction === 'draft' && selectedIds.length > 0) {
      for (const id of selectedIds) {
        await fetch(`${BACKEND_URL}/apis/v1/jobs/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'draft' }),
        });
      }
      setSelectedIds([]);
      showToast(`Drafted ${selectedIds.length} items`, 'success');
      fetchJobs();
    }
  };

  const tabs = [
    { key: 'all', label: 'All', count: statusCounts.all || 2905 },
    { key: 'draft', label: 'Drafts', count: statusCounts.draft || 138 },
    { key: 'published', label: 'Published', count: statusCounts.published || 2669 },
    { key: 'pending', label: 'Pending', count: statusCounts.pending || 93 },
    { key: 'trash', label: 'Trashed', count: statusCounts.trash || 105 },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '17 Sep, 2026';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '17 Sep, 2026';
    }
  };

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

      {/* Top Header: Jobs + Add New (Matching WP Reference Screenshot) */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-normal text-slate-900 tracking-tight">Jobs</h1>
        <Link
          href="/edu-admin/job/create"
          className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-[#2271b1] bg-white hover:bg-blue-50 border border-[#2271b1] rounded transition-colors shadow-2xs"
        >
          Add New
        </Link>
      </div>

      {/* Status Filter Counts Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-2">
        {/* Status Count Links: All (2905) | Drafts (138) | Published (2669) | Pending (93) | Trashed (105) */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 flex-wrap">
          {tabs.map((tab, idx) => (
            <React.Fragment key={tab.key}>
              <button
                onClick={() => {
                  setStatusTab(tab.key);
                  setPage(1);
                }}
                className={`hover:text-[#2271b1] transition-colors flex items-center gap-1 ${
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
            Search Posts
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

      {/* Data Table (Exact Matching Columns: [ ] | # | Job | Author | Category | Status | Action) */}
      <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-[#f6f7f7] border-b border-slate-300 text-xs font-semibold text-slate-800">
              <tr>
                <th className="py-2 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === jobs.length && jobs.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                  />
                </th>
                <th className="py-2 px-3 w-10 text-center">#</th>
                <th className="py-2 px-3 min-w-[340px]">Job</th>
                <th className="py-2 px-3 min-w-[130px]">Author</th>
                <th className="py-2 px-3 min-w-[120px]">Category</th>
                <th className="py-2 px-3 min-w-[90px]">Status</th>
                <th className="py-2 px-3 text-right min-w-[110px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AdminLoader text="Loading Job Posts..." subtext="Retrieving govt job records from database" minHeight="min-h-[160px]" />
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No jobs found for the selected filter.
                  </td>
                </tr>
              ) : (
                jobs.map((j, idx) => {
                  const mediaSource = j.featured_media || j.image;
                  const fullMediaUrl = getImageUrl(mediaSource, '/logo.webp');

                  const authorName =
                    j.author?.name || j.author?.nicename || 'Mohit';

                  const categoryNames =
                    j.categories && j.categories.length > 0
                      ? j.categories.map((c) => c.name || c).join(', ')
                      : 'Jobs';

                  const statusName =
                    j.status === 'publish' || j.status === 'published' || j.status === 'active'
                      ? 'Published'
                      : j.status === 'pending' || j.status === 'pending_review'
                      ? 'Pending'
                      : j.status === 'draft'
                      ? 'Draft'
                      : 'Trash';

                  const isChecked = selectedIds.includes(j._id);

                  return (
                    <tr key={j._id || idx} className="hover:bg-[#f6f7f7] transition-colors">
                      {/* Checkbox */}
                      <td className="py-2 px-3 align-middle text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(j._id)}
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                        />
                      </td>

                      {/* Row Index */}
                      <td className="py-2 px-3 align-middle text-center text-slate-400 font-mono text-[11px]">
                        {(page - 1) * 15 + idx + 1}
                      </td>

                      {/* Job Title with Thumbnail */}
                      <td className="py-2 px-3 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="w-14 h-9 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                            <img
                              src={fullMediaUrl}
                              alt={j.title}
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
                          <div>
                            <Link
                              href={`/edu-admin/job/edit/${j.slug || j._id}`}
                              className="font-semibold text-[#0073aa] hover:text-[#005177] hover:underline text-xs line-clamp-1 cursor-pointer block"
                            >
                              {j.title}
                            </Link>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Posted: {formatTimeAgo(j.created_at || j.createdAt)} | Edited: {formatDate(j.updatedAt || j.updated_at || j.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-2 px-3 align-top text-slate-700 font-normal">
                        {authorName}
                      </td>

                      {/* Category */}
                      <td className="py-2 px-3 align-top text-slate-700 font-normal">
                        {categoryNames}
                      </td>

                      {/* Status Dropdown Button */}
                      <td className="py-2 px-3 align-top">
                        <div className="relative inline-flex items-center">
                          <select
                            value={
                              j.status === 'publish' || j.status === 'published' || j.status === 'active'
                                ? 'publish'
                                : j.status === 'pending' || j.status === 'pending_review'
                                ? 'pending'
                                : j.status === 'trash'
                                ? 'trash'
                                : 'draft'
                            }
                            disabled={updatingId === j._id}
                            onChange={(e) =>
                              handleStatusChange(j._id, e.target.value, j.title)
                            }
                            className={`text-xs font-semibold rounded-md px-2.5 py-0.5 border cursor-pointer appearance-none pr-6 focus:outline-none transition-all shadow-2xs ${
                              j.status === 'publish' || j.status === 'published' || j.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80 focus:ring-1 focus:ring-emerald-400'
                                : j.status === 'pending' || j.status === 'pending_review'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/80 focus:ring-1 focus:ring-amber-400'
                                : j.status === 'trash'
                                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/80 focus:ring-1 focus:ring-rose-400'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/80 focus:ring-1 focus:ring-slate-400'
                            } ${updatingId === j._id ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            {!isAuthor && <option value="publish">Published</option>}
                            <option value="pending">Pending</option>
                            <option value="draft">Draft</option>
                            <option value="trash">Trash</option>
                          </select>
                          {updatingId === j._id ? (
                            <span className="absolute right-1.5 w-3 h-3 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin pointer-events-none" />
                          ) : (
                            <ChevronDown
                              size={12}
                              className={`absolute right-1.5 pointer-events-none ${
                                j.status === 'publish' || j.status === 'published' || j.status === 'active'
                                  ? 'text-emerald-600'
                                  : j.status === 'pending' || j.status === 'pending_review'
                                  ? 'text-amber-600'
                                  : j.status === 'trash'
                                  ? 'text-rose-600'
                                  : 'text-slate-600'
                              }`}
                            />
                          )}
                        </div>
                      </td>

                      {/* Action Buttons: Cyan Edit + Red Trash */}
                      <td className="py-2 px-3 align-top text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Link
                            href={`/edu-admin/job/edit/${j.slug || j._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#00a0d2] hover:bg-[#008ebb] text-white rounded text-[11px] font-medium transition-colors shadow-2xs"
                            title="Edit Job"
                          >
                            <Edit size={11} />
                            <span>Edit</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(j._id, j.title)}
                            className="p-1 bg-[#dc3232] hover:bg-[#b32d2e] text-white rounded transition-colors shadow-2xs cursor-pointer"
                            title="Trash"
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

        {/* Pagination Footer */}
        <div className="p-2.5 bg-[#f6f7f7] border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div>
            Showing page <strong className="text-slate-800">{page}</strong> of{' '}
            <strong className="text-slate-800">{pages}</strong> ({total.toLocaleString()} total jobs)
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded border border-slate-300 transition-colors text-slate-700 shadow-2xs cursor-pointer"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="px-2 font-semibold text-slate-700 text-xs">{page}</span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="p-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded border border-slate-300 transition-colors text-slate-700 shadow-2xs cursor-pointer"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Professional Reusable Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        isLoading={deleteModal.isLoading}
        itemName={deleteModal.title}
        title={deleteModal.isBulk ? 'Move Selected Jobs to Trash?' : 'Move Job Post to Trash?'}
        description={
          deleteModal.isBulk
            ? 'Are you sure you want to move all selected job posts to trash? You can restore them anytime from the Trashed tab.'
            : 'Are you sure you want to move this job post to trash? It will no longer be visible on the live website.'
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
