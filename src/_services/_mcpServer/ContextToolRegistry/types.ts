/**
 * Context Tool Registry Types
 *
 * Type definitions for MCP context tools.
 */

/**
 * Tool: vector_upsert_context
 *
 * Store message embedding in Qdrant conversation-history collection
 */
export interface VectorUpsertContextParams {
  /** Agent type that processed this message */
  agentType: string;
  /** Container instance ID */
  containerInstanceId: string;
  /** Unique message ID */
  messageId: string;
  /** Parent request ID (if sidechain) */
  parentRequestId?: string;
  /** Payload data to store with vector */
  payload: ContextPayload;
  /** Request ID (hierarchical: req_abc123.1.2) */
  requestId: string;
  /** Root request ID (top-level request) */
  rootRequestId: string;
  /** 768-dimensional embedding vector */
  vector: number[];
}

/**
 * Context message payload stored in Qdrant
 */
export interface ContextPayload {
  /** Agent type that created this message */
  agentType: string;
  /** Channel ID (Discord/Slack) */
  channelId: string;
  /** Container instance that processed this */
  containerInstanceId: string;
  /** Message content */
  content: string;
  /** Text that was embedded (enriched with metadata) */
  embeddedText: string;
  /** Intent category (rule_query, unit_lookup, etc.) */
  intentCategory?: string;
  /** Processing time in milliseconds */
  processingTimeMs?: number;
  /** Message role */
  role: 'bot' | 'user';
  /** Session ID */
  sessionId: string;
  /** Message tags */
  tags: string[];
  /** Timestamp (Unix ms) */
  timestamp: number;
  /** User feedback on message quality */
  userFeedback?: 'failure' | 'neutral' | 'success';
  /** User ID */
  userId: string;
}

/**
 * Result from vector upsert operation
 */
export interface VectorUpsertContextResult {
  /** Message ID that was stored */
  messageId: string;
  /** Whether operation succeeded */
  success: boolean;
}

/**
 * Tool: vector_search_context
 *
 * Semantic search in conversation history with filtering
 */
export interface VectorSearchContextParams {
  /** Filters to apply to search */
  filters?: ContextSearchFilters;
  /** Maximum number of results */
  limit?: number;
  /** Search query text */
  query: string;
  /** Session ID to search within */
  sessionId: string;
}

/**
 * Filters for context search
 */
export interface ContextSearchFilters {
  /** Agent type filter */
  agentType?: string;
  /** Exclude this request ID and all its sidechains */
  excludeRequestId?: string;
  /** Exclude messages with these tags */
  excludeTags?: string[];
  /** Only include messages from this request */
  requestId?: string;
  /** Include specific tags (AND logic) */
  tags?: string[];
  /** Filter by user feedback */
  userFeedback?: 'failure' | 'success';
}

/**
 * Single search result
 */
export interface ContextSearchResult {
  /** Message ID */
  id: string;
  /** Context payload */
  payload: ContextPayload;
  /** Similarity score (0-1) */
  score: number;
}

/**
 * Result from vector search operation
 */
export interface VectorSearchContextResult {
  /** Number of results returned */
  count: number;
  /** Search results ordered by relevance */
  results: ContextSearchResult[];
}

/**
 * Tool: get_request_context
 *
 * Retrieve all messages for a specific request chain
 */
export interface GetRequestContextParams {
  /** Whether to include parent request messages */
  includeParent: boolean;
  /** Whether to include sidechain messages */
  includeSidechains: boolean;
  /** Request ID to retrieve */
  requestId: string;
}

/**
 * Result from get request context operation
 */
export interface GetRequestContextResult {
  /** Number of messages in current request */
  count: number;
  /** Messages from current request */
  current: ContextSearchResult[];
  /** Messages from parent request (if requested) */
  parent?: ContextSearchResult[];
  /** Messages from sidechains (if requested) */
  sidechains?: ContextSearchResult[];
}

/**
 * Qdrant filter object type
 */
export interface QdrantFilters {
  [key: string]: unknown;
  agentType?: string;
  requestId?: string;
  sessionId: string;
  tags?: string[];
  userFeedback?: string;
}

/**
 * Search result metadata type
 */
export interface SearchResultMetadata {
  [key: string]: unknown;
  agentType?: string;
  requestId?: string;
  tags?: string[];
}

/**
 * Search result type
 */
export interface SearchResult {
  id: string;
  metadata: SearchResultMetadata;
  score: number;
}
