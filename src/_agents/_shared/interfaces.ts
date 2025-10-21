/**
 * Agent Shared Interfaces
 *
 * Core interfaces for agent implementations.
 */

import type {
  AgentConfig as _AgentConfig,
  AgentExecutionResult,
  AgentTaskParams,
  CompletionParams,
  EmbedParams,
  LLMResponse,
} from './types';

// Re-export types for external use
export type { AgentExecutionResult, AgentTaskParams, CompletionParams, EmbedParams, LLMResponse };

/**
 * LLM Provider interface (Strategy Pattern)
 *
 * All LLM providers must implement this interface.
 */
export interface LLMProvider {
  /**
   * Generate text completion
   */
  complete(params: CompletionParams): Promise<LLMResponse>;

  /**
   * Generate embedding vector
   */
  embed(params: EmbedParams): Promise<number[]>;

  name: 'anthropic' | 'ollama' | 'openai' | 'vllm';

  /**
   * Stream completion (optional)
   */
  stream?(
    params: CompletionParams
  ): AsyncGenerator<string, void, unknown>;
}

/**
 * LLM Provider Registry
 *
 * Manages registered LLM providers and fallback logic.
 */
export interface LLMProviderRegistry {
  /**
   * Execute with fallback support
   */
  executeWithFallback(params: {
    completionParams: CompletionParams;
    fallbackProvider?: string;
    primaryProvider: string;
  }): Promise<LLMResponse>;

  /**
   * Get provider by name
   */
  get(name: string): LLMProvider;

  /**
   * Register provider
   */
  register(provider: LLMProvider): void;
}

/**
 * Base Agent interface
 *
 * All agent types must implement this interface.
 */
export interface BaseAgent {
  /**
   * Execute agent task
   */
  execute(task: AgentTaskParams): Promise<AgentExecutionResult>;

  /**
   * Main entry point (reads task from env, executes, outputs result)
   */
  run(): Promise<void>;
}

/**
 * Data Service Client interface
 *
 * Client for calling Data Service APIs from agents.
 */
export interface DataServiceClient {
  /**
   * Generate embedding
   */
  generateEmbedding(params: { text: string }): Promise<number[]>;

  /**
   * Query context
   */
  queryContext(params: {
    query: string;
    sessionId: string;
  }): Promise<unknown[]>;

  /**
   * Save context
   */
  saveContext(params: { data: unknown; sessionId: string; }): Promise<void>;

  /**
   * Vector search
   */
  vectorSearch(params: {
    collection: string;
    limit?: number;
    query: string;
  }): Promise<unknown[]>;
}
