/**
 * Query Router Implementation
 *
 * Routes queries to fast or complex processing paths based on classification.
 * Combines classification and routing logic into a single efficient component.
 */

import type { Logger } from '../../../../_shared/_infrastructure';
import type { CompletionParams, LLMResponse } from '../../../_shared/types';
import type { QueryRouter } from './interfaces';
import type { QueryClassification, QueryRoute, QueryRouterConfig, QueryStrategy } from './types';

import { buildClassificationPrompt } from './prompts';

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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Generic T needed for type safety
  set<T>(params: { key: string; ttl?: number; value: T }): Promise<void>;
}

/**
 * Query Router Implementation
 *
 * @example
 * ```typescript
 * const router = new QueryRouterImplementation({
 *   config,
 *   logger,
 *   ollamaProvider,
 *   cacheManager
 * });
 *
 * const route = await router.route({
 *   query: 'What did we discuss?',
 *   userId: 'user123'
 * });
 * // route.path === 'complex'
 * ```
 */
export class QueryRouterImplementation implements QueryRouter {
  private readonly cacheManager: CacheManager;
  private readonly config: QueryRouterConfig;
  private readonly logger: Logger;
  private readonly ollamaProvider: OllamaProvider;

  constructor(params: {
    cacheManager: CacheManager;
    config: QueryRouterConfig;
    logger: Logger;
    ollamaProvider: OllamaProvider;
  }) {
    this.ollamaProvider = params.ollamaProvider;
    this.cacheManager = params.cacheManager;
    this.config = params.config;
    this.logger = params.logger;
  }

  /**
   * Route query to appropriate processing path
   */
  public async route(params: { query: string; userId: string }): Promise<QueryRoute> {
    const startTime = Date.now();

    // Check cache first
    if (this.cacheManager.isEnabled()) {
      const cacheKey = this.cacheManager.generateKey({
        query: params.query,
        type: 'route',
        userId: params.userId,
      });

      const cached = await this.cacheManager.get<QueryRoute>({ key: cacheKey });
      if (cached !== null) {
        this.logger.debug({
          message: 'Query route cache hit',
          metadata: { cacheKey, path: cached.path },
        });
        return cached;
      }
    }

    // Classify query
    const classification = await this.classifyQuery(params);

    // Determine routing strategy
    const route = this.determineRoute({ classification, query: params.query });

    // Add cache key for future caching
    if (this.cacheManager.isEnabled()) {
      route.metadata.cacheKey = this.cacheManager.generateKey({
        query: params.query,
        type: 'route',
        userId: params.userId,
      });

      // Cache the route decision
      await this.cacheManager.set({
        key: route.metadata.cacheKey,
        ttl: 3600000,
        value: route,
      });
    }

    const duration = Date.now() - startTime;

    this.logger.info({
      message: `Query routed to ${route.path} path`,
      metadata: {
        category: classification.category,
        complexity: classification.complexity,
        duration,
        path: route.path,
      },
    });

    return route;
  }

  /**
   * Build complex path route
   */
  private buildComplexPathRoute(params: {
    classification: QueryClassification;
    query: string;
  }): QueryRoute {
    const { classification } = params;

    const strategy: QueryStrategy = {
      useDecomposition: classification.complexity > this.config.decompositionThreshold,
      useHybridSearch: true,
      useHyDE: classification.complexity > this.config.hydeThreshold,
      useQueryExpansion: this.isAmbiguous({ query: params.query }),
      useToolPlanning: this.needsTools({ query: params.query }),
    };

    return {
      classification,
      metadata: {
        estimatedLatency: 10000,
      },
      path: 'complex',
      rationale: this.buildComplexRationale({ classification, strategy }),
      strategy,
    };
  }

  /**
   * Build rationale for complex path
   */
  private buildComplexRationale(params: {
    classification: QueryClassification;
    strategy: QueryStrategy;
  }): string {
    const reasons: string[] = [];

    if (params.classification.complexity > 7) {
      reasons.push('high complexity');
    }

    if (params.strategy.useDecomposition) {
      reasons.push('requires decomposition');
    }

    if (params.strategy.useHyDE) {
      reasons.push('benefits from HyDE');
    }

    if (params.strategy.useToolPlanning) {
      reasons.push('needs tool planning');
    }

    if (reasons.length === 0) {
      return 'Complex query requires full RAG pipeline';
    }

    return `Complex path: ${reasons.join(', ')}`;
  }

  /**
   * Build fast path route
   */
  private buildFastPathRoute(params: { classification: QueryClassification }): QueryRoute {
    return {
      classification: params.classification,
      metadata: {
        estimatedLatency: this.config.fastPathMaxLatency,
      },
      path: 'fast',
      rationale: 'Simple query suitable for fast path processing',
      strategy: {
        useDecomposition: false,
        useHybridSearch: false,
        useHyDE: false,
        useQueryExpansion: false,
        useToolPlanning: false,
      },
    };
  }

  /**
   * Classify query using LLM
   */
  private async classifyQuery(params: { query: string }): Promise<QueryClassification> {
    const prompt = buildClassificationPrompt({ query: params.query });

    try {
      const response = await this.ollamaProvider.complete({
        maxTokens: 256,
        model: 'llama3.1:8b',
        prompt,
        temperature: 0.1,
      });

      // Parse JSON response
      const parsed = this.parseClassificationResponse({ response: response.text });

      return parsed;
    } catch (error) {
      this.logger.error({
        message: 'Query classification failed, using fallback',
        metadata: { error, query: params.query },
      });

      // Fallback classification
      return this.fallbackClassification({ query: params.query });
    }
  }

