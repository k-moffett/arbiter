/**
 * BaseCache
 *
 * Abstract base class for caching infrastructure.
 * All cache implementations in the project must extend this class.
 *
 * Features:
 * - Key-value storage
 * - TTL (time-to-live) support
 * - Automatic expiration
 * - Namespace support for key isolation
 *
 * @example
 * ```typescript
 * const cache = new MemoryCache({ ttl: 60000 }); // 60 second default TTL
 *
 * await cache.set({ key: 'user:123', value: userData });
 * const user = await cache.get({ key: 'user:123' });
 * await cache.delete({ key: 'user:123' });
 * ```
 */

import type { DeleteCacheParams, GetCacheParams, HasCacheParams, SetCacheParams } from './interfaces';
import type { CacheEntry } from './types';

export abstract class BaseCache {
  /**
   * Clear all entries from the cache
   * Use with caution in production
   *
   * @example
   * ```typescript
   * await cache.clear(); // Removes all cached entries
   * ```
   */
  public abstract clear(): Promise<void>;

  /**
   * Delete a value from the cache
   *
   * @param params - Delete parameters
   * @param params.key - Cache key to delete
   *
   * @example
   * ```typescript
   * await cache.delete({ key: 'user:123' });
   * ```
   */
  public abstract delete(params: DeleteCacheParams): Promise<void>;

  /**
   * Get a value from the cache
   * Returns null if key doesn't exist or has expired
   *
   * @param params - Get parameters
   * @param params.key - Cache key
   * @returns Cached value or null
   *
   * @example
   * ```typescript
   * const user = await cache.get({ key: 'user:123' });
   * if (user !== null) {
   *   console.log('Cache hit', user);
   * }
   * ```
   */
  public abstract get<T = unknown>(params: GetCacheParams): Promise<T | null>;

  /**
   * Get all cache entries (for debugging/inspection)
   * Returns array of entries with keys, values, and expiration info
   *
   * @returns Array of cache entries
   *
   * @example
   * ```typescript
   * const entries = await cache.getAll();
   * console.log(`Cache has ${entries.length} entries`);
   * ```
   */
  public abstract getAll(): Promise<CacheEntry<unknown>[]>;

  /**
   * Check if a key exists in the cache
   * Returns false if key doesn't exist or has expired
   *
   * @param params - Has parameters
   * @param params.key - Cache key to check
   * @returns True if key exists and hasn't expired
   *
   * @example
   * ```typescript
   * if (await cache.has({ key: 'user:123' })) {
   *   console.log('Key exists');
   * }
   * ```
   */
  public abstract has(params: HasCacheParams): Promise<boolean>;

  /**
   * Set a value in the cache
   * Optionally provide TTL in milliseconds
   *
   * @param params - Set parameters
   * @param params.key - Cache key
   * @param params.value - Value to cache
   * @param params.ttl - Optional TTL in milliseconds
   *
   * @example
   * ```typescript
   * await cache.set({ key: 'user:123', value: userData, ttl: 60000 });
   * ```
   */
  public abstract set<T = unknown>(params: SetCacheParams<T>): Promise<void>;
}
