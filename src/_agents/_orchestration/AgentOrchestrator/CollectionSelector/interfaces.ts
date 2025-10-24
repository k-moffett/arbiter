/**
 * Collection Selector Interfaces
 *
 * Interface for LLM-based collection selection service.
 */

import type { CollectionSelectionParams, CollectionSelectionResult } from './types';

/**
 * Collection Selector Interface
 *
 * Analyzes user queries and available collections to determine
 * which collections should be searched for relevant information.
 */
export interface CollectionSelector {
  /**
   * Select collections relevant to the query
   *
   * Uses LLM to analyze query semantics and collection metadata
   * to intelligently determine which collections to search.
   *
   * @returns Selected collections ordered by relevance
   */
  selectCollections(params: CollectionSelectionParams): Promise<CollectionSelectionResult>;
}
