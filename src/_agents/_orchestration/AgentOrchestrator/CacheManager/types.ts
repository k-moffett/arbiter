/**
 * Cache Manager Type Definitions
 *
 * Types for the caching system.
 */

/**
 * Cache entry with TTL and metadata
 */
export interface CacheEntry<T> {
  hitCount: number;
  key: string;
  timestamp: number;
  ttl: number;
  value: T;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hitRate: number;
  hits: number;
  misses: number;
  size: number;
}

/**
 * Cache manager configuration
 */
export interface CacheConfig {
  cacheDecompositions: boolean;
  cacheHyDE: boolean;
  cacheRoutes: boolean;
  cacheSearchResults: boolean;
  defaultTTL: number;
  enabled: boolean;
  maxSize: number;
}
