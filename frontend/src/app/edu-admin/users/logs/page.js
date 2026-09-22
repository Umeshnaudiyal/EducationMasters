'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  History,
  Search,
  RefreshCw,
  LogIn,
  LogOut,
  Clock,
  Laptop,
  Smartphone,
  Tablet,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
  User,
  Users,
  Building,
  Activity,
  Check,
  CalendarDays,
  Shield,
  Eye,
  ExternalLink,
} from 'lucide-react';

const PAGE_SIZE = 10;

function getPaginationItems(current, total) {
  if (!total || total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export default function UserSessionLogsPage() {
  const { data: session } = useSession();
  const currentUserRole = (session?.user?.role || 'user').toLowerCase();
  const isSuperOrAdmin = currentUserRole === 'admin' || currentUserRole === 'superadmin';

  // Data state
  const [data, setData] = useState({
    date: new Date().toISOString().split('T')[0],
    summary: {
      logsFound: 0,
      accessibleUsers: 0,
      noLoginToday: 0,
      activeToday: 0,
      loggedOut: 0,
    },
    loggedInToday: [],
    notLoggedInToday: [],
    isSuperOrAdmin: false,
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Pagination states for both tables (10 users at a time)
  const [loggedInPage, setLoggedInPage] = useState(1);
  const [notLoggedInPage, setNotLoggedInPage] = useState(1);

  // Calendar Modal State
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarData, setCalendarData] = useState(null);
  const [currentCalYear, setCurrentCalYear] = useState(new Date().getFullYear());
  const [currentCalMonth, setCurrentCalMonth] = useState(new Date().getMonth() + 1);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Day session detail popup inside calendar modal
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  // Fetch daily dashboard logs
  const fetchDashboardLogs = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        date: selectedDate,
        search: searchTerm.trim(),
        role: roleFilter,
      });

      const token =
        session?.user?.accessToken ||
        (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/apis/v1/auth/daily-dashboard-logs?${query}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(session?.user?.id ? { 'x-user-id': session.user.id } : {}),
            ...(session?.user?.email ? { 'x-user-email': session.user.email } : {}),
            ...(session?.user?.role ? { 'x-user-role': session.user.role } : {}),
          },
        }
      );

      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Error fetching daily login logs:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, searchTerm, roleFilter, session]);

  useEffect(() => {
    fetchDashboardLogs();
    setLoggedInPage(1);
    setNotLoggedInPage(1);
  }, [fetchDashboardLogs]);

  // Handle Escape key & body scroll lock for right slide-over drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && calendarModalOpen) {
        setCalendarModalOpen(false);
      }
    };
    if (calendarModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [calendarModalOpen]);

  // Open User Calendar History Modal
  const handleOpenCalendar = async (userId, userObj = null) => {
    setSelectedUserId(userId);
    setCalendarModalOpen(true);
    setSelectedDayDetail(null);
    fetchCalendarHistory(userId, currentCalYear, currentCalMonth);
  };

  const fetchCalendarHistory = async (userId, year, month) => {
    try {
      setCalendarLoading(true);
      const token =
        session?.user?.accessToken ||
        (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

      const query = new URLSearchParams({
        userId,
        year: String(year),
        month: String(month),
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/apis/v1/auth/calendar-history?${query}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(session?.user?.id ? { 'x-user-id': session.user.id } : {}),
            ...(session?.user?.email ? { 'x-user-email': session.user.email } : {}),
            ...(session?.user?.role ? { 'x-user-role': session.user.role } : {}),
          },
        }
      );

      const result = await res.json();
      if (result.success && result.data) {
        setCalendarData(result.data);
      }
    } catch (err) {
      console.error('Error fetching user calendar:', err);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handlePrevMonth = () => {
    let newMonth = currentCalMonth - 1;
    let newYear = currentCalYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setCurrentCalMonth(newMonth);
    setCurrentCalYear(newYear);
    if (selectedUserId) {
      fetchCalendarHistory(selectedUserId, newYear, newMonth);
    }
  };

  const handleNextMonth = () => {
    let newMonth = currentCalMonth + 1;
    let newYear = currentCalYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setCurrentCalMonth(newMonth);
    setCurrentCalYear(newYear);
    if (selectedUserId) {
      fetchCalendarHistory(selectedUserId, newYear, newMonth);
    }
  };

  const formatDateTimeDisplay = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return '—';
    }
  };

  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return '';
    }
  };

  // Filtered rows based on search
  const filterRows = (rows) => {
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.role?.toLowerCase().includes(q) ||
        r.branch?.toLowerCase().includes(q)
    );
  };

  const visibleLoggedIn = filterRows(data.loggedInToday || []);
  const visibleNotLoggedIn = filterRows(data.notLoggedInToday || []);

  // 10 Users Pagination slices
  const totalLoggedInPages = Math.ceil(visibleLoggedIn.length / PAGE_SIZE) || 1;
  const paginatedLoggedIn = visibleLoggedIn.slice(
    (loggedInPage - 1) * PAGE_SIZE,
    loggedInPage * PAGE_SIZE
  );

  const totalNotLoggedInPages = Math.ceil(visibleNotLoggedIn.length / PAGE_SIZE) || 1;
  const paginatedNotLoggedIn = visibleNotLoggedIn.slice(
    (notLoggedInPage - 1) * PAGE_SIZE,
    notLoggedInPage * PAGE_SIZE
  );

  return (
    <div className="w-full space-y-4 text-xs pb-12 font-sans">
      {/* Top Breadcrumb Tag & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
            <Shield size={12} className="text-blue-600" />
            <span>Access Records</span>
          </div>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Login Logs</h1>
          <p className="text-xs text-slate-500 max-w-3xl">
            Today's first login and latest logout for each user. Showing 10 users per page. Click History to open attendance & session calendar.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:border-[#2271b1] outline-hidden cursor-pointer"
            title="Filter logs by date"
          />

          <button
            type="button"
            onClick={fetchDashboardLogs}
            disabled={loading}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top 5 Summary Metric Cards (Exact layout from Screenshot #1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Logs Found */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] text-slate-500 font-medium">Logs Found</p>
            <p className="text-2xl font-black text-slate-900">{data.summary?.logsFound || 0}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <User size={20} />
          </div>
        </div>

        {/* Card 2: Accessible Users */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] text-slate-500 font-medium">Accessible Users</p>
            <p className="text-2xl font-black text-slate-900">
              {data.summary?.accessibleUsers || 0}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Users size={20} />
          </div>
        </div>

        {/* Card 3: No Login Today */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] text-slate-500 font-medium">No Login Today</p>
            <p className="text-2xl font-black text-slate-900">{data.summary?.noLoginToday || 0}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Calendar size={20} />
          </div>
        </div>

        {/* Card 4: Active Today */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] text-slate-500 font-medium">Active Today</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-emerald-600">
                {data.summary?.activeToday || 0}
              </p>
              {(data.summary?.activeToday || 0) > 0 && (
                <span className="relative flex h-2.5 w-2.5" title="Active Sessions Live">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
              )}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Card 5: Logged Out */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div className="space-y-0.5">
            <p className="text-[11px] text-slate-500 font-medium">Logged Out</p>
            <p className="text-2xl font-black text-slate-700">{data.summary?.loggedOut || 0}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <LogOut size={20} />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      {isSuperOrAdmin && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter users by name, email, role, or branch..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:border-[#2271b1] outline-hidden text-slate-800"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:border-[#2271b1] outline-hidden text-slate-800"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="author">Author</option>
              <option value="writer">Writer</option>
              <option value="institute_admin">Institute Admin</option>
              <option value="user">User / Student</option>
            </select>
          </div>
        </div>
      )}

      {/* Table 1: Logged In today (10 users per page) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table 1 Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Logged In today</h2>
            <p className="text-[11px] text-slate-500">Users who have an active login record today.</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            {visibleLoggedIn.length} {visibleLoggedIn.length === 1 ? 'user' : 'users'}
          </span>
        </div>

        {/* Table 1 Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3 min-w-[200px]">User</th>
                <th className="p-3 min-w-[130px]">Role</th>
                <th className="p-3 min-w-[160px]">Branch / Location</th>
                <th className="p-3 min-w-[190px]">Last Login</th>
                <th className="p-3 min-w-[190px]">Last Logout</th>
                <th className="p-3 min-w-[110px]">Status</th>
                <th className="p-3 min-w-[100px] text-center">History</th>
                <th className="p-3 min-w-[90px] text-center">Portal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
                      <span>Loading active records...</span>
                    </div>
                  </td>
                </tr>
              ) : visibleLoggedIn.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    No users logged in on this date.
                  </td>
                </tr>
              ) : (
                paginatedLoggedIn.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User */}
                    <td className="p-3">
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                          {u.name}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                          {u.email}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-3">
                      <span className="font-medium text-slate-700 capitalize">
                        {u.role ? u.role.replace('_', ' ') : 'User'}
                      </span>
                    </td>

                    {/* Branch */}
                    <td className="p-3">
                      <div>
                        <span className="font-medium text-slate-800 block truncate max-w-[160px]">
                          {u.branch}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                          {u.branchLocation}
                        </span>
                      </div>
                    </td>

                    {/* Last Login (Arrow format from Screenshot #1) */}
                    <td className="p-3 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-600 font-bold">➔</span>
                        <span>{formatDateTimeDisplay(u.last_login)}</span>
                      </div>
                    </td>

                    {/* Last Logout */}
                    <td className="p-3 text-slate-600">
                      {u.last_logout ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">🕒</span>
                          <span>{formatDateTimeDisplay(u.last_logout)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                          </span>
                          <span className="text-emerald-700 font-bold text-[11px]">Active Session</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-blue-50 text-blue-700 border border-blue-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        }`}
                      >
                        {u.status || 'Logged today'}
                      </span>
                    </td>

                    {/* History Button */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenCalendar(u.id, u)}
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#2271b1] hover:text-[#135e96] border border-blue-200 hover:border-blue-400 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 mx-auto shadow-2xs"
                        title="View monthly attendance calendar"
                      >
                        <Calendar size={12} />
                        <span>History</span>
                      </button>
                    </td>

                    {/* Portal */}
                    <td className="p-3 text-center text-slate-400">
                      <span>—</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table 1 Pagination (10 per page) */}
        {totalLoggedInPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
            <span className="text-[11px] text-slate-500">
              Showing{' '}
              <strong className="text-slate-800">
                {(loggedInPage - 1) * PAGE_SIZE + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800">
                {Math.min(loggedInPage * PAGE_SIZE, visibleLoggedIn.length)}
              </strong>{' '}
              of <strong className="text-slate-800">{visibleLoggedIn.length.toLocaleString()}</strong> users
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={loggedInPage <= 1}
                onClick={() => setLoggedInPage(1)}
                title="First page"
                className="px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none border border-slate-300 rounded text-[11px] font-semibold text-slate-700 cursor-pointer shadow-2xs"
              >
                «
              </button>
              <button
                type="button"
                disabled={loggedInPage <= 1}
                onClick={() => setLoggedInPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none border border-slate-300 rounded text-[11px] font-semibold text-slate-700 cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <ChevronLeft size={11} />
                <span>Prev</span>
              </button>

              {getPaginationItems(loggedInPage, totalLoggedInPages).map((item, idx) => {
                if (item === '...') {
                  return (
                    <span key={`dots-logged-${idx}`} className="px-1 text-slate-400 font-bold text-xs">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={`logged-page-${item}`}
                    type="button"
                    onClick={() => setLoggedInPage(item)}
                    className={`min-w-[26px] h-6 px-1.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                      loggedInPage === item
                        ? 'bg-[#2271b1] text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={loggedInPage >= totalLoggedInPages}
                onClick={() => setLoggedInPage((p) => Math.min(totalLoggedInPages, p + 1))}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none border border-slate-300 rounded text-[11px] font-semibold text-slate-700 cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight size={11} />
              </button>
              <button
                type="button"
                disabled={loggedInPage >= totalLoggedInPages}
                onClick={() => setLoggedInPage(totalLoggedInPages)}
                title="Last page"
                className="px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none border border-slate-300 rounded text-[11px] font-semibold text-slate-700 cursor-pointer shadow-2xs"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table 2: Not logged in today (10 users per page) */}
      {isSuperOrAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Table 2 Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Not logged in today</h2>
              <p className="text-[11px] text-slate-500">
                Users who do not have a login record for today but still need history access.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
              {visibleNotLoggedIn.length} {visibleNotLoggedIn.length === 1 ? 'user' : 'users'}
            </span>
          </div>

          {/* Table 2 Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-3 min-w-[200px]">User</th>
                  <th className="p-3 min-w-[130px]">Role</th>
                  <th className="p-3 min-w-[160px]">Branch / Location</th>
                  <th className="p-3 min-w-[140px]">Last Login</th>
                  <th className="p-3 min-w-[140px]">Last Logout</th>
                  <th className="p-3 min-w-[110px]">Status</th>
                  <th className="p-3 min-w-[100px] text-center">History</th>
                  <th className="p-3 min-w-[130px] text-center">Portal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      Loading users list...
                    </td>
                  </tr>
                ) : visibleNotLoggedIn.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      All accessible users have logged in today!
                    </td>
                  </tr>
                ) : (
                  paginatedNotLoggedIn.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* User */}
                      <td className="p-3">
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                            {u.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                            {u.email}
                          </span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-3">
                        <span className="font-medium text-slate-700 capitalize">
                          {u.role ? u.role.replace('_', ' ') : 'User'}
                        </span>
                      </td>

                      {/* Branch */}
                      <td className="p-3">
                        <div>
                          <span className="font-medium text-slate-800 block truncate max-w-[160px]">
                            {u.branch}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                            {u.branchLocation}
                          </span>
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="p-3 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">➔</span>
                          <span>{u.last_login ? formatDateTimeDisplay(u.last_login) : '-'}</span>
                        </div>
                      </td>

                      {/* Last Logout */}
                      <td className="p-3 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">🕒</span>
                          <span>{u.last_logout ? formatDateTimeDisplay(u.last_logout) : '-'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          No login today
                        </span>
                      </td>

                      {/* History Button */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenCalendar(u.id, u)}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#2271b1] hover:text-[#135e96] border border-blue-200 hover:border-blue-400 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 mx-auto shadow-2xs"
                          title="View monthly attendance calendar"
                        >
                          <Calendar size={12} />
                          <span>History</span>
                        </button>
                      </td>

                      {/* Portal Action */}
                      <td className="p-3 text-center">
                        <Link
                          href={`/edu-admin/users`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-md text-[10px] font-bold transition-colors"
                        >
                          <span>➔ View user</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table 2 Pagination (10 per page) */}
          {totalNotLoggedInPages > 1 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
              <span className="text-[11px] text-slate-500">
                Showing{' '}
                <strong className="text-slate-800">
                  {(notLoggedInPage - 1) * PAGE_SIZE + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-800">
                  {Math.min(notLoggedInPage * PAGE_SIZE, visibleNotLoggedIn.length)}
                </strong>{' '}
                of <strong className="text-slate-800">{visibleNotLoggedIn.length.toLocaleString()}</strong> users
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={notLoggedInPage <= 1}
                  onClick={() => setNotLoggedInPage(1)}
                  title="First page"
                  className="px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none border border-slate-300 rounded text-[11px] font-semibold text-slate-700 cursor-pointer shadow-2xs"
                >
                  «
                </button>
                <button
                  type="button"
                  disabled={notLoggedInPage <= 1}
                  onClick={() => setNotLoggedInPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none border border-slate-300 rounded text-[11px] font-semibold text-slate-700 cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <ChevronLeft size={11} />
                  <span>Prev</span>
                </button>

                {getPaginationItems(notLoggedInPage, totalNotLoggedInPages).map((item, idx) => {
                  if (item === '...') {
                    return (
                      <span key={`dots-not-logged-${idx}`} className="px-1 text-slate-400 font-bold text-xs">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={`not-logged-page-${item}`}
                      type="button"
                      onClick={() => setNotLoggedInPage(item)}
                      className={`min-w-[26px] h-6 px-1.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                        notLoggedInPage === item
                          ? 'bg-[#2271b1] text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={notLoggedInPage >= totalNotLoggedInPages}
                  onClick={() => setNotLoggedInPage((p) => Math.min(totalNotLoggedInPages, p + 1))}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none border border-slate-300 rounded text-[11px] font-semibold text-slate-700 cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span>Next</span>
                  <ChevronRight size={11} />
                </button>
                <button
                  type="button"
                  disabled={notLoggedInPage >= totalNotLoggedInPages}
                  onClick={() => setNotLoggedInPage(totalNotLoggedInPages)}
                  title="Last page"
                  className="px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none border border-slate-300 rounded text-[11px] font-semibold text-slate-700 cursor-pointer shadow-2xs"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Calendar History Slide-over Drawer (Opens from Right with Animation) */}
      {/* ========================================================================= */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
          calendarModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!calendarModalOpen}
      >
        {/* Dark Backdrop overlay with subtle blur */}
        <div
          onClick={() => setCalendarModalOpen(false)}
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ${
            calendarModalOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Sliding Drawer from Right */}
        <div
          className={`fixed inset-y-0 right-0 w-full sm:w-[94vw] lg:w-[84vw] max-w-6xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out z-10 ${
            calendarModalOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Top User Bar (Screenshot #2) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm shadow-2xs">
                {calendarData?.user?.name ? calendarData.user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {calendarData?.user?.name || 'User Attendance & Session History'}
                </h3>
                <p className="text-xs text-slate-400 font-normal">
                  {calendarData?.user?.email || ''} -{' '}
                  <span className="capitalize font-medium text-slate-500">
                    {calendarData?.user?.role ? calendarData.user.role.replace('_', ' ') : 'User'}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCalendarModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 shadow-2xs"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* 3 Metric Summary Counters (Screenshot #2) */}
          <div className="grid grid-cols-3 border-b border-slate-200 bg-white py-3.5 sm:py-4 shrink-0 select-none">
            {/* 1. Present */}
            <div className="text-center border-r border-slate-100">
              <p className="text-2xl sm:text-3xl font-black text-emerald-500 tracking-tight">
                {calendarData?.stats?.presentCount || 0}
              </p>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                PRESENT
              </p>
            </div>

            {/* 2. Active Now */}
            <div className="text-center border-r border-slate-100">
              <div className="flex items-center justify-center gap-1.5">
                <p className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
                  {calendarData?.stats?.activeNow || 0}
                </p>
                {(calendarData?.stats?.activeNow || 0) > 0 && (
                  <span className="relative flex h-2.5 w-2.5" title="Live Session Active">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                ACTIVE NOW
              </p>
            </div>

            {/* 3. Absent */}
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight">
                {calendarData?.stats?.absentCount || 0}
              </p>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                ABSENT
              </p>
            </div>
          </div>

          {/* Month Selector Bar (Screenshot #2) */}
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 select-none shrink-0">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="text-center">
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                {calendarData?.monthName || 'September'} {calendarData?.year || currentCalYear}
              </h4>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Scrollable Calendar Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
            {calendarLoading ? (
              <div className="flex flex-col items-center justify-center py-28 gap-3 text-slate-400">
                <div className="w-8 h-8 border-3 border-slate-200 border-t-[#2271b1] rounded-full animate-spin" />
                <span className="text-xs font-semibold">Loading attendance calendar...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-2.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1">
                  <div>SUN</div>
                  <div>MON</div>
                  <div>TUE</div>
                  <div>WED</div>
                  <div>THU</div>
                  <div>FRI</div>
                  <div>SAT</div>
                </div>

                {/* 7-Columns Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
                  {/* Empty padding days for first week */}
                  {Array.from({
                    length: calendarData?.calendarDays?.[0]?.dayOfWeek || 0,
                  }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[88px] sm:min-h-[96px] bg-slate-50/40 rounded-2xl border border-slate-100/70"
                    />
                  ))}

                  {/* Day Cards */}
                  {calendarData?.calendarDays?.map((d) => {
                    const isSunday = d.dayOfWeek === 0;
                    const isToday = d.isToday;
                    const isPresent = d.status === 'present' || d.status === 'active';
                    const isAbsent = d.status === 'absent';
                    const isOff = d.status === 'off' || isSunday;
                    const isFuture = d.status === 'future';

                    // Determine exact session badge style
                    let badgeType = 'active'; // 'active' | 'logged_out' | 'expired'
                    if (d.status === 'active') {
                      badgeType = 'active';
                    } else if (d.sessions && d.sessions.length > 0) {
                      const lastSession = d.sessions[d.sessions.length - 1];
                      if (
                        lastSession.action === 'session_expired' ||
                        lastSession.status === 'expired'
                      ) {
                        badgeType = 'expired';
                      } else if (lastSession.logout_time || lastSession.action === 'logout') {
                        badgeType = 'logged_out';
                      } else if (lastSession.status === 'active') {
                        badgeType = 'active';
                      } else if (!isToday && !d.lastLogout) {
                        badgeType = 'expired';
                      } else {
                        badgeType = 'logged_out';
                      }
                    } else if (!isToday && d.firstLogin && !d.lastLogout) {
                      badgeType = 'expired';
                    } else if (d.lastLogout) {
                      badgeType = 'logged_out';
                    }

                    // Card container styling matching Screenshot #2
                    let cardClasses = 'border-slate-100 bg-white text-slate-400';
                    if (isPresent) {
                      if (badgeType === 'active') {
                        cardClasses =
                          'border-emerald-300 bg-emerald-50/35 hover:bg-emerald-50/60 hover:border-emerald-400 hover:shadow-xs cursor-pointer';
                      } else if (badgeType === 'logged_out') {
                        cardClasses =
                          'border-blue-200 bg-blue-50/35 hover:bg-blue-50/60 hover:border-blue-300 hover:shadow-xs cursor-pointer';
                      } else if (badgeType === 'expired') {
                        cardClasses =
                          'border-rose-200 bg-rose-50/35 hover:bg-rose-50/60 hover:border-rose-300 hover:shadow-xs cursor-pointer';
                      }
                    } else if (isOff) {
                      cardClasses = 'border-slate-100 bg-white text-slate-400';
                    } else if (isAbsent) {
                      cardClasses = 'border-slate-200/80 bg-white text-slate-600';
                    } else if (isFuture) {
                      cardClasses = 'border-slate-100 bg-white/60 text-slate-300';
                    }

                    return (
                      <div
                        key={d.day}
                        onClick={() => d.sessions?.length > 0 && setSelectedDayDetail(d)}
                        className={`min-h-[88px] sm:min-h-[96px] p-2 sm:p-2.5 rounded-2xl border transition-all flex flex-col justify-between select-none ${cardClasses} ${
                          isToday ? 'ring-2 ring-blue-400/50' : ''
                        }`}
                      >
                        {/* Top: Day Number + Today Indicator */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold ${
                              isPresent
                                ? 'text-slate-900'
                                : isAbsent
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {d.day}
                          </span>
                          {isToday && (
                            <span className="relative flex h-2 w-2 ml-0.5" title="Today">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                            </span>
                          )}
                        </div>

                        {/* Middle / Bottom Content */}
                        {isPresent ? (
                          <div className="space-y-1">
                            {/* Login timestamp */}
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-800">
                              <span className="text-emerald-600 text-[9px]">➔</span>
                              <span>{formatTimeOnly(d.firstLogin) || '—'}</span>
                            </div>

                            {/* Logout or Active timestamp */}
                            <div className="flex items-center gap-1 text-[9.5px] text-slate-600">
                              <span className="text-slate-400 text-[8px]">⇥</span>
                              <span>
                                {d.lastLogout
                                  ? formatTimeOnly(d.lastLogout)
                                  : badgeType === 'active'
                                  ? 'active'
                                  : '—'}
                              </span>
                            </div>

                            {/* Status Badge matching Screenshot #2 */}
                            <div>
                              {badgeType === 'active' ? (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 shadow-2xs">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
                                  </span>
                                  <span>Active</span>
                                </div>
                              ) : badgeType === 'logged_out' ? (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  <span>Logged out</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span>Expired</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : isOff ? (
                          <div className="text-[10px] text-slate-300 font-normal">Off</div>
                        ) : isAbsent ? (
                          <div className="text-[10px] text-slate-300 font-normal">Absent</div>
                        ) : (
                          <div />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Drilldown Day Session Breakdown */}
                {selectedDayDetail && (
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[#2271b1]" />
                        <span className="font-bold text-slate-900 text-xs">
                          Session Breakdown for {selectedDayDetail.date}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedDayDetail(null)}
                        className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer font-semibold"
                      >
                        ✕ Close Breakdown
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      {selectedDayDetail.sessions?.map((s, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1 text-[11px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 capitalize">
                              Session #{idx + 1} ({s.action || 'login'})
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                s.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {s.status}
                            </span>
                          </div>
                          <p className="text-slate-600">
                            <strong>Login:</strong> {formatDateTimeDisplay(s.login_time)}
                          </p>
                          <p className="text-slate-600">
                            <strong>Logout:</strong>{' '}
                            {s.logout_time ? formatDateTimeDisplay(s.logout_time) : 'Active Session'}
                          </p>
                          <p className="text-slate-500 text-[10px]">
                            <strong>Device:</strong> {s.device || 'Desktop'} • <strong>IP:</strong>{' '}
                            {s.ip_address || 'Unknown'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
