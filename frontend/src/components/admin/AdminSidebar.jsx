'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import {
  AnimatedGauge,
  AnimatedPin,
  AnimatedImage,
  AnimatedLandmark,
  AnimatedCheckSquare,
  AnimatedUsers,
  AnimatedMail,
  AnimatedHistory,
  AnimatedUser,
  AnimatedSettings,
  AnimatedChevronLeft,
  AnimatedChevronRight,
} from '@/components/AnimatedIcons';

export default function AdminSidebar({
  userRole = 'admin',
  isCollapsed,
  setIsCollapsed,
  isMobileSidebarOpen = false,
  setIsMobileSidebarOpen = () => {},
}) {
  const pathname = usePathname();
  const normalizedRole = (userRole || 'admin').toLowerCase();

  const [openMenus, setOpenMenus] = useState({
    posts: false,
    media: false,
    institutes: true,
    mcqs: false,
    users: false,
    settings: false,
  });

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname, setIsMobileSidebarOpen]);

  // Auto-expand active category based on current pathname
  useEffect(() => {
    if (pathname.includes('/edu-admin/institutes') || pathname.includes('/edu-admin/institute')) {
      setOpenMenus((prev) => ({ ...prev, institutes: true }));
    } else if (
      pathname.includes('/edu-admin/blogs') ||
      pathname.includes('/edu-admin/blog') ||
      pathname.includes('/edu-admin/jobs') ||
      pathname.includes('/edu-admin/job') ||
      pathname.includes('/edu-admin/admit') ||
      pathname.includes('/edu-admin/result') ||
      pathname.includes('/edu-admin/categories') ||
      pathname.includes('/edu-admin/tags') ||
      pathname.includes('/edu-admin/departments')
    ) {
      setOpenMenus((prev) => ({ ...prev, posts: true }));
    } else if (pathname.includes('/edu-admin/media')) {
      setOpenMenus((prev) => ({ ...prev, media: true }));
    } else if (
      pathname.includes('/edu-admin/mcq') ||
      pathname.includes('/edu-admin/question') ||
      pathname.includes('/edu-admin/exams') ||
      pathname.includes('/edu-admin/states') ||
      pathname.includes('/edu-admin/subjects') ||
      pathname.includes('/edu-admin/topics') ||
      pathname.includes('/edu-admin/topic-groups')
    ) {
      setOpenMenus((prev) => ({ ...prev, mcqs: true }));
    } else if (pathname.includes('/edu-admin/users') || pathname.includes('/edu-admin/profile')) {
      setOpenMenus((prev) => ({ ...prev, users: true }));
    }
  }, [pathname]);

  const toggleSubmenu = (menu) => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: AnimatedGauge,
      href: '/edu-admin',
      roles: ['superadmin', 'admin', 'editor', 'author', 'writer', 'institute', 'institute_admin', 'institute_employee'],
    },
    {
      id: 'posts',
      label: 'Posts',
      icon: AnimatedPin,
      hasSubmenu: true,
      roles: ['superadmin', 'admin', 'editor', 'author', 'writer'],
      subItems: [
        { label: 'All Articles', href: '/edu-admin/blogs' },
        { label: 'Create Article', href: '/edu-admin/blog/create' },
        { label: 'All Job Posts', href: '/edu-admin/jobs' },
        { label: 'Add New Job', href: '/edu-admin/job/create' },
        { label: 'Admit Cards', href: '/edu-admin/admit-cards' },
        { label: 'Results', href: '/edu-admin/results' },
        { label: 'Categories', href: '/edu-admin/categories' },
        { label: 'Tags', href: '/edu-admin/tags' },
        { label: 'Departments', href: '/edu-admin/departments' },
      ],
    },
    {
      id: 'media',
      label: 'Media',
      icon: AnimatedImage,
      hasSubmenu: true,
      roles: ['superadmin', 'admin', 'editor', 'author', 'writer', 'institute_admin'],
      subItems: [
        { label: 'Library', href: '/edu-admin/media' },
        { label: 'Add New', href: '/edu-admin/media?action=upload' },
      ],
    },
    {
      id: 'institutes',
      label: 'Institutes',
      icon: AnimatedLandmark,
      hasSubmenu: true,
      roles: ['superadmin', 'admin', 'institute', 'institute_admin'],
      subItems: [
        { label: 'All Institutes', href: '/edu-admin/institutes' },
        { label: 'Add New', href: '/edu-admin/institutes/create' },
        { label: 'Courses', href: '/edu-admin/institutes/courses' },
        { label: 'Facilities', href: '/edu-admin/institutes/facilities' },
      ],
    },
    {
      id: 'mcqs',
      label: "MCQ's",
      icon: AnimatedCheckSquare,
      hasSubmenu: true,
      roles: ['superadmin', 'admin', 'editor', 'author', 'writer'],
      subItems: [
        { label: 'Exams', href: '/edu-admin/exams' },
        { label: 'States', href: '/edu-admin/states' },
        { label: 'Add New State', href: '/edu-admin/states/create' },
        { label: 'Subjects', href: '/edu-admin/subjects' },
        { label: 'Topics', href: '/edu-admin/topics' },
        { label: 'Topic Groups', href: '/edu-admin/topic-groups' },
        { label: 'Questions', href: '/edu-admin/questions' },
      ],
    },
    {
      id: 'users',
      label: 'Users',
      icon: AnimatedUsers,
      hasSubmenu: true,
      roles: ['superadmin', 'admin'],
      subItems: [
        { label: 'All Users', href: '/edu-admin/users' },
        { label: 'Add New', href: '/edu-admin/users/create' },
        { label: 'Session Logs', href: '/edu-admin/users/logs' },
        { label: 'Profile', href: '/edu-admin/profile' },
        { label: 'Roles & RBAC', href: '/edu-admin/users/roles' },
      ],
    },
    {
      id: 'subscribers',
      label: 'Subscribers',
      icon: AnimatedMail,
      href: '/edu-admin/subscribers',
      roles: ['superadmin', 'admin', 'editor'],
    },
    // Standalone profile and login logs item for non-admins
    {
      id: 'session-logs',
      label: 'Login Logs',
      icon: AnimatedHistory,
      href: '/edu-admin/users/logs',
      roles: ['editor', 'author', 'writer', 'institute', 'institute_admin', 'institute_employee'],
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: AnimatedUser,
      href: '/edu-admin/profile',
      roles: ['editor', 'author', 'writer', 'institute', 'institute_admin', 'institute_employee'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: AnimatedSettings,
      href: '/edu-admin/settings',
      roles: ['superadmin', 'admin'],
    },
  ];

  const renderNavItems = (isMobileView = false) => {
    return menuItems.map((item) => {
      const isSuperOrAdmin = normalizedRole === 'superadmin' || normalizedRole === 'admin';
      const hasRoleAccess = item.roles.includes(normalizedRole);

      // Only show item if authorized for user's role
      if (!hasRoleAccess && !isSuperOrAdmin) {
        return null;
      }

      // Don't show standalone profile item to admins since it's already inside Users menu
      if (item.id === 'profile' && isSuperOrAdmin) {
        return null;
      }

      const IconComponent = item.icon;
      const isMenuOpen = openMenus[item.id];
      const isDirectActive = item.href === pathname;
      const isSubmenuActive =
        item.subItems &&
        item.subItems.some((s) => {
          const baseHref = s.href.split('?')[0];
          return (
            pathname === baseHref ||
            (baseHref !== '/edu-admin' && pathname.startsWith(baseHref))
          );
        });
      const isActive = isDirectActive || isSubmenuActive;

      if (item.hasSubmenu) {
        return (
          <div key={item.id} className="relative group">
            <button
              type="button"
              onClick={() => toggleSubmenu(item.id)}
              title={!isMobileView && isCollapsed ? item.label : undefined}
              className={`relative w-full flex items-center justify-between px-3 py-2 text-xs font-normal transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#2271b1] text-white font-medium shadow-xs'
                  : 'text-[#c3c4c7] hover:bg-[#2c3338] hover:text-[#72aee6]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconComponent
                  size={16}
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-[#a7aaad] group-hover:text-[#72aee6]'
                  }`}
                />
                {(isMobileView || !isCollapsed) && (
                  <span className="truncate text-left">{item.label}</span>
                )}
              </div>

              {/* WordPress Triangle Arrow indicator on active parent */}
              {isActive && (isMobileView || !isCollapsed) && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-[#f0f0f1]" />
              )}
            </button>

            {/* Submenu Links */}
            {(isMobileView || !isCollapsed) && isMenuOpen && item.subItems && (
              <div className="bg-[#2c3338] py-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {item.subItems.map((sub, subIdx) => {
                  const isSubActive =
                    pathname === sub.href ||
                    (pathname.startsWith(sub.href) && sub.href !== '/edu-admin/institutes');

                  return (
                    <Link
                      key={subIdx}
                      href={sub.href}
                      onClick={() => {
                        if (isMobileView) setIsMobileSidebarOpen(false);
                      }}
                      className={`block py-1.5 px-4 text-[11px] transition-colors truncate ${
                        isSubActive
                          ? 'text-white font-bold bg-[#135e96]/40'
                          : 'text-[#c3c4c7] hover:text-[#72aee6] hover:bg-[#1d2327]/60'
                      }`}
                    >
                      {sub.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      return (
        <Link
          key={item.id}
          href={item.href}
          onClick={() => {
            if (isMobileView) setIsMobileSidebarOpen(false);
          }}
          title={!isMobileView && isCollapsed ? item.label : undefined}
          className={`group flex items-center gap-2.5 px-3 py-2 text-xs font-normal transition-all duration-200 ${
            isActive
              ? 'bg-[#2271b1] text-white font-medium shadow-xs'
              : 'text-[#c3c4c7] hover:bg-[#2c3338] hover:text-[#72aee6]'
          }`}
        >
          <IconComponent
            size={16}
            className={`shrink-0 transition-colors ${
              isActive ? 'text-white' : 'text-[#a7aaad] group-hover:text-[#72aee6]'
            }`}
          />
          {(isMobileView || !isCollapsed) && <span className="truncate">{item.label}</span>}
        </Link>
      );
    });
  };

  return (
    <>
      {/* 1. Mobile Slide-out Drawer Overlay (< 768px) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close Sidebar"
          />

          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-64 max-w-[82vw] bg-[#1d2327] text-[#c3c4c7] select-none flex flex-col shadow-2xl z-[100] animate-in slide-in-from-left duration-200">
            {/* Mobile Drawer Top Header */}
            <div className="h-11 px-3.5 bg-[#1d2327] border-b border-[#2c3338] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-amber-400/20 border border-amber-400 flex items-center justify-center p-0.5 shrink-0">
                  <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-xs text-white tracking-tight">Admin Menu</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 text-[#a7aaad] hover:text-white hover:bg-[#2c3338] rounded-md transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex-1 overflow-y-auto py-2 space-y-0.5 custom-scrollbar">
              {renderNavItems(true)}
            </div>

            {/* Mobile Footer */}
            <div className="border-t border-[#2c3338] p-3 bg-[#1d2327] shrink-0 text-center">
              <span className="text-[10px] text-slate-400">Education Masters Portal</span>
            </div>
          </aside>
        </div>
      )}

      {/* 2. Standard Fixed Desktop Sidebar (>= 768px) - 100% Intact */}
      <aside
        className={`hidden md:flex relative flex-col bg-[#1d2327] text-[#c3c4c7] select-none transition-all duration-200 ease-in-out shrink-0 z-30 ${
          isCollapsed ? 'w-12' : 'w-[165px]'
        }`}
        style={{ minHeight: '100vh' }}
      >
        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-1 space-y-0.5 custom-scrollbar">
          {renderNavItems(false)}
        </div>

        {/* Collapse Menu Toggle Button at Bottom */}
        <div className="border-t border-[#2c3338] bg-[#1d2327] shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="group w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#a7aaad] hover:text-[#72aee6] hover:bg-[#2c3338] transition-colors cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full border border-[#a7aaad] flex items-center justify-center shrink-0 transition-colors group-hover:border-[#72aee6]">
              {isCollapsed ? (
                <AnimatedChevronRight size={12} className="text-[#a7aaad] group-hover:text-[#72aee6]" />
              ) : (
                <AnimatedChevronLeft size={12} className="text-[#a7aaad] group-hover:text-[#72aee6]" />
              )}
            </div>
            {!isCollapsed && <span className="text-[11px]">Collapse Menu</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

