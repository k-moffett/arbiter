/**
 * OllamaProvider
 *
 * LLM provider for Ollama server.
 * Supports completions and embeddings.
 *
 * @example
 * ```typescript
 * import { OllamaProvider } from '@agents/_shared/_lib/OllamaProvider';
 *
 * const provider = new OllamaProvider({
 *   baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
 *   model: 'llama3.1:8b',
 *   embeddingModel: 'nomic-embed-text',
 *   temperature: 0.7
 * });
 *
 * // Generate completion
 * const response = await provider.complete({
 *   prompt: 'Explain dependency injection',
 *   temperature: 0.5
 * });
 *
 * // Generate embedding
 * const embedding = await provider.embed({
 *   text: 'Dependency injection is a design pattern'
 * });
 * ```
 */

export { OllamaProviderImplementation as OllamaProvider } from './OllamaProviderImplementation';
// Barrel exports
export type * from './ollamaTypes';
