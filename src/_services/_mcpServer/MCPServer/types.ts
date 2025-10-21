/**
 * MCPServer Types
 *
 * Type definitions for MCP Server configuration.
 */

import type { TransportType } from '../_sharedTypes';

/**
 * Server configuration
 */
export interface MCPServerConfig {
  agentOrchestratorURL: string;
  httpPort?: number;
  maxSessions?: number;
  /** Qdrant API key for authentication (optional) */
  qdrantApiKey?: string;
  /** Qdrant server URL */
  qdrantUrl?: string;
  transports: TransportType[];
}
