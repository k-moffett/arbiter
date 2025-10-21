/**
 * MCP Server Interfaces
 *
 * Re-exports interfaces from components and shared types.
 * This file provides backward compatibility while components are being migrated.
 */

import type {
  JSONRPCRequest,
  JSONRPCResponse,
  Session,
} from './_sharedTypes';

// TODO: These interfaces will be moved to their respective class directories
// when Transport and SessionManager implementations are created

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
