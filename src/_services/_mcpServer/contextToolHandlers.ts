/**
 * Context Tool Handlers
 *
 * Implementation functions for MCP context tools.
 * These handlers are called by the MCP server when agents invoke context tools.
 */

import type { QdrantClientAdapter } from '../../_data/_repositories/QdrantClientAdapter';
import type {
  ContextPayload,
  ContextSearchFilters,
  GetRequestContextParams,
  GetRequestContextResult,
  VectorSearchContextParams,
  VectorSearchContextResult,
  VectorUpsertContextParams,
  VectorUpsertContextResult,
} from './contextTools';

/**
 * Handler dependencies
 */
export interface ContextToolHandlerDependencies {
  /** Qdrant client for vector operations */
  qdrantClient: QdrantClientAdapter;
}

/**
 * Context tool handlers return type
 */
export interface ContextToolHandlers {
  handleGetRequestContext(params: unknown): Promise<GetRequestContextResult>;
  handleVectorSearchContext(params: unknown): Promise<VectorSearchContextResult>;
  handleVectorUpsertContext(params: unknown): Promise<VectorUpsertContextResult>;
}

/**
 * Qdrant filter object type
 */
interface QdrantFilters {
  [key: string]: unknown;
  agentType?: string;
  requestId?: string;
  sessionId: string;
  tags?: string[];
  userFeedback?: string;
}

/**
 * Build Qdrant filters from context search filters
 */
function buildQdrantFilters(params: {
  filters: ContextSearchFilters | undefined;
  sessionId: string;
}): QdrantFilters {
  const { filters, sessionId } = params;
  const qdrantFilters: QdrantFilters = {
    sessionId,
  };

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
 * Search result metadata type
 */
interface SearchResultMetadata {
  [key: string]: unknown;
  agentType?: string;
  requestId?: string;
  tags?: string[];
}

/**
 * Search result type
 */
interface SearchResult {
  id: string;
  metadata: SearchResultMetadata;
  score: number;
}

/**
 * Apply exclude filters to search results
 */
function applyExcludeFilters(params: {
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
function createZeroVector(): number[] {
  return new Array(768).fill(0) as number[];
}

/**
 * Handle vector_upsert_context tool
 */
async function handleVectorUpsertContext(params: {
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
async function handleVectorSearchContext(params: {
  params: unknown;
  qdrantClient: QdrantClientAdapter;
}): Promise<VectorSearchContextResult> {
  const { params: toolParams, qdrantClient } = params;
  const { filters, limit, sessionId } = toolParams as VectorSearchContextParams;

  // Build Qdrant filters
  const qdrantFilters = buildQdrantFilters({ filters, sessionId });

  // For semantic search, we need to generate an embedding for the query
  // This will be handled by the MCP server which has access to the embedding service
  // For now, we'll use a zero vector as placeholder
  // TODO: Integrate with embedding service
  const searchVector = createZeroVector();

  const results = await qdrantClient.search({
    collection: 'conversation-history',
    filters: qdrantFilters,
    limit: limit ?? 10,
    vector: searchVector,
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
async function handleGetRequestContext(params: {
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
 * Create context tool handlers
 */
export function createContextToolHandlers(
  deps: ContextToolHandlerDependencies
): ContextToolHandlers {
  const { qdrantClient } = deps;

  return {
    handleGetRequestContext: async (params: unknown) =>
      handleGetRequestContext({ params, qdrantClient }),
    handleVectorSearchContext: async (params: unknown) =>
      handleVectorSearchContext({ params, qdrantClient }),
    handleVectorUpsertContext: async (params: unknown) =>
      handleVectorUpsertContext({ params, qdrantClient }),
  };
}
