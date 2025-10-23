/**
 * Query Enhancer Interfaces
 *
 * Interface definitions for query enhancement.
 */

import type { EnhancedQuery, HyDEResult, QueryExpansion } from './types';

/**
 * Query enhancer interface
 *
 * Enhances queries using HyDE and query expansion techniques.
 * Components are conditional - only execute when requested.
 */
export interface QueryEnhancer {
  /**
   * Apply HyDE (Hypothetical Document Embeddings)
   *
   * Generates a hypothetical answer to the query, which can be used
   * for semantic search to find documents similar to the answer.
   *
   * @param params - Enhancement parameters
   * @param params.query - The query to enhance with HyDE
   * @returns HyDE result with hypothetical answer
   */
  applyHyDE(params: { query: string }): Promise<HyDEResult>;

  /**
   * Enhance query with all applicable techniques
   *
   * Applies HyDE and/or query expansion based on the provided flags.
   * This is the main entry point for query enhancement.
   *
   * @param params - Enhancement parameters
   * @param params.query - The query to enhance
   * @param params.useHyDE - Whether to apply HyDE
   * @param params.useExpansion - Whether to apply query expansion
   * @returns Enhanced query with all applicable enhancements
   */
  enhance(params: {
    query: string;
    useExpansion: boolean;
    useHyDE: boolean;
  }): Promise<EnhancedQuery>;

  /**
   * Expand query with alternatives and related queries
   *
   * Generates alternative phrasings and related queries that can
   * improve recall by searching for multiple variations.
   *
   * @param params - Expansion parameters
   * @param params.query - The query to expand
   * @returns Query expansion with alternatives and related queries
   */
  expandQuery(params: { query: string }): Promise<QueryExpansion>;
}
