/**
 * Query Router Interfaces
 *
 * Interface definitions for the query routing system.
 */

import type { QueryRoute } from './types';

/**
 * Query router interface
 */
export interface QueryRouter {
  /**
   * Route a query to appropriate processing path
   */
  route(params: { query: string; userId: string }): Promise<QueryRoute>;
}
