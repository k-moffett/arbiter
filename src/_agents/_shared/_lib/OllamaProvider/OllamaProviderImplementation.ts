/**
 * OllamaProvider Implementation
 *
 * LLM provider implementation for Ollama server.
 * Supports both completions and embeddings.
 */

import type { CompletionParams, EmbedParams, LLMProvider, LLMResponse } from '../../interfaces';
import type {
  InternalOllamaChatRequest,
  InternalOllamaEmbeddingRequest,
  InternalOllamaMessage,
  InternalOllamaVersionResponse,
} from './interfaces';
import type {
  OllamaChatResponse,
  OllamaConfig,
  OllamaEmbeddingResponse,
  OllamaVersionResponse,
} from './ollamaTypes';

import {
  fromExternalChatResponse,
  fromExternalEmbeddingResponse,
  fromExternalVersionResponse,
  toExternalChatRequest,
  toExternalEmbeddingRequest,
} from './mappers';
import { fetchWithTimeout } from './utils';

/**
 * Ollama Provider Implementation
 *
 * Connects to Ollama server for LLM completions and embeddings.
 *
 * @example
 * ```typescript
 * const provider = new OllamaProviderImplementation({
 *   baseUrl: 'http://ollama:11434',
 *   model: 'llama3.1:8b',
 *   embeddingModel: 'nomic-embed-text'
 * });
 *
 * // Completion
 * const response = await provider.complete({
 *   prompt: 'What is TypeScript?',
 *   temperature: 0.7
 * });
 *
 * // Embedding
 * const embedding = await provider.embed({
 *   text: 'TypeScript is a typed superset of JavaScript'
 * });
 * ```
 */
/* eslint-disable perfectionist/sort-classes */
export class OllamaProviderImplementation implements LLMProvider {
  public readonly name = 'ollama' as const;

  private readonly baseUrl: string;
  private readonly embeddingModel: string;
  private readonly maxTokens: number;
  private readonly model: string;
  private readonly temperature: number;
  private readonly timeout: number;

  constructor(config: OllamaConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.model = config.model;
    this.embeddingModel = config.embeddingModel ?? 'nomic-embed-text';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 2048;
    this.timeout = config.timeout ?? 30000;
  }

  /**
   * Generate text completion
   */
  public async complete(params: CompletionParams): Promise<LLMResponse> {
    // Build internal request payload
    const internalRequest: InternalOllamaChatRequest = {
      messages: this.buildMessages(params),
      model: this.model,
      options: {
        numPredict: params.maxTokens ?? this.maxTokens,
        ...(params.stopSequences !== undefined && { stop: params.stopSequences }),
        temperature: params.temperature ?? this.temperature,
      },
      stream: false,
    };

    // Convert to external API format
    const externalRequest = toExternalChatRequest(internalRequest);

    try {
      const externalResponse = await fetchWithTimeout<OllamaChatResponse>({
        controller: new AbortController(),
        options: {
          body: JSON.stringify(externalRequest),
          headers: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'Content-Type': 'application/json',
            /* eslint-enable @typescript-eslint/naming-convention */
          },
          method: 'POST',
        },
        timeout: this.timeout,
        url: `${this.baseUrl}/api/chat`,
      });

      // Convert to internal format
      const response = fromExternalChatResponse(externalResponse);

      if (response.message.content === '') {
        throw new Error('No message returned from Ollama');
      }

      // Calculate tokens (Ollama provides these)
      const promptTokens = response.promptEvalCount ?? 0;
      const completionTokens = response.evalCount ?? 0;

      return {
        finishReason: response.done ? 'stop' : 'length',
        text: response.message.content,
        usage: {
          completionTokens,
          promptTokens,
          totalTokens: promptTokens + completionTokens,
        },
      };
    } catch (error) {
      throw new Error(
        `Ollama completion failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate embedding vector
   */
  public async embed(params: EmbedParams): Promise<number[]> {
    // Build internal request payload
    const internalRequest: InternalOllamaEmbeddingRequest = {
      model: this.embeddingModel,
      prompt: params.text,
    };

    // Convert to external API format
    const externalRequest = toExternalEmbeddingRequest(internalRequest);

    try {
      const externalResponse = await fetchWithTimeout<OllamaEmbeddingResponse>({
        controller: new AbortController(),
        options: {
          body: JSON.stringify(externalRequest),
          headers: {
            /* eslint-disable @typescript-eslint/naming-convention */
            'Content-Type': 'application/json',
            /* eslint-enable @typescript-eslint/naming-convention */
          },
          method: 'POST',
        },
        timeout: this.timeout,
        url: `${this.baseUrl}/api/embeddings`,
      });

      // Convert to internal format
      const response = fromExternalEmbeddingResponse(externalResponse);

      if (response.embedding.length === 0) {
        throw new Error('No embedding returned from Ollama');
      }

      return response.embedding;
    } catch (error) {
      throw new Error(
        `Ollama embedding failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Health check
   */
  public async health(): Promise<boolean> {
    try {
      const externalResponse = await fetchWithTimeout<OllamaVersionResponse>({
        controller: new AbortController(),
        options: {
          method: 'GET',
        },
        timeout: 5000,
        url: `${this.baseUrl}/api/version`,
      });

      const response: InternalOllamaVersionResponse = fromExternalVersionResponse(externalResponse);
      return response.version.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Build messages array with optional system prompt
   */
  private buildMessages(params: CompletionParams): InternalOllamaMessage[] {
    const systemMessages =
      params.systemPrompt !== undefined && params.systemPrompt.length > 0 ?
        [{ content: params.systemPrompt, role: 'system' as const }] :
        [];

    return [...systemMessages, { content: params.prompt, role: 'user' as const }];
  }
}
/* eslint-enable perfectionist/sort-classes */
