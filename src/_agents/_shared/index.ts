/**
 * Agent Shared Utilities
 *
 * Shared code for all agent implementations.
 * Includes base classes, LLM provider abstraction, and data service client.
 *
 * @example
 * ```typescript
 * import { BaseAgent, LLMProvider } from '@agents/_shared';
 *
 * export class QueryAgent extends BaseAgent {
 *   async execute(task: AgentTaskParams): Promise<AgentExecutionResult> {
 *     // Agent logic here
 *   }
 * }
 * ```
 */

// LLM Providers
export { OllamaProvider } from './_lib/OllamaProvider';
export { VLLMProvider } from './_lib/VLLMProvider';

// Barrel exports
export * from './interfaces';
export * from './types';

// TODO: Export additional implementations when ready
// export { BaseAgentImplementation as BaseAgent } from './lib/BaseAgent';
// export { AnthropicProvider } from './lib/AnthropicProvider';
// export { OpenAIProvider } from './lib/OpenAIProvider';
// export { LLMProviderRegistryImplementation as LLMProviderRegistry } from './lib/LLMProviderRegistry';
// export { DataServiceClientImplementation as DataServiceClient } from './lib/DataServiceClient';
