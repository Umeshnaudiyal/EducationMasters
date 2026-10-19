'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export const DEFAULT_ROLE_PERMISSIONS = {
  superadmin: ['*'],
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
    'delete_users',
    'manage_settings',
    'view_subscribers',
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
    'view_subscribers',
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
};

export const normalizeRole = (role) => {
  const r = (role || '').toLowerCase().trim();
  if (r === 'writer') return 'author';
  if (r === 'institute') return 'institute_admin';
  if (r === 'subscriber') return 'user';
  return r || 'user';
};

/**
 * Maps an admin URL path to its required permission capability.
 * Returns null if the path is accessible to all authenticated admin panel users.
 */
export const getRequiredPermissionForPath = (pathname) => {
  if (!pathname || !pathname.startsWith('/edu-admin')) return null;

  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/edu-admin';

  // Always accessible to any logged in user
  if (cleanPath === '/edu-admin/profile') {
    return null;
  }

  // Dashboard Overview
  if (cleanPath === '/edu-admin') {
    return 'view_dashboard';
  }

  // Creating / Drafting Posts
  if (
    cleanPath === '/edu-admin/blog/create' ||
    cleanPath === '/edu-admin/job/create' ||
    cleanPath === '/edu-admin/admit-card/create' ||
    cleanPath === '/edu-admin/result/create'
  ) {
    return 'create_posts';
  }

  // Editing Posts
  if (
    cleanPath.startsWith('/edu-admin/blog/edit') ||
    cleanPath.startsWith('/edu-admin/job/edit') ||
    cleanPath.startsWith('/edu-admin/admit-card/edit') ||
    cleanPath.startsWith('/edu-admin/result/edit')
  ) {
    return 'edit_posts';
  }

  // Viewing Posts & Content
  if (
    cleanPath === '/edu-admin/blogs' ||
    cleanPath.startsWith('/edu-admin/blog') ||
    cleanPath === '/edu-admin/jobs' ||
    cleanPath.startsWith('/edu-admin/job') ||
    cleanPath === '/edu-admin/admit-cards' ||
    cleanPath.startsWith('/edu-admin/admit-card') ||
    cleanPath === '/edu-admin/results' ||
    cleanPath.startsWith('/edu-admin/result') ||
    cleanPath.startsWith('/edu-admin/posts')
  ) {
    return 'view_posts';
  }

  // Taxonomies: Categories, Tags, Departments
  if (
    cleanPath === '/edu-admin/categories' ||
    cleanPath.startsWith('/edu-admin/categories') ||
    cleanPath === '/edu-admin/tags' ||
    cleanPath.startsWith('/edu-admin/tags') ||
    cleanPath === '/edu-admin/departments' ||
    cleanPath.startsWith('/edu-admin/departments')
  ) {
    return 'manage_categories';
  }

  // Sticky Notes (General staff productivity tool)
  if (cleanPath.startsWith('/edu-admin/sticky-notes')) {
    return 'view_dashboard';
  }

  // Media Assets
  if (cleanPath === '/edu-admin/media') {
    return 'view_media';
  }

  // Institutes & CRM
  if (cleanPath === '/edu-admin/institutes/create' || cleanPath === '/edu-admin/institute/create') {
    return 'create_institutes';
  }
  if (
    cleanPath === '/edu-admin/institutes/courses' ||
    cleanPath === '/edu-admin/institutes/facilities'
  ) {
    return 'edit_institutes';
  }
  if (cleanPath === '/edu-admin/institutes' || cleanPath.startsWith('/edu-admin/institute')) {
    return 'view_institutes';
  }

  // Mock Tests
  if (cleanPath === '/edu-admin/mock-tests/create') {
    return 'create_mcqs';
  }
  if (cleanPath.startsWith('/edu-admin/mock-tests')) {
    return 'view_mcqs';
  }

  // Question Bank
  if (cleanPath === '/edu-admin/questions/create') {
    return 'create_mcqs';
  }
  if (
    cleanPath.startsWith('/edu-admin/questions') ||
    cleanPath.startsWith('/edu-admin/question-reports')
  ) {
    return 'view_mcqs';
  }

  // MCQs Taxonomy (Exams, States, Subjects, Topics)
  if (
    cleanPath.startsWith('/edu-admin/exams') ||
    cleanPath.startsWith('/edu-admin/states') ||
    cleanPath.startsWith('/edu-admin/state') ||
    cleanPath.startsWith('/edu-admin/subjects') ||
    cleanPath.startsWith('/edu-admin/topics') ||
    cleanPath.startsWith('/edu-admin/topic-groups') ||
    cleanPath.startsWith('/edu-admin/mcqs')
  ) {
    return 'manage_categories';
  }

  // User Management
  if (cleanPath === '/edu-admin/users/roles') {
    return 'edit_users';
  }
  if (cleanPath === '/edu-admin/users/create') {
    return 'create_users';
  }
  if (cleanPath === '/edu-admin/users/logs') {
    // Admin user logs page
    return 'view_users';
  }
  if (cleanPath.startsWith('/edu-admin/users')) {
    return 'view_users';
  }

  // Subscribers
  if (cleanPath.startsWith('/edu-admin/subscribers')) {
    return 'view_subscribers';
  }

  // WhatsApp & Settings
  if (cleanPath.startsWith('/edu-admin/whatsapp')) {
    return 'manage_settings';
  }
  if (cleanPath.startsWith('/edu-admin/settings')) {
    return 'manage_settings';
  }

  return null;
};

