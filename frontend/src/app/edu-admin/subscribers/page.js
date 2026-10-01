'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Mail,
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Download,
  Phone,
  MessageCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
} from 'lucide-react';
import AdminLoader from '@/components/admin/AdminLoader';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { getAuthToken } from '@/utils/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

const INTEREST_PRESETS = [
  'All Updates (GK, Jobs, Exams, Study Material)',
  'UPSC Civil Services & IAS',
  'SSC CGL / CHSL / MTS',
  'Railway RRB NTPC & Group D',
  'Banking PO & Clerk (IBPS / SBI)',
  'State Police & Defence Exams',
  'Daily Current Affairs & GK MCQs',
];

export default function SubscribersManagementPage() {
  const { data: session } = useSession();

  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Selected for Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  // Modals & Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: 'All Updates (GK, Jobs, Exams, Study Material)',
    active: true,
  });
  const [saving, setSaving] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    title: '',
    isBulk: false,
    isLoading: false,
  });

  // Toast notification
  const [toast, setToast] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const copyToClipboard = (text, fieldId) => {
    if (!text || typeof window === 'undefined') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Fetch Subscribers
  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search.trim(),
        status: statusFilter,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      const token = getAuthToken(session);
      const res = await fetch(`${BACKEND_URL}/apis/v1/subscribers?${queryParams}`, {
        cache: 'no-store',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-bypass-cache': '1',
        },
      });

      const json = await res.json();
      if (json.success) {
        setSubscribers(json.data || []);
        setTotal(json.total || 0);
        setPages(json.pages || 1);
        if (json.stats) {
          setStats(json.stats);
        }
      } else {
        showToast(json.message || 'Failed to fetch subscribers', 'error');
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      showToast('Failed to load subscribers. Check server connection.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, session]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSubscribers();
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
    setSelectedIds([]);
  };

  // Modal Open For Create
  const handleOpenCreateModal = () => {
    setEditingSubscriber(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      interest: 'All Updates (GK, Jobs, Exams, Study Material)',
      active: true,
    });
    setIsModalOpen(true);
  };

  // Modal Open For Edit
  const handleOpenEditModal = (subscriber) => {
    setEditingSubscriber(subscriber);
    setFormData({
      name: subscriber.name || '',
      email: subscriber.email || '',
      phone: subscriber.phone || '',
      interest: subscriber.interest || 'All Updates (GK, Jobs, Exams, Study Material)',
      active: subscriber.active !== false,
    });
    setIsModalOpen(true);
  };

  // Save / Submit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email && !formData.phone) {
      showToast('Please provide at least an Email address or Phone number.', 'error');
      return;
    }

    try {
      setSaving(true);
      const token = getAuthToken(session);
      const isEditing = Boolean(editingSubscriber);
      const url = isEditing
        ? `${BACKEND_URL}/apis/v1/subscribers/${editingSubscriber._id}`
        : `${BACKEND_URL}/apis/v1/subscribers`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        showToast(isEditing ? 'Subscriber updated successfully!' : 'Subscriber added successfully!');
        setIsModalOpen(false);
        fetchSubscribers();
      } else {
        showToast(json.message || 'Failed to save subscriber.', 'error');
      }
    } catch (err) {
      console.error('Error saving subscriber:', err);
      showToast('Error saving subscriber details.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (subscriber) => {
    try {
      const token = getAuthToken(session);
      const newStatus = !subscriber.active;
      const res = await fetch(`${BACKEND_URL}/apis/v1/subscribers/${subscriber._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ active: newStatus }),
      });

      const json = await res.json();
      if (json.success) {
        setSubscribers((prev) =>
          prev.map((s) => (s._id === subscriber._id ? { ...s, active: newStatus } : s))
        );
        showToast(`Subscriber ${newStatus ? 'activated' : 'deactivated'} successfully.`);
        // Update stats
        setStats((prev) => ({
          ...prev,
          active: newStatus ? prev.active + 1 : Math.max(0, prev.active - 1),
          inactive: !newStatus ? prev.inactive + 1 : Math.max(0, prev.inactive - 1),
        }));
      } else {
        showToast(json.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      showToast('Error toggling status.', 'error');
    }
  };

  // Delete Single Modal Trigger
  const handleDeleteClick = (subscriber) => {
    setDeleteModal({
      isOpen: true,
      id: subscriber._id,
      title: subscriber.name || subscriber.email || subscriber.phone || 'Subscriber',
      isBulk: false,
      isLoading: false,
    });
  };

  // Bulk Delete Modal Trigger
  const handleBulkDeleteClick = () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one subscriber.', 'error');
      return;
    }
    setDeleteModal({
      isOpen: true,
      id: null,
      title: `${selectedIds.length} Subscribers`,
      isBulk: true,
      isLoading: false,
    });
  };

  // Confirm Delete Action
  const handleConfirmDelete = async () => {
    try {
      setDeleteModal((prev) => ({ ...prev, isLoading: true }));
      const token = getAuthToken(session);

      if (deleteModal.isBulk) {
        const res = await fetch(`${BACKEND_URL}/apis/v1/subscribers/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ ids: selectedIds, action: 'delete' }),
        });
        const json = await res.json();
        if (json.success) {
          showToast(json.message || 'Selected subscribers deleted.');
          setSelectedIds([]);
          setDeleteModal({ isOpen: false, id: null, title: '', isBulk: false, isLoading: false });
          fetchSubscribers();
        } else {
          showToast(json.message || 'Failed to delete selected subscribers.', 'error');
        }
      } else {
        const res = await fetch(`${BACKEND_URL}/apis/v1/subscribers/${deleteModal.id}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (json.success) {
          showToast('Subscriber deleted successfully.');
          setDeleteModal({ isOpen: false, id: null, title: '', isBulk: false, isLoading: false });
          fetchSubscribers();
        } else {
          showToast(json.message || 'Failed to delete subscriber.', 'error');
        }
      }
    } catch (err) {
      console.error('Delete subscriber error:', err);
      showToast('Error executing delete operation.', 'error');
    } finally {
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Bulk Action Apply (Activate / Deactivate)
  const handleApplyBulkAction = async () => {
    if (!bulkAction) {
      showToast('Please select a bulk action from the dropdown.', 'error');
      return;
    }
    if (selectedIds.length === 0) {
      showToast('Please select at least one subscriber.', 'error');
      return;
    }

    if (bulkAction === 'delete') {
      handleBulkDeleteClick();
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken(session);
      const res = await fetch(`${BACKEND_URL}/apis/v1/subscribers/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ids: selectedIds, action: bulkAction }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setSelectedIds([]);
        setBulkAction('');
        fetchSubscribers();
      } else {
        showToast(json.message || 'Failed to apply bulk action.', 'error');
      }
    } catch (err) {
      console.error('Bulk action error:', err);
      showToast('Error applying bulk action.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      showToast('No subscribers available to export.', 'error');
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Exam Interest', 'Status', 'Date Subscribed'];
    const rows = subscribers.map((s, idx) => [
      s.sql_id || s._id || idx + 1,
      `"${String(s.name || '').replace(/"/g, '""')}"`,
      `"${String(s.email || '').replace(/"/g, '""')}"`,
      `"${String(s.phone || '').replace(/"/g, '""')}"`,
      `"${String(s.interest || '').replace(/"/g, '""')}"`,
      s.active ? 'Active' : 'Inactive',
      `"${new Date(s.created_at || s.createdAt || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `education_masters_subscribers_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Subscribers CSV exported successfully!');
  };

  // Select all checkbox handler
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(subscribers.map((s) => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = subscribers.length > 0 && selectedIds.length === subscribers.length;

  return (
    <div className="w-full min-h-full space-y-3 select-none font-sans text-slate-800">
      
      {/* Toast Alert */}
      {toast && (
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
            <Check size={14} className="text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP HEADER: Title + Add New + Export CSV (Matching WP/Admin Reference) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-normal text-slate-900 tracking-tight">Subscribers</h1>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-[#2271b1] bg-white hover:bg-blue-50 border border-[#2271b1] rounded transition-colors shadow-2xs cursor-pointer"
          >
            Add New
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Export CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* STATUS FILTER TABS & SEARCH ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-2 text-xs">
        
        {/* Status Count Links */}
        <div className="flex items-center gap-2 text-slate-500 flex-wrap">
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            className={`cursor-pointer transition ${
              statusFilter === 'all'
                ? 'font-bold text-slate-900'
                : 'hover:text-blue-600 text-blue-700'
            }`}
          >
            All <span className="text-slate-400 font-normal">({stats.total})</span>
          </button>
          <span>|</span>

          <button
            type="button"
            onClick={() => handleFilterChange('active')}
            className={`cursor-pointer transition ${
              statusFilter === 'active'
                ? 'font-bold text-slate-900'
                : 'hover:text-emerald-700 text-emerald-600'
            }`}
          >
            Active <span className="text-slate-400 font-normal">({stats.active})</span>
          </button>
          <span>|</span>

          <button
            type="button"
            onClick={() => handleFilterChange('inactive')}
            className={`cursor-pointer transition ${
              statusFilter === 'inactive'
                ? 'font-bold text-slate-900'
                : 'hover:text-slate-700 text-slate-600'
            }`}
          >
            Inactive <span className="text-slate-400 font-normal">({stats.inactive})</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-auto flex items-center gap-1.5">
          <div className="relative flex-1 md:w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subscribers..."
              className="pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
            />
          </div>

          <button
            type="submit"
            className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2c3338] border border-slate-300 text-xs font-medium rounded transition cursor-pointer shrink-0"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              fetchSubscribers();
            }}
            className="p-1.5 bg-[#f6f7f7] hover:bg-[#f0f0f1] text-slate-600 border border-slate-300 rounded transition cursor-pointer shrink-0"
            title="Refresh"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </form>

      </div>

      {/* BULK ACTIONS & PAGINATION ROW */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs py-1">
        <div className="w-full sm:w-auto flex items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal flex-1 sm:flex-initial"
          >
            <option value="">Bulk actions</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
            <option value="delete">Delete</option>
          </select>

          <button
            type="button"
            onClick={handleApplyBulkAction}
            disabled={selectedIds.length === 0 || !bulkAction}
            className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-[#f0f0f1] disabled:opacity-50 disabled:cursor-not-allowed text-[#2c3338] border border-slate-300 text-xs font-medium rounded transition cursor-pointer shrink-0"
          >
            Apply
          </button>

          {selectedIds.length > 0 && (
            <span className="text-slate-500 text-xs">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        {/* Limit and total count */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{total} items</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs focus:outline-none"
          >
            <option value={15}>15 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* FULL-WIDTH DATA CONTAINER: Mobile Cards (block md:hidden) + Desktop Table (hidden md:block) */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden w-full">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <AdminLoader text="Loading subscribers..." subtext="Fetching registered newsletter leads" />
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center space-y-2.5">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto border border-blue-200">
              <Mail size={22} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No Subscribers Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'No subscribers match your search or filter criteria.'
                : 'No subscribers registered yet. Click "Add New" to register a subscriber.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Touch-Friendly Subscriber Cards */}
            <div className="block md:hidden divide-y divide-slate-100">
              {subscribers.map((subscriber, idx) => {
                const isSelected = selectedIds.includes(subscriber._id);
                const rawInitialSource = subscriber.name || subscriber.email || 'S';
                const initial = (typeof rawInitialSource === 'string'
                  ? rawInitialSource.trim().charAt(0)
                  : String(rawInitialSource).trim().charAt(0) || 'S'
                ).toUpperCase() || 'S';

                return (
                  <div
                    key={subscriber._id || idx}
                    className={`p-3 space-y-2 text-xs bg-white ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* Top Row: Checkbox + Avatar + Name + ID */}
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(subscriber._id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-1 shrink-0"
                      />
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{subscriber.name ? String(subscriber.name) : 'Anonymous'}</span>
                          {subscriber.sql_id && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                              #{subscriber.sql_id}
                            </span>
                          )}
                        </div>
                        {subscriber.email && (
                          <div className="flex items-center gap-1 text-slate-600 mt-0.5 break-all">
                            <Mail size={11} className="text-slate-400 shrink-0" />
                            <a href={`mailto:${subscriber.email}`} className="hover:underline">
                              {subscriber.email}
                            </a>
                          </div>
                        )}
                        {subscriber.phone && (
                          <div className="flex items-center gap-1.5 text-slate-600 mt-0.5">
                            <Phone size={11} className="text-slate-400 shrink-0" />
                            <span>{String(subscriber.phone)}</span>
                            <a
                              href={`https://wa.me/${String(subscriber.phone).replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 p-0.5 inline-flex"
                            >
                              <MessageCircle size={12} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Interest Category Badge */}
                    <div className="pl-6">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-normal text-[10.5px]">
                        {subscriber.interest || 'All Exam Updates'}
                      </span>
                    </div>

                    {/* Bottom Row: Status Toggle + Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 pl-6">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(subscriber)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                          subscriber.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            subscriber.active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{subscriber.active ? 'Active' : 'Inactive'}</span>
                      </button>

                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(subscriber)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 bg-slate-100 rounded cursor-pointer"
                          title="Edit Subscriber"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(subscriber)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 bg-slate-100 rounded cursor-pointer"
                          title="Delete Subscriber"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Exact Same Desktop Table (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f6f7f7] border-b border-slate-200 text-[#2c3338] font-semibold">
                    <th className="p-2.5 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-2.5 font-semibold">Subscriber</th>
                    <th className="p-2.5 font-semibold">Email & Contact</th>
                    <th className="p-2.5 font-semibold">Exam Interest / Category</th>
                    <th className="p-2.5 font-semibold text-center">Status</th>
                    <th className="p-2.5 font-semibold">Subscribed Date</th>
                    <th className="p-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {subscribers.map((subscriber, idx) => {
                  const isSelected = selectedIds.includes(subscriber._id);
                  const rawInitialSource = subscriber.name || subscriber.email || 'S';
                  const initial = (typeof rawInitialSource === 'string'
                    ? rawInitialSource.trim().charAt(0)
                    : String(rawInitialSource).trim().charAt(0) || 'S'
                  ).toUpperCase() || 'S';

                  return (
                    <tr
                      key={subscriber._id || idx}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(subscriber._id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Name & Avatar */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {initial}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{subscriber.name ? String(subscriber.name) : 'Anonymous Subscriber'}</span>
                              {subscriber.sql_id && (
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                                  #{subscriber.sql_id}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {String(subscriber._id || '').slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="p-2.5">
                        <div className="space-y-0.5">
                          {subscriber.email ? (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              <a
                                href={`mailto:${subscriber.email}`}
                                className="hover:text-blue-600 hover:underline"
                              >
                                {subscriber.email}
                              </a>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(subscriber.email, `email-${subscriber._id}`)}
                                className="text-slate-400 hover:text-slate-600 p-0.5"
                                title="Copy Email"
                              >
                                {copiedField === `email-${subscriber._id}` ? (
                                  <Check size={11} className="text-emerald-600" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No email</span>
                          )}

                          {subscriber.phone && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>{String(subscriber.phone)}</span>
                              <a
                                href={`https://wa.me/${String(subscriber.phone).replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 p-0.5 inline-flex items-center"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Exam Interest */}
                      <td className="p-2.5">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-normal text-[11px]">
                          {subscriber.interest || 'All Exam Updates'}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(subscriber)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                            subscriber.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              subscriber.active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{subscriber.active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className="p-2.5 text-slate-500">
                        {subscriber.created_at || subscriber.createdAt ? (
                          <div>
                            <p className="font-medium text-slate-700">
                              {new Date(subscriber.created_at || subscriber.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric',
                              })}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(subscriber.created_at || subscriber.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(subscriber)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                            title="Edit Subscriber"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteClick(subscriber)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Delete Subscriber"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

        {/* BOTTOM PAGINATION BAR */}
        {!loading && total > 0 && (
          <div className="p-2.5 border-t border-slate-200 bg-[#f6f7f7] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of{' '}
              {total} subscribers
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={14} />
              </button>

              <span className="px-2.5 py-1 font-medium text-slate-700 bg-white border border-slate-300 rounded">
                {page} / {pages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-2xl border border-slate-300 relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  {editingSubscriber ? 'Edit Subscriber' : 'Add New Subscriber'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="space-y-3.5 mt-3 text-xs">
              
              {/* Full Name */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.g. Priya Sharma"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="E.g. priya@example.com"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Phone / WhatsApp */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="E.g. +91 9876543210"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Exam Interest */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Exam Interests / Preference
                </label>
                <input
                  type="text"
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                  placeholder="Select or enter interest"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 mb-1.5"
                />

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1">
                  {INTEREST_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, interest: preset })}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                        formData.interest === preset
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {preset.split('(')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded">
                <div>
                  <p className="font-medium text-slate-800">Active Subscription</p>
                  <p className="text-[10px] text-slate-500">
                    Active subscribers will receive newsletters and alerts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-[#f6f7f7] hover:bg-[#f0f0f1] border border-slate-300 text-slate-700 font-medium rounded transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white font-medium rounded transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingSubscriber ? 'Update Subscriber' : 'Save Subscriber'}</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, title: '', isBulk: false, isLoading: false })}
        onConfirm={handleConfirmDelete}
        title={deleteModal.title}
        itemType={deleteModal.isBulk ? 'selected subscribers' : 'subscriber'}
        isLoading={deleteModal.isLoading}
      />

    </div>
  );
}
