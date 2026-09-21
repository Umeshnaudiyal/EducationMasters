'use client';

import React, { useState } from 'react';
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
  User
} from 'lucide-react';

export default function AdminHeader({ session }) {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const user = session?.user || {
    name: 'Admin',
    nicename: 'admin',
    email: 'admin@educationmasters.in',
    role: 'admin',
  };

  const userRole = (user.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  return (
    <header className="h-9 bg-[#1d2327] text-white flex items-center justify-between px-3 select-none shrink-0 z-40 border-b border-[#2c3338]">
      {/* Left: Brand + Quick + New */}
      <div className="flex items-center gap-3">
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
          <span className="font-semibold text-xs tracking-tight">Education Masters</span>
        </Link>

        {/* + New Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNewMenu(!showNewMenu);
              setShowProfileMenu(false);
            }}
            className="flex items-center gap-1 px-2 py-0.5 text-xs text-[#c3c4c7] hover:text-[#72aee6] hover:bg-[#2c3338] rounded transition-colors"
          >
            <Plus size={13} className="text-[#a7aaad]" />
            <span className="text-[11px]">New</span>
            <ChevronDown size={11} className="text-[#a7aaad]" />
          </button>

          {showNewMenu && (
            <div className="absolute left-0 mt-1 w-44 bg-[#2c3338] border border-[#3c434a] rounded shadow-xl py-1 z-50 text-xs text-[#c3c4c7]">
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

      {/* Right: Hi, User + Profile Dropdown (Matching Screenshot #4) */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNewMenu(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1 text-xs text-[#c3c4c7] hover:text-[#72aee6] hover:bg-[#2c3338] rounded transition-colors cursor-pointer"
          >
            <span className="text-[12px] font-medium text-slate-200">
              Hi, {user.name || user.nicename || 'umeshnauriyal0007'}
            </span>
            <div className="w-6 h-6 rounded bg-[#2c3338] border border-[#3c434a] flex items-center justify-center text-[10px] text-white font-bold overflow-hidden shadow-2xs">
              <User size={14} className="text-[#72aee6]" />
            </div>
          </button>

          {/* Profile Dropdown (Exact Screenshot #4 layout) */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-1.5 w-56 bg-[#23282d] border border-[#3c434a] rounded-md shadow-2xl py-2 z-50 text-xs text-[#c3c4c7]">
              {/* User Header Info Card */}
              <div className="px-4 py-2 border-b border-[#3c434a] mb-1.5">
                <p className="font-bold text-white text-sm truncate">
                  {user.name || user.nicename || 'umeshnauriyal0007'}
                </p>
                <p className="text-[#a7aaad] text-[11px] truncate mt-0.5">
                  {user.email || 'umeshnauriyal0007@gmail.com'}
                </p>
                <div className="mt-2">
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase rounded bg-blue-600/30 text-blue-400 border border-blue-500/40">
                    ROLE: {(user.role || 'ADMIN').toUpperCase()}
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
                  <User size={15} className="text-[#72aee6]" />
                  <span>User Profile</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/edu-admin/users"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#1d2327] hover:text-[#72aee6] rounded text-xs transition-colors font-medium"
                  >
                    <Users size={15} className="text-blue-400" />
                    <span>Manage Users</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/edu-admin/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#1d2327] hover:text-[#72aee6] rounded text-xs transition-colors font-medium"
                  >
                    <ShieldAlert size={15} className="text-purple-400" />
                    <span>Settings</span>
                  </Link>
                )}
              </div>

              <div className="border-t border-[#3c434a] my-1.5 mx-2"></div>

              <div className="px-1">
                <button
                  onClick={() => signOut({ callbackUrl: '/edu-login' })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-[#1d2327] hover:text-rose-300 rounded transition-colors text-left font-medium cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
