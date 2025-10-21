/**
 * Data Repository Interfaces (DAO Pattern)
 *
 * Abstract repository interfaces for database operations.
 * Concrete implementations in _implementations/ directory.
 */

import type {
  ContextMessage,
  ContextQuery,
  SearchQuery,
  SearchResult,
  VectorDocument,
} from './types';

/**
 * Vector Repository interface
 *
 * Abstract interface for vector database operations.
 * Implementations: QdrantAdapter, PineconeAdapter (future), etc.
 */
export interface VectorRepository {
  /**
   * Create collection
   */
  createCollection(params: {
    dimensions: number;
    name: string;
  }): Promise<void>;

  /**
   * Delete vectors by IDs
   */
  delete(ids: string[]): Promise<void>;

  /**
   * Delete collection
   */
  deleteCollection(name: string): Promise<void>;

  /**
   * Search vectors
   */
  search(query: SearchQuery): Promise<SearchResult[]>;

  /**
   * Upsert vector documents
   */
  upsert(documents: VectorDocument[]): Promise<void>;
}

/**
 * Context Repository interface
 *
 * Abstract interface for context storage operations.
 * Implementations: JSONLStore, MongoDBStore (future), etc.
 */
export interface ContextRepository {
  /**
   * Delete session context
   */
  deleteSession(sessionId: string): Promise<void>;

  /**
   * Get recent messages
   */
  getRecent(params: {
    limit: number;
    sessionId: string;
  }): Promise<ContextMessage[]>;

  /**
   * Query messages
   */
  query(query: ContextQuery): Promise<ContextMessage[]>;

  /**
   * Save message
   */
  save(message: ContextMessage): Promise<void>;
}

/**
 * Embedding Service interface
 *
 * Abstract interface for embedding generation.
 * Implementations: OllamaEmbeddingService, OpenAIEmbeddingService (future), etc.
 */
export interface EmbeddingService {
  /**
   * Generate embedding vector
   */
  embed(text: string): Promise<number[]>;

  /**
   * Generate batch embeddings
   */
  embedBatch(texts: string[]): Promise<number[][]>;

  /**
   * Get embedding dimensions
   */
  getDimensions(): number;
}
