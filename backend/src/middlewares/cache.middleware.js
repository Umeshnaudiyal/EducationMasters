import memoryCache from '../services/cache.service.js';

/**
 * Generate a clean, deterministic cache key from an Express request
 */
export const generateCacheKey = (req) => {
  const url = req.originalUrl || req.url;
  // Strip trailing slashes and normalize
  const cleanUrl = url.replace(/\/+$/, '') || '/';
  return `cache:${cleanUrl}`;
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

    // Skip if bypass requested (e.g., ?bypass_cache=1)
    if (req.query.bypass_cache || req.headers['x-bypass-cache']) {
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
 * Middleware to invalidate cache patterns after successful mutation (POST, PUT, DELETE, PATCH)
 * @param  {...string} patterns - Wildcard patterns to purge, e.g. '/apis/v1/jobs*', '/apis/v1/search*'
 */
export const invalidateCache = (...patterns) => {
  return (req, res, next) => {
    // Run invalidation after response is finished
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Add 'cache:' prefix if not already present
          const fullPatterns = patterns.map(p => p.startsWith('cache:') ? p : `cache:${p}`);
          const count = memoryCache.invalidatePatterns(...fullPatterns);
          if (count > 0) {
            console.log(`[Cache Invalidation] Cleared ${count} keys for patterns:`, patterns);
          }
        } catch (err) {
          console.warn('[Cache Invalidation] Error clearing cache:', err.message);
        }
      }
    });

    next();
  };
};

/**
 * Direct programmatic cache invalidation helper
 */
export const purgeCache = (...patterns) => {
  const fullPatterns = patterns.map(p => p.startsWith('cache:') ? p : `cache:${p}`);
  return memoryCache.invalidatePatterns(...fullPatterns);
};

export default {
  cacheResponse,
  invalidateCache,
  purgeCache,
  generateCacheKey
};
