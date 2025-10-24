/**
 * Context Tool Registry Utilities
 *
 * Pure helper functions for context tool operations.
 */

import type { QdrantClientAdapter } from '../../../_data/_repositories/QdrantClientAdapter';
import type {
  CollectionSearchResult,
  ContextPayload,
  ContextSearchFilters,
  GetRequestContextParams,
  GetRequestContextResult,
  ListCollectionsParams,
  ListCollectionsResult,
  QdrantFilters,
  SearchInCollectionParams,
  SearchInCollectionResult,
  SearchResult,
  VectorSearchContextParams,
  VectorSearchContextResult,
  VectorUpsertContextParams,
  VectorUpsertContextResult,
} from './types';

/**
 * Build Qdrant filters from context search filters
 */
export function buildQdrantFilters(params: {
  filters: ContextSearchFilters | undefined;
  userId: string;
}): QdrantFilters {
  const { filters, userId } = params;
  // userId is required in QdrantFilters
  const qdrantFilters: QdrantFilters = { userId };

  if (filters === undefined) {
    return qdrantFilters;
  }

  // Add filter conditions
  if (filters.agentType !== undefined) {
    qdrantFilters.agentType = filters.agentType;
  }

  if (filters.requestId !== undefined) {
    qdrantFilters.requestId = filters.requestId;
  }

  if (filters.sessionId !== undefined) {
    qdrantFilters.sessionId = filters.sessionId;
  }

  if (filters.userFeedback !== undefined) {
    qdrantFilters.userFeedback = filters.userFeedback;
  }

  if (filters.tags !== undefined && filters.tags.length > 0) {
    // For tags, we need all tags to match (AND logic)
    // This is a simplified approach; for complex tag matching,
    // we may need to use Qdrant's nested filters
    qdrantFilters.tags = filters.tags;
  }

  return qdrantFilters;
}

/**
 * Apply exclude filters to search results
 */
export function applyExcludeFilters(params: {
  filters: ContextSearchFilters | undefined;
  results: SearchResult[];
}): SearchResult[] {
  const { filters, results } = params;
  let filteredResults = results;

  if (filters === undefined) {
    return filteredResults;
  }

  // Apply excludeTags filter
  if (filters.excludeTags !== undefined && filters.excludeTags.length > 0) {
    const excludeTags = filters.excludeTags;
    filteredResults = filteredResults.filter((result) => {
      const resultTags = result.metadata.tags;
      if (resultTags === undefined) {
        return true;
      }
      return !excludeTags.some((tag) => resultTags.includes(tag));
    });
  }

  // Apply excludeRequestId filter
  if (filters.excludeRequestId !== undefined && filters.excludeRequestId !== '') {
    const excludeRequestId = filters.excludeRequestId;
    filteredResults = filteredResults.filter((result) => {
      const resultRequestId = result.metadata.requestId;
      if (resultRequestId === undefined) {
        return true;
      }
      // Exclude the request and all its sidechains
      return !resultRequestId.startsWith(excludeRequestId);
    });
  }

  return filteredResults;
}

/**
 * Create a zero vector for placeholder searches
 */
export function createZeroVector(): number[] {
  return new Array(768).fill(0) as number[];
}

/**
 * Handle vector_upsert_context tool
 */
export async function handleVectorUpsertContext(params: {
  params: unknown;
  qdrantClient: QdrantClientAdapter;
}): Promise<VectorUpsertContextResult> {
  const { params: toolParams, qdrantClient } = params;
  const { messageId, parentRequestId, payload, requestId, rootRequestId, vector } =
    toolParams as VectorUpsertContextParams;

  // Validate vector dimensions (768 for nomic-embed-text)
  if (vector.length !== 768) {
    throw new Error(`Invalid vector dimensions: expected 768, got ${String(vector.length)}`);
  }

  // Build metadata for Qdrant point
  const metadata = {
    agentType: payload.agentType,
    channelId: payload.channelId,
    containerInstanceId: payload.containerInstanceId,
    embeddedText: payload.embeddedText,
    intentCategory: payload.intentCategory,
    parentRequestId,
    processingTimeMs: payload.processingTimeMs,
    requestId,
    role: payload.role,
    rootRequestId,
    sessionId: payload.sessionId,
    tags: payload.tags,
    timestamp: payload.timestamp,
    userId: payload.userId,
    userFeedback: payload.userFeedback,
  };

  // Upsert to Qdrant
  await qdrantClient.upsert([
    {
      content: payload.content,
      id: messageId,
      metadata,
      vector,
    },
  ]);

  return {
    messageId,
    success: true,
  };
}

/**
 * Handle vector_search_context tool
 */
export async function handleVectorSearchContext(params: {
  params: unknown;
  qdrantClient: QdrantClientAdapter;
}): Promise<VectorSearchContextResult> {
  const { params: toolParams, qdrantClient } = params;
  const { filters, limit, queryVector, userId } = toolParams as VectorSearchContextParams;

  // Validate vector dimensions (768 for nomic-embed-text)
  if (queryVector.length !== 768) {
    throw new Error(
      `Invalid query vector dimensions: expected 768, got ${String(queryVector.length)}`
    );
  }

  // Build Qdrant filters
  const qdrantFilters = buildQdrantFilters({ filters, userId });

  // Use the provided query vector for semantic search
  const results = await qdrantClient.search({
    collection: 'conversation-history',
    filters: qdrantFilters,
    limit: limit ?? 10,
    vector: queryVector,
  });

  // Apply exclude filters
  const filteredResults = applyExcludeFilters({ filters, results });

  return {
    count: filteredResults.length,
    results: filteredResults.map((result) => ({
      id: result.id,
      payload: result.metadata as unknown as ContextPayload,
      score: result.score,
    })),
  };
}

