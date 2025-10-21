/**
 * MemoryCache
 *
 * Simple in-memory cache implementation with TTL support.
 * Stores cache entries in a Map with automatic expiration.
 *
 * Features:
 * - In-memory storage (not persistent)
 * - TTL support with automatic expiration
 * - Configurable default TTL
 * - Thread-safe for Node.js single-threaded model
 *
 * @example
 * ```typescript
 * const cache = new MemoryCache({ defaultTTL: 60000 }); // 60 second default
 *
 * await cache.set({ key: 'user:123', value: userData });
 * const user = await cache.get({ key: 'user:123' });
 * ```
 */

import type {
  DeleteCacheParams,
  GetCacheParams,
  HasCacheParams,
  SetCacheParams,
} from '../../_base/BaseCache/index.js';
import type { CacheEntry } from '../../_base/BaseCache/index.js';
import type { CacheEntryInternal, MemoryCacheParams } from './interfaces.js';

import { BaseCache } from '../../_base/BaseCache/index.js';

/* eslint-disable @typescript-eslint/require-await -- BaseCache requires async methods, but MemoryCache is synchronous */
export class MemoryCache extends BaseCache {
  private readonly cache: Map<string, CacheEntryInternal>;
  private readonly defaultTTL: number | undefined;

  constructor(params: MemoryCacheParams = {}) {
    super();
    this.cache = new Map();
    this.defaultTTL = params.defaultTTL;
  }

  public async clear(): Promise<void> {
    this.cache.clear();
  }

  public async delete(params: DeleteCacheParams): Promise<void> {
    this.cache.delete(params.key);
  }

  public async get<T = unknown>(params: GetCacheParams): Promise<T | null> {
    const entry = this.cache.get(params.key);

    if (entry === undefined) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(params.key);
      return null;
    }

    return entry.value as T;
  }

  public async getAll(): Promise<CacheEntry<unknown>[]> {
    const entries: CacheEntry<unknown>[] = [];
    const now = Date.now();

    for (const [, entry] of this.cache.entries()) {
      // Skip expired entries
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        continue;
      }

      entries.push({
        expiresAt: entry.expiresAt,
        value: entry.value,
      });
    }

    return entries;
  }

  public async has(params: HasCacheParams): Promise<boolean> {
    const entry = this.cache.get(params.key);

    if (entry === undefined) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(params.key);
      return false;
    }

    return true;
  }

  public async set<T = unknown>(params: SetCacheParams<T>): Promise<void> {
    const ttl = params.ttl ?? this.defaultTTL;
    const expiresAt = ttl !== undefined ? Date.now() + ttl : null;

    this.cache.set(params.key, {
      expiresAt,
      value: params.value,
    });
  }
}
