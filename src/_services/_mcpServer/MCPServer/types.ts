/**
 * MCPServer Types
 *
 * Type definitions for MCP Server configuration.
 */

import type { TransportType } from '../sessionTypes';

/**
 * Server configuration
 */
export interface MCPServerConfig {
  agentOrchestratorURL: string;
  httpPort?: number;
  /** Maximum number of concurrent requests (default: 50) */
  maxConcurrentRequests?: number;
  maxSessions?: number;
  /** Qdrant API key for authentication (optional) */
  qdrantApiKey?: string;
  /** Qdrant server URL */
  qdrantUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  requestTimeout?: number;
  transports: TransportType[];
}
