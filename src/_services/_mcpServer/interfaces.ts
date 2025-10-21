/**
 * MCP Server Interfaces
 *
 * Core interfaces for the MCP server implementation.
 */

import type {
  JSONRPCRequest,
  JSONRPCResponse,
  MCPServerConfig,
  Session,
} from './types';

/**
 * Transport layer interface
 * Handles communication over stdio or HTTP
 */
export interface Transport {
  /**
   * Register request handler
   */
  onRequest(handler: (req: JSONRPCRequest) => Promise<JSONRPCResponse>): void;

  /**
   * Send response to client
   */
  sendResponse(res: JSONRPCResponse): Promise<void>;

  /**
   * Start the transport layer
   */
  start(): Promise<void>;

  /**
   * Stop the transport layer
   */
  stop(): Promise<void>;

  type: 'stdio' | 'streamable-http';
}

/**
 * Session manager interface
 * Manages user/channel sessions
 */
export interface SessionManager {
  /**
   * Destroy session
   */
  destroy(sessionId: string): Promise<void>;

  /**
   * Get existing session
   */
  get(sessionId: string): Session | null;

  /**
   * Get or create session
   */
  getOrCreate(sessionId: string): Session;

  /**
   * List all active sessions
   */
  listActive(): Session[];
}

/**
 * Request router interface
 * Routes JSON-RPC requests to appropriate handlers
 */
export interface RequestRouter {
  /**
   * Register resource handler
   */
  registerResource(name: string, handler: ResourceHandler): void;

  /**
   * Register tool handler
   */
  registerTool(name: string, handler: ToolHandler): void;

  /**
   * Route request to handler
   */
  route(session: Session, request: JSONRPCRequest): Promise<JSONRPCResponse>;
}

/**
 * Tool handler function
 */
export type ToolHandler = (params: unknown) => Promise<unknown>;

/**
 * Resource handler function
 */
export type ResourceHandler = (params: unknown) => Promise<unknown>;

/**
 * MCP Server interface
 */
export interface MCPServer {
  /**
   * Health check
   */
  health(): Promise<{ status: 'ok'; uptime: number }>;

  /**
   * Start the server
   */
  start(config: MCPServerConfig): Promise<void>;

  /**
   * Stop the server
   */
  stop(): Promise<void>;
}