  /**
   * Determine routing path and strategy
   */
  private determineRoute(params: {
    classification: QueryClassification;
    query: string;
  }): QueryRoute {
    const { classification } = params;

    // Fast path criteria: complexity must be BELOW threshold (not equal)
    // This ensures queries AT the threshold use complex path with enhancement
    const isFastPath =
      classification.complexity < this.config.complexityThreshold &&
      !this.requiresDecomposition({ query: params.query });

    if (isFastPath) {
      return this.buildFastPathRoute({ classification });
    }

    return this.buildComplexPathRoute({ classification, query: params.query });
  }

  /**
   * Extract JSON from LLM response (handles markdown code blocks)
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
   * Fallback classification when LLM fails
   */
  private fallbackClassification(params: { query: string }): QueryClassification {
    const query = params.query.toLowerCase();

    // Check for temporal keywords
    if (this.hasTemporalIndicator({ query })) {
      return {
        category: 'temporal',
        complexity: 5,
        confidence: 0.6,
        needsRetrieval: true,
      };
    }

    // Check for comparison keywords
    if (this.hasComparisonIndicator({ query })) {
      return {
        category: 'complex',
        complexity: 7,
        confidence: 0.6,
        needsRetrieval: false,
      };
    }

    // Check for conversational
    if (this.hasConversationalIndicator({ query })) {
      return {
        category: 'conversational',
        complexity: 1,
        confidence: 0.8,
        needsRetrieval: false,
      };
    }

    // Default to semantic with moderate complexity
    return {
      category: 'semantic',
      complexity: 5,
      confidence: 0.5,
      needsRetrieval: true,
    };
  }

  /**
   * Check for comparison indicators
   */
  private hasComparisonIndicator(params: { query: string }): boolean {
    const comparisonKeywords = ['compare', 'difference', 'versus', 'vs'];
    return comparisonKeywords.some((keyword) => params.query.includes(keyword));
  }

  /**
   * Check for conversational indicators
   */
  private hasConversationalIndicator(params: { query: string }): boolean {
    const greetings = ['hello', 'hi', 'hey', 'thanks', 'thank you', 'bye', 'goodbye'];
    return greetings.some((greeting) => params.query.includes(greeting));
  }

  /**
   * Check for temporal indicators
   */
  private hasTemporalIndicator(params: { query: string }): boolean {
    const temporalKeywords = ['last time', 'earlier', 'yesterday', 'before', 'previous'];
    return temporalKeywords.some((keyword) => params.query.includes(keyword));
  }

  /**
   * Check if query is ambiguous
   */
  private isAmbiguous(params: { query: string }): boolean {
    const query = params.query.toLowerCase();

    // Very short queries may be ambiguous
    if (query.split(' ').length <= 3) {
      return true;
    }

    // Vague terms
    const vagueTerms = ['it', 'that', 'this', 'thing', 'stuff'];

    return vagueTerms.some((term) => query.includes(term));
  }

  /**
   * Check if query needs tools
   */
  private needsTools(params: { query: string }): boolean {
    const query = params.query.toLowerCase();

    // Tool indicators
    const toolIndicators = ['calculate', 'count', 'summarize', 'extract', 'find'];

    return toolIndicators.some((indicator) => query.includes(indicator));
  }

  /**
   * Parse LLM classification response
   */
  private parseClassificationResponse(params: { response: string }): QueryClassification {
    try {
      const jsonStr = this.extractJsonFromResponse({ response: params.response });

      const parsed = JSON.parse(jsonStr) as {
        category: string;
        complexity: number;
        confidence: number;
        needsRetrieval: boolean;
      };

      return {
        category: this.validateCategory({ category: parsed.category }),
        complexity: Math.max(0, Math.min(10, parsed.complexity)),
        confidence: Math.max(0, Math.min(1, parsed.confidence)),
        needsRetrieval: parsed.needsRetrieval,
      };
    } catch (error) {
      this.logger.warn({
        message: 'Failed to parse classification response',
        metadata: { error, response: params.response },
      });

      throw new Error('Failed to parse classification');
    }
  }

  /**
   * Check if query requires decomposition
   */
  private requiresDecomposition(params: { query: string }): boolean {
    const query = params.query.toLowerCase();

    // Multi-part indicators
    const indicators = [
      'compare',
      'then',
      'and then',
      'first',
      'second',
      'finally',
      ', then',
      'summarize',
      'list',
    ];

    return indicators.some((indicator) => query.includes(indicator));
  }

  /**
   * Validate category value
   */
  private validateCategory(params: { category: string }):
    | 'complex'
    | 'conversational'
    | 'factual'
    | 'retrieval-required'
    | 'semantic'
    | 'temporal' {
    const validCategories = [
      'conversational',
      'factual',
      'temporal',
      'semantic',
      'complex',
      'retrieval-required',
    ];

    if (validCategories.includes(params.category)) {
      return params.category as
        | 'complex'
        | 'conversational'
        | 'factual'
        | 'retrieval-required'
        | 'semantic'
        | 'temporal';
    }

    return 'semantic'; // Default fallback
  }
}
