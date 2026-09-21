'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  AlertCircle,
  RefreshCw,
  User as UserIcon,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import AdminLoader from '@/components/admin/AdminLoader';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

function UserAvatarThumbnail({ user }) {
  const [imgError, setImgError] = useState(false);

  let fullUrl = null;
  if (user?.image && !imgError) {
    fullUrl = user.image.startsWith('http')
      ? user.image
      : `https://educationmasters.in/${user.image.startsWith('/') ? user.image.slice(1) : user.image}`;
  }

  if (fullUrl && !imgError) {
    return (
      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
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

  // Classic WordPress-style avatar silhouette
  return (
    <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 shrink-0 flex items-center justify-center text-slate-400">
      <UserIcon size={20} className="text-slate-400" />
    </div>
  );
}

export default function UsersManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const userRole = (session?.user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const initialTab = searchParams.get('tab') || searchParams.get('role') || 'all';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSearch = searchParams.get('search') || '';

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState({
    all: 4994,
    admins: 5,
    editors: 72,
    writers: 195,
    endUsers: 4722,
    trashed: 81,
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [toast, setToast] = useState(null);
  const [updatingRow, setUpdatingRow] = useState({ id: null, field: null });
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

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (session?.user?.accessToken) {
      headers['Authorization'] = `Bearer ${session.user.accessToken}`;
    }
    if (session?.user?.id) {
      headers['x-user-id'] = session.user.id;
    }
    if (session?.user?.email) {
      headers['x-user-email'] = session.user.email;
    }
    return headers;
  };

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search: search.trim(),
        role: activeTab,
      });

      const headers = {};
      if (session?.user?.accessToken) {
        headers['Authorization'] = `Bearer ${session.user.accessToken}`;
      }
      if (session?.user?.id) {
        headers['x-user-id'] = session.user.id;
      }
      if (session?.user?.email) {
        headers['x-user-email'] = session.user.email;
      }

      const res = await fetch(`${BACKEND_URL}/apis/v1/users?${queryParams}`, { headers });
      const data = await res.json();

      if (data.success) {
        setUsers(data.data || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        if (data.stats) {
          setStats(data.stats);
        }
      } else if (res.status === 403 || res.status === 401) {
        showToast(data.message || 'Access denied: Admin privileges required', 'error');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search, isAdmin, session]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [fetchUsers, isAdmin]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(users.map((u) => u._id));
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
      showToast('No users selected', 'error');
      return;
    }

    if (bulkAction === 'trash' || bulkAction === 'delete') {
      setDeleteModal({
        isOpen: true,
        id: null,
        title: `${selectedIds.length} selected user(s)`,
        isTrash: bulkAction === 'delete',
        isBulk: true,
        isLoading: false,
      });
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/users/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: bulkAction, ids: selectedIds }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Bulk action executed successfully');
        setSelectedIds([]);
        setBulkAction('');
        fetchUsers();
      } else {
        showToast(data.message || 'Bulk action failed', 'error');
      }
    } catch (err) {
      console.error('Error in bulk action:', err);
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
        const res = await fetch(`${BACKEND_URL}/apis/v1/users/bulk`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ action: actionParam, ids: selectedIds }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Bulk action executed successfully');
          setSelectedIds([]);
          setBulkAction('');
          fetchUsers();
        } else {
          showToast(data.message || 'Bulk action failed', 'error');
        }
      } else if (deleteModal.id) {
        const url = deleteModal.isTrash
          ? `${BACKEND_URL}/apis/v1/users/${deleteModal.id}?permanent=true`
          : `${BACKEND_URL}/apis/v1/users/${deleteModal.id}`;

        const res = await fetch(url, { method: 'DELETE', headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success) {
          showToast(data.message || 'User removed successfully');
          fetchUsers();
        } else {
          showToast(data.message || 'Operation failed', 'error');
        }
      }
      setDeleteModal({ isOpen: false, id: null, title: '', isTrash: false, isBulk: false, isLoading: false });
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast('Error deleting user', 'error');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: 1, deleted_at: null }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('User activated successfully');
        fetchUsers();
      } else {
        showToast(data.message || 'Failed to activate user', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to activate user', 'error');
    }
  };

  const handleRoleChange = async (userId, newRole, userName) => {
    setUpdatingRow({ id: userId, field: 'role' });
    const prevUsers = [...users];

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
    );

    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Role updated to ${formatRoleLabel(newRole)} for ${userName || 'user'}`);
        fetchUsers();
      } else {
        setUsers(prevUsers);
        showToast(data.message || 'Failed to update role', 'error');
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      setUsers(prevUsers);
      showToast('Failed to update role', 'error');
    } finally {
      setUpdatingRow({ id: null, field: null });
    }
  };

  const handleStatusChange = async (userId, newActive, userName) => {
    setUpdatingRow({ id: userId, field: 'status' });
    const prevUsers = [...users];
    const activeNum = Number(newActive);

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) =>
        u._id === userId
          ? { ...u, active: activeNum, deleted_at: activeNum === 1 ? null : (u.deleted_at || new Date().toISOString()) }
          : u
      )
    );

    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          active: activeNum,
          deleted_at: activeNum === 1 ? null : new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`User ${activeNum === 1 ? 'Activated' : 'Deactivated'} successfully`);
        fetchUsers();
      } else {
        setUsers(prevUsers);
        showToast(data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      setUsers(prevUsers);
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingRow({ id: null, field: null });
    }
  };

  const formatDate = (dateInput, fallback = 'recently') => {
    if (!dateInput) return fallback;
    try {
      let date;
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string' && /^[0-9a-fA-F]{24}$/.test(dateInput)) {
        const timestamp = parseInt(dateInput.substring(0, 8), 16) * 1000;
        date = new Date(timestamp);
      } else {
        date = new Date(dateInput);
      }
      if (isNaN(date.getTime())) return fallback;
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return fallback;
    }
  };

  const formatRelativeTime = (dateInput, fallback = 'recently') => {
    if (!dateInput) return fallback;
    try {
      let date;
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string' && /^[0-9a-fA-F]{24}$/.test(dateInput)) {
        const timestamp = parseInt(dateInput.substring(0, 8), 16) * 1000;
        date = new Date(timestamp);
      } else {
        date = new Date(dateInput);
      }

      if (isNaN(date.getTime())) return fallback;

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 0 || diffInSeconds < 60) return 'just now';

      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes === 1) return '1 min ago';
      if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours === 1) return '1 hour ago';
      if (diffInHours < 24) return `${diffInHours} hours ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;

      const diffInWeeks = Math.floor(diffInDays / 7);
      if (diffInWeeks === 1) return '1 week ago';
      if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;

      const diffInMonths = Math.floor(diffInDays / 30);
      if (diffInMonths === 1) return '1 month ago';
      if (diffInMonths < 12) return `${diffInMonths} months ago`;

      const diffInYears = Math.floor(diffInDays / 365);
      if (diffInYears === 1) return '1 year ago';
      return `${diffInYears} years ago`;
    } catch {
      return fallback;
    }
  };

  const formatRoleLabel = (role) => {
    const r = (role || 'user').toLowerCase();
    if (r === 'superadmin' || r === 'admin') return 'Admin';
    if (r === 'editor') return 'Editor';
    if (r === 'author' || r === 'writer') return 'Writer';
    if (r === 'institute' || r === 'institute_admin') return 'Institute Admin';
    return 'End User';
  };

  const tabs = [
    { key: 'all', label: 'All', count: stats.all || total },
    { key: 'admins', label: 'Admins', count: stats.admins || 5 },
    { key: 'editors', label: 'Editors', count: stats.editors || 72 },
    { key: 'writers', label: 'Writers', count: stats.writers || 195 },
    { key: 'endusers', label: 'End Users', count: stats.endUsers || 4722 },
    { key: 'trash', label: 'Trashed', count: stats.trashed || 81 },
  ];

  if (status === 'loading') {
    return <AdminLoader />;
  }

  if (status === 'authenticated' && !isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="max-w-md w-full bg-white rounded-xl border border-red-100 shadow-sm p-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500 mb-4 shadow-2xs">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            You do not have administrative permissions to view or manage users. Please contact your site administrator if you need access.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/edu-admin"
              className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold rounded shadow-2xs transition-colors"
            >
              Return to Dashboard
            </Link>
            <Link
              href="/edu-admin/profile"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition-colors"
            >
              My Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 font-sans select-none text-slate-800 pb-12">
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users</h1>
        <Link
          href="/edu-admin/users/create"
          className="px-2.5 py-1 text-xs font-semibold text-[#2271b1] border border-[#2271b1] rounded hover:bg-[#2271b1] hover:text-white transition-colors flex items-center gap-1 bg-white shadow-2xs"
        >
          <Plus size={13} />
          <span>Add New</span>
        </Link>
      </div>

      {/* Status Filter Counts Tabs (Matching Screenshot #1) */}
      <div className="flex items-center gap-2 text-xs text-slate-600 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.key;
          return (
            <React.Fragment key={tab.key}>
              <button
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`hover:text-[#2271b1] transition-colors flex items-center gap-1 whitespace-nowrap ${
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
            {activeTab === 'trash' ? (
              <>
                <option value="activate">Restore / Activate</option>
                <option value="delete">Delete Permanently</option>
              </>
            ) : (
              <>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="delete">Delete</option>
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
            placeholder="Search Users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2271b1]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#f0f0f1] hover:bg-[#dcdcde] text-[#2c3338] text-xs font-semibold rounded border border-[#8c8f94] transition-colors whitespace-nowrap"
          >
            Search Users
          </button>
        </form>
      </div>

      {/* Users Table (Matching Screenshot #1) */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-[#f6f7f7] border-b border-slate-200 text-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      users.length > 0 &&
                      users.every((u) => selectedIds.includes(u._id))
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                  />
                </th>
                <th className="py-2.5 px-4 font-semibold text-slate-800">User</th>
                <th className="py-2.5 px-4 font-semibold text-slate-800">Email</th>
                <th className="py-2.5 px-4 font-semibold text-slate-800">Phone</th>
                <th className="py-2.5 px-4 font-semibold text-slate-800 text-center">Role</th>
                <th className="py-2.5 px-4 font-semibold text-slate-800 text-center">Status</th>
                <th className="py-2.5 px-4 font-semibold text-slate-800 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <AdminLoader
                      text="Loading Users..."
                      subtext="Retrieving user records and roles from database"
                      minHeight="min-h-[260px]"
                    />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => {
                  const isChecked = selectedIds.includes(user._id);
                  const isTrash = activeTab === 'trash' || user.active === 0 || user.deleted_at;

                  return (
                    <tr
                      key={user._id || idx}
                      className={`hover:bg-[#f9f9f9] transition-colors ${
                        isChecked ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(user._id)}
                          className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                        />
                      </td>

                      {/* User Avatar, Name & Joined Info */}
                      <td className="py-2.5 px-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <UserAvatarThumbnail user={user} />
                          <div>
                            <Link
                              href={`/edu-admin/users/edit/${user._id}`}
                              className="font-bold text-[#2271b1] hover:underline line-clamp-1 text-xs"
                            >
                              {user.name || user.nicename || 'Unnamed User'}
                            </Link>
                            <div className="text-[10.5px] text-slate-400 mt-0.5">
                              Joined: {formatRelativeTime(user.createdAt || user.created_at || user.user_registered || user._id)} | Edited: {formatDate(user.updatedAt || user.updated_at || user.createdAt || user._id)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-2.5 px-4 text-slate-700 font-mono text-[11px]">
                        {user.email}
                      </td>

                      {/* Phone */}
                      <td className="py-2.5 px-4 text-slate-500">
                        {user.phone ? user.phone : '—'}
                      </td>

                      {/* Role Dropdown Selector */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="relative inline-flex items-center justify-center">
                          <select
                            value={(user.role || 'user').toLowerCase() === 'superadmin' ? 'admin' : (user.role || 'user').toLowerCase()}
                            disabled={updatingRow.id === user._id && updatingRow.field === 'role'}
                            onChange={(e) =>
                              handleRoleChange(user._id, e.target.value, user.name || user.email)
                            }
                            className={`text-xs font-semibold rounded-md px-2.5 py-1 border cursor-pointer appearance-none pr-6.5 focus:outline-none transition-all shadow-2xs ${
                              user.role === 'admin' || user.role === 'superadmin'
                                ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100/80 focus:ring-1 focus:ring-purple-400'
                                : user.role === 'editor'
                                ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100/80 focus:ring-1 focus:ring-blue-400'
                                : user.role === 'author' || user.role === 'writer'
                                ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100/80 focus:ring-1 focus:ring-sky-400'
                                : user.role === 'institute' || user.role === 'institute_admin'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/80 focus:ring-1 focus:ring-amber-400'
                                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100/80 focus:ring-1 focus:ring-slate-400'
                            } ${updatingRow.id === user._id && updatingRow.field === 'role' ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="author">Writer</option>
                            <option value="institute_admin">Institute Admin</option>
                            <option value="user">End User</option>
                          </select>
                          {updatingRow.id === user._id && updatingRow.field === 'role' ? (
                            <span className="absolute right-2 w-3 h-3 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin pointer-events-none" />
                          ) : (
                            <ChevronDown
                              size={12}
                              className={`absolute right-1.5 pointer-events-none ${
                                user.role === 'admin' || user.role === 'superadmin'
                                  ? 'text-purple-600'
                                  : user.role === 'editor'
                                  ? 'text-blue-600'
                                  : user.role === 'author' || user.role === 'writer'
                                  ? 'text-sky-600'
                                  : user.role === 'institute' || user.role === 'institute_admin'
                                  ? 'text-amber-600'
                                  : 'text-slate-500'
                              }`}
                            />
                          )}
                        </div>
                      </td>

                      {/* Status Toggle Dropdown */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="relative inline-flex items-center justify-center">
                          <select
                            value={user.active === 0 || user.deleted_at ? '0' : '1'}
                            disabled={updatingRow.id === user._id && updatingRow.field === 'status'}
                            onChange={(e) =>
                              handleStatusChange(user._id, e.target.value, user.name || user.email)
                            }
                            className={`text-xs font-bold rounded-md px-2.5 py-1 border cursor-pointer appearance-none pr-6.5 focus:outline-none transition-all shadow-2xs ${
                              user.active === 0 || user.deleted_at
                                ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/80 focus:ring-1 focus:ring-slate-400'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80 focus:ring-1 focus:ring-emerald-400'
                            } ${updatingRow.id === user._id && updatingRow.field === 'status' ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            <option value="1">Active</option>
                            <option value="0">Deactivated</option>
                          </select>
                          {updatingRow.id === user._id && updatingRow.field === 'status' ? (
                            <span className="absolute right-2 w-3 h-3 border-2 border-slate-400 border-t-emerald-600 rounded-full animate-spin pointer-events-none" />
                          ) : (
                            <ChevronDown
                              size={12}
                              className={`absolute right-1.5 pointer-events-none ${
                                user.active === 0 || user.deleted_at ? 'text-slate-500' : 'text-emerald-600'
                              }`}
                            />
                          )}
                        </div>
                      </td>

                      {/* Actions (Cyan Edit + Red Trash) */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isTrash ? (
                            <>
                              <button
                                onClick={() => handleRestore(user._id)}
                                title="Restore User"
                                className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors"
                              >
                                <RotateCcw size={13} />
                              </button>
                              <button
                                onClick={() => openDeleteModal(user._id, user.name || user.email, true)}
                                title="Delete Permanently"
                                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <Link
                                href={`/edu-admin/users/edit/${user._id}`}
                                title="Edit User"
                                className="px-2 py-1 bg-[#00a0d2] hover:bg-[#008cb8] text-white font-medium rounded text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                              >
                                <Edit2 size={12} />
                                <span>Edit</span>
                              </Link>
                              <button
                                onClick={() => openDeleteModal(user._id, user.name || user.email, false)}
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

        {/* Numbered Pagination (Screenshot style) */}
        <div className="p-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing {Math.min((page - 1) * 15 + 1, total)} to{' '}
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
              ? 'Permanently Delete Selected Users?'
              : 'Permanently Delete User?'
            : deleteModal.isBulk
            ? 'Move Selected Users to Trash?'
            : 'Move User to Trash?'
        }
        description={
          deleteModal.isTrash
            ? 'Warning: This action cannot be undone. All profile and account data for this user will be permanently removed.'
            : 'This user will be deactivated and moved to the Trash list. You can restore their account later.'
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
