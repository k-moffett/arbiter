/**
 * Multi-Collection Retriever Implementation
 *
 * Orchestrates retrieval across multiple Qdrant collections.
 */

import type { MCPClient } from '../../../_shared/_lib/MCPClient';
import type { CollectionSelector } from '../CollectionSelector';
import type { HybridSearchRetriever, RetrievedContext } from '../HybridSearchRetriever';
import type { HybridSearchResult } from '../HybridSearchRetriever/types';
import type { MultiCollectionRetriever } from './interfaces';
import type {
  CollectionSearchResult,
  MultiCollectionRetrievalMetadata,
  MultiCollectionRetrievalParams,
} from './types';

/**
 * Multi-Collection Retriever Configuration
 */
export interface MultiCollectionRetrieverConfig {
  /** Collection selector for intelligent collection discovery */
  collectionSelector: CollectionSelector;
  /** Embedding service for query vectorization */
  embeddingService: {
    /** Generate embedding vector from text */
    embed(params: { text: string }): Promise<number[]>;
  };
  /** Hybrid search retriever for conversation-history */
  hybridSearchRetriever: HybridSearchRetriever;
  /** MCP client for collection discovery and search */
  mcpClient: MCPClient;
}

/**
 * Multi-Collection Retriever Implementation
 *
 * Orchestrates parallel searches across multiple collections,
 * merging results by similarity scores.
 *
 * @example
 * ```typescript
 * const retriever = new MultiCollectionRetrieverImplementation({
 *   collectionSelector,
 *   embeddingService,
 *   hybridSearchRetriever,
 *   mcpClient
 * });
 *
 * const results = await retriever.retrieve({
 *   query: "Tell me about Project Odyssey",
 *   userId: "user_123",
 *   limit: 10
 * });
 * ```
 */
export class MultiCollectionRetrieverImplementation implements MultiCollectionRetriever {
  private readonly collectionSelector: CollectionSelector;
  private readonly embeddingService: MultiCollectionRetrieverConfig['embeddingService'];
  private readonly hybridSearchRetriever: HybridSearchRetriever;
  private readonly mcpClient: MCPClient;

  constructor(config: MultiCollectionRetrieverConfig) {
    this.collectionSelector = config.collectionSelector;
    this.embeddingService = config.embeddingService;
    this.hybridSearchRetriever = config.hybridSearchRetriever;
    this.mcpClient = config.mcpClient;
  }

