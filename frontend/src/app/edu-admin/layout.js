'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Home, LogOut, BookOpen } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminLoader from '@/components/admin/AdminLoader';
import { RBACProvider, useRBAC } from '@/context/RBACContext';

function AdminRouteGuard({ children }) {
  const pathname = usePathname();
  const { canAccessRoute, userRole } = useRBAC();

  const access = canAccessRoute(pathname);

  if (!access.allowed) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-sm p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-xs">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Your role <span className="font-semibold text-rose-600 uppercase">({userRole})</span> does not have the required capability <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-[11px]">{access.requiredPermission}</code> to access this route.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-left text-xs text-slate-500 w-full mb-6">
            <p className="font-semibold text-slate-700 mb-0.5">Need Access?</p>
            <p className="text-[11px]">
              Contact an administrator to grant this capability to your account via the Roles &amp; Permissions Matrix.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/edu-admin"
              className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Return to Dashboard
            </Link>
            <Link
              href="/edu-admin/profile"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
            >
              My Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Monitor daily midnight (12:00 AM) session expiry and sync token
  React.useEffect(() => {
    if (!session?.user) return;

    if (session.user.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('token', session.user.accessToken);
    }

    const checkSessionExpiry = () => {
      const now = new Date();
      const nowTime = now.getTime();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      // 1. Check if session_date is from a previous calendar day
      if (session.user.session_date && session.user.session_date !== todayStr) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        signOut({ callbackUrl: '/edu-login?expired=1' });
        return;
      }

      // 2. Check if session expires_at is reached or in the past
      if (session.user.expires_at) {
        const expiresAtTime = new Date(session.user.expires_at).getTime();
        if (nowTime >= expiresAtTime) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          signOut({ callbackUrl: '/edu-login?expired=1' });
          return;
        }
      }

      // 3. Check upcoming midnight of the current day
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const remainingMs = midnight.getTime() - nowTime;

      if (remainingMs <= 1000) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        signOut({ callbackUrl: '/edu-login?expired=1' });
      }
    };

    // Run check immediately on mount and periodically
    checkSessionExpiry();
    const interval = setInterval(checkSessionExpiry, 5000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkSessionExpiry();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [session]);


  // If session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full bg-[#f0f0f1] flex items-center justify-center">
        <AdminLoader text="Loading Education Masters Admin Portal..." subtext="Authenticating and preparing dashboard" />
      </div>
    );
  }

  // If user is not authenticated, redirect immediately to login
  if (status === 'unauthenticated' || !session?.user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/edu-login';
    }
    return (
      <div className="min-h-screen w-full bg-[#f0f0f1] flex items-center justify-center">
        <AdminLoader text="Redirecting to Login..." subtext="Authentication required to access Education Masters Admin Portal" />
      </div>
    );
  }

  const userRole = session?.user?.role || 'admin';

  // If user has role 'user' or 'subscriber' (End User / Student), restrict access to admin panel
  if (session?.user && (userRole === 'user' || userRole === 'subscriber')) {
    return (
      <div className="min-h-screen bg-[#f0f0f1] flex flex-col items-center justify-center p-4 font-sans text-slate-800 select-none">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600 shadow-inner">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Access Restricted</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your account <span className="font-semibold text-slate-700 font-mono">({session.user.email})</span> is currently registered with the <span className="font-semibold text-blue-600 uppercase">End User</span> role and does not have administrative permissions.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-left text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">Need Staff or Writer Privileges?</p>
            <p className="text-[11px] text-slate-500">
              Please contact the site administrator to upgrade your account role to Writer, Editor, or Admin.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            <Link
              href="/"
              className="w-full py-2.5 px-4 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Home size={14} />
              <span>Go to Homepage</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/edu-login' })}
              className="w-full py-2.5 px-4 bg-[#f0f0f1] hover:bg-[#dcdcde] text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RBACProvider>
      <div className="min-h-screen bg-[#f0f0f1] text-slate-800 flex flex-col font-sans antialiased w-full max-w-full">
        {/* Top Header Bar - Always Sticky at top */}
        <AdminHeader
          session={session}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Body Area with Sticky Sidebar + Content */}
        <div className="flex-1 flex flex-row min-w-0 w-full max-w-full relative">
          {/* Compact Collapsible Sidebar - Sticky below the header */}
          <AdminSidebar
            userRole={userRole}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            isMobileSidebarOpen={isMobileSidebarOpen}
            setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          />

          {/* Dynamic Page Container with Route Access Guard */}
          <main className="flex-1 p-3 sm:p-5 bg-[#f0f0f1] custom-scrollbar min-w-0 max-w-full">
            <AdminRouteGuard>
              {children}
            </AdminRouteGuard>
          </main>
        </div>
      </div>
    </RBACProvider>
  );
}
