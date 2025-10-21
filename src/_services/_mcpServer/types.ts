/**
 * MCP Server Type Definitions
 *
 * Re-exports all types from shared types and component types.
 * This file provides backward compatibility during migration.
 */

// Shared types (JSON-RPC protocol and Session types)
export type {
  JSONRPCError,
  JSONRPCRequest,
  JSONRPCResponse,
  RequestState,
  Session,
  SessionMetadata,
  TransportType,
} from './_sharedTypes';

// Component types
export type { MCPServerConfig } from './MCPServer/types';
