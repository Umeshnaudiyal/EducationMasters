/**
 * Image Validation Utilities for Education Masters
 * Enforces a strict 300 KB maximum file size and verified image formats
 * (WebP, JPG/JPEG, PNG, GIF, SVG, AVIF) across the frontend.
 */

export const MAX_IMAGE_SIZE_KB = 300;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_KB * 1024; // 307,200 bytes

export const ALLOWED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.avif',
];

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
];

export const IMAGE_ACCEPT_ATTRIBUTE =
  'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,.jpg,.jpeg,.png,.webp,.gif,.svg,.avif';

/**
 * Format bytes into clean human-readable text (e.g. "150.2 KB", "1.2 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes === undefined || bytes === null) return '0 KB';
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  const kb = bytes / k;
  if (kb < k) return `${kb.toFixed(1)} KB`;
  const mb = kb / k;
  return `${mb.toFixed(2)} MB`;
};

/**
 * Validates a single File object
 * @param {File} file
 * @param {Object} [options]
 * @param {number} [options.maxSizeKB=300]
 * @param {string[]} [options.allowedExtensions]
 * @param {string[]} [options.allowedTypes]
 * @returns {{ isValid: boolean, error: string | null, formattedSize: string, sizeInKB: number }}
 */
export const validateImageFile = (file, options = {}) => {
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided.',
      formattedSize: '0 KB',
      sizeInKB: 0,
    };
  }

  const maxSizeKB = options.maxSizeKB || MAX_IMAGE_SIZE_KB;
  const maxSizeBytes = maxSizeKB * 1024;
  const allowedExtensions = options.allowedExtensions || ALLOWED_IMAGE_EXTENSIONS;
  const allowedTypes = options.allowedTypes || ALLOWED_IMAGE_MIME_TYPES;

  const fileName = file.name || 'Unknown file';
  const fileSize = file.size || 0;
  const formattedSize = formatFileSize(fileSize);
  const sizeInKB = Math.round(fileSize / 1024);

  // 1. Validate File Format / Extension
  const ext = ('.' + (fileName.split('.').pop() || '')).toLowerCase();
  const mimeType = (file.type || '').toLowerCase();

  const isExtensionAllowed = allowedExtensions.includes(ext);
  const isMimeAllowed = mimeType ? allowedTypes.includes(mimeType) || mimeType.startsWith('image/') : false;

  if (!isExtensionAllowed && !isMimeAllowed) {
    return {
      isValid: false,
      error: `"${fileName}" is not a supported image format. Supported formats: ${allowedExtensions.map((e) => e.replace('.', '').toUpperCase()).join(', ')}.`,
      formattedSize,
      sizeInKB,
      fileName,
    };
  }

  // 2. Validate File Size (Maximum 300 KB)
  if (fileSize > maxSizeBytes) {
    return {
      isValid: false,
      error: `"${fileName}" (${formattedSize}) exceeds the maximum allowed size of ${maxSizeKB} KB. Please compress or resize the image.`,
      formattedSize,
      sizeInKB,
      fileName,
    };
  }

  return {
    isValid: true,
    error: null,
    formattedSize,
    sizeInKB,
    fileName,
  };
};

/**
 * Validates a list or array of File objects
 * @param {FileList|File[]} files
 * @param {Object} [options]
 * @returns {{ validFiles: File[], invalidFiles: Array<{ file: File, reason: string, formattedSize: string }>, allValid: boolean, summaryError: string | null }}
 */
export const validateImageFiles = (files, options = {}) => {
  const fileArray = Array.from(files || []);
  if (fileArray.length === 0) {
    return {
      validFiles: [],
      invalidFiles: [],
      allValid: true,
      summaryError: null,
    };
  }

  const validFiles = [];
  const invalidFiles = [];

  for (const file of fileArray) {
    const result = validateImageFile(file, options);
    if (result.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({
        file,
        reason: result.error,
        formattedSize: result.formattedSize,
      });
    }
  }

  const allValid = invalidFiles.length === 0;
  let summaryError = null;

  if (!allValid) {
    if (invalidFiles.length === 1) {
      summaryError = invalidFiles[0].reason;
    } else {
      summaryError = `${invalidFiles.length} files failed validation:\n` +
        invalidFiles.map((item) => `• ${item.reason}`).join('\n');
    }
  }

  return {
    validFiles,
    invalidFiles,
    allValid,
    summaryError,
  };
};

export default {
  MAX_IMAGE_SIZE_KB,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_ACCEPT_ATTRIBUTE,
  formatFileSize,
  validateImageFile,
  validateImageFiles,
};