  /**
   * Retrieve context from multiple collections
   */
  public async retrieve(params: MultiCollectionRetrievalParams): Promise<RetrievedContext> {
    const startTime = Date.now();

    // Check if multi-collection is enabled
    const enableMultiCollection = params.enableMultiCollection ?? true;
    if (!enableMultiCollection) {
      return await this.retrieveConversationHistoryOnly({ params });
    }

    try {
      const { collections, selectedCollections, selectionConfidence } =
        await this.discoverAndSelectCollections({ params });

      const searchResults = await this.executeParallelSearches({
        params,
        selectedCollections,
      });

      const { collectionResults, finalResults, totalDocuments } =
        this.mergeAndRankResults({
          limit: params.limit ?? 10,
          searchResults,
        });

      return this.buildRetrievalResponse({
        collectionResults,
        collectionsDiscovered: collections.count,
        collectionsSearched: selectedCollections.length,
        finalResults,
        params,
        selectionConfidence,
        startTime,
        totalDocuments,
      });
    } catch (error) {
      console.error('[ERROR] Multi-collection retrieval failed:', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback to conversation-history only
      return await this.retrieveConversationHistoryOnly({ params });
    }
  }

  /**
   * Build final retrieval response
   */
  private buildRetrievalResponse(params: {
    collectionResults: CollectionSearchResult[];
    collectionsDiscovered: number;
    collectionsSearched: number;
    finalResults: HybridSearchResult[];
    params: MultiCollectionRetrievalParams;
    selectionConfidence: number;
    startTime: number;
    totalDocuments: number;
  }): RetrievedContext {
    const totalDuration = Date.now() - params.startTime;
    const metadata: MultiCollectionRetrievalMetadata = {
      collectionResults: params.collectionResults,
      collectionsDiscovered: params.collectionsDiscovered,
      collectionsSearched: params.collectionsSearched,
      selectionConfidence: params.selectionConfidence,
      totalDuration,
    };

    return {
      count: params.finalResults.length,
      results: params.finalResults,
      retrievalMetadata: {
        alternativesCount: params.params.alternativeQueries?.length ?? 0,
        filtersApplied: this.extractFilters({ params: params.params }),
        relatedCount: params.params.relatedQueries?.length ?? 0,
        retrievalDuration: totalDuration,
        totalDocumentsSearched: params.totalDocuments,
        usedHyDE: params.params.hypotheticalAnswer !== undefined,
        ...(metadata as unknown as Record<string, unknown>),
      },
    };
  }

  /**
   * Discover and select collections based on query
   */
  private async discoverAndSelectCollections(params: {
    params: MultiCollectionRetrievalParams;
  }): Promise<{
    collections: { collections: unknown[]; count: number };
    selectedCollections: Array<{ collectionName: string; confidence: number; reasoning: string }>;
    selectionConfidence: number;
  }> {
    const collectionsResult = await this.mcpClient.listCollections({
      includeMetadata: true,
    });

    const selectionResult = await this.collectionSelector.selectCollections({
      collections: collectionsResult.collections,
      query: params.params.query,
    });

    const minConfidence = params.params.minCollectionConfidence ?? 0.7;
    const maxCollections = params.params.maxCollections ?? 3;
    const selectedCollections = selectionResult.selectedCollections
      .filter((c) => c.confidence >= minConfidence)
      .slice(0, maxCollections);

    return {
      collections: collectionsResult,
      selectedCollections,
      selectionConfidence: selectionResult.confidence,
    };
  }

  /**
   * Execute parallel searches across selected collections
   */
  private async executeParallelSearches(params: {
    params: MultiCollectionRetrievalParams;
    selectedCollections: Array<{ collectionName: string; confidence: number; reasoning: string }>;
  }): Promise<
    Array<{
      collectionResult: CollectionSearchResult;
      results: HybridSearchResult[];
    }>
  > {
    const searchPromises = params.selectedCollections.map(async (selected) => {
      return await this.searchSingleCollection({
        params: params.params,
        selected,
      });
    });

    return await Promise.all(searchPromises);
  }

  /**
   * Extract filter names for metadata
   */
  private extractFilters(params: { params: MultiCollectionRetrievalParams }): string[] {
    const filters: string[] = [];

    if (params.params.filters !== undefined) {
      if (params.params.filters.role !== undefined) {
        filters.push(`role:${params.params.filters.role}`);
      }
      if (params.params.filters.sessionId !== undefined) {
        filters.push('sessionId');
      }
      if (params.params.filters.temporalScope !== undefined) {
        filters.push(`temporal:${params.params.filters.temporalScope}`);
      }
      if (params.params.filters.tags !== undefined) {
        filters.push('tags');
      }
      if (params.params.filters.excludeTags !== undefined) {
        filters.push('excludeTags');
      }
    }

    return filters;
  }

  /**
   * Merge and rank results from all collections
   */
  private mergeAndRankResults(params: {
    limit: number;
    searchResults: Array<{
      collectionResult: CollectionSearchResult;
      results: HybridSearchResult[];
    }>;
  }): {
    collectionResults: CollectionSearchResult[];
    finalResults: HybridSearchResult[];
    totalDocuments: number;
  } {
    const allResults: HybridSearchResult[] = [];
    const collectionResults: CollectionSearchResult[] = [];

    for (const { collectionResult, results } of params.searchResults) {
      allResults.push(...results);
      collectionResults.push(collectionResult);
    }

    const sortedResults = this.sortByScoreDescending(allResults);
    const finalResults = sortedResults.slice(0, params.limit);

    return {
      collectionResults,
      finalResults,
      totalDocuments: allResults.length,
    };
  }

  /**
   * Fallback: retrieve from conversation-history only
   */
  private async retrieveConversationHistoryOnly(params: {
    params: MultiCollectionRetrievalParams;
  }): Promise<RetrievedContext> {
    return await this.hybridSearchRetriever.retrieve(params.params);
  }

  /**
   * Search a single collection
   */
  private async searchSingleCollection(params: {
    params: MultiCollectionRetrievalParams;
    selected: { collectionName: string; confidence: number; reasoning: string };
  }): Promise<{
    collectionResult: CollectionSearchResult;
    results: HybridSearchResult[];
  }> {
    const searchStart = Date.now();

    // Use HybridSearchRetriever for conversation-history
    if (params.selected.collectionName === 'conversation-history') {
      const result = await this.hybridSearchRetriever.retrieve(params.params);
      const searchDuration = Date.now() - searchStart;

      return {
        collectionResult: {
          collectionName: params.selected.collectionName,
          confidence: params.selected.confidence,
          count: result.count,
          reasoning: params.selected.reasoning,
          searchDuration,
        },
        results: result.results,
      };
    }

    // Use semantic search for other collections
    const queryVector = await this.embeddingService.embed({
      text: params.params.query,
    });

    const results = await this.mcpClient.searchInCollection({
      collectionName: params.selected.collectionName,
      limit: params.params.limit ?? 10,
      queryVector,
      scoreThreshold: 0.5,
    });

    const searchDuration = Date.now() - searchStart;

    // Convert to HybridSearchResult format
    const hybridResults: HybridSearchResult[] = results.map((r) => ({
      bm25Score: 0,
      combinedScore: r.score,
      denseScore: r.score,
      id: r.id,
      payload: {
        agentType: 'document',
        channelId: '',
        containerInstanceId: '',
        content: r.content,
        embeddedText: r.content,
        role: 'bot',
        sessionId: '',
        tags: [params.selected.collectionName],
        timestamp: Date.now(),
        userId: params.params.userId,
      },
    }));

    return {
      collectionResult: {
        collectionName: params.selected.collectionName,
        confidence: params.selected.confidence,
        count: results.length,
        reasoning: params.selected.reasoning,
        searchDuration,
      },
      results: hybridResults,
    };
  }

  /**
   * Sort results by combined score (highest first)
   */
  private sortByScoreDescending(results: HybridSearchResult[]): HybridSearchResult[] {
    // Manual bubble sort to avoid multi-param arrow functions
    const sorted = [...results];
    const { length } = sorted;
    for (let i = 0; i < length; i++) {
      for (let j = 0; j < length - 1 - i; j++) {
        const current = sorted[j];
        const next = sorted[j + 1];
        if (current === undefined || next === undefined) {
          continue;
        }
        if (current.combinedScore < next.combinedScore) {
          sorted[j] = next;
          sorted[j + 1] = current;
        }
      }
    }
    return sorted;
  }
}
