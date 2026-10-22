'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  Plus,
  ExternalLink,
  ChevronDown,
  ShieldAlert,
  Loader2,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { WhatsAppHeaderDrawer, SmtpHeaderDrawer } from './HeaderIntegrationModals';
import {
  AnimatedLogIn,
  AnimatedLogOut,
  AnimatedClock,
  AnimatedUser,
  AnimatedHistory,
  AnimatedUsers,
  AnimatedShield,
  AnimatedSettings,
  AnimatedPlus,
  AnimatedFileText,
  AnimatedBriefcase,
  AnimatedLandmark,
  AnimatedCheckSquare,
  AnimatedMenu,
} from '@/components/AnimatedIcons';
import { BACKEND_URL } from '@/utils/api';

const WhatsAppIcon = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`shrink-0 ${className}`}
  >
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.19.53-1.06 1.04-1.46 1.1-.38.07-.86.1-2.49-.58-1.97-.82-3.23-2.83-3.33-2.96-.1-.14-.8-1.07-.8-2.04s.51-1.45.69-1.65c.19-.19.41-.24.55-.24.14 0 .28 0 .4.01.13.01.3.05.47.45.17.41.6 1.45.65 1.55.05.1.09.22.02.35-.07.14-.11.22-.21.35-.11.12-.23.28-.33.37-.11.11-.23.23-.1.45.13.22.58.96 1.25 1.56.86.77 1.59 1.01 1.81 1.12.22.11.35.1.48-.05.14-.14.58-.68.74-.91.16-.23.32-.19.53-.11.22.08 1.39.66 1.63.78.24.12.4.18.46.28.06.1.06.6-.13 1.13z" />
  </svg>
);

