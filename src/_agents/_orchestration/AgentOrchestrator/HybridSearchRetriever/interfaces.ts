/**
 * Hybrid Search Retriever Interfaces
 *
 * Interface definitions for hybrid search retrieval.
 */

import type { HybridSearchParams, RetrievedContext } from './types';

/**
 * Hybrid search retriever interface
 *
 * Combines BM25 sparse search with dense semantic search,
 * supporting multiple query variations and metadata filtering.
 */
export interface HybridSearchRetriever {
  /**
   * Get maximum results per query from configuration
   *
   * @returns Maximum number of results per query
   */
  getMaxResultsPerQuery(): number;

  /**
   * Retrieve context using hybrid search
   *
   * Executes parallel searches for all query variations (original + HyDE + expansions),
   * combines results using weighted scoring (60% dense, 40% BM25),
   * applies metadata and temporal filters,
   * and returns deduplicated, reranked results.
   *
   * @param params - Search parameters
   * @param params.query - Original query text
   * @param params.userId - User ID for context filtering
   * @param params.filters - Optional metadata filters
   * @param params.limit - Maximum number of results (default: 10)
   * @param params.hypotheticalAnswer - Optional HyDE hypothetical answer
   * @param params.alternativeQueries - Optional alternative query phrasings
   * @param params.relatedQueries - Optional related queries
   * @returns Retrieved context with hybrid search results
   */
  retrieve(params: HybridSearchParams): Promise<RetrievedContext>;
}
