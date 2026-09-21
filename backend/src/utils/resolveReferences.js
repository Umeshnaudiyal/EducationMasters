import mongoose from 'mongoose';
import { Category, Tag, State, Department, Media, User } from '../models/index.js';

const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

export const resolveCategoryIds = async (categories) => {
  if (!categories) return [];
  const catArray = Array.isArray(categories) ? categories : [categories];
  const resolvedIds = [];

  for (const item of catArray) {
    if (!item) continue;

    // If it's already an ObjectId instance or valid 24-char hex string
    if (mongoose.Types.ObjectId.isValid(item) && isValidObjectId(String(item))) {
      resolvedIds.push(new mongoose.Types.ObjectId(String(item)));
      continue;
    }

    if (typeof item === 'object' && item._id && isValidObjectId(String(item._id))) {
      resolvedIds.push(new mongoose.Types.ObjectId(String(item._id)));
      continue;
    }

    const nameOrSlug = typeof item === 'object' ? (item.name || item.slug || '') : String(item).trim();
    if (!nameOrSlug) continue;

    // Look up existing category by name or slug
    let catDoc = await Category.findOne({
      $or: [
        { name: { $regex: `^${nameOrSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
        { slug: nameOrSlug.toLowerCase() },
      ],
    });

    if (!catDoc) {
      const generatedSlug = nameOrSlug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      try {
        catDoc = await Category.create({
          name: nameOrSlug,
          slug: generatedSlug || `cat-${Date.now().toString().slice(-4)}`,
        });
      } catch (err) {
        catDoc = await Category.findOne({
          $or: [{ name: nameOrSlug }, { slug: generatedSlug }],
        });
      }
    }

    if (catDoc && catDoc._id) {
      resolvedIds.push(catDoc._id);
    }
  }

  return [...new Set(resolvedIds.map((id) => id.toString()))].map((id) => new mongoose.Types.ObjectId(id));
};

export const resolveTagIds = async (tags) => {
  if (!tags) return [];
  const tagArray = Array.isArray(tags) ? tags : [tags];
  const resolvedIds = [];

  for (const item of tagArray) {
    if (!item) continue;

    if (mongoose.Types.ObjectId.isValid(item) && isValidObjectId(String(item))) {
      resolvedIds.push(new mongoose.Types.ObjectId(String(item)));
      continue;
    }

    if (typeof item === 'object' && item._id && isValidObjectId(String(item._id))) {
      resolvedIds.push(new mongoose.Types.ObjectId(String(item._id)));
      continue;
    }

    const nameOrSlug = typeof item === 'object' ? (item.name || item.slug || '') : String(item).trim();
    if (!nameOrSlug) continue;

    let tagDoc = await Tag.findOne({
      $or: [
        { name: { $regex: `^${nameOrSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
        { slug: nameOrSlug.toLowerCase() },
      ],
    });

    if (!tagDoc) {
      const generatedSlug = nameOrSlug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      try {
        tagDoc = await Tag.create({
          name: nameOrSlug,
          slug: generatedSlug || `tag-${Date.now().toString().slice(-4)}`,
        });
      } catch (err) {
        tagDoc = await Tag.findOne({
          $or: [{ name: nameOrSlug }, { slug: generatedSlug }],
        });
      }
    }

    if (tagDoc && tagDoc._id) {
      resolvedIds.push(tagDoc._id);
    }
  }

  return [...new Set(resolvedIds.map((id) => id.toString()))].map((id) => new mongoose.Types.ObjectId(id));
};

export const resolveStateId = async (state) => {
  if (!state || state === '-- All India --' || state === '— All India —' || state === 'all' || state === 'all-india') {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(state) && isValidObjectId(String(state))) {
    return new mongoose.Types.ObjectId(String(state));
  }

  if (typeof state === 'object' && state._id && isValidObjectId(String(state._id))) {
    return new mongoose.Types.ObjectId(String(state._id));
  }

  const nameOrSlug = typeof state === 'object' ? (state.name || state.slug || '') : String(state).trim();
  if (!nameOrSlug) return null;

  const stateDoc = await State.findOne({
    $or: [
      { name: { $regex: `^${nameOrSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
      { slug: nameOrSlug.toLowerCase() },
    ],
  });

  return stateDoc ? stateDoc._id : null;
};

export const resolveDepartmentId = async (dept) => {
  if (!dept || dept === '— Please Choose —' || dept === '-- Please Choose --') {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(dept) && isValidObjectId(String(dept))) {
    return new mongoose.Types.ObjectId(String(dept));
  }

  if (typeof dept === 'object' && dept._id && isValidObjectId(String(dept._id))) {
    return new mongoose.Types.ObjectId(String(dept._id));
  }

  const nameOrSlug = typeof dept === 'object' ? (dept.name || dept.slug || '') : String(dept).trim();
  if (!nameOrSlug) return null;

  const deptDoc = await Department.findOne({
    $or: [
      { name: { $regex: `^${nameOrSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
      { slug: nameOrSlug.toLowerCase() },
    ],
  });

  return deptDoc ? deptDoc._id : null;
};

export const sanitizeObjectId = (val) => {
  if (!val || val === '' || val === 'null' || val === 'undefined') return null;
  if (mongoose.Types.ObjectId.isValid(val) && isValidObjectId(String(val))) {
    return new mongoose.Types.ObjectId(String(val));
  }
  if (typeof val === 'object' && val._id && isValidObjectId(String(val._id))) {
    return new mongoose.Types.ObjectId(String(val._id));
  }
  return null;
};
