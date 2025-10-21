/**
 * VLLMProvider Implementation
 *
 * LLM provider implementation for vLLM server (OpenAI-compatible API).
 * Optimized for RTX 4070 12GB VRAM with Phi-4 14B model.
 */

import type { CompletionParams, EmbedParams, LLMProvider, LLMResponse } from '../../interfaces';
import type {
  InternalVLLMChatRequest,
  InternalVLLMHealthResponse,
  InternalVLLMMessage,
} from './interfaces';
import type { VLLMChatResponse, VLLMConfig, VLLMHealthResponse } from './vllmTypes';

import {
  fromExternalChatResponse,
  fromExternalHealthResponse,
  toExternalChatRequest,
} from './mappers';
import { fetchWithTimeout } from './utils';

/**
 * vLLM Provider Implementation
 *
 * Connects to vLLM server for LLM completions.
 * Uses OpenAI-compatible API format.
 *
 * @example
 * ```typescript
 * const provider = new VLLMProviderImplementation({
 *   baseUrl: 'http://vllm:8000',
 *   model: 'microsoft/phi-4'
 * });
 *
 * const response = await provider.complete({
 *   prompt: 'What is TypeScript?',
 *   temperature: 0.7,
 *   maxTokens: 100
 * });
 * ```
 */
/* eslint-disable perfectionist/sort-classes */
export class VLLMProviderImplementation implements LLMProvider {
  public readonly name = 'vllm' as const;

  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly maxTokens: number;
  private readonly model: string;
  private readonly temperature: number;
  private readonly timeout: number;

  constructor(config: VLLMConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.model = config.model;
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 2048;
    this.timeout = config.timeout ?? 30000;
    this.apiKey = config.apiKey ?? undefined;
  }

  /**
   * Generate text completion
   */
  public async complete(params: CompletionParams): Promise<LLMResponse> {
    // Build internal request payload
    const internalRequest: InternalVLLMChatRequest = {
      maxTokens: params.maxTokens ?? this.maxTokens,
      messages: this.buildMessages(params),
      model: this.model,
      ...(params.stopSequences !== undefined && { stop: params.stopSequences }),
      stream: false,
      temperature: params.temperature ?? this.temperature,
    };

    // Convert to external API format
    const externalRequest = toExternalChatRequest(internalRequest);

    try {
      const externalResponse = await fetchWithTimeout<VLLMChatResponse>({
        controller: new AbortController(),
        options: {
          body: JSON.stringify(externalRequest),
          headers: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'Content-Type': 'application/json',
            ...(this.apiKey !== undefined && { Authorization: `Bearer ${this.apiKey}` }),
            /* eslint-enable @typescript-eslint/naming-convention */
          },
          method: 'POST',
        },
        timeout: this.timeout,
        url: `${this.baseUrl}/v1/chat/completions`,
      });

      // Convert to internal format
      const response = fromExternalChatResponse(externalResponse);

      if (response.choices.length === 0) {
        throw new Error('No completion choices returned from vLLM');
      }

      const choice = response.choices[0];
      if (choice === undefined) {
        throw new Error('Invalid response: first choice is undefined');
      }

      return {
        finishReason: choice.finishReason === 'stop' ? 'stop' : 'length',
        text: choice.message.content,
        usage: {
          completionTokens: response.usage.completionTokens,
          promptTokens: response.usage.promptTokens,
          totalTokens: response.usage.totalTokens,
        },
      };
    } catch (error) {
      throw new Error(
        `vLLM completion failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate embeddings
   *
   * Note: vLLM does not support embeddings. Use OllamaProvider for embeddings.
   */
  public embed(_params: EmbedParams): Promise<number[]> {
    throw new Error(
      'vLLM does not support embedding generation. Use OllamaProvider with nomic-embed-text model instead.'
    );
  }

  /**
   * Health check
   */
  public async health(): Promise<boolean> {
    try {
      const externalResponse = await fetchWithTimeout<VLLMHealthResponse>({
        controller: new AbortController(),
        options: {
          method: 'GET',
        },
        timeout: 5000,
        url: `${this.baseUrl}/health`,
      });

      const response: InternalVLLMHealthResponse = fromExternalHealthResponse(externalResponse);
      return response.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Build messages array with optional system prompt
   */
  private buildMessages(params: CompletionParams): InternalVLLMMessage[] {
    const systemMessages =
      params.systemPrompt !== undefined && params.systemPrompt.length > 0 ?
        [{ content: params.systemPrompt, role: 'system' as const }] :
        [];

    return [...systemMessages, { content: params.prompt, role: 'user' as const }];
  }
}
/* eslint-enable perfectionist/sort-classes */
