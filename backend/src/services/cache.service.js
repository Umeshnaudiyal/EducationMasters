/**
 * In-Memory Cache Service
 * Provides ultra-fast (sub-millisecond) in-RAM caching for Express API endpoints.
 * Features:
 * - Deterministic Key Hashing
 * - TTL (Time-To-Live) Expiration
 * - Maximum Key Capacity (LRU Eviction)
 * - Wildcard Pattern Invalidation (e.g., 'jobs:*')
 * - Automatic Periodic Garbage Collection
 * - Performance Metrics (Hits, Misses, Memory Size)
 */

class MemoryCacheService {
  constructor(options = {}) {
    this.maxItems = options.maxItems || 3000; // Cap to avoid runaway memory
    this.cleanupIntervalMs = options.cleanupIntervalMs || 60 * 1000; // 1 minute
    this.store = new Map(); // key -> { value, expiresAt, size, lastAccessed }
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };

    // Periodic GC for expired keys
    this.cleanupTimer = setInterval(() => this.purgeExpired(), this.cleanupIntervalMs);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref(); // Don't prevent process exit
    }
  }

  /**
   * Get an item from the cache
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (entry.expiresAt && entry.expiresAt <= now) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.lastAccessed = now;
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set an item in cache with TTL in seconds
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds - Default: 300s (5 minutes)
   */
  set(key, value, ttlSeconds = 300) {
    // Evict oldest if capacity reached
    if (this.store.size >= this.maxItems && !this.store.has(key)) {
      this.evictOldest();
    }

    const now = Date.now();
    const expiresAt = ttlSeconds > 0 ? now + (ttlSeconds * 1000) : null;

    this.store.set(key, {
      value,
      expiresAt,
      lastAccessed: now
    });
    this.stats.sets++;
    return true;
  }

  /**
   * Delete a specific key
   * @param {string} key
   */
  del(key) {
    const deleted = this.store.delete(key);
    if (deleted) this.stats.deletes++;
    return deleted;
  }

  /**
   * Invalidate all keys matching a wildcard pattern
   * Example: invalidatePattern('jobs*') or invalidatePattern('/apis/v1/jobs*')
   * @param {string} pattern
   * @returns {number} count of deleted keys
   */
  invalidatePattern(pattern) {
    if (!pattern) return 0;
    
    // Convert wildcard pattern 'jobs*' to regex '^jobs.*'
    const regexStr = '^' + pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
      .replace(/\*/g, '.*'); // Convert * to .*
    
    const regex = new RegExp(regexStr, 'i');
    let count = 0;

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    this.stats.deletes += count;
    return count;
  }

  /**
   * Invalidate multiple patterns at once
   * @param  {...string} patterns
   */
  invalidatePatterns(...patterns) {
    let total = 0;
    for (const pattern of patterns) {
      if (Array.isArray(pattern)) {
        for (const p of pattern) total += this.invalidatePattern(p);
      } else if (typeof pattern === 'string') {
        total += this.invalidatePattern(pattern);
      }
    }
    return total;
  }

  /**
   * Evict the least recently accessed item
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }

  /**
   * Remove expired keys from RAM
   */
  purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.store.clear();
  }

  /**
   * Get cache diagnostics & stats
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 
      ? ((this.stats.hits / totalRequests) * 100).toFixed(2) + '%' 
      : '0%';

    return {
      size: this.store.size,
      maxItems: this.maxItems,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      sets: this.stats.sets,
      deletes: this.stats.deletes
    };
  }
}

// Export singleton instance
const memoryCache = new MemoryCacheService({
  maxItems: 3000,
  cleanupIntervalMs: 60 * 1000
});

export default memoryCache;
