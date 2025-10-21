/**
 * MCPServer Interfaces
 *
 * Interface definitions for MCP Server.
 */

import type { MCPServerConfig } from './types';

/**
 * MCP Server interface
 */
export interface MCPServer {
  /**
   * Health check
   */
  health(): { status: 'ok'; uptime: number };

  /**
   * Start the server
   */
  start(config: MCPServerConfig): Promise<void>;

  /**
   * Stop the server
   */
  stop(): void;
}
