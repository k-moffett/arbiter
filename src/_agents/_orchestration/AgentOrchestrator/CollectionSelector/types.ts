/**
 * Collection Selector Types
 *
 * Type definitions for LLM-based collection selection.
 */

import type { CollectionInfo } from '../../../../_services/_mcpServer/ContextToolRegistry';

/**
 * Parameters for collection selection
 */
export interface CollectionSelectionParams {
  /** Available collections with metadata */
  collections: CollectionInfo[];
  /** User query to analyze */
  query: string;
}

/**
 * Single collection selection with reasoning
 */
export interface SelectedCollection {
  /** Collection name */
  collectionName: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Why this collection was selected */
  reasoning: string;
}

/**
 * Result from collection selection
 */
export interface CollectionSelectionResult {
  /** Confidence in overall selection (0-1) */
  confidence: number;
  /** Selected collections ordered by relevance */
  selectedCollections: SelectedCollection[];
}

/**
 * LLM response format for collection selection
 */
export interface CollectionSelectionLLMResponse {
  /** Confidence in selection (0-1) */
  confidence: number;
  /** Selected collection names with reasoning */
  selections: Array<{
    /** Collection name */
    collection: string;
    /** Confidence for this collection (0-1) */
    confidence: number;
    /** Selection reasoning */
    reasoning: string;
  }>;
}
