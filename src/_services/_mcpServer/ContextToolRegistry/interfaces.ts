/**
 * Context Tool Registry Interfaces
 *
 * Interface definitions for Context Tool Registry.
 */

import type { QdrantClientAdapter } from '../../../_data/_repositories/QdrantClientAdapter';
import type {
  GetRequestContextResult,
  ListCollectionsResult,
  SearchInCollectionResult,
  VectorSearchContextResult,
  VectorUpsertContextResult,
} from './types';

/**
 * Context tool registry interface
 * Manages context tool definitions and handlers
 */
export interface ContextToolRegistry {
  /**
   * Create tool handlers with Qdrant client dependency
   */
  createHandlers(): ContextToolHandlers;

  /**
   * Get tool definitions for MCP registration
   */
  getToolDefinitions(): ContextToolDefinition[];
}

/**
 * Context tool handlers return type
 */
export interface ContextToolHandlers {
  handleGetRequestContext(params: unknown): Promise<GetRequestContextResult>;
  handleListCollections(params: unknown): Promise<ListCollectionsResult>;
  handleSearchInCollection(params: unknown): Promise<SearchInCollectionResult>;
  handleVectorSearchContext(params: unknown): Promise<VectorSearchContextResult>;
  handleVectorUpsertContext(params: unknown): Promise<VectorUpsertContextResult>;
}

/**
 * Handler dependencies
 */
export interface ContextToolHandlerDependencies {
  /** Qdrant client for vector operations */
  qdrantClient: QdrantClientAdapter;
}

/**
 * MCP tool registry entry for context tools
 */
export interface ContextToolDefinition {
  description: string;
  inputSchema: Record<string, unknown>;
  name: string;
}
