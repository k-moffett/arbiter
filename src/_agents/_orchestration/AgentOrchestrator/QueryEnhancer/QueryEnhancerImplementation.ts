/**
 * Query Enhancer Implementation
 *
 * Enhances queries using HyDE and query expansion techniques.
 * Components are conditional - only execute when requested by QueryRouter.
 */

import type { Logger } from '../../../../_shared/_infrastructure';
import type { CompletionParams, LLMResponse } from '../../../_shared/types';
import type { QueryEnhancer } from './interfaces';
import type { EnhancedQuery, HyDEResult, QueryExpansion } from './types';
import type { QueryEnhancerConfig } from './types';

import { buildExpansionPrompt, buildHyDEPrompt } from './prompts';

/**
 * Ollama provider interface (minimal subset needed)
 */
interface OllamaProvider {
  complete(params: CompletionParams): Promise<LLMResponse>;
}

/**
 * Cache manager interface (minimal subset needed)
 */
interface CacheManager {
  generateKey(params: { query: string; type: string; userId: string }): string;
  get<T>(params: { key: string }): Promise<T | null>;
  isEnabled(): boolean;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Generic needed for type safety
  set<T>(params: { key: string; ttl?: number; value: T }): Promise<void>;
}

/**
 * Query Enhancer Implementation
 *
 * @example
 * ```typescript
 * const enhancer = new QueryEnhancerImplementation({
 *   config,
 *   logger,
 *   ollamaProvider,
 *   cacheManager,
 *   userId: 'user123'
 * });
 *
 * const result = await enhancer.enhance({
 *   query: 'What did we discuss?',
 *   useHyDE: true,
 *   useExpansion: true
 * });
 * // result.hyde = { hypotheticalAnswer: '...' }
 * // result.expansion = { alternatives: [...], related: [...] }
 * ```
 */
export class QueryEnhancerImplementation implements QueryEnhancer {
  private readonly cacheManager: CacheManager;
  private readonly config: QueryEnhancerConfig;
  private readonly logger: Logger;
  private readonly ollamaProvider: OllamaProvider;
  private readonly userId: string;

  constructor(params: {
    cacheManager: CacheManager;
    config: QueryEnhancerConfig;
    logger: Logger;
    ollamaProvider: OllamaProvider;
    userId: string;
  }) {
    this.ollamaProvider = params.ollamaProvider;
    this.cacheManager = params.cacheManager;
    this.config = params.config;
    this.logger = params.logger;
    this.userId = params.userId;
  }

  /**
   * Apply HyDE (Hypothetical Document Embeddings)
   */
  public async applyHyDE(params: { query: string }): Promise<HyDEResult> {
    const startTime = Date.now();

    // Check cache first
    if (this.cacheManager.isEnabled()) {
      const cacheKey = this.cacheManager.generateKey({
        query: params.query,
        type: 'hyde',
        userId: this.userId,
      });

      const cached = await this.cacheManager.get<HyDEResult>({ key: cacheKey });
      if (cached !== null) {
        this.logger.debug({
          message: 'HyDE cache hit',
          metadata: { cacheKey },
        });
        return cached;
      }
    }

    try {
      const prompt = buildHyDEPrompt({ query: params.query });

      const response = await this.ollamaProvider.complete({
        maxTokens: 512,
        model: this.config.llmModel,
        prompt,
        temperature: this.config.temperature,
      });

      const parsed = this.parseHyDEResponse({
        query: params.query,
        response: response.text,
      });

      // Cache the result
      if (this.cacheManager.isEnabled()) {
        const cacheKey = this.cacheManager.generateKey({
          query: params.query,
          type: 'hyde',
          userId: this.userId,
        });

        await this.cacheManager.set({
          key: cacheKey,
          ttl: 3600000,
          value: parsed,
        });
      }

      const duration = Date.now() - startTime;

      this.logger.info({
        message: 'HyDE applied',
        metadata: {
          confidence: parsed.confidence,
          duration,
          queryLength: params.query.length,
        },
      });

      return parsed;
    } catch (error) {
      this.logger.error({
        message: 'HyDE generation failed, using fallback',
        metadata: { error, query: params.query },
      });

      // Fallback: return original query as hypothetical answer
      return {
        confidence: 0.5,
        hypotheticalAnswer: params.query,
        originalQuery: params.query,
      };
    }
  }

