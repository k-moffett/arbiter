/**
 * VLLMProvider Types
 *
 * External API type definitions for vLLM server (OpenAI-compatible).
 * These types match the vLLM API exactly (snake_case naming).
 * For internal use, see internalTypes.ts and mappers.ts.
 */

/* eslint-disable @typescript-eslint/naming-convention */
// External API uses snake_case - we can't change it

/**
 * vLLM provider configuration
 */
export interface VLLMConfig {
  /**
   * API key (if required)
   */
  apiKey?: string;

  /**
   * Base URL for vLLM server
   * @example "http://vllm:8000" (Docker) or "http://localhost:8000" (local)
   */
  baseUrl: string;

  /**
   * Default max tokens for completions
   * @default 2048
   */
  maxTokens?: number;

  /**
   * Model identifier
   * @example "microsoft/phi-4"
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
 * vLLM chat completion request (OpenAI-compatible)
 */
export interface VLLMChatRequest {
  max_tokens?: number;
  messages: VLLMMessage[];
  model: string;
  stop?: string[];
  stream?: boolean;
  temperature?: number;
}

/**
 * vLLM message format
 */
export interface VLLMMessage {
  content: string;
  role: 'assistant' | 'system' | 'user';
}

/**
 * vLLM chat completion response
 */
export interface VLLMChatResponse {
  choices: VLLMChoice[];
  created: number;
  id: string;
  model: string;
  object: 'chat.completion';
  usage: VLLMUsage;
}

/**
 * vLLM choice
 */
export interface VLLMChoice {
  finish_reason: 'length' | 'stop';
  index: number;
  message: VLLMMessage;
}

/**
 * vLLM token usage
 */
export interface VLLMUsage {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
}

/**
 * vLLM health response
 */
export interface VLLMHealthResponse {
  status: 'healthy' | 'unhealthy';
}

/**
 * vLLM models response
 */
export interface VLLMModelsResponse {
  data: VLLMModelInfo[];
  object: 'list';
}

/**
 * vLLM model information
 */
export interface VLLMModelInfo {
  created: number;
  id: string;
  object: 'model';
  owned_by: string;
}
