/**
 * MCPClient Interfaces
 *
 * Client for calling MCP server tools from agent containers.
 */

import type {
  CollectionSearchResult,
  ContextPayload,
  ContextSearchFilters,
  ContextSearchResult,
  GetRequestContextResult,
  ListCollectionsResult,
  SearchInCollectionParams,
  VectorSearchContextResult,
  VectorUpsertContextResult,
} from '../../../../_services/_mcpServer/ContextToolRegistry';

/**
 * MCP Client Configuration
 */
export interface MCPClientConfig {
  /** Base URL of MCP server */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * MCP Tool Call Request
 */
export interface MCPToolCallRequest {
  /** Tool arguments */
  arguments: Record<string, unknown>;
  /** Tool name */
  name: string;
}

/**
 * MCP Tool Call Response
 */
export interface MCPToolCallResponse<T = unknown> {
  /** Error message if failed */
  error?: string;
  /** Tool result */
  result?: T;
  /** Whether call succeeded */
  success: boolean;
}

/**
 * MCP Client Interface
 */
export interface MCPClient {
  /**
   * Call MCP tool
   */
  callTool<T = unknown>(request: MCPToolCallRequest): Promise<MCPToolCallResponse<T>>;

  /**
   * Get all messages for a request chain
   */
  getRequestContext(params: {
    includeParent: boolean;
    includeSidechains: boolean;
    requestId: string;
  }): Promise<GetRequestContextResult>;

  /**
   * List all available Qdrant collections with metadata
   */
  listCollections(params: { includeMetadata: boolean }): Promise<ListCollectionsResult>;

  /**
   * Search conversation history semantically
   */
  searchContext(params: {
    filters?: ContextSearchFilters;
    limit?: number;
    query?: string;
    queryVector: number[];
    userId: string;
  }): Promise<VectorSearchContextResult>;

  /**
   * Search in specific Qdrant collection
   */
  searchInCollection(params: {
    collectionName: string;
    filters?: Record<string, unknown>;
    limit?: number;
    queryVector: number[];
    scoreThreshold?: number;
  }): Promise<CollectionSearchResult[]>;

  /**
   * Store message embedding in Qdrant
   */
  upsertContext(params: {
    agentType: string;
    containerInstanceId: string;
    messageId: string;
    parentRequestId?: string;
    payload: ContextPayload;
    requestId: string;
    rootRequestId: string;
    vector: number[];
  }): Promise<VectorUpsertContextResult>;
}

// Re-export types for convenience
export type {
  CollectionSearchResult,
  ContextPayload,
  ContextSearchFilters,
  ContextSearchResult,
  GetRequestContextResult,
  ListCollectionsResult,
  SearchInCollectionParams,
  VectorSearchContextResult,
  VectorUpsertContextResult,
};
