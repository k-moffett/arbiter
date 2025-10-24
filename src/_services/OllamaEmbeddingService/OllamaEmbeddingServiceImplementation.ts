/**
 * Ollama Embedding Service Implementation
 *
 * Generates embeddings using Ollama's nomic-embed-text model.
 * Features: LRU caching, retry with backoff, batched processing.
 *
 * Single Responsibility: Generate text embeddings via Ollama
 */

import type {
  BatchEmbeddingResult,
  EmbeddingRequest,
  EmbeddingResult,
  HealthCheckResult,
  OllamaEmbeddingConfig,
  OllamaEmbeddingResponse,
} from './types.js';

import crypto from 'node:crypto';

import { Logger } from '@shared/_infrastructure';
import { getEnv, retryWithBackoff } from '@shared/_utils';

import { LRUCache } from './_cache/LRUCache.js';

/**
 * Ollama Embedding Service
 *
 * Generates embeddings with caching and retry support.
 */
export class OllamaEmbeddingService {
  private readonly cache: LRUCache<string, number[]>;
  private readonly config: OllamaEmbeddingConfig;
  private readonly logger: Logger;

  /**
   * Create Ollama Embedding Service
   *
   * Configuration loaded from environment variables:
   * - OLLAMA_BASE_URL (default: http://arbiter-ollama:11434)
   * - OLLAMA_EMBEDDING_MODEL (default: nomic-embed-text)
   * - OLLAMA_TIMEOUT (default: 30000)
   * - OLLAMA_BATCH_SIZE (default: 20)
   * - OLLAMA_MAX_RETRIES (default: 3)
   * - OLLAMA_CACHE_ENABLED (default: true)
   * - OLLAMA_CACHE_MAX_SIZE (default: 10000)
   * - OLLAMA_CACHE_TTL (default: 86400000 = 24hr)
   *
   * @param params - Service configuration (optional, uses ENV if not provided)
   */
  constructor(params?: { config?: Partial<OllamaEmbeddingConfig> }) {
    // Load configuration from ENV with defaults
    const baseUrl = getEnv({
      defaultValue: 'http://arbiter-ollama:11434',
      key: 'OLLAMA_BASE_URL',
    });
    const model = getEnv({ defaultValue: 'nomic-embed-text', key: 'OLLAMA_EMBEDDING_MODEL' });
    const timeout = Number(getEnv({ defaultValue: '30000', key: 'OLLAMA_TIMEOUT' }));
    const batchSize = Number(getEnv({ defaultValue: '20', key: 'OLLAMA_BATCH_SIZE' }));
    const maxRetries = Number(getEnv({ defaultValue: '3', key: 'OLLAMA_MAX_RETRIES' }));
    const enableCache = getEnv({ defaultValue: 'true', key: 'OLLAMA_CACHE_ENABLED' }) === 'true';
    const cacheMaxSize = Number(getEnv({ defaultValue: '10000', key: 'OLLAMA_CACHE_MAX_SIZE' }));
    const cacheTtl = Number(getEnv({ defaultValue: '86400000', key: 'OLLAMA_CACHE_TTL' }));

    this.config = {
      baseUrl,
      batchSize,
      cacheMaxSize,
      cacheTtl,
      enableCache,
      maxRetries,
      model,
      retryDelays: [100, 500, 2000],
      timeout,
      ...params?.config,
    };

    this.logger = new Logger({
      metadata: {
        serviceName: 'OllamaEmbeddingService',
      },
    });

    this.cache = new LRUCache<string, number[]>({
      maxSize: this.config.cacheMaxSize,
      ttl: this.config.cacheTtl,
    });

    this.logger.info({
      context: {
        baseUrl: this.config.baseUrl,
        cacheEnabled: this.config.enableCache,
        model: this.config.model,
      },
      message: 'Ollama Embedding Service initialized',
    });
  }

  /**
   * Clear embedding cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.logger.info({ message: 'Embedding cache cleared' });
  }

  /**
   * Generate embeddings for batch of texts
   *
   * @param params - Array of embedding requests
   * @returns Batch result with statistics
   */
  public async generateBatchEmbeddings(params: {
    requests: EmbeddingRequest[];
  }): Promise<BatchEmbeddingResult> {
    const { requests } = params;
    const startTime = Date.now();

    this.logger.info({
      context: { batchSize: this.config.batchSize, totalRequests: requests.length },
      message: 'Starting batch embedding generation',
    });

    const { cacheHits, cacheMisses, results } = await this.processBatches({ requests });

    const totalTimeMs = Date.now() - startTime;

    this.logger.info({
      context: {
        cacheHits,
        cacheMisses,
        retries: 0,
        totalRequests: requests.length,
        totalTimeMs,
      },
      message: 'Batch embedding generation complete',
    });

    return {
      cacheHits,
      cacheMisses,
      results,
      retries: 0,
      totalTimeMs,
    };
  }

