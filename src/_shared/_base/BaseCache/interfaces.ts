/**
 * BaseCache Interfaces
 *
 * Interface definitions for BaseCache method parameters.
 */

/**
 * Parameters for getting cache values
 */
export interface GetCacheParams {
  key: string;
}

/**
 * Parameters for setting cache values
 */
export interface SetCacheParams<T = unknown> {
  key: string;
  ttl?: number;
  value: T;
}

/**
 * Parameters for deleting cache values
 */
export interface DeleteCacheParams {
  key: string;
}

/**
 * Parameters for checking if key exists
 */
export interface HasCacheParams {
  key: string;
}
