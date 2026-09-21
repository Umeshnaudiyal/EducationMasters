'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ShieldCheck,
  Users,
  Check,
  X,
  Lock,
  Building2,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Settings,
  Save,
  Info,
  ShieldAlert,
} from 'lucide-react';
import AdminLoader from '@/components/admin/AdminLoader';

export default function RolesAndPermissionsPage() {
  const { data: session, status } = useSession();
  const userRole = (session?.user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const [activeRole, setActiveRole] = useState('superadmin');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Role Definitions
  const roles = [
    {
      id: 'superadmin',
      name: 'Superadmin',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'Universal root access. Bypasses all permission checks. Can create institutes, assign CRM plans, and manage all staff.',
    },
    {
      id: 'admin',
      name: 'Admin',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'System administrator. Can manage users, institutes, content, MCQs, and media library.',
    },
    {
      id: 'editor',
      name: 'Editor',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Content reviewer and publisher. Manages blogs, job posts, admit cards, results, categories, and tags.',
    },
    {
      id: 'author',
      name: 'Author (Writer)',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Content creator. Can draft articles, blogs, job notifications, and submit questions to the MCQ bank.',
    },
    {
      id: 'institute_admin',
      name: 'Institute Admin',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'Educational institute manager. Manages institute profile, courses, leads CRM, and invites institute employees.',
    },
    {
      id: 'institute_employee',
      name: 'Institute Employee',
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      description: 'Institute staff member. Handles student inquiries, leads follow-up, and admissions inside the CRM panel.',
    },
    {
      id: 'user',
      name: 'User (Student)',
      badge: 'bg-slate-100 text-slate-800 border-slate-200',
      description: 'Public portal user. Can take online MCQ mock tests, browse institutes, save jobs, and apply.',
    },
  ];

  // Permission Modules
  const permissionModules = [
    {
      category: 'Dashboard & Analytics',
      icon: Settings,
      permissions: [
        { key: 'view_dashboard', label: 'View Dashboard Overview' },
        { key: 'view_analytics', label: 'View Live System Analytics & Growth Stats' },
      ],
    },
    {
      category: 'Content & Posts (Jobs, Blogs, Admit Cards)',
      icon: FileText,
      permissions: [
        { key: 'view_posts', label: 'View All Posts & Articles' },
        { key: 'create_posts', label: 'Create / Draft New Posts & Jobs' },
        { key: 'edit_posts', label: 'Edit Existing Posts' },
        { key: 'publish_posts', label: 'Publish & Unpublish Posts' },
        { key: 'delete_posts', label: 'Delete Posts (Trash)' },
        { key: 'manage_categories', label: 'Manage Categories, Tags, and Departments' },
      ],
    },
    {
      category: 'Institutes & CRM Management',
      icon: Building2,
      permissions: [
        { key: 'view_institutes', label: 'View Institutes Directory' },
        { key: 'create_institutes', label: 'Create New Educational Institute' },
        { key: 'edit_institutes', label: 'Edit Institute Profile, Courses, & Facilities' },
        { key: 'assign_crm_plans', label: 'Assign / Upgrade CRM Subscription Validity' },
        { key: 'manage_institute_staff', label: 'Create & Manage Institute Employees' },
        { key: 'view_institute_leads', label: 'Access Student Inquiries & CRM Leads' },
      ],
    },
    {
      category: "MCQ's & Test Series",
      icon: HelpCircle,
      permissions: [
        { key: 'view_mcqs', label: 'View MCQ Question Bank' },
        { key: 'create_mcqs', label: 'Add New MCQ Questions & Options' },
        { key: 'edit_mcqs', label: 'Edit Questions & Explanations' },
        { key: 'delete_mcqs', label: 'Delete Questions' },
      ],
    },
    {
      category: 'Media Library Assets',
      icon: ImageIcon,
      permissions: [
        { key: 'view_media', label: 'View Media Assets' },
        { key: 'upload_media', label: 'Upload Images, Banners, & Documents' },
        { key: 'delete_media', label: 'Delete Media Assets' },
      ],
    },
    {
      category: 'User Management & Roles',
      icon: Users,
      permissions: [
        { key: 'view_users', label: 'View Users List & Role Filters' },
        { key: 'create_users', label: 'Create Admin, Editor, Author, & Institute Users' },
        { key: 'edit_users', label: 'Edit User Roles & Permissions' },
        { key: 'toggle_user_status', label: 'Activate / Deactivate Users' },
        { key: 'delete_users', label: 'Delete Users' },
      ],
    },
  ];

  // Default permission matrices
  const [rolePermissions, setRolePermissions] = useState({
    superadmin: ['all'],
    admin: [
      'view_dashboard',
      'view_analytics',
      'view_posts',
      'create_posts',
      'edit_posts',
      'publish_posts',
      'delete_posts',
      'manage_categories',
      'view_institutes',
      'create_institutes',
      'edit_institutes',
      'assign_crm_plans',
      'manage_institute_staff',
      'view_institute_leads',
      'view_mcqs',
      'create_mcqs',
      'edit_mcqs',
      'delete_mcqs',
      'view_media',
      'upload_media',
      'delete_media',
      'view_users',
      'create_users',
      'edit_users',
      'toggle_user_status',
    ],
    editor: [
      'view_dashboard',
      'view_posts',
      'create_posts',
      'edit_posts',
      'publish_posts',
      'manage_categories',
      'view_mcqs',
      'create_mcqs',
      'edit_mcqs',
      'view_media',
      'upload_media',
    ],
    author: [
      'view_dashboard',
      'view_posts',
      'create_posts',
      'view_mcqs',
      'create_mcqs',
      'view_media',
      'upload_media',
    ],
    institute_admin: [
      'view_dashboard',
      'view_institutes',
      'edit_institutes',
      'manage_institute_staff',
      'view_institute_leads',
      'view_media',
      'upload_media',
    ],
    institute_employee: [
      'view_dashboard',
      'view_institute_leads',
    ],
    user: [
      'view_mcqs',
    ],
  });

  const hasPermission = (roleId, permKey) => {
    if (roleId === 'superadmin') return true;
    return rolePermissions[roleId]?.includes(permKey);
  };

  const togglePermission = (permKey) => {
    if (activeRole === 'superadmin') return; // Superadmin has all permissions

    setRolePermissions((prev) => {
      const currentList = prev[activeRole] || [];
      const isPresent = currentList.includes(permKey);
      const updatedList = isPresent
        ? currentList.filter((k) => k !== permKey)
        : [...currentList, permKey];
      return {
        ...prev,
        [activeRole]: updatedList,
      };
    });
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const currentRoleObj = roles.find((r) => r.id === activeRole) || roles[0];

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
            You do not have administrative permissions to view or configure roles and permissions. Please contact an administrator.
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
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Roles & Permissions Matrix
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">
              RBAC Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure granular access levels for Superadmins, Admins, Content Writers, and Educational Institute CRM accounts.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          {savedSuccess ? <Check size={14} /> : <Save size={14} />}
          {savedSuccess ? 'Changes Saved!' : 'Save Role Matrix'}
        </button>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveRole(r.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
              activeRole === r.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-[1.01]'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck
              size={14}
              className={activeRole === r.id ? 'text-white' : 'text-slate-400'}
            />
            <span>{r.name}</span>
          </button>
        ))}
      </div>

      {/* Role Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-800">{currentRoleObj.name} Scope</h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${currentRoleObj.badge}`}
            >
              {currentRoleObj.id}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{currentRoleObj.description}</p>
        </div>
        {activeRole === 'superadmin' && (
          <div className="flex items-center gap-2 text-xs font-medium text-purple-700 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
            <Lock size={14} />
            <span>Superadmin inherently has universal bypass access to all capabilities.</span>
          </div>
        )}
      </div>

      {/* Permission Modules Accordion / Matrix */}
      <div className="space-y-4">
        {permissionModules.map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                    <Icon size={16} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{mod.category}</h4>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {mod.permissions.filter((p) => hasPermission(activeRole, p.key)).length} of{' '}
                  {mod.permissions.length} active
                </span>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {mod.permissions.map((perm) => {
                  const isChecked = hasPermission(activeRole, perm.key);
                  const isSuper = activeRole === 'superadmin';

                  return (
                    <div
                      key={perm.key}
                      onClick={() => !isSuper && togglePermission(perm.key)}
                      className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                        isSuper
                          ? 'bg-purple-50/40 border-purple-200 cursor-not-allowed'
                          : isChecked
                          ? 'bg-blue-50/60 border-blue-200 hover:bg-blue-50 cursor-pointer'
                          : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold ${
                            isChecked ? 'text-slate-800' : 'text-slate-500'
                          }`}
                        >
                          {perm.label}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{perm.key}</p>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-200 text-transparent'
                        }`}
                      >
                        <Check size={14} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
