/**
 * Embedding Provider Adapter Implementation
 *
 * Adapts Ollama's single-text embed() to batch interface required by HybridSearchRetriever.
 */

import type { Logger } from '../../../../_shared/_infrastructure';
import type { EmbedParams } from '../../../_shared/types';
import type { EmbeddingProvider } from './types';

/**
 * Ollama provider interface (single-text embedding)
 */
interface OllamaProvider {
  embed(params: EmbedParams): Promise<number[]>;
}

/**
 * Embedding Provider Adapter
 *
 * Converts single-text Ollama embed() to batch interface.
 * Executes embeddings in parallel for performance.
 *
 * @example
 * ```typescript
 * const adapter = new EmbeddingProviderAdapterImplementation({
 *   ollamaProvider,
 *   embeddingModel: 'nomic-embed-text',
 *   logger
 * });
 *
 * const result = await adapter.embed({
 *   texts: ['query1', 'query2', 'query3']
 * });
 * // result.embeddings = [[...], [...], [...]]
 * ```
 */
export class EmbeddingProviderAdapterImplementation implements EmbeddingProvider {
  private readonly embeddingModel: string;
  private readonly logger: Logger;
  private readonly ollamaProvider: OllamaProvider;

  constructor(params: {
    embeddingModel: string;
    logger: Logger;
    ollamaProvider: OllamaProvider;
  }) {
    this.ollamaProvider = params.ollamaProvider;
    this.embeddingModel = params.embeddingModel;
    this.logger = params.logger;
  }

  /**
   * Embed multiple texts in parallel
   */
  public async embed(params: { texts: string[] }): Promise<{ embeddings: number[][] }> {
    if (params.texts.length === 0) {
      return { embeddings: [] };
    }

    const startTime = Date.now();

    this.logger.debug({
      message: 'Batch embedding texts',
      metadata: { count: params.texts.length },
    });

    try {
      // Execute all embeddings in parallel
      const embeddings = await Promise.all(
        params.texts.map((text) =>
          this.ollamaProvider.embed({
            model: this.embeddingModel,
            text,
          })
        )
      );

      const duration = Date.now() - startTime;

      this.logger.debug({
        message: 'Batch embedding complete',
        metadata: {
          count: params.texts.length,
          duration,
        },
      });

      return { embeddings };
    } catch (error) {
      this.logger.error({
        message: 'Batch embedding failed',
        metadata: {
          count: params.texts.length,
          error,
        },
      });
      throw error;
    }
  }
}
