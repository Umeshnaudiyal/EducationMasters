/**
 * Standard Slug Utility for EducationMasters
 * Provides slug generation, validation, and uniqueness verification across all models.
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

/**
 * Check if a slug is already taken by another document in a Mongoose Model.
 * @param {Object} Model - Mongoose Model
 * @param {string} slug - Target slug
 * @param {string|mongoose.Types.ObjectId|null} currentId - ID of document being updated (to ignore self)
 * @returns {Promise<boolean>} - true if slug is taken, false if available
 */
export const isSlugTaken = async (Model, slug, currentId = null) => {
  if (!Model || !slug) return false;
  const query = { slug: String(slug).trim().toLowerCase() };
  if (currentId) {
    query._id = { $ne: currentId };
  }
  const existing = await Model.findOne(query).select('_id').lean();
  return Boolean(existing);
};

/**
 * Validate slug format and uniqueness for creating or updating a record.
 * @param {Object} Model - Mongoose Model
 * @param {Object} options
 * @param {string} options.slug - User supplied slug
 * @param {string} options.fallbackText - Fallback text to derive slug from (e.g. name or title)
 * @param {string|null} options.currentId - Current document ID if updating
 * @param {string} options.modelLabel - Human-readable label for error message (e.g. 'institute', 'article')
 * @param {boolean} options.isRequired - Whether slug is mandatory
 * @returns {Promise<{ isValid: boolean, slug: string, error?: string }>}
 */
export const validateUniqueSlug = async (
  Model,
  { slug = '', fallbackText = '', currentId = null, modelLabel = 'record', isRequired = true } = {}
) => {
  let targetSlug = slug && String(slug).trim() ? slugify(slug) : slugify(fallbackText);

  if (!targetSlug) {
    if (isRequired) {
      return {
        isValid: false,
        slug: '',
        error: `Slug is required. Please provide a valid ${modelLabel} name or slug.`,
      };
    }
    return { isValid: true, slug: '' };
  }

  if (!isValidSlug(targetSlug)) {
    return {
      isValid: false,
      slug: targetSlug,
      error: 'Slug can only contain lowercase alphanumeric characters and single hyphens.',
    };
  }

  const taken = await isSlugTaken(Model, targetSlug, currentId);
  if (taken) {
    return {
      isValid: false,
      slug: targetSlug,
      error: `A ${modelLabel} with the slug "${targetSlug}" already exists. Slugs must be unique.`,
    };
  }

  return {
    isValid: true,
    slug: targetSlug,
  };
};

/**
 * Automatically generate a unique slug by appending incremental suffixes (-2, -3, ...) if taken.
 * Useful for automated systems or import pipelines.
 * @param {Object} Model - Mongoose Model
 * @param {string} text - Base text to slugify
 * @param {string|null} currentId - Document ID if updating
 * @returns {Promise<string>} - Unique slug guaranteed not to collide
 */
export const generateUniqueSlug = async (Model, text, currentId = null) => {
  const base = slugify(text) || 'item';
  let candidate = base;
  let counter = 1;

  while (await isSlugTaken(Model, candidate, currentId)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  return candidate;
};

export default {
  slugify,
  isValidSlug,
  isSlugTaken,
  validateUniqueSlug,
  generateUniqueSlug,
};
