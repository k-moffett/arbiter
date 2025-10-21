/**
 * MCP Server Type Definitions
 *
 * Type definitions for the Model Context Protocol server.
 * This service acts as the API gateway between clients and the agent orchestrator.
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

/**
 * Session metadata
 */
export interface Session {
  activeRequests: Map<string, RequestState>;
  clientType: 'cli' | 'discord' | 'slack';
  createdAt: Date;
  id: string;
  lastAccessedAt: Date;
  metadata: SessionMetadata;
}

/**
 * Session metadata (client-specific data)
 */
export interface SessionMetadata {
  channelId?: string;
  guildId?: string;
  userId?: string;
}

/**
 * Request state tracking
 */
export interface RequestState {
  requestId: string;
  startedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Transport types
 */
export type TransportType = 'stdio' | 'streamable-http';

/**
 * Server configuration
 */
export interface MCPServerConfig {
  agentOrchestratorURL: string;
  httpPort?: number;
  maxSessions?: number;
  transports: TransportType[];
}
