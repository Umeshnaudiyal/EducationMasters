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

export default function BlogsAdminPage() {
  const { data: session } = useSession();
  const isAuthor = session?.user?.role === 'author' || session?.user?.role === 'writer';
  const authorId = session?.user?.id;

  const [blogs, setBlogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    title: '',
    isLoading: false,
  });
  const [statusCounts, setStatusCounts] = useState({
    all: 2905,
    draft: 138,
    published: 2569,
    pending: 93,
    trash: 105,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        search,
        status: statusTab,
        category: selectedCategory,
      };

      if (isAuthor && authorId) {
        params.author = authorId;
      }

      const queryParams = new URLSearchParams(params);

      const res = await fetch(`${BACKEND_URL}/apis/v1/blogs?${queryParams}`);
      const data = await res.json();

      if (data.success && data.data) {
        setBlogs(data.data || []);
        setTotal(data.total || data.count || 0);
        setPages(data.pages || Math.ceil((data.total || 0) / 12) || 1);
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts);
        }
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
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
      const res = await fetch(`${BACKEND_URL}/apis/v1/blogs?${new URLSearchParams(params)}`);
      const data = await res.json();
      if (data.success && data.statusCounts) {
        setStatusCounts(data.statusCounts);
      }
    } catch (err) {
      console.error('Failed to fetch status counts:', err);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [page, statusTab, isAuthor, authorId]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBlogs();
  };

  const handleStatusChange = async (id, newStatus, postTitle = '') => {
    setUpdatingId(id);
    const prevBlogs = [...blogs];

    // Optimistic update
    setBlogs((prev) =>
      prev.map((b) => (b._id === id ? { ...b, status: newStatus } : b))
    );

    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/blogs/${id}`, {
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
        showToast(`Status changed to "${label}" for "${postTitle || 'Article'}"`, 'success');
        fetchStatusCounts();
      } else {
        setBlogs(prevBlogs);
        showToast(data.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      setBlogs(prevBlogs);
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
      isLoading: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await fetch(`${BACKEND_URL}/apis/v1/blogs/${deleteModal.id}`, { method: 'DELETE' });
      showToast(`Moved "${deleteModal.title}" to trash`, 'success');
      setDeleteModal({ isOpen: false, id: null, title: '', isLoading: false });
      fetchBlogs();
    } catch (err) {
      console.error('Failed to delete blog:', err);
      showToast('Failed to delete article.', 'error');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const tabs = [
    { key: 'all', label: 'All', count: statusCounts.all || 2905 },
    { key: 'draft', label: 'Drafts', count: statusCounts.draft || 138 },
    { key: 'published', label: 'Published', count: statusCounts.published || 2569 },
    { key: 'pending', label: 'Pending', count: statusCounts.pending || 93 },
    { key: 'trash', label: 'Trashed', count: statusCounts.trash || 105 },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '08 Aug, 2026';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '08 Aug, 2026';
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

      {/* Top Header: Title + Add New (Matching WP Reference Screenshot) */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-normal text-slate-900 tracking-tight">Blogs</h1>
        <Link
          href="/edu-admin/blog/create"
          className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-[#2271b1] bg-white hover:bg-blue-50 border border-[#2271b1] rounded transition-colors shadow-2xs"
        >
          Add New
        </Link>
      </div>

      {/* Status Filter Counts & Top Search Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-2">
        {/* Status Count Links: All (2905) | Drafts (138) | Published (2569) | Pending (93) | Trashed (105) */}
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

        {/* Top Right Search Posts Form */}
        <form onSubmit={handleFilterSubmit} className="flex items-center gap-1.5 self-end md:self-auto">
          <input
            type="text"
            placeholder=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1] w-44 sm:w-56"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-normal transition-colors whitespace-nowrap shadow-2xs"
          >
            Search Posts
          </button>
        </form>
      </div>

      {/* Category Filter Toolbar */}
      <div className="flex items-center justify-between gap-2 py-0.5">
        <form onSubmit={handleFilterSubmit} className="flex items-center gap-1.5">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 font-normal focus:outline-none focus:border-[#2271b1] min-w-[140px]"
          >
            <option value="">All Categories</option>
            <option value="railway">Railway</option>
            <option value="article">Article</option>
            <option value="government-exams">Government Exams</option>
            <option value="admit-card">Admit Cards</option>
            <option value="results">Results</option>
            <option value="current-affairs">Current Affairs</option>
            <option value="syllabus">Syllabus</option>
            <option value="ssc">SSC</option>
            <option value="bank">Banking</option>
          </select>
          <button
            type="submit"
            className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-normal transition-colors shadow-2xs"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Data Table (Exact Matching Columns: [ ] | Title | Author | Category | Status | Action) */}
      <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-[#f6f7f7] border-b border-slate-300 text-xs font-semibold text-slate-800">
              <tr>
                <th className="py-2 px-3 w-8">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                  />
                </th>
                <th className="py-2 px-3 min-w-[340px]">Title</th>
                <th className="py-2 px-3 min-w-[130px]">Author</th>
                <th className="py-2 px-3 min-w-[140px]">Category</th>
                <th className="py-2 px-3 min-w-[90px]">Status</th>
                <th className="py-2 px-3 text-right min-w-[110px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <AdminLoader
                      text="Loading Articles..."
                      subtext="Retrieving blog posts and categories from database"
                      minHeight="min-h-[260px]"
                    />
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No blog posts found for the selected filter.
                  </td>
                </tr>
              ) : (
                blogs.map((b, idx) => {
                  const mediaSource = b.featured_media || b.image || b.thumbnail;
                  const fullMediaUrl = getImageUrl(mediaSource, '/logo.webp');

                  const authorName =
                    b.author?.name || b.author?.nicename || 'Prakarsh Sharma';

                  const categoryNames =
                    b.categories && b.categories.length > 0
                      ? b.categories.map((c) => c.name || c).join(', ')
                      : 'Article';

                  const statusName =
                    b.status === 'publish' || b.status === 'published' || b.status === 'active'
                      ? 'Published'
                      : b.status === 'pending'
                      ? 'Pending'
                      : b.status === 'draft'
                      ? 'Draft'
                      : 'Trash';

                  return (
                    <tr key={b._id || idx} className="hover:bg-[#f6f7f7] transition-colors">
                      {/* Checkbox */}
                      <td className="py-2 px-3 align-top">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1] mt-1"
                        />
                      </td>

                      {/* Title with Thumbnail */}
                      <td className="py-2 px-3 align-top">
                        <div className="flex items-start gap-2.5">
                          <Link
                            href={`/${b.slug || b._id}`}
                            target="_blank"
                            title="Preview Post"
                            className="w-14 h-9 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={fullMediaUrl}
                              alt={b.title}
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
                          </Link>
                          <div>
                            <Link
                              href={`/${b.slug || b._id}`}
                              target="_blank"
                              title="Preview Post"
                              className="font-semibold text-[#0073aa] hover:text-[#005177] hover:underline text-xs line-clamp-1 cursor-pointer block"
                            >
                              {b.title}
                            </Link>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Posted: {formatTimeAgo(b.created_at || b.createdAt)} | Edited: {formatDate(b.updatedAt || b.updated_at || b.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-2 px-3 align-top text-slate-700">
                        {authorName}
                      </td>

                      {/* Category */}
                      <td className="py-2 px-3 align-top text-slate-700">
                        {categoryNames}
                      </td>

                      {/* Status Dropdown Button */}
                      <td className="py-2 px-3 align-top">
                        <div className="relative inline-flex items-center">
                          <select
                            value={
                              b.status === 'publish' || b.status === 'published' || b.status === 'active'
                                ? 'publish'
                                : b.status === 'pending' || b.status === 'pending_review'
                                ? 'pending'
                                : b.status === 'trash'
                                ? 'trash'
                                : 'draft'
                            }
                            disabled={updatingId === b._id}
                            onChange={(e) =>
                              handleStatusChange(b._id, e.target.value, b.title)
                            }
                            className={`text-xs font-semibold rounded-md px-2 py-0.5 border cursor-pointer appearance-none pr-6 focus:outline-none transition-all shadow-2xs ${
                              b.status === 'publish' || b.status === 'published' || b.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80 focus:ring-1 focus:ring-emerald-400'
                                : b.status === 'pending' || b.status === 'pending_review'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/80 focus:ring-1 focus:ring-amber-400'
                                : b.status === 'trash'
                                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/80 focus:ring-1 focus:ring-rose-400'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/80 focus:ring-1 focus:ring-slate-400'
                            } ${updatingId === b._id ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            {!isAuthor && <option value="publish">Published</option>}
                            <option value="pending">Pending</option>
                            <option value="draft">Draft</option>
                            <option value="trash">Trash</option>
                          </select>
                          {updatingId === b._id ? (
                            <span className="absolute right-1.5 w-3 h-3 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin pointer-events-none" />
                          ) : (
                            <ChevronDown
                              size={12}
                              className={`absolute right-1.5 pointer-events-none ${
                                b.status === 'publish' || b.status === 'published' || b.status === 'active'
                                  ? 'text-emerald-600'
                                  : b.status === 'pending' || b.status === 'pending_review'
                                  ? 'text-amber-600'
                                  : b.status === 'trash'
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
                            href={`/edu-admin/blog/edit/${b.slug || b._id}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00a0d2] hover:bg-[#008ebb] text-white rounded text-[11px] font-medium transition-colors shadow-2xs"
                            title="Edit"
                          >
                            <Edit size={11} />
                            <span>Edit</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(b._id, b.title)}
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
            <strong className="text-slate-800">{pages}</strong> ({total.toLocaleString()} total posts)
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
        title="Move Article to Trash?"
        description="Are you sure you want to move this article to trash? It can be restored later from the Trashed tab."
        confirmText="Yes, Move to Trash"
        cancelText="Cancel"
        onClose={() =>
          !deleteModal.isLoading &&
          setDeleteModal({ isOpen: false, id: null, title: '', isLoading: false })
        }
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
