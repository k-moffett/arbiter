/**
 * Cache Manager Interfaces
 *
 * Interface definitions for the caching system.
 */

import type { CacheStats } from './types';

/**
 * Cache manager interface
 */
export interface CacheManager {
  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;

  /**
   * Generate cache key
   */
  generateKey(params: { query: string; type: string; userId: string }): string;

  /**
   * Get value from cache
   */
   
  get<T>(params: { key: string }): Promise<T | null>;

  /**
   * Get cache statistics
   */
  getStats(): CacheStats;

  /**
   * Invalidate specific cache entry
   */
  invalidate(params: { key: string }): Promise<void>;

  /**
   * Check if caching is enabled
   */
  isEnabled(): boolean;

  /**
   * Set value in cache
   */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Generic needed for type safety
  set<T>(params: { key: string; ttl?: number; value: T }): Promise<void>;
}
