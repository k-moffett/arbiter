/**
 * MCPClient Implementation
 *
 * HTTP client for calling MCP server tools from agent containers.
 * Provides typed wrappers around context tools.
 */

import type {
  ContextPayload,
  ContextSearchFilters,
  GetRequestContextResult,
  MCPClient,
  MCPClientConfig,
  MCPToolCallRequest,
  MCPToolCallResponse,
  VectorSearchContextResult,
  VectorUpsertContextResult,
} from './interfaces';

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
      // MCP server uses JSON-RPC protocol at /mcp endpoint
      const jsonrpcRequest = {
        id: Date.now(),
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          arguments: request.arguments,
          name: request.name,
        },
      };

      const response = await fetch(`${this.baseUrl}/mcp`, {
        body: JSON.stringify(jsonrpcRequest),
        headers: {
          /* eslint-disable @typescript-eslint/naming-convention */
          'Content-Type': 'application/json',
          /* eslint-enable @typescript-eslint/naming-convention */
        },
        method: 'POST',
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        return {
          error: `HTTP ${String(response.status)}: ${errorText}`,
          success: false,
        };
      }

      // Parse JSON-RPC response
      const jsonrpcResponse = (await response.json()) as {
        id: number;
        jsonrpc: string;
        result?: { content: Array<{ text: string; type: string }>; isError?: boolean };
        error?: { code: number; data?: unknown; message: string };
      };

      // Check for JSON-RPC error
      if (jsonrpcResponse.error !== undefined) {
        return {
          error: jsonrpcResponse.error.message,
          success: false,
        };
      }

      // Check for tool execution error
      if (jsonrpcResponse.result?.isError === true) {
        const errorContent = jsonrpcResponse.result.content[0];
        return {
          error: errorContent?.text ?? 'Tool execution failed',
          success: false,
        };
      }

      // Extract result from JSON-RPC response
      const resultContent = jsonrpcResponse.result?.content[0];
      if (resultContent === undefined || resultContent.type !== 'text') {
        return {
          error: 'Invalid tool response format',
          success: false,
        };
      }

      // Parse the text content as JSON
      const toolResult = JSON.parse(resultContent.text) as T;
      return {
        result: toolResult,
        success: true,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          error: `Tool call timed out after ${String(this.timeout)}ms`,
          success: false,
        };
      }

      return {
        error: error instanceof Error ? error.message : String(error),
        success: false,
      };
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
   * Search conversation history semantically
   */
  public async searchContext(params: {
    filters?: ContextSearchFilters;
    limit?: number;
    query: string;
    sessionId: string;
  }): Promise<VectorSearchContextResult> {
    const response = await this.callTool<VectorSearchContextResult>({
      arguments: {
        filters: params.filters,
        limit: params.limit,
        query: params.query,
        sessionId: params.sessionId,
      },
      name: 'vector_search_context',
    });

    if (!response.success || response.result === undefined) {
      throw new Error(`vector_search_context failed: ${response.error ?? 'Unknown error'}`);
    }

    return response.result;
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
}
