/**
 * Ollama Embedding Service - Public API
 *
 * Generates embeddings using Ollama's nomic-embed-text model.
 */

export { OllamaEmbeddingService } from './OllamaEmbeddingServiceImplementation.js';
export type {
  BatchEmbeddingResult,
  EmbeddingRequest,
  EmbeddingResult,
  HealthCheckResult,
  OllamaEmbeddingConfig,
} from './types.js';
