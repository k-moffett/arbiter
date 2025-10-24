/**
 * MCPClient Implementation
 *
 * HTTP client for calling MCP server tools from agent containers.
 * Provides typed wrappers around context tools.
 */

import type {
  CollectionSearchResult,
  ContextPayload,
  ContextSearchFilters,
  GetRequestContextResult,
  ListCollectionsResult,
  MCPClient,
  MCPClientConfig,
  MCPToolCallRequest,
  MCPToolCallResponse,
  VectorSearchContextResult,
  VectorUpsertContextResult,
} from './interfaces';

/**
 * JSON-RPC response from MCP server
 */
interface JsonRpcResponse {
  error?: { code: number; data?: unknown; message: string };
  id: number;
  jsonrpc: string;
  result?: { content: Array<{ text: string; type: string }>; isError?: boolean };
}

/**
 * MCP Client Implementation
 *
 * @example
 * ```typescript
 * const client = new MCPClientImplementation({
 *   baseUrl: process.env.MCP_SERVER_URL || 'http://mcp-server:3100'
 * });
 *
 * // Search context
 * const results = await client.searchContext({
 *   query: 'How does Feel No Pain work?',
 *   sessionId: 'sess_1',
 *   filters: { userFeedback: 'success' }
 * });
 * ```
 */
