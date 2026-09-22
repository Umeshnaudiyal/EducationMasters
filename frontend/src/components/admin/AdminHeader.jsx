'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  Plus,
  ExternalLink,
  ChevronDown,
  ShieldAlert,
  FileText,
  Briefcase,
  Landmark,
  FileQuestion,
  Users,
  LogOut,
  User,
  Clock,
  LogIn,
  Activity,
  History,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function AdminHeader({ session }) {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Live session times state
  const [sessionData, setSessionData] = useState({
    loginTime: session?.user?.login_time || null,
    logoutTime: session?.user?.logout_time || null,
    expiresAt: session?.user?.expires_at || null,
    timeRemaining: '',
  });

  const user = session?.user || {
    name: 'Admin',
    nicename: 'admin',
    email: 'admin@educationmasters.in',
    role: 'admin',
  };

  const userRole = (user.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  // Fetch real-time session info from backend
  const fetchSessionInfo = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/apis/v1/auth/session-info?userId=${user.id}`
      );
      const data = await res.json();
      if (data.success && data.data?.user) {
        setSessionData({
          loginTime: data.data.user.login_time,
          logoutTime: data.data.user.logout_time,
          expiresAt: data.data.user.expires_at,
          timeRemaining: data.data.formattedTimeRemaining || '',
        });
      }
    } catch (err) {
      // Fallback to session props
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSessionInfo();
    const interval = setInterval(fetchSessionInfo, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchSessionInfo]);

  // Live Countdown to 12:00 AM Midnight
  const [countdownText, setCountdownText] = useState('');
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // 00:00:00 next day
      const diffMs = midnight.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdownText('Expiring...');
        // Trigger auto-logout on midnight pass
        signOut({ callbackUrl: '/edu-login?expired=1' });
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);

      setCountdownText(`${hrs}h ${mins}m`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 10000);
    return () => clearInterval(timer);
  }, []);

  // Format time helpers (HH:MM AM/PM)
  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return null;
    }
  };

  const formatFullDateTime = (dateStr) => {
    if (!dateStr) return 'Not recorded';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Invalid date';
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
      return 'Not recorded';
    }
  };

  const loginTimeDisplay = formatTimeOnly(sessionData.loginTime || user.login_time);
  const logoutTimeDisplay = formatTimeOnly(sessionData.logoutTime || user.logout_time);

  // Professional logout handler that saves logout time to MongoDB before terminating NextAuth
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const token =
        user?.accessToken ||
        (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/apis/v1/auth/logout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );
    } catch (err) {
      console.error('Logout API call error:', err);
    } finally {
      signOut({ callbackUrl: '/edu-login' });
    }
  };

  return (
    <header className="h-11 bg-[#1d2327] text-white flex items-center justify-between px-3 sm:px-4 select-none shrink-0 z-40 border-b border-[#2c3338] shadow-2xs">
      {/* Left: Brand + Quick + New */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Education Masters Brand Item */}
        <Link
          href="/edu-admin"
          className="flex items-center gap-2 text-xs font-semibold text-[#f0f0f1] hover:text-[#72aee6] transition-colors"
        >
          <div className="w-5 h-5 rounded-full overflow-hidden bg-amber-400/20 border border-amber-400 flex items-center justify-center p-0.5">
            <img
              src="/logo.webp"
              alt="Education Masters"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          </div>
          <span className="font-semibold text-xs tracking-tight hidden xs:inline">
            Education Masters
          </span>
        </Link>

        {/* + New Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNewMenu(!showNewMenu);
              setShowProfileMenu(false);
              setShowSessionDetail(false);
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#c3c4c7] hover:text-[#72aee6] hover:bg-[#2c3338] rounded-md transition-all cursor-pointer"
          >
            <Plus size={13} className="text-[#a7aaad]" />
            <span className="text-[11px]">New</span>
            <ChevronDown size={11} className="text-[#a7aaad]" />
          </button>

          {showNewMenu && (
            <div className="absolute left-0 mt-1.5 w-44 bg-[#2c3338] border border-[#3c434a] rounded-lg shadow-2xl py-1 z-50 text-xs text-[#c3c4c7] animate-in fade-in zoom-in-95 duration-100">
              <Link
                href="/edu-admin/blog/create"
                onClick={() => setShowNewMenu(false)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#1d2327] hover:text-[#72aee6] transition-colors"
              >
                <FileText size={13} className="text-blue-400" />
                <span>Post / Article</span>
              </Link>
              <Link
                href="/edu-admin/posts/create?type=job"
                onClick={() => setShowNewMenu(false)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#1d2327] hover:text-[#72aee6] transition-colors"
              >
                <Briefcase size={13} className="text-emerald-400" />
                <span>Job Post</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/edu-admin/institutes/create"
                  onClick={() => setShowNewMenu(false)}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#1d2327] hover:text-[#72aee6] transition-colors"
                >
                  <Landmark size={13} className="text-cyan-400" />
                  <span>Institute</span>
                </Link>
              )}
              <Link
                href="/edu-admin/mcqs/create"
                onClick={() => setShowNewMenu(false)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#1d2327] hover:text-[#72aee6] transition-colors"
              >
                <FileQuestion size={13} className="text-pink-400" />
                <span>MCQ Question</span>
              </Link>
              {isAdmin && (
                <>
                  <div className="border-t border-[#3c434a] my-1"></div>
                  <Link
                    href="/edu-admin/users/create"
                    onClick={() => setShowNewMenu(false)}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#1d2327] hover:text-[#72aee6] transition-colors"
                  >
                    <Users size={13} className="text-amber-400" />
                    <span>User</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* View Public Website */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1 text-[11px] text-[#a7aaad] hover:text-[#72aee6] transition-colors px-1"
          title="Visit Public Website"
        >
          <span>View Site</span>
          <ExternalLink size={11} />
        </Link>
      </div>

      {/* Middle/Right: Session Time Widget (Interactive Animated Badges with Hover Tooltips) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Session Time Status Badges Capsule */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-0.5 bg-[#2c3338]/60 border border-[#3c434a] rounded-lg shadow-2xs">
          {/* 1. Login "In" Badge with Smooth Hover Animation & Tooltip */}
          <div className="group relative flex items-center">
            <button
              type="button"
              onClick={() => setShowSessionDetail(!showSessionDetail)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1d2327]/80 hover:bg-emerald-950/50 border border-emerald-500/25 hover:border-emerald-400/60 text-emerald-400 text-[11px] font-medium transition-all duration-200 shadow-2xs hover:shadow-emerald-950/40 hover:scale-[1.02] cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-300/80 text-[10px] uppercase font-bold tracking-wider">In:</span>
              <span className="font-bold text-white text-[11px] tracking-tight">
                {loginTimeDisplay || 'Active'}
              </span>
            </button>

            {/* Floating Animated Tooltip on Hover */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transform group-hover:translate-y-0 translate-y-1 transition-all duration-200">
              <div className="bg-[#23282d] border border-emerald-500/30 rounded-xl shadow-2xl p-2.5 w-52 text-[11px] text-slate-200 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold border-b border-slate-700/60 pb-1 mb-1.5">
                  <LogIn size={12} />
                  <span>First Login Today</span>
                </div>
                <p className="text-white font-semibold">
                  {formatFullDateTime(sessionData.loginTime || user.login_time)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Preserved across all same-day re-logins
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <span className="text-slate-600 font-light text-xs">|</span>

          {/* 2. Logout "Out" Badge with Smooth Hover Animation & Tooltip */}
          <div className="group relative flex items-center">
            <button
              type="button"
              onClick={() => setShowSessionDetail(!showSessionDetail)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1d2327]/80 hover:bg-rose-950/50 border border-rose-500/25 hover:border-rose-400/60 text-rose-300 text-[11px] font-medium transition-all duration-200 shadow-2xs hover:shadow-rose-950/40 hover:scale-[1.02] cursor-pointer"
            >
              <LogOut size={11} className="text-rose-400" />
              <span className="text-rose-300/80 text-[10px] uppercase font-bold tracking-wider">Out:</span>
              <span className="font-semibold text-slate-200 text-[11px]">
                {logoutTimeDisplay || '—'}
              </span>
            </button>

            {/* Floating Animated Tooltip on Hover */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transform group-hover:translate-y-0 translate-y-1 transition-all duration-200">
              <div className="bg-[#23282d] border border-rose-500/30 rounded-xl shadow-2xl p-2.5 w-52 text-[11px] text-slate-200 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold border-b border-slate-700/60 pb-1 mb-1.5">
                  <LogOut size={12} />
                  <span>Latest Logout Time</span>
                </div>
                <p className="text-white font-semibold">
                  {logoutTimeDisplay ? formatFullDateTime(sessionData.logoutTime || user.logout_time) : 'Session Currently Active'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Updated each time you sign out
                </p>
              </div>
            </div>
          </div>

          {/* 3. Midnight Expiry Countdown Tag with Smooth Hover Animation & Tooltip */}
          <div className="group relative hidden md:flex items-center">
            <div
              onClick={() => setShowSessionDetail(!showSessionDetail)}
              className="flex items-center gap-1 px-2 py-1 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/25 hover:border-amber-400/50 rounded-md text-[10px] text-amber-300 font-semibold transition-all duration-200 shadow-2xs hover:scale-[1.02] cursor-pointer"
            >
              <Clock size={10} className="text-amber-300" />
              <span>{countdownText} left (12 AM)</span>
            </div>

            {/* Floating Animated Tooltip on Hover */}
            <div className="absolute top-full right-0 pt-2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transform group-hover:translate-y-0 translate-y-1 transition-all duration-200">
              <div className="bg-[#23282d] border border-amber-500/30 rounded-xl shadow-2xl p-2.5 w-52 text-[11px] text-slate-200 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold border-b border-slate-700/60 pb-1 mb-1.5">
                  <Clock size={12} />
                  <span>Daily 12:00 AM Reset</span>
                </div>
                <p className="text-white font-medium">
                  Sessions auto-expire every midnight to start fresh daily logs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNewMenu(false);
              setShowSessionDetail(false);
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 text-xs text-[#c3c4c7] hover:text-[#72aee6] hover:bg-[#2c3338] rounded transition-colors cursor-pointer"
          >
            <span className="text-[12px] font-medium text-slate-200 max-w-[120px] truncate">
              Hi, {user.name || user.nicename || 'Admin'}
            </span>
            <div className="w-6 h-6 rounded bg-[#2c3338] border border-[#3c434a] flex items-center justify-center text-[10px] text-white font-bold overflow-hidden shadow-2xs">
              <User size={14} className="text-[#72aee6]" />
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-1.5 w-64 bg-[#23282d] border border-[#3c434a] rounded-md shadow-2xl py-2 z-50 text-xs text-[#c3c4c7] animate-in fade-in duration-100">
              {/* User Header Info Card */}
              <div className="px-4 py-2 border-b border-[#3c434a] mb-1.5">
                <p className="font-bold text-white text-sm truncate">
                  {user.name || user.nicename || 'Admin'}
                </p>
                <p className="text-[#a7aaad] text-[11px] truncate mt-0.5">
                  {user.email || 'admin@educationmasters.in'}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase rounded bg-blue-600/30 text-blue-400 border border-blue-500/40">
                    ROLE: {(user.role || 'ADMIN').toUpperCase()}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Online
                  </span>
                </div>
              </div>

              {/* Session Timings Card in Dropdown */}
              <div className="mx-2 mb-2 p-2.5 bg-[#1d2327] border border-[#3c434a] rounded space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-300 font-bold border-b border-[#2c3338] pb-1">
                  <span className="flex items-center gap-1 text-[10px] uppercase text-[#72aee6]">
                    <Clock size={11} /> Today's Session
                  </span>
                  <span className="text-[10px] text-amber-300">12:00 AM Reset</span>
                </div>

                <div className="flex items-center justify-between text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <LogIn size={11} /> Login:
                  </span>
                  <span className="text-white font-semibold">
                    {formatFullDateTime(sessionData.loginTime || user.login_time)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1 text-rose-400 font-medium">
                    <LogOut size={11} /> Last Logout:
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {formatFullDateTime(sessionData.logoutTime || user.logout_time)}
                  </span>
                </div>
              </div>

              {/* Menu Links */}
              <div className="space-y-0.5 px-1">
                <Link
                  href="/edu-admin/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#1d2327] hover:text-[#72aee6] rounded text-xs transition-colors font-medium"
                >
                  <User size={14} className="text-[#72aee6]" />
                  <span>User Profile</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/edu-admin/users/logs"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#1d2327] hover:text-[#72aee6] rounded text-xs transition-colors font-medium"
                  >
                    <History size={14} className="text-emerald-400" />
                    <span>Login & Logout Logs</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/edu-admin/users"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#1d2327] hover:text-[#72aee6] rounded text-xs transition-colors font-medium"
                  >
                    <Users size={14} className="text-blue-400" />
                    <span>Manage Users</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/edu-admin/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#1d2327] hover:text-[#72aee6] rounded text-xs transition-colors font-medium"
                  >
                    <ShieldAlert size={14} className="text-purple-400" />
                    <span>Settings</span>
                  </Link>
                )}
              </div>

              <div className="border-t border-[#3c434a] my-1.5 mx-2"></div>

              <div className="px-1">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-[#1d2327] hover:text-rose-300 rounded transition-colors text-left font-medium cursor-pointer disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Signing Out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={14} />
                      <span>Log Out & Save Time</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
