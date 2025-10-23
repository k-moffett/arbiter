/**
 * Vector Search Tool Adapter Implementation
 *
 * Adapts MCP client's searchContext() to VectorSearchTool interface
 * required by HybridSearchRetriever.
 */

import type {
  ContextSearchFilters,
  VectorSearchContextParams,
  VectorSearchContextResult,
} from '../../../../_services/_mcpServer/ContextToolRegistry/types';
import type { Logger } from '../../../../_shared/_infrastructure';
import type { MCPClient } from '../../../_shared/_lib/MCPClient';
import type { VectorSearchTool } from './types';

/**
 * Vector Search Tool Adapter
 *
 * Wraps MCP client to provide VectorSearchTool interface.
 * Handles error logging and parameter mapping.
 *
 * @example
 * ```typescript
 * const adapter = new VectorSearchToolAdapterImplementation({
 *   mcpClient,
 *   logger
 * });
 *
 * const result = await adapter.execute({
 *   userId: 'user123',
 *   queryVector: [...],
 *   limit: 10,
 *   filters: { sessionId: 'session123' }
 * });
 * // result.results = [...]
 * ```
 */
export class VectorSearchToolAdapterImplementation implements VectorSearchTool {
  private readonly logger: Logger;
  private readonly mcpClient: MCPClient;

  constructor(params: { logger: Logger; mcpClient: MCPClient }) {
    this.mcpClient = params.mcpClient;
    this.logger = params.logger;
  }

  /**
   * Execute vector search via MCP client
   */
  public async execute(
    params: VectorSearchContextParams
  ): Promise<VectorSearchContextResult> {
    const startTime = Date.now();

    this.logger.debug({
      message: 'Executing vector search',
      metadata: {
        limit: params.limit,
        userId: params.userId,
        vectorLength: params.queryVector.length,
      },
    });

    try {
      // Build search params conditionally to satisfy exactOptionalPropertyTypes
      const searchParams: {
        filters?: ContextSearchFilters;
        limit: number;
        query?: string;
        queryVector: number[];
        userId: string;
      } = {
        limit: params.limit ?? 10,
        queryVector: params.queryVector,
        userId: params.userId,
      };

      // Only add optional properties if defined
      if (params.filters !== undefined) {
        searchParams.filters = params.filters;
      }
      if (params.query !== undefined) {
        searchParams.query = params.query;
      }

      // Call MCP client searchContext
      const result = await this.mcpClient.searchContext(searchParams);

      const duration = Date.now() - startTime;

      this.logger.debug({
        message: 'Vector search complete',
        metadata: {
          duration,
          resultsCount: result.count,
        },
      });

      return result;
    } catch (error) {
      this.logger.error({
        message: 'Vector search failed',
        metadata: {
          error,
          userId: params.userId,
        },
      });
      throw error;
    }
  }
}
