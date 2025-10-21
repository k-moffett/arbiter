/**
 * Session Types
 *
 * Shared types for session management across MCP server components.
 */

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