export class MCPClientImplementation implements MCPClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: MCPClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout ?? 30000; // 30 second default
  }

  /**
   * Call generic MCP tool
   */
  public async callTool<T = unknown>(
    request: MCPToolCallRequest
  ): Promise<MCPToolCallResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.timeout);

    try {
      const jsonrpcRequest = this.buildJsonRpcRequest({ request });
      const response = await this.sendJsonRpcRequest({ controller, jsonrpcRequest });
      const httpResult = await this.handleHttpResponse({ response });

      if (!httpResult.success || httpResult.data === undefined) {
        return {
          error: httpResult.error ?? 'No data in response',
          success: false,
        };
      }

      const jsonrpcResponse = httpResult.data;
      const errorCheck = this.checkJsonRpcErrors({ jsonrpcResponse });

      if (!errorCheck.success) {
        return {
          error: errorCheck.error ?? 'Unknown error',
          success: false,
        };
      }

      return this.extractToolResult<T>({ jsonrpcResponse });
    } catch (error) {
      return this.handleCallToolError({ error });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get all messages for a request chain
   */
  public async getRequestContext(params: {
    includeParent: boolean;
    includeSidechains: boolean;
    requestId: string;
  }): Promise<GetRequestContextResult> {
    const response = await this.callTool<GetRequestContextResult>({
      arguments: {
        includeParent: params.includeParent,
        includeSidechains: params.includeSidechains,
        requestId: params.requestId,
      },
      name: 'get_request_context',
    });

    if (!response.success || response.result === undefined) {
      throw new Error(`get_request_context failed: ${response.error ?? 'Unknown error'}`);
    }

    return response.result;
  }

  /**
   * List all available Qdrant collections with metadata
   */
  public async listCollections(params: {
    includeMetadata: boolean;
  }): Promise<ListCollectionsResult> {
    const response = await this.callTool<ListCollectionsResult>({
      arguments: {
        includeMetadata: params.includeMetadata,
      },
      name: 'list_collections',
    });

    if (!response.success || response.result === undefined) {
      throw new Error(`list_collections failed: ${response.error ?? 'Unknown error'}`);
    }

    return response.result;
  }

  /**
   * Search conversation history semantically
   */
  public async searchContext(params: {
    filters?: ContextSearchFilters;
    limit?: number;
    query?: string;
    queryVector: number[];
    userId: string;
  }): Promise<VectorSearchContextResult> {
    const response = await this.callTool<VectorSearchContextResult>({
      arguments: {
        filters: params.filters,
        limit: params.limit,
        query: params.query,
        queryVector: params.queryVector,
        userId: params.userId,
      },
      name: 'vector_search_context',
    });

    if (!response.success || response.result === undefined) {
      throw new Error(`vector_search_context failed: ${response.error ?? 'Unknown error'}`);
    }

    return response.result;
  }

  /**
   * Search in specific Qdrant collection
   */
  public async searchInCollection(params: {
    collectionName: string;
    filters?: Record<string, unknown>;
    limit?: number;
    queryVector: number[];
    scoreThreshold?: number;
  }): Promise<CollectionSearchResult[]> {
    const response = await this.callTool<{ results: CollectionSearchResult[] }>({
      arguments: {
        collectionName: params.collectionName,
        filters: params.filters,
        limit: params.limit,
        queryVector: params.queryVector,
        scoreThreshold: params.scoreThreshold,
      },
      name: 'search_in_collection',
    });

    if (!response.success || response.result === undefined) {
      throw new Error(`search_in_collection failed: ${response.error ?? 'Unknown error'}`);
    }

    return response.result.results;
  }

  /**
   * Store message embedding in Qdrant
   */
  public async upsertContext(params: {
    agentType: string;
    containerInstanceId: string;
    messageId: string;
    parentRequestId?: string;
    payload: ContextPayload;
    requestId: string;
    rootRequestId: string;
    vector: number[];
  }): Promise<VectorUpsertContextResult> {
    const response = await this.callTool<VectorUpsertContextResult>({
      arguments: {
        agentType: params.agentType,
        containerInstanceId: params.containerInstanceId,
        messageId: params.messageId,
        parentRequestId: params.parentRequestId,
        payload: params.payload,
        requestId: params.requestId,
        rootRequestId: params.rootRequestId,
        vector: params.vector,
      },
      name: 'vector_upsert_context',
    });

    if (!response.success || response.result === undefined) {
      throw new Error(`vector_upsert_context failed: ${response.error ?? 'Unknown error'}`);
    }

    return response.result;
  }

  /**
   * Build JSON-RPC request for MCP tool call
   */
  private buildJsonRpcRequest(params: { request: MCPToolCallRequest }): Record<string, unknown> {
    return {
      id: Date.now(),
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        arguments: params.request.arguments,
        name: params.request.name,
      },
    };
  }

  /**
   * Check JSON-RPC response for errors
   */
  private checkJsonRpcErrors(params: {
    jsonrpcResponse: JsonRpcResponse;
  }): { error?: string; success: boolean } {
    if (params.jsonrpcResponse.error !== undefined) {
      return {
        error: params.jsonrpcResponse.error.message,
        success: false,
      };
    }

    if (params.jsonrpcResponse.result?.isError === true) {
      const errorContent = params.jsonrpcResponse.result.content[0];
      return {
        error: errorContent?.text ?? 'Tool execution failed',
        success: false,
      };
    }

    return { success: true };
  }

  /**
   * Extract tool result from JSON-RPC response
   */
  private extractToolResult<T>(params: {
    jsonrpcResponse: JsonRpcResponse;
  }): MCPToolCallResponse<T> {
    const resultContent = params.jsonrpcResponse.result?.content[0];

    if (resultContent?.type !== 'text') {
      return {
        error: 'Invalid tool response format',
        success: false,
      };
    }

    const toolResult = JSON.parse(resultContent.text) as T;
    return {
      result: toolResult,
      success: true,
    };
  }

  /**
   * Handle errors from callTool method
   */
  private handleCallToolError(params: { error: unknown }): MCPToolCallResponse<never> {
    if (params.error instanceof Error && params.error.name === 'AbortError') {
      return {
        error: `Tool call timed out after ${String(this.timeout)}ms`,
        success: false,
      };
    }

    return {
      error: params.error instanceof Error ? params.error.message : String(params.error),
      success: false,
    };
  }

  /**
   * Handle HTTP response from MCP server
   */
  private async handleHttpResponse(params: {
    response: Response;
  }): Promise<{ data?: JsonRpcResponse; error?: string; success: boolean }> {
    if (!params.response.ok) {
      const errorText = await params.response.text().catch(() => 'Unknown error');
      return {
        error: `HTTP ${String(params.response.status)}: ${errorText}`,
        success: false,
      };
    }

    const jsonrpcResponse = (await params.response.json()) as JsonRpcResponse;
    return {
      data: jsonrpcResponse,
      success: true,
    };
  }

  /**
   * Send JSON-RPC request to MCP server
   */
  private async sendJsonRpcRequest(params: {
    controller: AbortController;
    jsonrpcRequest: Record<string, unknown>;
  }): Promise<Response> {
    return await fetch(`${this.baseUrl}/mcp`, {
      body: JSON.stringify(params.jsonrpcRequest),
      headers: {
        /* eslint-disable @typescript-eslint/naming-convention */
        'Content-Type': 'application/json',
        /* eslint-enable @typescript-eslint/naming-convention */
      },
      method: 'POST',
      signal: params.controller.signal,
    });
  }
}
