/**
 * OllamaProvider Internal Interfaces
 *
 * Internal interface definitions using camelCase naming conventions.
 * These interfaces are used internally by the provider implementation.
 * See mappers.ts for conversion to/from external Ollama API types (ollamaTypes.ts).
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
 * Internal Ollama chat request
 */
export interface InternalOllamaChatRequest {
  messages: InternalOllamaMessage[];
  model: string;
  options?: InternalOllamaOptions;
  stream?: boolean;
}

/**
 * Internal Ollama message format
 */
export interface InternalOllamaMessage {
  content: string;
  role: 'assistant' | 'system' | 'user';
}

/**
 * Internal Ollama generation options
 */
export interface InternalOllamaOptions {
  numPredict?: number;
  stop?: string[];
  temperature?: number;
}

/**
 * Internal Ollama chat response
 */
export interface InternalOllamaChatResponse {
  createdAt: string;
  done: boolean;
  evalCount?: number;
  evalDuration?: number;
  message: InternalOllamaMessage;
  model: string;
  promptEvalCount?: number;
  promptEvalDuration?: number;
  totalDuration?: number;
}

/**
 * Internal Ollama embedding request
 */
export interface InternalOllamaEmbeddingRequest {
  model: string;
  prompt: string;
}

/**
 * Internal Ollama embedding response
 */
export interface InternalOllamaEmbeddingResponse {
  embedding: number[];
}

/**
 * Internal Ollama version response
 */
export interface InternalOllamaVersionResponse {
  version: string;
}
