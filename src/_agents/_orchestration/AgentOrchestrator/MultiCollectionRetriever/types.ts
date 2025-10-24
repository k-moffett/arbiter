/**
 * Multi-Collection Retriever Types
 *
 * Type definitions for multi-collection retrieval orchestration.
 */

import type { HybridSearchParams } from '../HybridSearchRetriever/types';

/**
 * Multi-collection retrieval parameters
 *
 * Extends HybridSearchParams with collection selection options
 */
export interface MultiCollectionRetrievalParams extends HybridSearchParams {
  /**
   * Whether to enable multi-collection search (default: true)
   * If false, falls back to conversation-history only
   */
  enableMultiCollection?: boolean;

  /**
   * Maximum number of collections to search in parallel (default: 3)
   * Limits resource usage for queries matching many collections
   */
  maxCollections?: number;

  /**
   * Minimum confidence threshold for collection selection (0-1, default: 0.7)
   * Collections below this threshold are excluded
   */
  minCollectionConfidence?: number;
}

/**
 * Per-collection search result
 */
export interface CollectionSearchResult {
  /** Collection that was searched */
  collectionName: string;
  /** Confidence in collection selection (0-1) */
  confidence: number;
  /** Number of results from this collection */
  count: number;
  /** Reasoning for collection selection */
  reasoning: string;
  /** Search duration in milliseconds */
  searchDuration: number;
}

/**
 * Multi-collection retrieval metadata
 */
export interface MultiCollectionRetrievalMetadata {
  /** Per-collection search results */
  collectionResults: CollectionSearchResult[];
  /** Number of collections discovered */
  collectionsDiscovered: number;
  /** Number of collections searched */
  collectionsSearched: number;
  /** Collection selection confidence (0-1) */
  selectionConfidence: number;
  /** Total retrieval duration in milliseconds */
  totalDuration: number;
}
