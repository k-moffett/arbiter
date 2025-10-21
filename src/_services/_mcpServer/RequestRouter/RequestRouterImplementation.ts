/**
 * RequestRouter Implementation
 *
 * Routes JSON-RPC requests to appropriate tool/resource handlers.
 * Manages tool and resource registration.
 */

import type { JSONRPCRequest, JSONRPCResponse } from '../_sharedTypes';
import type {
  RegisterResourceParams,
  RegisterToolParams,
  RequestRouter,
  ResourceHandler,
  RouteParams,
  ToolHandler,
} from './interfaces';

/**
 * Request Router Implementation
 *
 * @example
 * ```typescript
 * const router = new RequestRouterImplementation();
 *
 * router.registerTool({
 *   name: 'vector_upsert_context',
 *   handler: async (params) => {
 *     // Handle tool call
 *     return { success: true };
 *   }
 * });
 *
 * const response = await router.route({
 *   session,
 *   request
 * });
 * ```
 */
export class RequestRouterImplementation implements RequestRouter {
  private readonly resourceHandlers: Map<string, ResourceHandler> = new Map();
  private readonly toolHandlers: Map<string, ToolHandler> = new Map();

  /**
   * Register resource handler
   */
  public registerResource(params: RegisterResourceParams): void {
    this.resourceHandlers.set(params.name, params.handler);
  }

  /**
   * Register tool handler
   */
  public registerTool(params: RegisterToolParams): void {
    this.toolHandlers.set(params.name, params.handler);
  }

  /**
   * Route request to appropriate handler
   */
  public async route(params: RouteParams): Promise<JSONRPCResponse> {
    const { request } = params;

    try {
      // Handle tools/call method
      if (request.method === 'tools/call') {
        return await this.handleToolCall(request);
      }

      // Handle tools/list method
      if (request.method === 'tools/list') {
        return this.handleToolsList(request);
      }

      // Handle resources methods
      if (request.method.startsWith('resources/')) {
        return await this.handleResourceCall(request);
      }

      // Handle initialization
      if (request.method === 'initialize') {
        return this.handleInitialize(request);
      }

      // Unknown method
      return {
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`,
        },
        id: request.id,
        jsonrpc: '2.0',
      };
    } catch (error) {
      return {
        error: {
          code: -32603,
          data: error instanceof Error ? error.stack : undefined,
          message: error instanceof Error ? error.message : String(error),
        },
        id: request.id,
        jsonrpc: '2.0',
      };
    }
  }

  /**
   * Handle initialize request
   */
  private handleInitialize(request: JSONRPCRequest): JSONRPCResponse {
    return {
      id: request.id,
      jsonrpc: '2.0',
      result: {
        capabilities: {
          resources: {},
          tools: {},
        },
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'arbiter-mcp-server',
          version: '1.0.0',
        },
      },
    };
  }

  /**
   * Handle resource call request
   */
  private async handleResourceCall(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse> {
    // Extract resource name from method (e.g., "resources/read" -> "read")
    const resourceName = request.method.replace('resources/', '');
    const handler = this.resourceHandlers.get(resourceName);

    if (handler === undefined) {
      return {
        error: {
          code: -32601,
          message: `Resource not found: ${resourceName}`,
        },
        id: request.id,
        jsonrpc: '2.0',
      };
    }

    const result = await handler(request.params);

    return {
      id: request.id,
      jsonrpc: '2.0',
      result,
    };
  }

  /**
   * Handle tool call request
   */
  private async handleToolCall(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const params = request.params as { arguments: unknown; name: string } | undefined;

    if (params?.name === undefined) {
      return {
        error: {
          code: -32602,
          message: 'Invalid params: missing tool name',
        },
        id: request.id,
        jsonrpc: '2.0',
      };
    }

    const handler = this.toolHandlers.get(params.name);

    if (handler === undefined) {
      return {
        error: {
          code: -32601,
          message: `Tool not found: ${params.name}`,
        },
        id: request.id,
        jsonrpc: '2.0',
      };
    }

    try {
      const result = await handler(params.arguments);

      return {
        id: request.id,
        jsonrpc: '2.0',
        result: {
          result,
          success: true,
        },
      };
    } catch (error) {
      return {
        id: request.id,
        jsonrpc: '2.0',
        result: {
          error: error instanceof Error ? error.message : String(error),
          success: false,
        },
      };
    }
  }

  /**
   * Handle tools list request
   */
  private handleToolsList(request: JSONRPCRequest): JSONRPCResponse {
    const tools = Array.from(this.toolHandlers.keys()).map((name) => ({
      description: `Tool: ${name}`,
      name,
    }));

    return {
      id: request.id,
      jsonrpc: '2.0',
      result: {
        tools,
      },
    };
  }
}
