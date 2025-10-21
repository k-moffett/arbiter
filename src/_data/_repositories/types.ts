/**
 * Data Repository Type Definitions
 *
 * Type definitions for data layer abstractions (DAO pattern).
 */

/**
 * Vector document
 */
export interface VectorDocument {
  content: string;
  id: string;
  metadata: Record<string, unknown>;
  vector: number[];
}

/**
 * Search query
 */
export interface SearchQuery {
  collection: string;
  filters?: Record<string, unknown>;
  limit?: number;
  query?: string;
  vector?: number[];
}

/**
 * Search result
 */
export interface SearchResult {
  content: string;
  id: string;
  metadata: Record<string, unknown>;
  score: number;
}

/**
 * Context message
 */
export interface ContextMessage {
  content: string;
  id: string;
  metadata?: Record<string, unknown>;
  role: 'user' | 'assistant' | 'system';
  sessionId: string;
  timestamp: Date;
}

/**
 * Context query
 */
export interface ContextQuery {
  limit?: number;
  sessionId: string;
  since?: Date;
}
