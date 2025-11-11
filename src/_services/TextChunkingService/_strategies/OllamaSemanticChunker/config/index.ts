/**
 * Semantic Chunker Configuration
 *
 * ENV-driven configuration for Ollama-powered semantic chunking.
 */

import { SemanticChunkingConfig } from './SemanticChunkingConfigImplementation.js';

export type {
  AdaptiveThresholdConfig,
  SemanticBoundaryWeights,
  SemanticChunkingConfigConstructorParams,
  SemanticChunkingConfigParams,
} from './interfaces.js';
// Existing config exports (legacy)
export { loadSemanticChunkerConfig } from './loader.js';

// New semantic chunking config exports
export { SemanticChunkingConfig };
export type {
  SemanticChunkerConfig,
  SemanticChunkerModels,
  SemanticChunkerTemperatures,
  SemanticChunkerWeights,
} from './types.js';

/**
 * Factory function for creating semantic chunking configuration
 *
 * Provides convenient way to create config instances with optional parameters.
 *
 * @param params - Optional constructor parameters
 * @param params.envFile - Path to ENV file (default: 'env/.env.text-chunking')
 * @param params.overrides - Override specific config values (for testing)
 * @returns Configured SemanticChunkingConfig instance
 *
 * @example
 * ```typescript
 * // Use default ENV file
 * const config = createSemanticChunkingConfig();
 *
 * // Use custom ENV file
 * const config = createSemanticChunkingConfig({
 *   envFile: 'env/.env.text-chunking.test'
 * });
 *
 * // Override specific values (for testing)
 * const config = createSemanticChunkingConfig({
 *   overrides: {
 *     maxChunkSize: 2000,
 *     tagExtractionEnabled: false
 *   }
 * });
 * ```
 */
export function createSemanticChunkingConfig(
  params?: import('./interfaces.js').SemanticChunkingConfigConstructorParams
): SemanticChunkingConfig {
  return new SemanticChunkingConfig(params);
}
