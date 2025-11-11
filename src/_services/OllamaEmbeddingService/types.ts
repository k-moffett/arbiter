/**
 * Ollama Embedding Service - Type Definitions
 *
 * Types for generating embeddings using Ollama's nomic-embed-text model.
 */

/**
 * Configuration for Ollama Embedding Service
 */
export interface OllamaEmbeddingConfig {
  /** Ollama base URL (default: http://localhost:11434) */
  baseUrl: string;

  /** Batch size for processing multiple texts (default: 20) */
  batchSize: number;

  /** Cache max size (default: 10000) */
  cacheMaxSize: number;

  /** Cache TTL in milliseconds (default: 86400000 = 24hr) */
  cacheTtl: number;

  /** Enable LRU cache (default: true) */
  enableCache: boolean;

  /** Maximum retry attempts (default: 3) */
  maxRetries: number;

  /** Model name (default: nomic-embed-text) */
  model: string;

  /** Retry delays in milliseconds (default: [100, 500, 2000]) */
  retryDelays: number[];

  /** Request timeout in milliseconds (default: 30000) */
  timeout: number;
}

/**
 * Single embedding request
 */
export interface EmbeddingRequest {
  /** Optional ID for tracking */
  id?: string;

  /** Text to embed */
  text: string;
}

/**
 * Single embedding result
 */
export interface EmbeddingResult {
  /** The embedding vector */
  embedding: number[];

  /** Whether result came from cache */
  fromCache: boolean;

  /** Optional ID from request */
  id?: string;
}

/**
 * Batch embedding result with statistics
 */
export interface BatchEmbeddingResult {
  /** Number of cache hits */
  cacheHits: number;

  /** Number of cache misses */
  cacheMisses: number;

  /** Array of embedding results */
  results: EmbeddingResult[];

  /** Number of retries that occurred */
  retries: number;

  /** Total time in milliseconds */
  totalTimeMs: number;
}

/**
 * Ollama API response for embedding
 */
export interface OllamaEmbeddingResponse {
  /** The embedding vector */
  embedding: number[];
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /** Error message if unhealthy */
  error?: string;

  /** Whether service is healthy */
  healthy: boolean;

  /** Response time in milliseconds */
  responseTimeMs: number;

  /** Ollama version if healthy */
  version?: string;
}