/**
 * Handle get_request_context tool
 */
export async function handleGetRequestContext(params: {
  params: unknown;
  qdrantClient: QdrantClientAdapter;
}): Promise<GetRequestContextResult> {
  const { params: toolParams, qdrantClient } = params;
  const { includeParent, includeSidechains, requestId } =
    toolParams as GetRequestContextParams;

  // Get current request messages
  const currentResults = await qdrantClient.search({
    collection: 'conversation-history',
    filters: { requestId },
    limit: 1000, // High limit to get all messages
    vector: createZeroVector(),
  });

  const result: GetRequestContextResult = {
    count: currentResults.length,
    current: currentResults.map((r) => ({
      id: r.id,
      payload: r.metadata as unknown as ContextPayload,
      score: r.score,
    })),
  };

  // Get parent request if requested
  if (includeParent && requestId.includes('.')) {
    const parentRequestId = requestId.split('.').slice(0, -1).join('.');
    const parentResults = await qdrantClient.search({
      collection: 'conversation-history',
      filters: { requestId: parentRequestId },
      limit: 1000,
      vector: createZeroVector(),
    });

    result.parent = parentResults.map((r) => ({
      id: r.id,
      payload: r.metadata as unknown as ContextPayload,
      score: r.score,
    }));
  }

  // Get sidechains if requested
  if (includeSidechains) {
    // Sidechains are requests that start with current requestId + "."
    // We'll need to search and filter
    // This is a simplified approach; for production, we'd use Qdrant's prefix matching
    const allResults = await qdrantClient.search({
      collection: 'conversation-history',
      filters: {}, // Get all from session
      limit: 10000,
      vector: createZeroVector(),
    });

    const sidechainPrefix = `${requestId}.`;
    const sidechainResults = (allResults as SearchResult[]).filter((r) => {
      const resultRequestId = r.metadata.requestId;
      if (resultRequestId === undefined) {
        return false;
      }
      return resultRequestId.startsWith(sidechainPrefix);
    });

    result.sidechains = sidechainResults.map((r) => ({
      id: r.id,
      payload: r.metadata as unknown as ContextPayload,
      score: r.score,
    }));
  }

  return result;
}

/**
 * Handle list_collections tool
 */
export async function handleListCollections(params: {
  params: unknown;
  qdrantClient: QdrantClientAdapter;
}): Promise<ListCollectionsResult> {
  const { params: toolParams, qdrantClient } = params;
  const { includeMetadata } = toolParams as ListCollectionsParams;

  // Call QdrantClientAdapter method
  const collections = await qdrantClient.listCollectionsWithMetadata({
    includeMetadata: includeMetadata ?? false,
  });

  return {
    collections: collections.map((c) => {
      const collectionInfo: {
        description?: string;
        distance: string;
        name: string;
        pointCount: number;
        status: string;
        tags?: string[];
        vectorDimensions: number;
      } = {
        distance: c.distance,
        name: c.name,
        pointCount: c.pointCount,
        status: c.status,
        vectorDimensions: c.vectorDimensions,
      };

      if (c.description !== undefined) {
        collectionInfo.description = c.description;
      }

      if (c.tags !== undefined) {
        collectionInfo.tags = c.tags;
      }

      return collectionInfo;
    }),
    count: collections.length,
  };
}

/**
 * Handle search_in_collection tool
 */
export async function handleSearchInCollection(params: {
  params: unknown;
  qdrantClient: QdrantClientAdapter;
}): Promise<SearchInCollectionResult> {
  const { params: toolParams, qdrantClient } = params;
  const { collectionName, filters, limit, queryVector, scoreThreshold } =
    toolParams as SearchInCollectionParams;

  // Validate vector dimensions (768 for nomic-embed-text)
  if (queryVector.length !== 768) {
    throw new Error(
      `Invalid query vector dimensions: expected 768, got ${String(queryVector.length)}`
    );
  }

  // Call QdrantClientAdapter method - build params with proper optional handling
  const searchParams: {
    collectionName: string;
    filters?: Record<string, unknown>;
    limit?: number;
    scoreThreshold?: number;
    vector: number[];
  } = {
    collectionName,
    limit: limit ?? 10,
    vector: queryVector,
  };

  if (filters !== undefined) {
    searchParams.filters = filters;
  }

  if (scoreThreshold !== undefined) {
    searchParams.scoreThreshold = scoreThreshold;
  }

  const results = await qdrantClient.searchInCollection(searchParams);

  return {
    collectionName,
    count: results.length,
    results: results.map((result): CollectionSearchResult => ({
      content: result.content,
      id: result.id,
      metadata: result.metadata,
      score: result.score,
    })),
  };
}
