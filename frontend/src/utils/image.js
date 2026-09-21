/**
 * Global Image URL Resolver for Education Masters
 * Resolves Media documents, file path strings, or blog featured_media to full absolute URLs.
 */
export const getImageUrl = (mediaObj, fallback = '/logo.webp') => {
  if (!mediaObj) return fallback;

  let filePath = '';

  if (typeof mediaObj === 'string') {
    filePath = mediaObj.trim();
  } else if (typeof mediaObj === 'object') {
    if (mediaObj.img_url) {
      return encodeURI(mediaObj.img_url);
    }
    if (mediaObj.file) {
      filePath = mediaObj.file;
    } else if (mediaObj.url) {
      filePath = mediaObj.url;
    } else if (mediaObj.path && mediaObj.name) {
      const cleanPath = mediaObj.path.endsWith('/') ? mediaObj.path.slice(0, -1) : mediaObj.path;
      filePath = `${cleanPath}/${mediaObj.name}`;
    } else if (mediaObj.path && !mediaObj.path.endsWith('/')) {
      filePath = mediaObj.path;
    }
  }

  if (!filePath) return fallback;

  // Filter out directory paths with no filename, or invalid placeholders
  const cleanStr = filePath.trim().toLowerCase();
  if (
    cleanStr.endsWith('/') ||
    cleanStr.endsWith('\\') ||
    cleanStr === 'placeholder.png' ||
    cleanStr === '/placeholder.png' ||
    cleanStr.endsWith('/placeholder.png') ||
    cleanStr === 'null' ||
    cleanStr === 'undefined' ||
    cleanStr === 'false' ||
    cleanStr === 'none'
  ) {
    return fallback;
  }

  // If already absolute URL
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return encodeURI(filePath);
  }

  // Ensure leading slash
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

  // Local newly uploaded multer files or uploads directory
  if (
    normalizedPath.includes('_17') ||
    normalizedPath.includes('_18') ||
    normalizedPath.includes('_19') ||
    normalizedPath.startsWith('/uploads/') ||
    normalizedPath.startsWith('/temp/')
  ) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
    return encodeURI(`${backendUrl}${normalizedPath}`);
  }

  // Production migrated image repository (https://educationmasters.in/assets/... or similar)
  return encodeURI(`https://educationmasters.in${normalizedPath}`);
};

export default getImageUrl;
