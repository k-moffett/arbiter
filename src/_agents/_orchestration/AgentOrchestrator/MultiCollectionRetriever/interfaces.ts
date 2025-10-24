/**
 * Multi-Collection Retriever Interfaces
 *
 * Interface for multi-collection retrieval orchestration.
 */

import type { RetrievedContext } from '../HybridSearchRetriever/types';
import type { MultiCollectionRetrievalParams } from './types';

/**
 * Multi-Collection Retriever Interface
 *
 * Orchestrates retrieval across multiple Qdrant collections,
 * using CollectionSelector for intelligent collection discovery
 * and HybridSearchRetriever for conversation-history search.
 */
export interface MultiCollectionRetriever {
  /**
   * Retrieve context from multiple collections
   *
   * Process:
   * 1. Discover available collections via MCP
   * 2. Use CollectionSelector to identify relevant collections
   * 3. Search conversation-history with HybridSearchRetriever
   * 4. Search other collections with semantic search
   * 5. Merge and rank results by similarity scores
   *
   * @param params - Retrieval parameters
   * @returns Combined context from all searched collections
   */
  retrieve(params: MultiCollectionRetrievalParams): Promise<RetrievedContext>;
}
