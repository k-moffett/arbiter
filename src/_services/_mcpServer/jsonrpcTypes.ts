/**
 * JSON-RPC 2.0 Protocol Types
 *
 * Shared types for JSON-RPC 2.0 protocol used across MCP server components.
 */

/**
 * JSON-RPC 2.0 Request
 */
export interface JSONRPCRequest {
  id: string | number;
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

/**
 * JSON-RPC 2.0 Response
 */
export interface JSONRPCResponse {
  error?: JSONRPCError;
  id: string | number;
  jsonrpc: '2.0';
  result?: unknown;
}

/**
 * JSON-RPC 2.0 Error
 */
export interface JSONRPCError {
  code: number;
  data?: unknown;
  message: string;
}
