// High-Performance In-Memory TTL Cache for Database Queries & API Responses
class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  /**
   * Set a cache key with value and TTL in seconds
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlSeconds Default 60 seconds
   */
  set(key, value, ttlSeconds = 60) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Get a cache key value if not expired
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Delete a specific cache key
   * @param {string} key 
   */
  del(key) {
    this.store.delete(key);
  }

  /**
   * Delete all keys starting with a prefix (e.g. 'students:', 'exercises:')
   * @param {string} prefix 
   */
  delPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all cached items
   */
  flush() {
    this.store.clear();
  }

  /**
   * Get value from cache or execute async fetch function and cache result
   * @param {string} key 
   * @param {Function} fetchFn Async function returning data
   * @param {number} ttlSeconds TTL in seconds
   */
  async getOrFetch(key, fetchFn, ttlSeconds = 60) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const freshData = await fetchFn();
    if (freshData !== undefined && freshData !== null) {
      this.set(key, freshData, ttlSeconds);
    }
    return freshData;
  }
}

// Global Singleton Memory Cache Instance across HMR
const globalCache = globalThis.__appMemoryCache || new MemoryCache();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__appMemoryCache = globalCache;
}

export default globalCache;
