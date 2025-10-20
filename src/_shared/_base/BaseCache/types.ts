/**
 * BaseCache Types
 *
 * Type definitions for cache operations.
 */

/**
 * Cache entry with TTL
 */
export interface CacheEntry<T> {
  expiresAt: number | null;
  value: T;
}

/**
 * Cache options
 */
export interface CacheOptions {
  /**
   * Time to live in milliseconds
   */
  ttl?: number;
}