  /**
   * Generate embedding for single text
   *
   * @param params - Embedding request
   * @returns Embedding result with caching info
   */
  public async generateEmbedding(params: EmbeddingRequest): Promise<EmbeddingResult> {
    const { id, text } = params;

    // Check cache
    if (this.config.enableCache) {
      const cacheKey = this.getCacheKey({ text });
      const cached = this.cache.get({ key: cacheKey });

      if (cached !== null) {
        this.logger.debug({
          context: { cacheKey, textLength: text.length },
          message: 'Cache hit for embedding',
        });

        return {
          embedding: cached,
          fromCache: true,
          ...(id !== undefined ? { id } : {}),
        };
      }
    }

    // Generate embedding with retry
    const embedding = await retryWithBackoff({
      config: {
        delays: this.config.retryDelays,
        logger: this.logger,
        maxRetries: this.config.maxRetries,
        operation: 'Generate embedding',
      },
      fn: async () => await this.callOllamaEmbedding({ text }),
    });

    // Cache result
    if (this.config.enableCache) {
      const cacheKey = this.getCacheKey({ text });
      this.cache.set({ key: cacheKey, value: embedding });
    }

    return {
      embedding,
      fromCache: false,
      ...(id !== undefined ? { id } : {}),
    };
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { maxSize: number; size: number; } {
    return {
      maxSize: this.config.cacheMaxSize,
      size: this.cache.size(),
    };
  }

  /**
   * Health check for Ollama service
   *
   * @returns Health check result
   */
  public async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.config.baseUrl}/api/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout),
      });

      const responseTimeMs = Date.now() - startTime;

      if (!response.ok) {
        return {
          error: `HTTP ${String(response.status)}: ${response.statusText}`,
          healthy: false,
          responseTimeMs,
        };
      }

      const data = (await response.json()) as { version: string };

      this.logger.info({
        context: { responseTimeMs, version: data.version },
        message: 'Ollama health check passed',
      });

      return {
        healthy: true,
        responseTimeMs,
        version: data.version,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      this.logger.error({
        context: { error, responseTimeMs },
        message: 'Ollama health check failed',
      });

      return {
        error: (error as Error).message,
        healthy: false,
        responseTimeMs,
      };
    }
  }

  /**
   * Call Ollama API to generate embedding
   */
  private async callOllamaEmbedding(params: { text: string }): Promise<number[]> {
    const { text } = params;

    this.logger.debug({
      context: { model: this.config.model, textLength: text.length },
      message: 'Calling Ollama embedding API',
    });

    const response = await fetch(`${this.config.baseUrl}/api/embeddings`, {
      body: JSON.stringify({
        model: this.config.model,
        prompt: text,
      }),
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- HTTP header name
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${String(response.status)} ${response.statusText}`);
    }

    const data = (await response.json()) as OllamaEmbeddingResponse;

    this.logger.debug({
      context: { dimensions: data.embedding.length },
      message: 'Embedding generated successfully',
    });

    return data.embedding;
  }

  /**
   * Generate cache key from text
   */
  private getCacheKey(params: { text: string }): string {
    return crypto.createHash('sha256').update(params.text).digest('hex');
  }

  /**
   * Process requests in batches
   */
  private async processBatches(params: {
    requests: EmbeddingRequest[];
  }): Promise<{ cacheHits: number; cacheMisses: number; results: EmbeddingResult[] }> {
    const { requests } = params;
    const results: EmbeddingResult[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;

    for (let i = 0; i < requests.length; i += this.config.batchSize) {
      const batch = requests.slice(i, i + this.config.batchSize);
      const batchNum = Math.floor(i / this.config.batchSize) + 1;
      const totalBatches = Math.ceil(requests.length / this.config.batchSize);

      this.logger.info({
        context: { batchNum, totalBatches },
        message: `Processing batch ${String(batchNum)}/${String(totalBatches)}`,
      });

      const batchResults = await Promise.all(
        batch.map(async (request) => await this.generateEmbedding(request))
      );

      // Update statistics
      for (const result of batchResults) {
        if (result.fromCache) {
          cacheHits++;
        } else {
          cacheMisses++;
        }
      }

      results.push(...batchResults);
    }

    return { cacheHits, cacheMisses, results };
  }
}