const RBACContext = createContext(null);

export function RBACProvider({ children }) {
  const { data: session } = useSession();
  const rawRole = session?.user?.role || 'user';
  const userRole = normalizeRole(rawRole);
  const userPermissions = Array.isArray(session?.user?.permissions)
    ? session.user.permissions
    : [];

  const [roleMatrix, setRoleMatrix] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('edu_role_matrix');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore parse error
      }
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);

  // Fetch live role matrix from backend API
  const refreshRoleMatrix = useCallback(async () => {
    try {
      setIsLoadingMatrix(true);
      const token =
        session?.user?.accessToken ||
        (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/apis/v1/users/roles/matrix', {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setRoleMatrix(data.data);
          if (typeof window !== 'undefined') {
            localStorage.setItem('edu_role_matrix', JSON.stringify(data.data));
          }
        }
      }
    } catch (err) {
      console.warn('[RBAC] Could not load roles matrix from API, using default/cached:', err.message);
    } finally {
      setIsLoadingMatrix(false);
    }
  }, [session?.user?.accessToken]);

  useEffect(() => {
    if (session?.user) {
      refreshRoleMatrix();
    }
  }, [session?.user, refreshRoleMatrix]);

  // Check if current user has a specific permission
  const hasPermission = useCallback(
    (permKey) => {
      if (!permKey) return true;

      // Superadmin has absolute bypass for everything
      if (userRole === 'superadmin') return true;

      // Explicit direct permissions on user object
      if (userPermissions.includes('*') || userPermissions.includes(permKey)) {
        return true;
      }

      // Permissions mapped to the role in the matrix
      const rolePerms = roleMatrix[userRole] || [];
      if (rolePerms.includes('*') || rolePerms.includes(permKey)) {
        return true;
      }

      return false;
    },
    [userRole, userPermissions, roleMatrix]
  );

  // Check if current user can access a route path
  const canAccessRoute = useCallback(
    (pathname) => {
      // Superadmin can access any route
      if (userRole === 'superadmin') {
        return { allowed: true, requiredPermission: null };
      }

      // Public / self profile route
      if (pathname === '/edu-admin/profile') {
        return { allowed: true, requiredPermission: null };
      }

      // If user wants to see their own session logs on /edu-admin/users/logs
      if (pathname === '/edu-admin/users/logs') {
        return { allowed: true, requiredPermission: null };
      }

      const requiredPerm = getRequiredPermissionForPath(pathname);
      if (!requiredPerm) {
        return { allowed: true, requiredPermission: null };
      }

      const allowed = hasPermission(requiredPerm);
      return { allowed, requiredPermission: requiredPerm };
    },
    [userRole, hasPermission]
  );

  // Save updated role matrix to API and local state
  const saveRoleMatrix = useCallback(
    async (newMatrix) => {
      const token =
        session?.user?.accessToken ||
        (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/apis/v1/users/roles/matrix', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ permissions: newMatrix }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update roles matrix in database');
      }

      const updated = data.data || newMatrix;
      setRoleMatrix(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('edu_role_matrix', JSON.stringify(updated));
      }
      return updated;
    },
    [session?.user?.accessToken]
  );

  const value = {
    roleMatrix,
    isLoadingMatrix,
    userRole,
    rawRole,
    userPermissions,
    hasPermission,
    canAccessRoute,
    refreshRoleMatrix,
    saveRoleMatrix,
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    // Graceful fallback for components used outside RBACProvider
    return {
      roleMatrix: DEFAULT_ROLE_PERMISSIONS,
      isLoadingMatrix: false,
      userRole: 'admin',
      rawRole: 'admin',
      userPermissions: [],
      hasPermission: () => true,
      canAccessRoute: () => ({ allowed: true, requiredPermission: null }),
      refreshRoleMatrix: async () => {},
      saveRoleMatrix: async () => {},
    };
  }
  return context;
}
