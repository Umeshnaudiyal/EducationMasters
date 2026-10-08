/**
 * Standard Frontend Slug Utility for EducationMasters
 * Provides slug generation and validation.
 */

/**
 * Convert any string into a clean, URL-safe lowercase slug.
 * @param {string} text - Input text
 * @returns {string} - Clean kebab-case slug
 */
export const slugify = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .normalize('NFD') // normalize accented characters
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '') // remove special characters
    .replace(/[\s_-]+/g, '-') // collapse whitespace and underscores to single hyphen
    .replace(/^-+|-+$/g, ''); // strip leading/trailing hyphens
};

/**
 * Validate that a slug string conforms to strict lowercase kebab-case format.
 * @param {string} slug - Slug to validate
 * @returns {boolean}
 */
export const isValidSlug = (slug) => {
  if (!slug || typeof slug !== 'string') return false;
  const clean = slug.trim();
  if (clean.length < 1 || clean.length > 200) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean);
};

export default {
  slugify,
  isValidSlug,
};
