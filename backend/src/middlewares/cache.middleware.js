import memoryCache from '../services/cache.service.js';

/**
 * Generate a clean, deterministic cache key from an Express request
 */
export const generateCacheKey = (req) => {
  const url = req.originalUrl || req.url;
  // Strip trailing slashes and normalize
  const cleanUrl = url.replace(/\/+$/, '') || '/';
  const userPrefix = req.user?._id ? `user:${req.user._id}:` : 'public:';
  return `cache:${userPrefix}${cleanUrl}`;
};

/**
 * Middleware to cache GET request responses in memory
 * @param {number} ttlSeconds - Duration to keep response cached (default: 300s / 5 mins)
 */
export const cacheResponse = (ttlSeconds = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if bypass requested (e.g., ?bypass_cache=1, x-bypass-cache header, or Cache-Control: no-cache)
    const isBypass =
      req.query.bypass_cache === '1' ||
      req.query.bypass_cache === 'true' ||
      Boolean(req.headers['x-bypass-cache']) ||
      req.headers['cache-control']?.includes('no-cache') ||
      req.headers['pragma'] === 'no-cache';

    if (isBypass) {
      res.setHeader('X-Cache', 'BYPASS');
      return next();
    }

    const key = generateCacheKey(req);
    const cachedData = memoryCache.get(key);

    if (cachedData !== null) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-TTL', `${ttlSeconds}s`);
      return res.json(cachedData);
    }

    // Mark as Cache Miss
    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to store successful responses in memory
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful 200 responses
      if (res.statusCode === 200 && body !== undefined) {
        try {
          memoryCache.set(key, body, ttlSeconds);
        } catch (e) {
          console.warn('[Cache Middleware] Failed to cache response:', e.message);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Middleware to invalidate cache patterns immediately after mutation (POST, PUT, DELETE, PATCH)
 * @param  {...string} patterns - Patterns to purge, e.g. 'exams*', 'questions*', 'topics*', 'search*'
 */
export const invalidateCache = (...patterns) => {
  return (req, res, next) => {
    let hasInvalidated = false;

    const doInvalidation = () => {
      if (hasInvalidated) return;
      hasInvalidated = true;
      try {
        const count = memoryCache.invalidatePatterns(...patterns);
        if (count > 0) {
          console.log(`[Cache Invalidation] Instantly cleared ${count} keys for:`, patterns);
        }
      } catch (err) {
        console.warn('[Cache Invalidation] Error clearing cache:', err.message);
      }
    };

    // 1. Hook into res.json to invalidate synchronously before the client receives the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        doInvalidation();
      }
      return originalJson(body);
    };

    // 2. Fallback hook on response stream finish
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        doInvalidation();
      }
    });

    next();
  };
};

/**
 * Direct programmatic cache invalidation helper
 */
export const purgeCache = (...patterns) => {
  return memoryCache.invalidatePatterns(...patterns);
};

export default {
  cacheResponse,
  invalidateCache,
  purgeCache,
  generateCacheKey,
};
