/**
 * RequestRouter Interfaces
 *
 * Interface definitions for Request Router.
 */

import type { JSONRPCRequest, JSONRPCResponse } from '../jsonrpcTypes';
import type { Session } from '../sessionTypes';

/**
 * Request router interface
 * Routes JSON-RPC requests to appropriate handlers
 */
export interface RequestRouter {
  /**
   * Register resource handler
   */
  registerResource(params: RegisterResourceParams): void;

  /**
   * Register tool handler
   */
  registerTool(params: RegisterToolParams): void;

  /**
   * Route request to handler
   */
  route(params: RouteParams): Promise<JSONRPCResponse>;
}

/**
 * Parameters for registerTool
 */
export interface RegisterToolParams {
  /** Tool handler function */
  handler: ToolHandler;
  /** Tool name */
  name: string;
}

/**
 * Parameters for registerResource
 */
export interface RegisterResourceParams {
  /** Resource handler function */
  handler: ResourceHandler;
  /** Resource name */
  name: string;
}

/**
 * Parameters for route
 */
export interface RouteParams {
  /** JSON-RPC request */
  request: JSONRPCRequest;
  /** Session context */
  session: Session;
}

/**
 * Tool handler function
 */
export type ToolHandler = (params: unknown) => Promise<unknown>;

/**
 * Resource handler function
 */
export type ResourceHandler = (params: unknown) => Promise<unknown>;
