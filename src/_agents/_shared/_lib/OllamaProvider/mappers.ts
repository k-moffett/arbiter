/**
 * OllamaProvider DTO Mappers
 *
 * Maps between internal interfaces (camelCase) and external Ollama API types (snake_case).
 * Provides clean boundary between external SDK and internal code.
 */

import type {
  InternalOllamaChatRequest,
  InternalOllamaChatResponse,
  InternalOllamaEmbeddingRequest,
  InternalOllamaEmbeddingResponse,
  InternalOllamaMessage,
  InternalOllamaOptions,
  InternalOllamaVersionResponse,
} from './interfaces';
import type {
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaEmbeddingRequest,
  OllamaEmbeddingResponse,
  OllamaMessage,
  OllamaOptions,
  OllamaVersionResponse,
} from './ollamaTypes';

/**
 * Map internal request to external Ollama API request
 */
export function toExternalChatRequest(internal: InternalOllamaChatRequest): OllamaChatRequest {
  return {
    messages: internal.messages.map(toExternalMessage),
    model: internal.model,
    ...(internal.options !== undefined && { options: toExternalOptions(internal.options) }),
    ...(internal.stream !== undefined && { stream: internal.stream }),
  };
}

/**
 * Map internal message to external message
 */
function toExternalMessage(internal: InternalOllamaMessage): OllamaMessage {
  return {
    content: internal.content,
    role: internal.role,
  };
}

/**
 * Map internal options to external options
 */
function toExternalOptions(internal: InternalOllamaOptions): OllamaOptions {
  /* eslint-disable @typescript-eslint/naming-convention */
  return {
    ...(internal.numPredict !== undefined && { num_predict: internal.numPredict }),
    ...(internal.stop !== undefined && { stop: internal.stop }),
    ...(internal.temperature !== undefined && { temperature: internal.temperature }),
  };
  /* eslint-enable @typescript-eslint/naming-convention */
}

/**
 * Map external Ollama API response to internal response
 */
export function fromExternalChatResponse(external: OllamaChatResponse): InternalOllamaChatResponse {
  return {
    createdAt: external.created_at,
    done: external.done,
    ...(external.eval_count !== undefined && { evalCount: external.eval_count }),
    ...(external.eval_duration !== undefined && { evalDuration: external.eval_duration }),
    message: fromExternalMessage(external.message),
    model: external.model,
    ...(external.prompt_eval_count !== undefined && {
      promptEvalCount: external.prompt_eval_count,
    }),
    ...(external.prompt_eval_duration !== undefined && {
      promptEvalDuration: external.prompt_eval_duration,
    }),
    ...(external.total_duration !== undefined && { totalDuration: external.total_duration }),
  };
}

/**
 * Map external message to internal message
 */
function fromExternalMessage(external: OllamaMessage): InternalOllamaMessage {
  return {
    content: external.content,
    role: external.role,
  };
}

/**
 * Map internal embedding request to external request
 */
export function toExternalEmbeddingRequest(
  internal: InternalOllamaEmbeddingRequest
): OllamaEmbeddingRequest {
  return {
    model: internal.model,
    prompt: internal.prompt,
  };
}

/**
 * Map external embedding response to internal response
 */
export function fromExternalEmbeddingResponse(
  external: OllamaEmbeddingResponse
): InternalOllamaEmbeddingResponse {
  return {
    embedding: external.embedding,
  };
}

/**
 * Map external version response to internal response
 */
export function fromExternalVersionResponse(
  external: OllamaVersionResponse
): InternalOllamaVersionResponse {
  return {
    version: external.version,
  };
}
