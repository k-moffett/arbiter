/**
 * Query Decomposer Implementation
 *
 * Decomposes complex queries into simpler sub-queries using LLM analysis.
 * Only called conditionally for complex queries (complexity > 7).
 */

import type { Logger } from '../../../../_shared/_infrastructure';
import type { CompletionParams, LLMResponse } from '../../../_shared/types';
import type { DecomposedQuery, SubQuery } from '../types';
import type { QueryDecomposer } from './interfaces';
import type { QueryDecomposerConfig, QueryIntent } from './types';

import { buildDecompositionPrompt, buildIntentPrompt } from './prompts';

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
 * Query Decomposer Implementation
 *
 * @example
 * ```typescript
 * const decomposer = new QueryDecomposerImplementation({
 *   config,
 *   logger,
 *   ollamaProvider,
 *   cacheManager,
 *   userId: 'user123'
 * });
 *
 * const result = await decomposer.decompose({
 *   query: 'Compare X and Y, then summarize'
 * });
 * // result.subQueries = [...]
 * ```
 */
export class QueryDecomposerImplementation implements QueryDecomposer {
  private readonly cacheManager: CacheManager;
  private readonly config: QueryDecomposerConfig;
  private readonly logger: Logger;
  private readonly ollamaProvider: OllamaProvider;
  private readonly userId: string;

