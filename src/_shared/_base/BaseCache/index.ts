/**
 * BaseCache Module
 *
 * Exports the BaseCache abstract class and related types.
 */

export { BaseCache } from './BaseCacheImplementation.js';
export type {
  DeleteCacheParams,
  GetCacheParams,
  HasCacheParams,
  SetCacheParams,
} from './interfaces.js';
export type { CacheEntry, CacheOptions } from './types.js';
