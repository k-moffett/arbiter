/**
 * Context Tool Registry Implementation
 *
 * Manages context tool definitions and creates handlers with Qdrant client dependency.
 */

import type { QdrantClientAdapter } from '../../../_data/_repositories/QdrantClientAdapter';
import type {
  ContextToolDefinition,
  ContextToolHandlerDependencies,
  ContextToolHandlers,
  ContextToolRegistry,
} from './interfaces';

import { CONTEXT_TOOLS } from './consts';
import {
  handleGetRequestContext,
  handleListCollections,
  handleSearchInCollection,
  handleVectorSearchContext,
  handleVectorUpsertContext,
} from './utils';

/**
 * Context Tool Registry Implementation
 *
 * @example
 * ```typescript
 * const registry = new ContextToolRegistryImplementation({
 *   qdrantClient
 * });
 *
 * const tools = registry.getToolDefinitions();
 * const handlers = registry.createHandlers();
 * ```
 */
export class ContextToolRegistryImplementation implements ContextToolRegistry {
  private readonly qdrantClient: QdrantClientAdapter;

  constructor(deps: ContextToolHandlerDependencies) {
    this.qdrantClient = deps.qdrantClient;
  }

  /**
   * Create tool handlers with Qdrant client dependency
   */
  public createHandlers(): ContextToolHandlers {
    return {
      handleGetRequestContext: async (params: unknown) =>
        handleGetRequestContext({ params, qdrantClient: this.qdrantClient }),
      handleListCollections: async (params: unknown) =>
        handleListCollections({ params, qdrantClient: this.qdrantClient }),
      handleSearchInCollection: async (params: unknown) =>
        handleSearchInCollection({ params, qdrantClient: this.qdrantClient }),
      handleVectorSearchContext: async (params: unknown) =>
        handleVectorSearchContext({ params, qdrantClient: this.qdrantClient }),
      handleVectorUpsertContext: async (params: unknown) =>
        handleVectorUpsertContext({ params, qdrantClient: this.qdrantClient }),
    };
  }

  /**
   * Get tool definitions for MCP registration
   */
  public getToolDefinitions(): ContextToolDefinition[] {
    return CONTEXT_TOOLS;
  }
}
