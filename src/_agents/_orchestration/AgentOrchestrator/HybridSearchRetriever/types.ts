/**
 * Hybrid Search Retriever Type Definitions
 *
 * Types for hybrid search combining BM25 and dense semantic search.
 */

import type { ContextPayload } from '../../../../_services/_mcpServer/ContextToolRegistry/types';

/**
 * Temporal scope for context filtering
 *
 * Determines how far back in time to search for context.
 */
export type TemporalScope = 'all_time' | 'lastMessage' | 'recent' | 'session';

/**
 * Metadata filters for hybrid search
 *
 * Extends basic filtering with temporal scope and quality filtering.
 */
export interface HybridSearchFilters {
  /**
   * Exclude messages with these tags
   */
  excludeTags?: string[];

  /**
   * Maximum age in milliseconds (for temporal scopes)
   */
  maxAge?: number;

  /**
   * Minimum quality score (0-1)
   * Only return messages with user feedback 'success' or neutral
   */
  minQuality?: number;

  /**
   * Filter by role (user or bot messages)
   */
  role?: 'bot' | 'user';

  /**
   * Session ID to filter by
   */
  sessionId?: string;

  /**
   * Include specific tags (AND logic)
   */
  tags?: string[];

  /**
   * Temporal scope for filtering
   */
  temporalScope?: TemporalScope;
}

/**
 * Hybrid search parameters
 */
export interface HybridSearchParams {
  /**
   * Alternative query variations for parallel search
   */
  alternativeQueries?: string[];

  /**
   * Metadata filters to apply
   */
  filters?: HybridSearchFilters;

  /**
   * Hypothetical answer from HyDE (if used)
   */
  hypotheticalAnswer?: string;

  /**
   * Maximum number of results to return
   */
  limit?: number;

  /**
   * Original query text
   */
  query: string;

  /**
   * Related queries for parallel search
   */
  relatedQueries?: string[];

  /**
   * User ID for context filtering
   */
  userId: string;
}

/**
 * Hybrid search result with combined scores
 */
export interface HybridSearchResult {
  /**
   * BM25 sparse search score (0-1 normalized)
   */
  bm25Score: number;

  /**
   * Combined hybrid score (weighted average)
   */
  combinedScore: number;

  /**
   * Dense semantic search score (0-1)
   */
  denseScore: number;

  /**
   * Message ID
   */
  id: string;

  /**
   * Context payload
   */
  payload: ContextPayload;
}

/**
 * Retrieved context with hybrid search results
 */
export interface RetrievedContext {
  /**
   * Number of results returned
   */
  count: number;

  /**
   * Hybrid search results ordered by combined score
   */
  results: HybridSearchResult[];

  /**
   * Retrieval metadata
   */
  retrievalMetadata: RetrievalMetadata;
}

/**
 * Retrieval metadata for debugging and monitoring
 */
export interface RetrievalMetadata {
  /**
   * Number of alternative queries used
   */
  alternativesCount: number;

  /**
   * Filters applied to search
   */
  filtersApplied: string[];

  /**
   * Number of related queries used
   */
  relatedCount: number;

  /**
   * Retrieval duration in milliseconds
   */
  retrievalDuration: number;

  /**
   * Total number of documents searched
   */
  totalDocumentsSearched: number;

  /**
   * Whether HyDE was used
   */
  usedHyDE: boolean;
}

/**
 * Hybrid search retriever configuration
 */
export interface HybridSearchRetrieverConfig {
  /**
   * BM25 b parameter (length normalization)
   * Typical range: 0.75
   */
  bm25B: number;

  /**
   * BM25 k1 parameter (term frequency saturation)
   * Typical range: 1.2-2.0
   */
  bm25K1: number;

  /**
   * Weight for BM25 score in hybrid combination
   * Typical: 0.4 (40% BM25, 60% dense)
   */
  bm25Weight: number;

  /**
   * Weight for dense score in hybrid combination
   * Typical: 0.6 (60% dense, 40% BM25)
   */
  denseWeight: number;

  /**
   * Maximum number of results per query variation
   */
  maxResultsPerQuery: number;

  /**
   * Temporal scope thresholds in milliseconds
   */
  temporalThresholds: {
    /** Last message: last 5 minutes */
    lastMessage: number;
    /** Recent: last hour */
    recent: number;
    /** Session: last 24 hours */
    session: number;
  };
}
