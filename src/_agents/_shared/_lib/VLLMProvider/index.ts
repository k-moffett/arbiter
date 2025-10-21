/**
 * VLLMProvider
 *
 * LLM provider for vLLM server (OpenAI-compatible API).
 *
 * @example
 * ```typescript
 * import { VLLMProvider } from '@agents/_shared/_lib/VLLMProvider';
 *
 * const provider = new VLLMProvider({
 *   baseUrl: process.env.VLLM_BASE_URL || 'http://localhost:8000',
 *   model: 'microsoft/phi-4',
 *   temperature: 0.7,
 *   maxTokens: 2048
 * });
 *
 * const response = await provider.complete({
 *   prompt: 'Explain TypeScript in 3 sentences',
 *   temperature: 0.7
 * });
 *
 * console.log(response.text);
 * ```
 */

export { VLLMProviderImplementation as VLLMProvider } from './VLLMProviderImplementation';
// Barrel exports
export type * from './vllmTypes';
