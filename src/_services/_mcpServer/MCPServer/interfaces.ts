/**
 * MCPServer Interfaces
 *
 * Interface definitions for MCP Server.
 */

import type { MCPServerConfig } from './types';

/**
 * Health check response
 */
export interface HealthCheckResponse {
  /** Number of active requests being processed */
  activeRequests: number;
  /** Memory usage information */
  memoryUsage: {
    heapTotal: number;
    heapUsed: number;
  };
  /** Whether Qdrant connection is healthy */
  qdrantConnected: boolean;
  /** Number of queued requests waiting to be processed */
  queuedRequests: number;
  /** Health status */
  status: 'ok';
  /** Server uptime in milliseconds */
  uptime: number;
}

/**
 * MCP Server interface
 */
export interface MCPServer {
  /**
   * Health check with detailed metrics
   */
  health(): HealthCheckResponse;

  /**
   * Start the server
   */
  start(config: MCPServerConfig): Promise<void>;

  /**
   * Stop the server
   */
  stop(): Promise<void>;
}
