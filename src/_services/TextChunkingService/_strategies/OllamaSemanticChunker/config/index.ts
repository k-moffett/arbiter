/**
 * Semantic Chunker Configuration
 *
 * ENV-driven configuration for Ollama-powered semantic chunking.
 */

export { loadSemanticChunkerConfig } from './loader';
export type {
  SemanticChunkerConfig,
  SemanticChunkerModels,
  SemanticChunkerTemperatures,
  SemanticChunkerWeights,
} from './types';
