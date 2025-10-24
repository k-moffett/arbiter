/**
 * LRU Cache Implementation
 *
 * Simple Least Recently Used cache with TTL support.
 */

/**
 * Cache entry with TTL tracking
 */
interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

/**
 * LRU Cache with time-based expiration
 */
export class LRUCache<K, V> {
  private readonly cache: Map<K, CacheEntry<V>>;
  private readonly maxSize: number;
  private readonly ttl: number;

  /**
   * Create LRU cache
   *
   * @param params - Cache configuration
   */
  constructor(params: { maxSize: number; ttl: number }) {
    this.cache = new Map();
    this.maxSize = params.maxSize;
    this.ttl = params.ttl;
  }

  /**
   * Clear all entries
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get value from cache
   *
   * @param params - Get parameters
   * @returns Value if found and not expired, null otherwise
   */
  public get(params: { key: K }): V | null {
    const entry = this.cache.get(params.key);

    if (entry === undefined) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(params.key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(params.key);
    this.cache.set(params.key, entry);

    return entry.value;
  }

  /**
   * Check if key exists and is not expired
   */
  public has(params: { key: K }): boolean {
    return this.get(params) !== null;
  }

  /**
   * Set value in cache
   *
   * @param params - Set parameters
   */
  public set(params: { key: K; value: V }): void {
    // Remove if already exists
    this.cache.delete(params.key);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey as K);
      }
    }

    // Add new entry
    this.cache.set(params.key, {
      expiresAt: Date.now() + this.ttl,
      value: params.value,
    });
  }

  /**
   * Get current cache size
   */
  public size(): number {
    return this.cache.size;
  }
}