export default function AdminHeader({ session, onToggleMobileSidebar }) {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isWhatsAppDrawerOpen, setIsWhatsAppDrawerOpen] = useState(false);
  const [isSmtpDrawerOpen, setIsSmtpDrawerOpen] = useState(false);
  const [globalStatus, setGlobalStatus] = useState(null);

  const profileRef = useRef(null);
  const profileTimerRef = useRef(null);
  const newMenuRef = useRef(null);
  const newMenuTimerRef = useRef(null);

  // Smooth hover enter/leave handlers for User Profile Dropdown
  const handleProfileEnter = () => {
    if (profileTimerRef.current) {
      clearTimeout(profileTimerRef.current);
      profileTimerRef.current = null;
    }
    setShowProfileMenu(true);
  };

  const handleProfileLeave = () => {
    if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
    profileTimerRef.current = setTimeout(() => {
      setShowProfileMenu(false);
    }, 220);
  };

  // Smooth hover enter/leave handlers for + New Menu Dropdown
  const handleNewMenuEnter = () => {
    if (newMenuTimerRef.current) {
      clearTimeout(newMenuTimerRef.current);
      newMenuTimerRef.current = null;
    }
    setShowNewMenu(true);
  };

  const handleNewMenuLeave = () => {
    if (newMenuTimerRef.current) clearTimeout(newMenuTimerRef.current);
    newMenuTimerRef.current = setTimeout(() => {
      setShowNewMenu(false);
    }, 220);
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (newMenuRef.current && !newMenuRef.current.contains(e.target)) {
        setShowNewMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
      if (newMenuTimerRef.current) clearTimeout(newMenuTimerRef.current);
    };
  }, []);

  // Live session times state
  const [sessionData, setSessionData] = useState({
    loginTime: session?.user?.login_time || null,
    logoutTime: session?.user?.logout_time || null,
    expiresAt: session?.user?.expires_at || null,
    sessionDate: session?.user?.session_date || null,
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
        `${BACKEND_URL}/apis/v1/auth/session-info?userId=${user.id}`
      );
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.isExpired) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          signOut({ callbackUrl: '/edu-login?expired=1' });
          return;
        }

        if (data.data.user) {
          setSessionData({
            loginTime: data.data.user.login_time,
            logoutTime: data.data.user.logout_time,
            expiresAt: data.data.user.expires_at,
            sessionDate: data.data.user.session_date,
            timeRemaining: data.data.formattedTimeRemaining || '',
          });
        }
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

  // Fetch live global status for WhatsApp and SMTP
  const fetchGlobalStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/apis/v1/settings/status`);
      const json = await res.json();
      if (json.success && json.data) {
        setGlobalStatus(json.data);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchGlobalStatus();
    const interval = setInterval(fetchGlobalStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchGlobalStatus]);

  // Live Countdown to 12:00 AM Midnight with Active Day Checking
  const [countdownText, setCountdownText] = useState('');
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const sessionDate = sessionData.sessionDate || session?.user?.session_date;

      // 1. If session was established on a previous calendar day, expire immediately
      if (sessionDate && sessionDate !== todayStr) {
        setCountdownText('Session Expired');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        signOut({ callbackUrl: '/edu-login?expired=1' });
        return;
      }

      // 2. Compute time remaining until 12:00 AM midnight expiration
      let targetMidnight;
      if (sessionData.expiresAt || session?.user?.expires_at) {
        targetMidnight = new Date(sessionData.expiresAt || session.user.expires_at);
      } else {
        targetMidnight = new Date(now);
        targetMidnight.setHours(24, 0, 0, 0);
      }

      const diffMs = targetMidnight.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdownText('Session Expired');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        signOut({ callbackUrl: '/edu-login?expired=1' });
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);

      setCountdownText(`${hrs}h ${mins}m`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 5000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        updateCountdown();
        fetchSessionInfo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [sessionData.sessionDate, sessionData.expiresAt, session?.user?.session_date, session?.user?.expires_at, fetchSessionInfo]);

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
        `${BACKEND_URL}/apis/v1/auth/logout`,
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
    <header className="sticky top-0 z-50 h-11 bg-[#1d2327] text-white flex items-center justify-between px-2.5 sm:px-4 select-none shrink-0 border-b border-[#2c3338] shadow-2xs">
      {/* Left: Hamburger (Mobile) + Brand + Quick + New */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-1.5 -ml-1 text-[#c3c4c7] hover:text-white hover:bg-[#2c3338] rounded-md transition-colors cursor-pointer"
          title="Toggle Navigation Menu"
          aria-label="Toggle navigation menu"
        >
          <AnimatedMenu size={18} />
        </button>

        {/* Education Masters Brand Item */}
        <Link
          href="/edu-admin"
          className="flex items-center gap-2 text-xs font-semibold text-[#f0f0f1] hover:text-[#72aee6] transition-colors"
        >
          <div className="w-5 h-5 rounded-full overflow-hidden bg-amber-400/20 border border-amber-400 flex items-center justify-center p-0.5 shrink-0">
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
        <div
          ref={newMenuRef}
          onMouseEnter={handleNewMenuEnter}
          onMouseLeave={handleNewMenuLeave}
          className="relative"
        >
          <button
            onClick={() => {
              setShowNewMenu(!showNewMenu);
              setShowProfileMenu(false);
              setShowSessionDetail(false);
            }}
            className="group flex items-center gap-1 px-1.5 sm:px-2 py-1 text-xs text-[#c3c4c7] hover:text-[#72aee6] hover:bg-[#2c3338] rounded-md transition-all cursor-pointer"
          >
            <AnimatedPlus size={13} className="text-[#a7aaad] group-hover:text-[#72aee6]" />
            <span className="text-[11px]">New</span>
            <ChevronDown size={11} className="text-[#a7aaad]" />
          </button>

          {showNewMenu && (
            <div
              onMouseEnter={handleNewMenuEnter}
              onMouseLeave={handleNewMenuLeave}
              className="absolute left-0 mt-1.5 w-44 bg-[#2c3338] border border-[#3c434a] rounded-lg shadow-2xl py-1 z-50 text-xs text-[#c3c4c7] animate-in fade-in zoom-in-95 duration-100"
            >
              <Link
                href="/edu-admin/blog/create"
                onClick={() => setShowNewMenu(false)}
                className="group flex items-center gap-2 px-3 py-1.5 hover:bg-[#1d2327] hover:text-[#72aee6] transition-colors"
              >
                <AnimatedFileText size={13} className="text-blue-400" />
                <span>Post / Article</span>
              </Link>
              <Link
                href="/edu-admin/posts/create?type=job"
                onClick={() => setShowNewMenu(false)}
                className="group flex items-center gap-2 px-3 py-1.5 hover:bg-[#1d2327] hover:text-[#72aee6] transition-colors"
              >
                <AnimatedBriefcase size={13} className="text-emerald-400" />
                <span>Job Post</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/edu-admin/institutes/create"
                  onClick={() => setShowNewMenu(false)}
                  className="group flex items-center gap-2 px-3 py-1.5 hover:bg-[#1d2327] hover:text-[#72aee6] transition-colors"
                >
                  <AnimatedLandmark size={13} className="text-cyan-400" />
                  <span>Institute</span>
                </Link>
              )}
              <Link
                href="/edu-admin/mcqs/create"
                onClick={() => setShowNewMenu(false)}
                className="group flex items-center gap-2 px-3 py-1.5 hover:bg-[#1d2327] hover:text-[#72aee6] transition-colors"
              >
                <AnimatedCheckSquare size={13} className="text-pink-400" />
                <span>MCQ Question</span>
              </Link>
              {isAdmin && (
                <>
                  <div className="border-t border-[#3c434a] my-1"></div>
                  <Link
                    href="/edu-admin/users/create"
                    onClick={() => setShowNewMenu(false)}
                    className="group flex items-center gap-2 px-3 py-1.5 hover:bg-[#1d2327] hover:text-[#72aee6] transition-colors"
                  >
                    <AnimatedUsers size={13} className="text-amber-400" />
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

      {/* Middle/Right: WhatsApp & SMTP Integration Badges (At Left of Login Time) + Session Time Widget */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* 1. WhatsApp Connection Pool Button with Smooth Hover Slide-in Status Animation */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => {
              setIsWhatsAppDrawerOpen((prev) => !prev);
              setIsSmtpDrawerOpen(false);
              setShowProfileMenu(false);
            }}
            className="relative flex items-center h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl bg-[#2c3338]/90 hover:bg-[#343b42] border border-[#3c434a] hover:border-emerald-500/50 text-emerald-400 transition-all duration-300 ease-out shadow-2xs cursor-pointer group"
          >
            {/* WhatsApp Green Brand Icon */}
            <div className="shrink-0 flex items-center justify-center text-[#25D366]">
              <WhatsAppIcon size={16} />
            </div>

            {/* Smooth Slide Animation on Hover: Expands to show WhatsApp Connected / Disconnected Status */}
            <div className="max-w-0 group-hover:max-w-[220px] opacity-0 group-hover:opacity-100 overflow-hidden transition-all duration-300 ease-out whitespace-nowrap flex items-center gap-1.5 pl-0 group-hover:pl-2">
              <span
                className={`text-[11px] font-bold tracking-tight flex items-center gap-1.5 ${globalStatus?.whatsapp?.status === 'CONNECTED'
                    ? 'text-emerald-400'
                    : globalStatus?.whatsapp?.status === 'SCAN_QR'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${globalStatus?.whatsapp?.status === 'CONNECTED'
                      ? 'bg-emerald-400 animate-pulse'
                      : globalStatus?.whatsapp?.status === 'SCAN_QR'
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-rose-400'
                    }`}
                />
                <span>
                  {globalStatus?.whatsapp?.status === 'CONNECTED'
                    ? (globalStatus.whatsapp.activeName || 'WhatsApp Connected')
                    : globalStatus?.whatsapp?.status === 'SCAN_QR'
                      ? 'Scan QR Required'
                      : 'WhatsApp Disconnected'}
                </span>
              </span>
            </div>

            {/* Top-Right Status Dot Indicator */}
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
              {globalStatus?.whatsapp?.status === 'CONNECTED' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-[#1d2327]"></span>
                </>
              ) : globalStatus?.whatsapp?.status === 'SCAN_QR' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border-2 border-[#1d2327]"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-[#1d2327]"></span>
              )}
            </span>
          </button>

          {/* Floating Animated Tooltip on Hover */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transform group-hover:translate-y-0 translate-y-1 transition-all duration-200">
            <div className="bg-[#23282d] border border-emerald-500/30 rounded-xl shadow-2xl p-2.5 w-52 text-[11px] text-slate-200 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 mb-1.5">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <WhatsAppIcon size={12} className="text-[#25D366]" />
                  <span>WhatsApp Status</span>
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${globalStatus?.whatsapp?.status === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : globalStatus?.whatsapp?.status === 'SCAN_QR'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                >
                  {globalStatus?.whatsapp?.status || 'DISCONNECTED'}
                </span>
              </div>
              <p className="text-white font-semibold">
                {globalStatus?.whatsapp?.status === 'CONNECTED'
                  ? `Connected: ${globalStatus.whatsapp.activePhone
                    ? `+${String(globalStatus.whatsapp.activePhone).trim().replace(/^\++/, '')}`
                    : 'Active Line'
                  }`
                  : globalStatus?.whatsapp?.status === 'SCAN_QR'
                    ? 'Scan QR with phone to connect'
                    : 'Offline / Disconnected'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Click to open live QR &amp; worker pool
              </p>
            </div>
          </div>
        </div>

        {/* 2. Global SMTP Mail Button (Dark styled matching header) */}
        {(() => {
          const isSmtpConnected = Boolean(
            globalStatus?.smtp?.status === 'CONNECTED' &&
            globalStatus?.smtp?.user &&
            globalStatus?.smtp?.hasCredentials
          );
          const hasCredentials = Boolean(
            globalStatus?.smtp?.user && globalStatus?.smtp?.hasCredentials
          );

          return (
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  setIsSmtpDrawerOpen((prev) => !prev);
                  setIsWhatsAppDrawerOpen(false);
                  setShowProfileMenu(false);
                }}
                title={`Global SMTP: ${isSmtpConnected ? 'Connected' : hasCredentials ? 'Offline / Untested' : 'Unconfigured'
                  }`}
                className="relative flex items-center h-7 sm:h-8 px-2 sm:px-2 rounded-xl bg-[#2c3338]/90 hover:bg-[#343b42] border border-[#3c434a] hover:border-cyan-500/50 text-cyan-400 transition-all duration-300 ease-out shadow-2xs cursor-pointer group"
              >
                <div className="shrink-0 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-cyan-400" />
                </div>

                {/* Smooth Slide Animation on Hover for SMTP */}
                <div className="max-w-0 group-hover:max-w-[170px] opacity-0 group-hover:opacity-100 overflow-hidden transition-all duration-300 ease-out whitespace-nowrap flex items-center gap-1.5 pl-0 group-hover:pl-2">
                  <span
                    className={`text-[11px] font-bold tracking-tight flex items-center gap-1.5 ${isSmtpConnected ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSmtpConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                        }`}
                    />
                    <span>
                      {isSmtpConnected
                        ? 'SMTP Connected'
                        : !hasCredentials
                          ? 'SMTP Unconfigured'
                          : 'SMTP Offline'}
                    </span>
                  </span>
                </div>

                {/* Top-Right Status Dot Indicator */}
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
                  {isSmtpConnected ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-[#1d2327]"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-[#1d2327]"></span>
                  )}
                </span>
              </button>

              {/* Floating Animated Tooltip on Hover */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transform group-hover:translate-y-0 translate-y-1 transition-all duration-200">
                <div className="bg-[#23282d] border border-cyan-500/30 rounded-xl shadow-2xl p-2.5 w-52 text-[11px] text-slate-200 backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 mb-1.5">
                    <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                      <Mail size={12} />
                      <span>SMTP Server</span>
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${isSmtpConnected
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                        }`}
                    >
                      {isSmtpConnected
                        ? 'CONNECTED'
                        : !hasCredentials
                          ? 'UNCONFIGURED'
                          : 'OFFLINE'}
                    </span>
                  </div>
                  <p className="text-white font-semibold">
                    {isSmtpConnected
                      ? `Active: ${globalStatus.smtp.user}`
                      : !hasCredentials
                        ? 'Email & password not stored'
                        : 'Transactional mail server offline'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isSmtpConnected ? 'Click to view SMTP settings' : 'Click to configure credentials'}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Divider before Login Time */}
        <span className="text-slate-600 font-light text-xs hidden sm:inline">|</span>

        {/* Session Time Status Badges Capsule (Login time) */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-0.5 bg-[#2c3338]/60 border border-[#3c434a] rounded-lg shadow-2xs">
          {/* 1. Login "In" Badge with Smooth Hover Animation & Tooltip */}
          <div className="group relative flex items-center">
            <button
              type="button"
              onClick={() => setShowSessionDetail(!showSessionDetail)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-[#1d2327]/80 hover:bg-emerald-950/50 border border-emerald-500/25 hover:border-emerald-400/60 text-emerald-400 text-[10px] sm:text-[11px] font-medium transition-all duration-200 shadow-2xs hover:shadow-emerald-950/40 hover:scale-[1.02] cursor-pointer"
            >
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-300/80 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider hidden xs:inline">In:</span>
              <span className="font-bold text-white text-[10px] sm:text-[11px] tracking-tight whitespace-nowrap">
                {loginTimeDisplay || 'Active'}
              </span>
            </button>

            {/* Floating Animated Tooltip on Hover */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transform group-hover:translate-y-0 translate-y-1 transition-all duration-200">
              <div className="bg-[#23282d] border border-emerald-500/30 rounded-xl shadow-2xl p-2.5 w-52 text-[11px] text-slate-200 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold border-b border-slate-700/60 pb-1 mb-1.5">
                  <AnimatedLogIn size={12} />
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
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-[#1d2327]/80 hover:bg-rose-950/50 border border-rose-500/25 hover:border-rose-400/60 text-rose-300 text-[10px] sm:text-[11px] font-medium transition-all duration-200 shadow-2xs hover:shadow-rose-950/40 hover:scale-[1.02] cursor-pointer"
            >
              <AnimatedLogOut size={11} className="text-rose-400 shrink-0" />
              <span className="text-rose-300/80 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider hidden xs:inline">Out:</span>
              <span className="font-semibold text-slate-200 text-[10px] sm:text-[11px] whitespace-nowrap">
                {logoutTimeDisplay || '—'}
              </span>
            </button>

            {/* Floating Animated Tooltip on Hover */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transform group-hover:translate-y-0 translate-y-1 transition-all duration-200">
              <div className="bg-[#23282d] border border-rose-500/30 rounded-xl shadow-2xl p-2.5 w-52 text-[11px] text-slate-200 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold border-b border-slate-700/60 pb-1 mb-1.5">
                  <AnimatedLogOut size={12} />
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
              <AnimatedClock size={10} className="text-amber-300" />
              <span>{countdownText} left (12 AM)</span>
            </div>

            {/* Floating Animated Tooltip on Hover */}
            <div className="absolute top-full right-0 pt-2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transform group-hover:translate-y-0 translate-y-1 transition-all duration-200">
              <div className="bg-[#23282d] border border-amber-500/30 rounded-xl shadow-2xl p-2.5 w-52 text-[11px] text-slate-200 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold border-b border-slate-700/60 pb-1 mb-1.5">
                  <AnimatedClock size={12} />
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
        <div
          ref={profileRef}
          onMouseEnter={handleProfileEnter}
          onMouseLeave={handleProfileLeave}
          className="relative"
        >
          <button
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNewMenu(false);
              setShowSessionDetail(false);
            }}
            className="group flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1 text-xs text-[#c3c4c7] hover:text-[#72aee6] hover:bg-[#2c3338] rounded transition-colors cursor-pointer"
          >
            <span className="text-[11px] sm:text-[12px] font-medium text-slate-200 max-w-[80px] sm:max-w-[120px] truncate hidden xxs:inline">
              Hi, {user.name || user.nicename || 'Admin'}
            </span>
            <div className="w-6 h-6 rounded bg-[#2c3338] border border-[#3c434a] flex items-center justify-center text-[10px] text-white font-bold overflow-hidden shadow-2xs shrink-0">
              <AnimatedUser size={14} className="text-[#72aee6]" />
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div
              onMouseEnter={handleProfileEnter}
              onMouseLeave={handleProfileLeave}
              className="absolute right-0 mt-1.5 w-64 bg-[#23282d] border border-[#3c434a] rounded-md shadow-2xl py-2 z-50 text-xs text-[#c3c4c7] animate-in fade-in duration-100"
            >
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
                  <span className="flex items-center gap-1.5 text-[10px] uppercase text-[#72aee6] font-bold">
                    <AnimatedClock size={12} className="text-[#72aee6]" /> Today&apos;s Session
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold">12:00 AM Reset</span>
                </div>

                <div className="flex items-center justify-between text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <AnimatedLogIn size={12} className="text-emerald-400" /> Login:
                  </span>
                  <span className="text-white font-semibold">
                    {formatFullDateTime(sessionData.loginTime || user.login_time)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                    <AnimatedLogOut size={12} className="text-rose-400" /> Last Logout:
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {formatFullDateTime(sessionData.logoutTime || user.logout_time)}
                  </span>
                </div>
              </div>

              {/* Menu Links with Lucide-Animated Icons */}
              <div className="space-y-0.5 px-1">
                <Link
                  href="/edu-admin/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="group flex items-center gap-2.5 px-3 py-2 hover:bg-[#1d2327] hover:text-[#72aee6] rounded text-xs transition-colors font-medium"
                >
                  <AnimatedUser size={14} className="text-[#72aee6]" />
                  <span>User Profile</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/edu-admin/users/logs"
                    onClick={() => setShowProfileMenu(false)}
                    className="group flex items-center gap-2.5 px-3 py-2 hover:bg-[#1d2327] hover:text-[#72aee6] rounded text-xs transition-colors font-medium"
                  >
                    <AnimatedHistory size={14} className="text-emerald-400" />
                    <span>Login &amp; Logout Logs</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/edu-admin/users"
                    onClick={() => setShowProfileMenu(false)}
                    className="group flex items-center gap-2.5 px-3 py-2 hover:bg-[#1d2327] hover:text-[#72aee6] rounded text-xs transition-colors font-medium"
                  >
                    <AnimatedUsers size={14} className="text-blue-400" />
                    <span>Manage Users</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/edu-admin/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="group flex items-center gap-2.5 px-3 py-2 hover:bg-[#1d2327] hover:text-[#72aee6] rounded text-xs transition-colors font-medium"
                  >
                    <AnimatedShield size={14} className="text-purple-400" />
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
                  className="group w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-[#1d2327] hover:text-rose-300 rounded transition-colors text-left font-medium cursor-pointer disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Signing Out...</span>
                    </>
                  ) : (
                    <>
                      <AnimatedLogOut size={14} className="text-rose-400" />
                      <span>Log Out &amp; Save Time</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide Animation Drawers for WhatsApp and SMTP */}
      <WhatsAppHeaderDrawer
        isOpen={isWhatsAppDrawerOpen}
        onClose={() => setIsWhatsAppDrawerOpen(false)}
        onRefreshStatus={fetchGlobalStatus}
      />
      <SmtpHeaderDrawer
        isOpen={isSmtpDrawerOpen}
        onClose={() => setIsSmtpDrawerOpen(false)}
        onRefreshStatus={fetchGlobalStatus}
      />
    </header>
  );
}
