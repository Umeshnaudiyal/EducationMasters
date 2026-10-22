import mongoose from 'mongoose';

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

const rolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// In-memory cache for ultra-fast permission lookups
let cachedMatrix = null;
let lastCacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

rolePermissionSchema.statics.getMatrix = async function () {
  const now = Date.now();
  if (cachedMatrix && now - lastCacheTimestamp < CACHE_TTL_MS) {
    return cachedMatrix;
  }

  const existingDocs = await this.find({});
  const matrix = { ...DEFAULT_ROLE_PERMISSIONS };

  const existingRoles = new Set();
  for (const doc of existingDocs) {
    existingRoles.add(doc.role);
    if (doc.role === 'superadmin') {
      matrix.superadmin = ['*'];
    } else {
      matrix[doc.role] = doc.permissions || [];
    }
  }

  // Seed any missing roles in background
  const missingRoles = Object.keys(DEFAULT_ROLE_PERMISSIONS).filter(
    (role) => !existingRoles.has(role)
  );

  if (missingRoles.length > 0) {
    try {
      const docsToInsert = missingRoles.map((role) => ({
        role,
        permissions: DEFAULT_ROLE_PERMISSIONS[role],
      }));
      await this.insertMany(docsToInsert, { ordered: false });
    } catch {
      // Ignore duplicate key race condition
    }
  }

  cachedMatrix = matrix;
  lastCacheTimestamp = now;
  return matrix;
};

rolePermissionSchema.statics.updateMatrix = async function (newMatrix) {
  if (!newMatrix || typeof newMatrix !== 'object') {
    throw new Error('Invalid permissions matrix format');
  }

  const updatedMatrix = { ...DEFAULT_ROLE_PERMISSIONS };

  for (const [roleKey, perms] of Object.entries(newMatrix)) {
    const role = normalizeRole(roleKey);
    // Superadmin always has universal access
    if (role === 'superadmin') {
      updatedMatrix.superadmin = ['*'];
      await this.findOneAndUpdate(
        { role: 'superadmin' },
        { permissions: ['*'] },
        { upsert: true, new: true }
      );
      continue;
    }

    const cleanPerms = Array.isArray(perms)
      ? Array.from(new Set(perms.map((p) => String(p).trim()).filter(Boolean)))
      : [];

    await this.findOneAndUpdate(
      { role },
      { permissions: cleanPerms },
      { upsert: true, new: true }
    );
    updatedMatrix[role] = cleanPerms;
  }

  cachedMatrix = updatedMatrix;
  lastCacheTimestamp = Date.now();
  return updatedMatrix;
};

rolePermissionSchema.statics.getEffectivePermissions = async function (user) {
  if (!user) return [];
  const normalized = normalizeRole(user.role);
  if (normalized === 'superadmin') {
    return ['*'];
  }

  const matrix = await this.getMatrix();
  const rolePerms = matrix[normalized] || [];
  const userPerms = Array.isArray(user.permissions) ? user.permissions : [];

  return Array.from(new Set([...rolePerms, ...userPerms]));
};

rolePermissionSchema.statics.hasRolePermission = async function (role, permKey) {
  const normalized = normalizeRole(role);
  if (normalized === 'superadmin') return true;

  const matrix = await this.getMatrix();
  const perms = matrix[normalized] || [];
  return perms.includes('*') || perms.includes(permKey);
};

const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);
export default RolePermission;
