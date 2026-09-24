'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Landmark,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  X,
  ExternalLink,
} from 'lucide-react';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { getImageUrl } from '@/utils/image';
import { getAuthToken } from '@/utils/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function StatesListPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Data states
  const [states, setStates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Notifications
  const [serverMessage, setServerMessage] = useState(null);

  const getActiveToken = useCallback(() => {
    return getAuthToken(session);
  }, [session]);

  // Fetch States
  const fetchStates = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: activeSearch,
      });

      const token = getActiveToken();
      const res = await fetch(`${BACKEND_URL}/apis/v1/states?${query.toString()}`, {
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
        setStates(data.data || []);
        setTotal(data.total || 0);
        setPages(data.pages || Math.ceil((data.total || 0) / limit) || 1);
      } else {
        setServerMessage({ type: 'error', text: data.message || 'Failed to load states list' });
      }
    } catch (err) {
      console.error('Error fetching states:', err);
      setServerMessage({ type: 'error', text: 'Error connecting to server. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeSearch, getActiveToken]);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  // Search trigger
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveSearch(searchTerm.trim());
    setPage(1);
    setSelectedIds([]);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearch('');
    setPage(1);
    setSelectedIds([]);
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(states.map((s) => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Delete
  const handleApplyBulkAction = async () => {
    if (!bulkAction) return;
    if (selectedIds.length === 0) {
      alert('Please select at least one state to apply bulk action.');
      return;
    }

    if (bulkAction === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected states?`)) {
        return;
      }

      try {
        setBulkLoading(true);
        const token = getActiveToken();
        const res = await fetch(`${BACKEND_URL}/apis/v1/states/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: 'delete', ids: selectedIds }),
        });
        const data = await res.json();

        if (data.success) {
          setServerMessage({ type: 'success', text: `Successfully deleted ${selectedIds.length} states` });
          setSelectedIds([]);
          setBulkAction('');
          fetchStates();
        } else {
          setServerMessage({ type: 'error', text: data.message || 'Failed to perform bulk action' });
        }
      } catch (err) {
        console.error('Bulk delete error:', err);
        setServerMessage({ type: 'error', text: 'Network error during bulk delete' });
      } finally {
        setBulkLoading(false);
      }
    }
  };

  // Single Delete
  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete?._id) return;

    try {
      setDeleting(true);
      const token = getActiveToken();
      const res = await fetch(`${BACKEND_URL}/apis/v1/states/${itemToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();

      if (data.success) {
        setServerMessage({ type: 'success', text: `State "${itemToDelete.name}" deleted successfully.` });
        setDeleteModalOpen(false);
        setItemToDelete(null);
        setSelectedIds((prev) => prev.filter((id) => id !== itemToDelete._id));
        fetchStates();
      } else {
        setServerMessage({ type: 'error', text: data.message || 'Failed to delete state.' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      setServerMessage({ type: 'error', text: 'Error connecting to server to delete state.' });
    } finally {
      setDeleting(false);
    }
  };

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="w-full space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Landmark size={24} className="text-[#2271b1]" />
            <span>States Management</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {total} {total === 1 ? 'State' : 'States'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage Indian states, administrative information, capital, leadership details, and comprehensive study guides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/edu-admin/states/create"
            className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>Add New State</span>
          </Link>
        </div>
      </div>

      {/* Alert Notifications */}
      {serverMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs sm:text-sm animate-in fade-in duration-200 ${
            serverMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {serverMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{serverMessage.text}</div>
          <button
            type="button"
            onClick={() => setServerMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter, Bulk Actions & Search Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Bulk Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-[#2271b1]"
          >
            <option value="">Bulk actions</option>
            <option value="delete">Delete Selected</option>
          </select>
          <button
            type="button"
            onClick={handleApplyBulkAction}
            disabled={bulkLoading || !bulkAction || selectedIds.length === 0}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
          >
            {bulkLoading && <Loader2 size={12} className="animate-spin" />}
            <span>Apply</span>
          </button>
          {selectedIds.length > 0 && (
            <span className="text-xs text-slate-500 font-medium">
              ({selectedIds.length} selected)
            </span>
          )}
        </div>

        {/* Right: Search & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search states, capital, CM..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            />
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={() => fetchStates()}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-300 transition-colors cursor-pointer shrink-0"
            title="Refresh List"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Full-Width States Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={states.length > 0 && selectedIds.length === states.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-2 w-10 text-center text-slate-400 font-semibold">#</th>
                <th className="py-3 px-2 w-14 text-center">Image</th>
                <th className="py-3 px-3 min-w-[160px]">State Name</th>
                <th className="py-3 px-3 min-w-[120px]">Slug</th>
                <th className="py-3 px-3 min-w-[90px]">State No.</th>
                <th className="py-3 px-3 min-w-[120px]">Capital</th>
                <th className="py-3 px-3 min-w-[140px]">Chief Minister</th>
                <th className="py-3 px-3 min-w-[140px]">Governor</th>
                <th className="py-3 px-3 w-28 text-right pr-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <Loader2 size={24} className="animate-spin text-[#2271b1] mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Loading states...</p>
                  </td>
                </tr>
              ) : states.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <Landmark size={36} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700 mb-1">No states found</p>
                    <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                      {activeSearch
                        ? `No results match your search "${activeSearch}". Try a different keyword.`
                        : 'Get started by creating the first state in your database.'}
                    </p>
                    <Link
                      href="/edu-admin/states/create"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      <Plus size={14} />
                      <span>Add New State</span>
                    </Link>
                  </td>
                </tr>
              ) : (
                states.map((item, index) => {
                  const isChecked = selectedIds.includes(item._id);
                  const rowNum = (page - 1) * limit + index + 1;
                  const thumbUrl = item.image ? getImageUrl(item.image) : null;

                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(item._id)}
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
                        />
                      </td>

                      {/* Row Index */}
                      <td className="py-3 px-2 text-center text-slate-400 font-mono text-[11px]">
                        {rowNum}
                      </td>

                      {/* Thumbnail */}
                      <td className="py-3 px-2 text-center">
                        <div className="w-9 h-9 rounded border border-slate-200 bg-white flex items-center justify-center overflow-hidden mx-auto shadow-2xs">
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={item.name}
                              className="w-full h-full object-contain p-0.5"
                            />
                          ) : (
                            <ImageIcon size={14} className="text-slate-300" />
                          )}
                        </div>
                      </td>

                      {/* State Name */}
                      <td className="py-3 px-3">
                        <Link
                          href={`/edu-admin/states/edit/${item._id}`}
                          className="font-bold text-slate-900 hover:text-[#2271b1] transition-colors flex items-center gap-1.5"
                        >
                          <span>{item.name}</span>
                        </Link>
                        {item.land_area && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Area: {item.land_area}
                          </span>
                        )}
                      </td>

                      {/* Slug */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.slug}
                        </span>
                      </td>

                      {/* State Number */}
                      <td className="py-3 px-3 text-slate-700">
                        {item.state_number ? (
                          <span className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                            {item.state_number}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Capital */}
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {item.capital || <span className="text-slate-400">—</span>}
                      </td>

                      {/* Chief Minister */}
                      <td className="py-3 px-3 text-slate-700">
                        {item.chief_minister || <span className="text-slate-400">—</span>}
                      </td>

                      {/* Governor */}
                      <td className="py-3 px-3 text-slate-700">
                        {item.governor || <span className="text-slate-400">—</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <Link
                            href={`/edu-admin/states/edit/${item._id}`}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Edit State"
                          >
                            <Edit2 size={14} />
                          </Link>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(item)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete State"
                          >
                            <Trash2 size={14} />
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
        {total > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Showing <span className="font-semibold text-slate-800">{startItem}</span> to{' '}
              <span className="font-semibold text-slate-800">{endItem}</span> of{' '}
              <span className="font-semibold text-slate-800">{total}</span> results
            </div>

            {pages > 1 && (
              <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200 transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: pages }, (_, i) => i + 1).map((num) => {
                  const isCurrent = num === page;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPage(num)}
                      className={`px-3 py-1.5 border-r border-slate-200 last:border-r-0 font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-[#2271b1] text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete State"
          description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
          itemName={itemToDelete?.name}
          confirmText="Delete State"
          type="danger"
          isLoading={deleting}
        />
      )}
    </div>
  );
}
