/**
 * Cache Service for API responses
 * Uses localStorage to cache API responses and reduce server requests
 */

class CacheService {
  constructor() {
    this.cachePrefix = 'bu_library_cache_';
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
    this.cacheConfig = {
      buildings: { ttl: 30 * 60 * 1000 }, // 30 minutes - buildings don't change often
      rooms: { ttl: 15 * 60 * 1000 },     // 15 minutes - rooms change less frequently
      bookings: { ttl: 2 * 60 * 1000 },   // 2 minutes - bookings change frequently
      health: { ttl: 1 * 60 * 1000 },     // 1 minute - health checks need to be recent
      config: { ttl: 60 * 60 * 1000 }     // 1 hour - config rarely changes
    };
  }

  /**
   * Generate cache key
   * @param {string} type - Type of data (buildings, rooms, etc.)
   * @param {string} identifier - Additional identifier (e.g., building short name)
   * @returns {string} Cache key
   */
  getCacheKey(type, identifier = '') {
    return `${this.cachePrefix}${type}${identifier ? '_' + identifier : ''}`;
  }

  /**
   * Get TTL for specific data type
   * @param {string} type - Data type
   * @returns {number} TTL in milliseconds
   */
  getTTL(type) {
    return this.cacheConfig[type]?.ttl || this.defaultTTL;
  }

  /**
   * Store data in cache with timestamp and TTL
   * @param {string} type - Data type
   * @param {any} data - Data to cache
   * @param {string} identifier - Optional identifier
   * @param {number} customTTL - Custom TTL override
   */
  set(type, data, identifier = '', customTTL = null) {
    try {
      const cacheKey = this.getCacheKey(type, identifier);
      const ttl = customTTL || this.getTTL(type);
      const cacheItem = {
        data: data,
        timestamp: Date.now(),
        ttl: ttl,
        expires: Date.now() + ttl
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      console.log(`Cached ${type}${identifier ? ' (' + identifier + ')' : ''} for ${ttl / 1000}s`);
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  /**
   * Get data from cache if valid
   * @param {string} type - Data type
   * @param {string} identifier - Optional identifier
   * @returns {any|null} Cached data or null if not found/expired
   */
  get(type, identifier = '') {
    try {
      const cacheKey = this.getCacheKey(type, identifier);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        console.log(`No cache found for ${type}${identifier ? ' (' + identifier + ')' : ''}`);
        return null;
      }

      const cacheItem = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now > cacheItem.expires) {
        console.log(`Cache expired for ${type}${identifier ? ' (' + identifier + ')' : ''}`);
        this.remove(type, identifier);
        return null;
      }

      const ageSeconds = Math.round((now - cacheItem.timestamp) / 1000);
      console.log(`Cache hit for ${type}${identifier ? ' (' + identifier + ')' : ''} (age: ${ageSeconds}s)`);
      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to read cache:', error);
      return null;
    }
  }

  /**
   * Remove specific cache entry
   * @param {string} type - Data type
   * @param {string} identifier - Optional identifier
   */
  remove(type, identifier = '') {
    try {
      const cacheKey = this.getCacheKey(type, identifier);
      localStorage.removeItem(cacheKey);
      console.log(`Removed cache for ${type}${identifier ? ' (' + identifier + ')' : ''}`);
    } catch (error) {
      console.warn('Failed to remove cache:', error);
    }
  }

  /**
   * Check if cached data exists and is valid
   * @param {string} type - Data type
   * @param {string} identifier - Optional identifier
   * @returns {boolean} True if valid cache exists
   */
  has(type, identifier = '') {
    return this.get(type, identifier) !== null;
  }

  /**
   * Clear all cache entries
   */
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      cacheKeys.forEach(key => localStorage.removeItem(key));
      console.log(`Cleared ${cacheKeys.length} cache entries`);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpired() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      const now = Date.now();
      let clearedCount = 0;

      cacheKeys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cacheItem = JSON.parse(cached);
            if (now > cacheItem.expires) {
              localStorage.removeItem(key);
              clearedCount++;
            }
          }
        } catch (error) {
          // Remove invalid cache entries
          localStorage.removeItem(key);
          clearedCount++;
        }
      });

      if (clearedCount > 0) {
        console.log(`Cleared ${clearedCount} expired cache entries`);
      }
    } catch (error) {
      console.warn('Failed to clear expired cache:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      const now = Date.now();
      let validCount = 0;
      let expiredCount = 0;
      let totalSize = 0;

      cacheKeys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            totalSize += cached.length;
            const cacheItem = JSON.parse(cached);
            if (now > cacheItem.expires) {
              expiredCount++;
            } else {
              validCount++;
            }
          }
        } catch (error) {
          expiredCount++;
        }
      });

      return {
        totalEntries: cacheKeys.length,
        validEntries: validCount,
        expiredEntries: expiredCount,
        totalSizeBytes: totalSize,
        totalSizeKB: Math.round(totalSize / 1024)
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { totalEntries: 0, validEntries: 0, expiredEntries: 0, totalSizeBytes: 0, totalSizeKB: 0 };
    }
  }
}

// Create and export singleton instance
const cacheService = new CacheService();

// Clean up expired cache on initialization
cacheService.clearExpired();

export default cacheService;
