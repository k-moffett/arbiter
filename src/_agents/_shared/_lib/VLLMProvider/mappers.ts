/**
 * VLLMProvider DTO Mappers
 *
 * Maps between internal interfaces (camelCase) and external vLLM API types (snake_case).
 * Provides clean boundary between external SDK and internal code.
 */

import type {
  InternalVLLMChatRequest,
  InternalVLLMChatResponse,
  InternalVLLMChoice,
  InternalVLLMHealthResponse,
  InternalVLLMMessage,
  InternalVLLMUsage,
} from './interfaces';
import type {
  VLLMChatRequest,
  VLLMChatResponse,
  VLLMChoice,
  VLLMHealthResponse,
  VLLMMessage,
  VLLMUsage,
} from './vllmTypes';

/**
 * Map internal request to external vLLM API request
 */
export function toExternalChatRequest(internal: InternalVLLMChatRequest): VLLMChatRequest {
  /* eslint-disable @typescript-eslint/naming-convention */
  return {
    ...(internal.maxTokens !== undefined && { max_tokens: internal.maxTokens }),
    messages: internal.messages.map(toExternalMessage),
    model: internal.model,
    ...(internal.stop !== undefined && { stop: internal.stop }),
    ...(internal.stream !== undefined && { stream: internal.stream }),
    ...(internal.temperature !== undefined && { temperature: internal.temperature }),
  };
  /* eslint-enable @typescript-eslint/naming-convention */
}

/**
 * Map internal message to external message
 */
function toExternalMessage(internal: InternalVLLMMessage): VLLMMessage {
  return {
    content: internal.content,
    role: internal.role,
  };
}

/**
 * Map external vLLM API response to internal response
 */
export function fromExternalChatResponse(external: VLLMChatResponse): InternalVLLMChatResponse {
  return {
    choices: external.choices.map(fromExternalChoice),
    created: external.created,
    id: external.id,
    model: external.model,
    object: external.object,
    usage: fromExternalUsage(external.usage),
  };
}

/**
 * Map external choice to internal choice
 */
function fromExternalChoice(external: VLLMChoice): InternalVLLMChoice {
  return {
    finishReason: external.finish_reason,
    index: external.index,
    message: fromExternalMessage(external.message),
  };
}

/**
 * Map external message to internal message
 */
function fromExternalMessage(external: VLLMMessage): InternalVLLMMessage {
  return {
    content: external.content,
    role: external.role,
  };
}

/**
 * Map external usage to internal usage
 */
function fromExternalUsage(external: VLLMUsage): InternalVLLMUsage {
  return {
    completionTokens: external.completion_tokens,
    promptTokens: external.prompt_tokens,
    totalTokens: external.total_tokens,
  };
}

/**
 * Map external health response to internal health response
 */
export function fromExternalHealthResponse(
  external: VLLMHealthResponse
): InternalVLLMHealthResponse {
  return {
    status: external.status,
  };
}
