/**
 * OllamaProvider Types
 *
 * External API type definitions for Ollama server.
 * These types match the Ollama API exactly (snake_case naming).
 * For internal use, see internalTypes.ts and mappers.ts.
 */

/* eslint-disable @typescript-eslint/naming-convention */
// External API uses snake_case - we can't change it

/**
 * Ollama provider configuration
 */
export interface OllamaConfig {
  /**
   * Base URL for Ollama server
   * @example "http://ollama:11434" (Docker) or "http://localhost:11434" (local)
   */
  baseUrl: string;

  /**
   * Embedding model identifier
   * @example "nomic-embed-text"
   * @default "nomic-embed-text"
   */
  embeddingModel?: string;

  /**
   * Default max tokens for completions
   * @default 2048
   */
  maxTokens?: number;

  /**
   * Model identifier for completions
   * @example "llama3.1:8b", "phi4:14b-q4_K_M"
   */
  model: string;

  /**
   * Default temperature for completions
   * @default 0.7
   */
  temperature?: number;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;
}

/**
 * Ollama chat request
 */
export interface OllamaChatRequest {
  messages: OllamaMessage[];
  model: string;
  options?: OllamaOptions;
  stream?: boolean;
}

/**
 * Ollama message format
 */
export interface OllamaMessage {
  content: string;
  role: 'assistant' | 'system' | 'user';
}

/**
 * Ollama generation options
 */
export interface OllamaOptions {
  num_predict?: number;
  stop?: string[];
  temperature?: number;
}

/**
 * Ollama chat response
 */
export interface OllamaChatResponse {
  created_at: string;
  done: boolean;
  eval_count?: number;
  eval_duration?: number;
  message: OllamaMessage;
  model: string;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  total_duration?: number;
}

/**
 * Ollama embedding request
 */
export interface OllamaEmbeddingRequest {
  model: string;
  prompt: string;
}

/**
 * Ollama embedding response
 */
export interface OllamaEmbeddingResponse {
  embedding: number[];
}

/**
 * Ollama version response
 */
export interface OllamaVersionResponse {
  version: string;
}

/**
 * Ollama model list response
 */
export interface OllamaModelsResponse {
  models: OllamaModelInfo[];
}

/**
 * Ollama model information
 */
export interface OllamaModelInfo {
  digest: string;
  modified_at: string;
  name: string;
  size: number;
}