  constructor(params: {
    cacheManager: CacheManager;
    config: QueryDecomposerConfig;
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
   * Analyze query intent
   */
  public async analyzeIntent(params: { query: string }): Promise<QueryIntent> {
    try {
      const prompt = buildIntentPrompt({ query: params.query });

      const response = await this.ollamaProvider.complete({
        maxTokens: 256,
        model: this.config.llmModel,
        prompt,
        temperature: this.config.temperature,
      });

      const parsed = this.parseIntentResponse({ response: response.text });

      return parsed;
    } catch (error) {
      this.logger.error({
        message: 'Intent analysis failed, using fallback',
        metadata: { error, query: params.query },
      });

      // Fallback intent
      return {
        confidence: 0.5,
        requiresContext: true,
        requiresTools: false,
        temporalScope: null,
        topics: [],
        type: 'semantic',
      };
    }
  }

  /**
   * Decompose query into sub-queries
   */
  public async decompose(params: { query: string }): Promise<DecomposedQuery> {
    const startTime = Date.now();

    // Check cache first
    if (this.cacheManager.isEnabled()) {
      const cacheKey = this.cacheManager.generateKey({
        query: params.query,
        type: 'decomposition',
        userId: this.userId,
      });

      const cached = await this.cacheManager.get<DecomposedQuery>({ key: cacheKey });
      if (cached !== null) {
        this.logger.debug({
          message: 'Decomposition cache hit',
          metadata: { cacheKey },
        });
        return cached;
      }
    }

    try {
      // Use LLM to decompose query
      const decomposition = await this.llmDecompose(params);

      // Validate and sanitize
      const validated = this.validateDecomposition({ decomposition });

      // Cache the result
      if (this.cacheManager.isEnabled()) {
        const cacheKey = this.cacheManager.generateKey({
          query: params.query,
          type: 'decomposition',
          userId: this.userId,
        });

        await this.cacheManager.set({
          key: cacheKey,
          ttl: 3600000,
          value: validated,
        });
      }

      const duration = Date.now() - startTime;

      this.logger.info({
        message: 'Query decomposed',
        metadata: {
          complexity: validated.complexity,
          duration,
          subQueryCount: validated.subQueries.length,
        },
      });

      return validated;
    } catch (error) {
      this.logger.error({
        message: 'Decomposition failed, using fallback',
        metadata: { error, query: params.query },
      });

      // Fallback to simple single-query decomposition
      return this.fallbackDecomposition(params);
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
   * Fallback decomposition when LLM fails
   */
  private fallbackDecomposition(params: { query: string }): DecomposedQuery {
    // Simple single-query decomposition
    const subQuery: SubQuery = {
      dependencies: [],
      priority: 1,
      query: params.query,
      suggestedTool: 'vector_search_context',
    };

    return {
      complexity: 5,
      originalQuery: params.query,
      queryType: 'simple',
      subQueries: [subQuery],
    };
  }

  /**
   * LLM-based decomposition
   */
  private async llmDecompose(params: { query: string }): Promise<DecomposedQuery> {
    const prompt = buildDecompositionPrompt({ query: params.query });

    const response = await this.ollamaProvider.complete({
      maxTokens: 1024,
      model: this.config.llmModel,
      prompt,
      temperature: this.config.temperature,
    });

    const parsed = this.parseDecompositionResponse({ response: response.text });

    return parsed;
  }

  /**
   * Parse LLM decomposition response
   */
  private parseDecompositionResponse(params: { response: string }): DecomposedQuery {
    const jsonStr = this.extractJsonFromResponse({ response: params.response });

    const parsed = JSON.parse(jsonStr) as {
      complexity: number;
      originalQuery: string;
      queryType: string;
      subQueries: Array<{
        dependencies: string[];
        priority: number;
        query: string;
        suggestedTool: string;
      }>;
    };

    return {
      complexity: Math.max(0, Math.min(10, parsed.complexity)),
      originalQuery: parsed.originalQuery,
      queryType: this.validateQueryType({ queryType: parsed.queryType }),
      subQueries: parsed.subQueries.map((sq) => ({
        dependencies: sq.dependencies,
        priority: sq.priority,
        query: sq.query,
        suggestedTool: sq.suggestedTool,
      })),
    };
  }

  /**
   * Parse intent analysis response
   */
  private parseIntentResponse(params: { response: string }): QueryIntent {
    const jsonStr = this.extractJsonFromResponse({ response: params.response });

    const parsed = JSON.parse(jsonStr) as {
      confidence: number;
      requiresContext: boolean;
      requiresTools: boolean;
      temporalScope?: string;
      topics: string[];
      type: string;
    };

    const temporalScope =
      parsed.temporalScope !== undefined
        ? this.validateTemporalScope({ scope: parsed.temporalScope })
        : null;

    return {
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      requiresContext: parsed.requiresContext,
      requiresTools: parsed.requiresTools,
      temporalScope,
      topics: parsed.topics,
      type: this.validateIntentType({ intentType: parsed.type }),
    };
  }

  /**
   * Validate and sanitize decomposition
   */
  private validateDecomposition(params: { decomposition: DecomposedQuery }): DecomposedQuery {
    // Limit number of sub-queries
    const subQueries = params.decomposition.subQueries.slice(0, this.config.maxSubQueries);

    // Ensure at least one sub-query
    if (subQueries.length === 0) {
      subQueries.push({
        dependencies: [],
        priority: 1,
        query: params.decomposition.originalQuery,
        suggestedTool: 'vector_search_context',
      });
    }

    return {
      ...params.decomposition,
      subQueries,
    };
  }

  /**
   * Validate intent type
   */
  private validateIntentType(params: {
    intentType: string;
  }): 'comparative' | 'factual' | 'hybrid' | 'listBuilding' | 'semantic' | 'temporal' {
    const validTypes = ['temporal', 'semantic', 'factual', 'comparative', 'hybrid', 'listBuilding'];

    if (validTypes.includes(params.intentType)) {
      return params.intentType as 'comparative' | 'factual' | 'hybrid' | 'listBuilding' | 'semantic' | 'temporal';
    }

    return 'semantic'; // Default
  }

  /**
   * Validate query type
   */
  private validateQueryType(params: { queryType: string }): 'comparative' | 'complex' | 'listBuilding' | 'simple' {
    const validTypes = ['simple', 'complex', 'comparative', 'listBuilding'];

    if (validTypes.includes(params.queryType)) {
      return params.queryType as 'comparative' | 'complex' | 'listBuilding' | 'simple';
    }

    return 'complex'; // Default
  }

  /**
   * Validate temporal scope
   */
  private validateTemporalScope(params: {
    scope: string;
  }): 'all_time' | 'lastMessage' | 'recent' | 'session' {
    const validScopes = ['lastMessage', 'recent', 'session', 'all_time'];

    if (validScopes.includes(params.scope)) {
      return params.scope as 'all_time' | 'lastMessage' | 'recent' | 'session';
    }

    return 'recent'; // Default
  }
}
