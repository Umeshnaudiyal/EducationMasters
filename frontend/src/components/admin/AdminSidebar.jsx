'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import {
  AnimatedGauge,
  AnimatedPin,
  AnimatedStickyNote,
  AnimatedImage,
  AnimatedLandmark,
  AnimatedCheckSquare,
  AnimatedMockTest,
  AnimatedUsers,
  AnimatedMail,
  AnimatedHistory,
  AnimatedUser,
  AnimatedSettings,
  AnimatedChevronLeft,
  AnimatedChevronRight,
} from '@/components/AnimatedIcons';

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
    questionBank: false,
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
      pathname.includes('/edu-admin/question') ||
      pathname.includes('/edu-admin/questions')
    ) {
      setOpenMenus((prev) => ({ ...prev, questionBank: true }));
    } else if (
      pathname.includes('/edu-admin/mcq') ||
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
      id: 'sticky-notes',
      label: 'Sticky Notes',
      icon: AnimatedStickyNote,
      href: '/edu-admin/sticky-notes',
      roles: ['superadmin', 'admin', 'editor', 'author', 'writer'],
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
      id: 'mock-tests',
      label: 'Mock Tests',
      icon: AnimatedMockTest,
      hasSubmenu: true,
      roles: ['superadmin', 'admin', 'editor', 'author', 'writer'],
      subItems: [
        { label: 'All Mock Test Series', href: '/edu-admin/mock-tests' },
        { label: 'Create Series', href: '/edu-admin/mock-tests/create' },
        { label: 'Pricing & Passes', href: '/edu-admin/mock-tests/plans' },
      ],
    },
    {
      id: 'questionBank',
      label: 'Question Bank',
      icon: AnimatedCheckSquare,
      hasSubmenu: true,
      roles: ['superadmin', 'admin', 'editor', 'author', 'writer'],
      subItems: [
        { label: 'All Questions', href: '/edu-admin/questions' },
        { label: 'Question Reports', href: '/edu-admin/question-reports' },
        { label: 'Add New Question', href: '/edu-admin/questions/create' },
      ],
    },
    {
      id: 'mcqs',
      label: "MCQ's Taxonomy",
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
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: WhatsAppIcon,
      href: '/edu-admin/whatsapp',
      roles: ['superadmin', 'admin'],
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
      const isDirectActive =
        item.href === pathname ||
        (item.href && item.href !== '/edu-admin' && pathname.startsWith(item.href));
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
              className={`relative w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#2271b1] text-white shadow-xs'
                  : 'text-[#c3c4c7] hover:bg-[#2c3338] hover:text-[#72aee6]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <IconComponent
                  size={17}
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-[#a7aaad] group-hover:text-[#72aee6]'
                  }`}
                />
                {(isMobileView || !isCollapsed) && (
                  <span className="truncate text-left leading-tight">{item.label}</span>
                )}
              </div>

              {/* WordPress Triangle Arrow indicator on active parent */}
              {isActive && (isMobileView || !isCollapsed) && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-[#f0f0f1]" />
              )}
            </button>

            {/* Submenu Links */}
            {(isMobileView || !isCollapsed) && isMenuOpen && item.subItems && (
              <div className="bg-[#262c30] py-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
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
                      className={`block py-2 px-5 text-[12px] font-medium transition-colors truncate ${
                        isSubActive
                          ? 'text-white font-bold bg-[#2271b1]/35 border-l-2 border-[#2271b1]'
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
          className={`group flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200 ${
            isActive
              ? 'bg-[#2271b1] text-white shadow-xs'
              : 'text-[#c3c4c7] hover:bg-[#2c3338] hover:text-[#72aee6]'
          }`}
        >
          <IconComponent
            size={17}
            className={`shrink-0 transition-colors ${
              isActive ? 'text-white' : 'text-[#a7aaad] group-hover:text-[#72aee6]'
            }`}
          />
          {(isMobileView || !isCollapsed) && <span className="truncate leading-tight">{item.label}</span>}
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
          <aside className="fixed inset-y-0 left-0 w-68 max-w-[85vw] bg-[#1d2327] text-[#c3c4c7] select-none flex flex-col shadow-2xl z-[100] animate-in slide-in-from-left duration-200">
            {/* Mobile Drawer Top Header */}
            <div className="h-12 px-4 bg-[#1d2327] border-b border-[#2c3338] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-amber-400/20 border border-amber-400 flex items-center justify-center p-0.5 shrink-0">
                  <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-xs sm:text-sm text-white tracking-tight">Admin Menu</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 text-[#a7aaad] hover:text-white hover:bg-[#2c3338] rounded-lg transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex-1 overflow-y-auto py-2 space-y-0.5 custom-scrollbar">
              {renderNavItems(true)}
            </div>

            {/* Mobile Footer */}
            <div className="border-t border-[#2c3338] p-3.5 bg-[#1d2327] shrink-0 text-center">
              <span className="text-[11px] text-slate-400 font-medium">Education Masters Portal</span>
            </div>
          </aside>
        </div>
      )}

      {/* 2. Standard Fixed Desktop Sidebar (>= 768px) with Center-side Animated Collapse Button */}
      <aside
        className={`hidden md:flex relative flex-col bg-[#1d2327] text-[#c3c4c7] select-none transition-all duration-300 ease-in-out shrink-0 z-30 ${
          isCollapsed ? 'w-14' : 'w-[188px]'
        }`}
        style={{ minHeight: '100vh' }}
      >
        {/* CENTER-SIDE FLOATING COLLAPSE BUTTON WITH ANIMATION & HOVER EFFECT */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="group/sidebtn absolute top-1/2 -translate-y-1/2 -right-3.5 z-40 w-7 h-7 rounded-full bg-[#1d2327] hover:bg-[#2271b1] text-[#a7aaad] hover:text-white border-2 border-[#2c3338] hover:border-[#2271b1] shadow-lg flex items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:scale-115 active:scale-95"
        >
          <div className="transition-transform duration-300 flex items-center justify-center">
            {isCollapsed ? (
              <AnimatedChevronRight size={13} className="text-[#a7aaad] group-hover/sidebtn:text-white" />
            ) : (
              <AnimatedChevronLeft size={13} className="text-[#a7aaad] group-hover/sidebtn:text-white" />
            )}
          </div>
        </button>

        {/* Navigation Items Container */}
        <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5 custom-scrollbar">
          {renderNavItems(false)}
        </div>

        {/* Bottom Collapse Menu Toggle Button */}
        <div className="border-t border-[#2c3338] bg-[#1d2327] shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="group w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[#a7aaad] hover:text-[#72aee6] hover:bg-[#2c3338] transition-colors cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full border border-[#a7aaad] flex items-center justify-center shrink-0 transition-colors group-hover:border-[#72aee6]">
              {isCollapsed ? (
                <AnimatedChevronRight size={12} className="text-[#a7aaad] group-hover:text-[#72aee6]" />
              ) : (
                <AnimatedChevronLeft size={12} className="text-[#a7aaad] group-hover:text-[#72aee6]" />
              )}
            </div>
            {!isCollapsed && <span className="text-[12px] font-medium">Collapse Menu</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

