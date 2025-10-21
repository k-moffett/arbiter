/**
 * MCP Server Type Definitions
 *
 * Re-exports all types from shared types and component types.
 * This file provides backward compatibility during migration.
 */

// JSON-RPC protocol types
export type {
  JSONRPCError,
  JSONRPCRequest,
  JSONRPCResponse,
} from './jsonrpcTypes';

// Component types
export type { MCPServerConfig } from './MCPServer/types';

// Session types
export type {
  RequestState,
  Session,
  SessionMetadata,
  TransportType,
} from './sessionTypes';
