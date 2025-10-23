/**
 * Cache Manager Implementation
 *
 * In-memory caching system with TTL support and statistics tracking.
 * Designed to be easily swappable with Redis or other caching backends.
 */

import type { Logger } from '../../../../_shared/_infrastructure';
import type { CacheManager } from './interfaces';
import type { CacheConfig, CacheEntry, CacheStats } from './types';

import { createHash } from 'node:crypto';

/**
 * Cache Manager Implementation
 *
 * @example
 * ```typescript
 * const cache = new CacheManagerImplementation({
 *   config: {
 *     enabled: true,
 *     maxSize: 1000,
 *     defaultTTL: 3600000
 *   },
 *   logger
 * });
 *
 * await cache.set({ key: 'route:user123:abc', value: routeData });
 * const cached = await cache.get({ key: 'route:user123:abc' });
 * ```
 */
export class CacheManagerImplementation implements CacheManager {
  private readonly cache: Map<string, CacheEntry<unknown>>;
  private readonly config: CacheConfig;
  private hits: number = 0;
  private readonly logger: Logger;
  private misses: number = 0;

  constructor(params: { config: CacheConfig; logger: Logger }) {
    this.config = params.config;
    this.logger = params.logger;
    this.cache = new Map();

    // Start periodic cleanup
    if (this.config.enabled) {
      this.startCleanupInterval();
    }
  }

  /**
   * Clear all cache entries
   */
  // eslint-disable-next-line @typescript-eslint/require-await -- Async for interface consistency (future Redis support)
  public async clear(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;

    this.logger.info({
      message: 'Cache cleared',
      metadata: { entriesCleared: size },
    });
  }

  /**
   * Generate cache key
   */
  public generateKey(params: { query: string; type: string; userId: string }): string {
    const queryHash = this.hashString({ input: params.query });
    return `${params.type}:${params.userId}:${queryHash}`;
  }

  /**
   * Get value from cache
   */
  // eslint-disable-next-line @typescript-eslint/require-await -- Async for interface consistency (future Redis support)
  public async get<T>(params: { key: string }): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }

    const entry = this.cache.get(params.key);

    if (entry === undefined) {
      this.misses += 1;
      return null;
    }

    // Check if expired
    if (this.isExpired({ entry })) {
      this.cache.delete(params.key);
      this.misses += 1;
      return null;
    }

    // Update hit count
    entry.hitCount += 1;
    this.hits += 1;

    this.logger.debug({
      message: 'Cache hit',
      metadata: { hitCount: entry.hitCount, key: params.key },
    });

    return entry.value as T;
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    return {
      hitRate,
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
    };
  }

  /**
   * Invalidate specific cache entry
   */
  // eslint-disable-next-line @typescript-eslint/require-await -- Async for interface consistency (future Redis support)
  public async invalidate(params: { key: string }): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const deleted = this.cache.delete(params.key);

    if (deleted) {
      this.logger.debug({
        message: 'Cache invalidated',
        metadata: { key: params.key },
      });
    }
  }

  /**
   * Check if caching is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Set value in cache
   */
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-parameters -- Async for Redis support, generic needed for type safety
  public async set<T>(params: { key: string; ttl?: number; value: T }): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Check max size and evict if needed
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      hitCount: 0,
      key: params.key,
      timestamp: Date.now(),
      ttl: params.ttl ?? this.config.defaultTTL,
      value: params.value,
    };

    this.cache.set(params.key, entry as CacheEntry<unknown>);

    this.logger.debug({
      message: 'Cache set',
      metadata: { key: params.key, ttl: entry.ttl },
    });
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired({ entry })) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.logger.debug({
        message: 'Cache cleanup completed',
        metadata: { expiredEntries: keysToDelete.length },
      });
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruHitCount = Number.POSITIVE_INFINITY;
    let lruTimestamp = Number.POSITIVE_INFINITY;

    // Find entry with lowest hit count and oldest timestamp
    for (const [key, entry] of this.cache.entries()) {
      if (entry.hitCount < lruHitCount) {
        lruKey = key;
        lruHitCount = entry.hitCount;
        lruTimestamp = entry.timestamp;
      } else if (entry.hitCount === lruHitCount) {
        if (entry.timestamp < lruTimestamp) {
          lruKey = key;
          lruTimestamp = entry.timestamp;
        }
      }
    }

    if (lruKey !== null) {
      this.cache.delete(lruKey);
      this.logger.debug({
        message: 'Cache LRU eviction',
        metadata: { evictedKey: lruKey },
      });
    }
  }

  /**
   * Hash string to create short key
   */
  private hashString(params: { input: string }): string {
    return createHash('sha256').update(params.input).digest('hex').substring(0, 8);
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(params: { entry: CacheEntry<unknown> }): boolean {
    const age = Date.now() - params.entry.timestamp;
    return age > params.entry.ttl;
  }

  /**
   * Start periodic cleanup interval
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 300000);
  }
}
