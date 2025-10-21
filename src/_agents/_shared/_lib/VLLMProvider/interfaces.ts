/**
 * VLLMProvider Internal Interfaces
 *
 * Internal interface definitions using camelCase naming conventions.
 * These interfaces are used internally by the provider implementation.
 * See mappers.ts for conversion to/from external vLLM API types (vllmTypes.ts).
 */

/**
 * Parameters for fetchWithTimeout utility
 */
export interface FetchWithTimeoutParams {
  /** AbortController for timeout */
  controller: AbortController;
  /** Request options */
  options: RequestInit;
  /** Timeout in milliseconds */
  timeout: number;
  /** URL to fetch */
  url: string;
}

/**
 * Internal vLLM chat completion request
 */
export interface InternalVLLMChatRequest {
  maxTokens?: number;
  messages: InternalVLLMMessage[];
  model: string;
  stop?: string[];
  stream?: boolean;
  temperature?: number;
}

/**
 * Internal vLLM message format
 */
export interface InternalVLLMMessage {
  content: string;
  role: 'assistant' | 'system' | 'user';
}

/**
 * Internal vLLM chat completion response
 */
export interface InternalVLLMChatResponse {
  choices: InternalVLLMChoice[];
  created: number;
  id: string;
  model: string;
  object: 'chat.completion';
  usage: InternalVLLMUsage;
}

/**
 * Internal vLLM choice
 */
export interface InternalVLLMChoice {
  finishReason: 'length' | 'stop';
  index: number;
  message: InternalVLLMMessage;
}

/**
 * Internal vLLM token usage
 */
export interface InternalVLLMUsage {
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
}

/**
 * Internal vLLM health response
 */
export interface InternalVLLMHealthResponse {
  status: 'healthy' | 'unhealthy';
}
