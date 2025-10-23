/**
 * Query Decomposer Interfaces
 *
 * Interface definitions for query decomposition.
 */

import type { DecomposedQuery } from '../types';
import type { QueryIntent } from './types';

/**
 * Query decomposer interface
 */
export interface QueryDecomposer {
  /**
   * Analyze query intent
   */
  analyzeIntent(params: { query: string }): Promise<QueryIntent>;

  /**
   * Decompose query into sub-queries
   */
  decompose(params: { query: string }): Promise<DecomposedQuery>;
}
