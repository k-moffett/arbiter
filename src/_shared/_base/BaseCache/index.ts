/**
 * BaseCache Module
 *
 * Exports the BaseCache abstract class and related types.
 */

export { BaseCache } from './BaseCacheImplementation';
export type {
  DeleteCacheParams,
  GetCacheParams,
  HasCacheParams,
  SetCacheParams,
} from './interfaces';
export type { CacheEntry, CacheOptions } from './types';
