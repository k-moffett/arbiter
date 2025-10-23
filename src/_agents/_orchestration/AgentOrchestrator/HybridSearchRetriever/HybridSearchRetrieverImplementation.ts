/**
 * Hybrid Search Retriever Implementation
 *
 * Combines BM25 sparse search with dense semantic search.
 * Supports multiple query variations, metadata filtering, and temporal scoping.
 *
 * NOTE: Currently uses client-side BM25 implementation.
 * Can be upgraded to use Qdrant's native sparse vectors when collection schema supports it.
 */

import type {
  ContextSearchFilters,
  ContextSearchResult,
  VectorSearchContextParams,
  VectorSearchContextResult,
} from '../../../../_services/_mcpServer/ContextToolRegistry/types';
import type { Logger } from '../../../../_shared/_infrastructure';
import type { HybridSearchRetriever } from './interfaces';
import type {
  HybridSearchFilters,
  HybridSearchParams,
  HybridSearchResult,
  HybridSearchRetrieverConfig,
  RetrievedContext,
} from './types';

import {
  applyMetadataFilters,
  applyTemporalFilter,
  calculateAvgDocLength,
  calculateBM25Score,
  calculateIDF,
  combineScores,
  mergeResults,
  normalizeBM25Scores,
} from './utils';

/**
 * Embedding provider interface (minimal subset needed)
 */
interface EmbeddingProvider {
  embed(params: { texts: string[] }): Promise<{ embeddings: number[][] }>;
}

/**
 * Vector search tool interface (minimal subset needed)
 */
interface VectorSearchTool {
  execute(params: VectorSearchContextParams): Promise<VectorSearchContextResult>;
}

/**
 * Hybrid Search Retriever Implementation
 *
 * @example
 * ```typescript
 * const retriever = new HybridSearchRetrieverImplementation({
 *   config,
 *   logger,
 *   embeddingProvider,
 *   vectorSearchTool,
 * });
 *
 * const result = await retriever.retrieve({
 *   query: 'What did we discuss?',
 *   userId: 'user123',
 *   filters: { temporalScope: 'recent' },
 *   hypotheticalAnswer: '...',
 *   alternativeQueries: ['...']
 * });
 * ```
 */
export class HybridSearchRetrieverImplementation implements HybridSearchRetriever {
  private readonly config: HybridSearchRetrieverConfig;
  private readonly embeddingProvider: EmbeddingProvider;
  private readonly logger: Logger;
  private readonly vectorSearchTool: VectorSearchTool;

  constructor(params: {
    config: HybridSearchRetrieverConfig;
    embeddingProvider: EmbeddingProvider;
    logger: Logger;
    vectorSearchTool: VectorSearchTool;
  }) {
    this.config = params.config;
    this.logger = params.logger;
    this.embeddingProvider = params.embeddingProvider;
    this.vectorSearchTool = params.vectorSearchTool;
  }

  /**
   * Get maximum results per query from configuration
   */
  public getMaxResultsPerQuery(): number {
    return this.config.maxResultsPerQuery;
  }

  /**
   * Retrieve context using hybrid search
   */
  public async retrieve(params: HybridSearchParams): Promise<RetrievedContext> {
    const startTime = Date.now();
    const queries = this.gatherQueryVariations(params);

    this.logQueryVariations({ params, queryCount: queries.length });

    const resultSets = await this.executeParallelSearches({
      filters: params.filters,
      limit: params.limit ?? 10,
      queries,
      userId: params.userId,
    });

    const mergedResults = mergeResults({ resultSets });
    const limitedResults = mergedResults.slice(0, params.limit ?? 10);
    const duration = Date.now() - startTime;

    this.logSearchCompletion({
      duration,
      queriesExecuted: queries.length,
      resultsCount: limitedResults.length,
    });

    return this.createRetrievedContext({
      duration,
      limitedResults,
      mergedResultsCount: mergedResults.length,
      params,
    });
  }

