'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { ShieldAlert, Home, LogOut, BookOpen } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminLoader from '@/components/admin/AdminLoader';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full bg-[#f0f0f1] flex items-center justify-center">
        <AdminLoader text="Loading Education Masters Admin Portal..." subtext="Authenticating and preparing dashboard" />
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
    <div className="min-h-screen bg-[#f0f0f1] text-slate-800 flex flex-col overflow-hidden font-sans antialiased">
      {/* Top Header Bar */}
      <AdminHeader session={session} />

      {/* Body Area with Sidebar + Content */}
      <div className="flex-1 flex flex-row min-w-0 h-[calc(100vh-36px)] overflow-hidden">
        {/* Compact Collapsible Sidebar (165px) with RBAC filtering */}
        <AdminSidebar
          userRole={userRole}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        {/* Dynamic Page Container with Stable Scrollbar to prevent horizontal shaking */}
        <main className="flex-1 overflow-y-scroll p-4 sm:p-5 bg-[#f0f0f1] custom-scrollbar [scrollbar-gutter:stable]">
          {children}
        </main>
      </div>
    </div>
  );
}
