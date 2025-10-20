/**
 * MemoryCache Interfaces
 *
 * Interface definitions for MemoryCache configuration and internal structures.
 */

/**
 * Internal cache entry with expiration
 */
export interface CacheEntryInternal {
  expiresAt: number | null;
  value: unknown;
}

/**
 * Constructor parameters for MemoryCache
 */
export interface MemoryCacheParams {
  defaultTTL?: number;
}