  /**
   * Apply BM25 scoring to search results
   */
  private applyBM25Scoring(params: {
    query: string;
    results: ContextSearchResult[];
  }): number[] {
    const { query, results } = params;

    if (results.length === 0) {
      return [];
    }

    // Extract document texts
    const documents = results.map((result) => result.payload.content);

    // Calculate IDF for the corpus
    const idf = calculateIDF({ documents });

    // Calculate average document length
    const avgDocLength = calculateAvgDocLength({ documents });

    // Calculate BM25 score for each document
    const scores = documents.map((document) =>
      calculateBM25Score({
        avgDocLength,
        b: this.config.bm25B,
        document,
        idf,
        k1: this.config.bm25K1,
        query,
      })
    );

    // Normalize to 0-1 range
    return normalizeBM25Scores({ scores });
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(params: {
    filters: HybridSearchFilters | undefined;
    results: ContextSearchResult[];
  }): ContextSearchResult[] {
    let filtered = params.results;

    if (params.filters === undefined) {
      return filtered;
    }

    // Apply temporal filtering
    if (params.filters.temporalScope !== undefined) {
      filtered = applyTemporalFilter({
        results: filtered,
        temporalScope: params.filters.temporalScope,
        thresholds: this.config.temporalThresholds,
      });
    }

    // Apply metadata filtering
    filtered = applyMetadataFilters({
      filters: params.filters,
      results: filtered,
    });

    return filtered;
  }

  /**
   * Build context search filters from hybrid search filters
   */
  private buildContextFilters(params: {
    filters: HybridSearchFilters | undefined;
  }): ContextSearchFilters | null {
    if (params.filters === undefined) {
      return null;
    }

    const contextFilters: ContextSearchFilters = {};

    if (params.filters.sessionId !== undefined) {
      contextFilters.sessionId = params.filters.sessionId;
    }

    if (params.filters.tags !== undefined) {
      contextFilters.tags = params.filters.tags;
    }

    return Object.keys(contextFilters).length > 0 ? contextFilters : null;
  }

  /**
   * Combine scores and map to hybrid results
   */
  private combineAndMapResults(params: {
    bm25Scores: number[];
    results: ContextSearchResult[];
  }): HybridSearchResult[] {
    return params.results.map((result) => {
      const index = params.results.indexOf(result);
      const bm25Score = params.bm25Scores[index];

      if (bm25Score === undefined) {
        throw new Error('BM25 score missing for result');
      }

      const combinedScore = combineScores({
        bm25Score,
        bm25Weight: this.config.bm25Weight,
        denseScore: result.score,
        denseWeight: this.config.denseWeight,
      });

      return {
        bm25Score,
        combinedScore,
        denseScore: result.score,
        id: result.id,
        payload: result.payload,
      };
    });
  }

  /**
   * Create retrieved context result
   */
  private createRetrievedContext(opts: {
    duration: number;
    limitedResults: HybridSearchResult[];
    mergedResultsCount: number;
    params: HybridSearchParams;
  }): RetrievedContext {
    return {
      count: opts.limitedResults.length,
      results: opts.limitedResults,
      retrievalMetadata: {
        alternativesCount: opts.params.alternativeQueries?.length ?? 0,
        filtersApplied: this.getFiltersApplied({
          filters: opts.params.filters,
        }),
        relatedCount: opts.params.relatedQueries?.length ?? 0,
        retrievalDuration: opts.duration,
        totalDocumentsSearched: opts.mergedResultsCount,
        usedHyDE: opts.params.hypotheticalAnswer !== undefined,
      },
    };
  }

  /**
   * Execute hybrid search for a single query
   */
  private async executeHybridSearch(params: {
    filters: HybridSearchFilters | undefined;
    limit: number;
    query: string;
    userId: string;
  }): Promise<HybridSearchResult[]> {
    const queryVector = await this.getQueryEmbedding({
      query: params.query,
    });
    const filteredResults = await this.searchAndFilter({
      filters: params.filters,
      limit: params.limit,
      query: params.query,
      queryVector,
      userId: params.userId,
    });

    if (filteredResults.length === 0) {
      return [];
    }

    const bm25Scores = this.applyBM25Scoring({
      query: params.query,
      results: filteredResults,
    });
    const hybridResults = this.combineAndMapResults({
      bm25Scores,
      results: filteredResults,
    });

    return this.sortByScore({ results: hybridResults });
  }

  /**
   * Execute parallel searches for all query variations
   */
  private async executeParallelSearches(params: {
    filters: HybridSearchFilters | undefined;
    limit: number;
    queries: string[];
    userId: string;
  }): Promise<HybridSearchResult[][]> {
    const { filters, queries, userId } = params;

    const promises = queries.map((query) =>
      this.executeHybridSearch({
        filters,
        limit: this.config.maxResultsPerQuery,
        query,
        userId,
      })
    );

    return await Promise.all(promises);
  }

  /**
   * Gather all query variations for parallel search
   */
  private gatherQueryVariations(params: HybridSearchParams): string[] {
    const queries: string[] = [];

    // Original query (highest priority)
    queries.push(params.query);

    // HyDE hypothetical answer (if provided)
    if (params.hypotheticalAnswer !== undefined && params.hypotheticalAnswer !== '') {
      queries.push(params.hypotheticalAnswer);
    }

    // Alternative query phrasings
    if (params.alternativeQueries !== undefined) {
      queries.push(...params.alternativeQueries);
    }

    // Related queries
    if (params.relatedQueries !== undefined) {
      queries.push(...params.relatedQueries);
    }

    return queries;
  }

  /**
   * Get list of filters applied (for metadata)
   */
  private getFiltersApplied(params: {
    filters: HybridSearchFilters | undefined;
  }): string[] {
    const applied: string[] = [];

    if (params.filters === undefined) {
      return applied;
    }

    if (params.filters.temporalScope !== undefined) {
      applied.push(`temporal:${params.filters.temporalScope}`);
    }

    if (params.filters.role !== undefined) {
      applied.push(`role:${params.filters.role}`);
    }

    if (params.filters.tags !== undefined && params.filters.tags.length > 0) {
      applied.push(`tags:${params.filters.tags.join(',')}`);
    }

    if (params.filters.excludeTags !== undefined && params.filters.excludeTags.length > 0) {
      applied.push(`excludeTags:${params.filters.excludeTags.join(',')}`);
    }

    if (params.filters.minQuality !== undefined) {
      applied.push(`minQuality:${String(params.filters.minQuality)}`);
    }

    return applied;
  }

  /**
   * Get query embedding vector
   */
  private async getQueryEmbedding(params: {
    query: string;
  }): Promise<number[]> {
    const embeddingResult = await this.embeddingProvider.embed({
      texts: [params.query],
    });
    const queryVector = embeddingResult.embeddings[0];

    if (queryVector === undefined) {
      throw new Error('Failed to generate embedding for query');
    }

    return queryVector;
  }

  /**
   * Log query variations
   */
  private logQueryVariations(opts: {
    params: HybridSearchParams;
    queryCount: number;
  }): void {
    this.logger.debug({
      message: 'Hybrid search with query variations',
      metadata: {
        alternativesCount: opts.params.alternativeQueries?.length ?? 0,
        queriesCount: opts.queryCount,
        relatedCount: opts.params.relatedQueries?.length ?? 0,
        useHyDE: opts.params.hypotheticalAnswer !== undefined,
      },
    });
  }

  /**
   * Log search completion
   */
  private logSearchCompletion(opts: {
    duration: number;
    queriesExecuted: number;
    resultsCount: number;
  }): void {
    this.logger.info({
      message: 'Hybrid search completed',
      metadata: {
        duration: opts.duration,
        queriesExecuted: opts.queriesExecuted,
        resultsCount: opts.resultsCount,
      },
    });
  }

  /**
   * Execute search and apply filters
   */
  private async searchAndFilter(params: {
    filters: HybridSearchFilters | undefined;
    limit: number;
    query: string;
    queryVector: number[];
    userId: string;
  }): Promise<ContextSearchResult[]> {
    const contextFilters = this.buildContextFilters({
      filters: params.filters,
    });
    const searchParams: VectorSearchContextParams = {
      limit: params.limit * 2,
      query: params.query,
      queryVector: params.queryVector,
      userId: params.userId,
    };

    if (contextFilters !== null) {
      searchParams.filters = contextFilters;
    }

    const searchResult = await this.vectorSearchTool.execute(searchParams);

    return this.applyFilters({
      filters: params.filters,
      results: searchResult.results,
    });
  }

  /**
   * Sort results by combined score
   */
  private sortByScore(params: {
    results: HybridSearchResult[];
  }): HybridSearchResult[] {
    const sorted = [...params.results];
    for (let i = 0; i < sorted.length - 1; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const resultI = sorted[i];
        const resultJ = sorted[j];
        if (resultI === undefined || resultJ === undefined) {
          continue;
        }
        if (resultJ.combinedScore > resultI.combinedScore) {
          sorted[i] = resultJ;
          sorted[j] = resultI;
        }
      }
    }
    return sorted;
  }
}