  /**
   * Enhance query with all applicable techniques
   */
  public async enhance(params: {
    query: string;
    useExpansion: boolean;
    useHyDE: boolean;
  }): Promise<EnhancedQuery> {
    const startTime = Date.now();

    // Execute enhancements in parallel
    const [hydeResult, expansionResult] = await Promise.all([
      this.getHyDEResult(params),
      this.getExpansionResult(params),
    ]);

    const duration = Date.now() - startTime;

    this.logger.info({
      message: 'Query enhanced',
      metadata: {
        duration,
        usedExpansion: params.useExpansion,
        usedHyDE: params.useHyDE,
      },
    });

    return {
      expansion: expansionResult,
      hyde: hydeResult,
      originalQuery: params.query,
    };
  }

  /**
   * Expand query with alternatives and related queries
   */
  public async expandQuery(params: { query: string }): Promise<QueryExpansion> {
    const startTime = Date.now();

    // Check cache first
    if (this.cacheManager.isEnabled()) {
      const cacheKey = this.cacheManager.generateKey({
        query: params.query,
        type: 'expansion',
        userId: this.userId,
      });

      const cached = await this.cacheManager.get<QueryExpansion>({ key: cacheKey });
      if (cached !== null) {
        this.logger.debug({
          message: 'Expansion cache hit',
          metadata: { cacheKey },
        });
        return cached;
      }
    }

    try {
      const prompt = buildExpansionPrompt({ query: params.query });

      const response = await this.ollamaProvider.complete({
        maxTokens: 512,
        model: this.config.llmModel,
        prompt,
        temperature: this.config.temperature,
      });

      const parsed = this.parseExpansionResponse({
        query: params.query,
        response: response.text,
      });

      // Cache the result
      if (this.cacheManager.isEnabled()) {
        const cacheKey = this.cacheManager.generateKey({
          query: params.query,
          type: 'expansion',
          userId: this.userId,
        });

        await this.cacheManager.set({
          key: cacheKey,
          ttl: 3600000,
          value: parsed,
        });
      }

      const duration = Date.now() - startTime;

      this.logger.info({
        message: 'Query expanded',
        metadata: {
          alternativesCount: parsed.alternatives.length,
          duration,
          relatedCount: parsed.related.length,
        },
      });

      return parsed;
    } catch (error) {
      this.logger.error({
        message: 'Query expansion failed, using fallback',
        metadata: { error, query: params.query },
      });

      // Fallback: return empty expansion
      return {
        alternatives: [],
        originalQuery: params.query,
        related: [],
      };
    }
  }

  /**
   * Extract JSON from LLM response
   */
  private extractJsonFromResponse(params: { response: string }): string {
    let jsonStr = params.response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.includes('```json')) {
      const match = /```json\s*(\{[\s\S]*?\})\s*```/.exec(jsonStr);
      const extracted = match?.[1];
      if (extracted !== undefined && extracted !== '') {
        jsonStr = extracted;
      }
    } else if (jsonStr.includes('```')) {
      const match = /```\s*(\{[\s\S]*?\})\s*```/.exec(jsonStr);
      const extracted = match?.[1];
      if (extracted !== undefined && extracted !== '') {
        jsonStr = extracted;
      }
    }

    // Find first JSON object
    const jsonMatch = /\{[\s\S]*?\}/.exec(jsonStr);
    if (jsonMatch !== null) {
      jsonStr = jsonMatch[0];
    }

    return jsonStr;
  }

  /**
   * Get expansion result or null
   */
  private async getExpansionResult(params: {
    query: string;
    useExpansion: boolean;
  }): Promise<QueryExpansion | null> {
    if (params.useExpansion) {
      return this.expandQuery({ query: params.query });
    }
    return null;
  }

  /**
   * Get HyDE result or null
   */
  private async getHyDEResult(params: {
    query: string;
    useHyDE: boolean;
  }): Promise<HyDEResult | null> {
    if (params.useHyDE) {
      return this.applyHyDE({ query: params.query });
    }
    return null;
  }

  /**
   * Parse query expansion response
   */
  private parseExpansionResponse(params: {
    query: string;
    response: string;
  }): QueryExpansion {
    const jsonStr = this.extractJsonFromResponse({ response: params.response });

    const parsed = JSON.parse(jsonStr) as {
      alternatives: string[];
      related: string[];
    };

    return {
      alternatives: parsed.alternatives.slice(0, this.config.maxAlternatives),
      originalQuery: params.query,
      related: parsed.related.slice(0, this.config.maxRelated),
    };
  }

  /**
   * Parse HyDE response
   */
  private parseHyDEResponse(params: { query: string; response: string }): HyDEResult {
    const jsonStr = this.extractJsonFromResponse({ response: params.response });

    const parsed = JSON.parse(jsonStr) as {
      confidence: number;
      hypotheticalAnswer: string;
    };

    return {
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      hypotheticalAnswer: parsed.hypotheticalAnswer,
      originalQuery: params.query,
    };
  }
}
