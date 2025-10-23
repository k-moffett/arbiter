/**
 * RAG Orchestration Service
 *
 * Integrates all RAG components in a dual-path architecture.
 * Orchestrates the complete flow from query to final prompt.
 *
 * Flow:
 * 1. Route (fast vs complex path)
 * 2. Enhance (HyDE + expansion, conditional)
 * 3. Decompose (complex queries only, conditional)
 * 4. Retrieve (hybrid search with multiple query variations)
 * 5. Validate (relevance filtering)
 * 6. Fit (context window management)
 * 7. Build Prompt (with citations)
 * 8. Background: Grade quality (feedback loop, async)
 */

import type { Logger } from '../../../../_shared/_infrastructure';
import type { AdvancedPromptBuilder } from '../AdvancedPromptBuilder';
import type { BuiltPrompt, PromptBuildParams } from '../AdvancedPromptBuilder/types';
import type { ContextWindowManager } from '../ContextWindowManager';
import type { FittedContext } from '../ContextWindowManager/types';
import type { HybridSearchRetriever } from '../HybridSearchRetriever';
import type {
  HybridSearchParams,
  RetrievedContext,
} from '../HybridSearchRetriever/types';
import type { QualityGrader } from '../QualityGrader';
import type { QueryDecomposer } from '../QueryDecomposer';
import type { QueryEnhancer } from '../QueryEnhancer';
import type { EnhancedQuery } from '../QueryEnhancer/types';
import type { QueryRouter } from '../QueryRouter';
import type {
  QueryClassification,
  QueryRoute,
} from '../QueryRouter/types';
import type { RAGValidator } from '../RAGValidator';
import type { ValidatedContext } from '../RAGValidator/types';
import type { ToolPlanner } from '../ToolPlanner';
import type {
  DecomposedQuery,
  RAGOrchestrationRequest,
  RAGOrchestrationResponse,
} from '../types';

/**
 * RAG Orchestration Service Implementation
 *
 * @example
 * ```typescript
 * const service = new RAGOrchestrationServiceImplementation({
 *   logger,
 *   queryRouter,
 *   queryEnhancer,
 *   queryDecomposer,
 *   hybridSearchRetriever,
 *   ragValidator,
 *   contextWindowManager,
 *   advancedPromptBuilder,
 *   toolPlanner,
 *   qualityGrader
 * });
 *
 * const result = await service.orchestrate({
 *   messageId: 'msg_123',
 *   query: 'What did we discuss?',
 *   userId: 'user_123',
 *   sessionId: 'session_123'
 * });
 * // result.builtPrompt ready for LLM execution
 * ```
 */
export class RAGOrchestrationServiceImplementation {
  private readonly advancedPromptBuilder: AdvancedPromptBuilder;
  private readonly contextWindowManager: ContextWindowManager;
  private readonly hybridSearchRetriever: HybridSearchRetriever;
  private readonly logger: Logger;
  private readonly qualityGrader: QualityGrader;
  private readonly queryDecomposer: QueryDecomposer;
  private readonly queryEnhancer: QueryEnhancer;
  private readonly queryRouter: QueryRouter;
  private readonly ragValidator: RAGValidator;
  private readonly toolPlanner: ToolPlanner;

  constructor(params: {
    advancedPromptBuilder: AdvancedPromptBuilder;
    contextWindowManager: ContextWindowManager;
    hybridSearchRetriever: HybridSearchRetriever;
    logger: Logger;
    qualityGrader: QualityGrader;
    queryDecomposer: QueryDecomposer;
    queryEnhancer: QueryEnhancer;
    queryRouter: QueryRouter;
    ragValidator: RAGValidator;
    toolPlanner: ToolPlanner;
  }) {
    this.queryRouter = params.queryRouter;
    this.queryEnhancer = params.queryEnhancer;
    this.queryDecomposer = params.queryDecomposer;
    this.hybridSearchRetriever = params.hybridSearchRetriever;
    this.ragValidator = params.ragValidator;
    this.contextWindowManager = params.contextWindowManager;
    this.advancedPromptBuilder = params.advancedPromptBuilder;
    this.toolPlanner = params.toolPlanner;
    this.qualityGrader = params.qualityGrader;
    this.logger = params.logger;
  }

  /**
   * Grade response quality (call this after LLM response)
   *
   * This is the feedback loop component that should be called
   * asynchronously after the LLM generates a response.
   */
  public async gradeResponse(params: {
    messageId: string;
    query: string;
    response: string;
    retrievedContext?: string[];
  }): Promise<void> {
    try {
      const gradingParams: import('../QualityGrader/types').GradingParams = {
        messageId: params.messageId,
        query: params.query,
        response: params.response,
      };

      if (params.retrievedContext !== undefined) {
        gradingParams.retrievedContext = params.retrievedContext;
      }

      const gradingResult = await this.qualityGrader.grade(gradingParams);

      this.logger.info({
        message: 'Response quality graded',
        metadata: {
          messageId: params.messageId,
          overallScore: gradingResult.grade.overallScore,
        },
      });

      // TODO: Update Qdrant metadata with quality scores and extracted entities
      // This would involve:
      // 1. Updating the message record with quality scores
      // 2. Adding extracted entities as tags
      // 3. Enriching context for future retrievals
    } catch (error) {
      this.logger.error({
        message: 'Background quality grading failed',
        metadata: { error, messageId: params.messageId },
      });
    }
  }

  /**
   * Orchestrate RAG pipeline
   */
  public async orchestrate(
    params: RAGOrchestrationRequest
  ): Promise<RAGOrchestrationResponse> {
    const startTime = Date.now();
    const stepsExecuted: string[] = ['route'];

    this.logOrchestrationStart(params);

    const route = await this.queryRouter.route({
      query: params.query,
      userId: params.userId,
    });

    this.logRouting({ classification: route.classification, path: route.path });

    // Early exit for queries that don't need retrieval (e.g., greetings)
    if (!route.classification.needsRetrieval) {
      this.logger.debug({
        message: 'Skipping retrieval - query does not require context',
        metadata: {
          category: route.classification.category,
          complexity: route.classification.complexity,
        },
      });

      stepsExecuted.push('build_prompt');
      const prompt = this.buildPromptWithoutContext({ params, route });
      const duration = Date.now() - startTime;

      this.logOrchestrationComplete({
        contextFitted: 0,
        duration,
        pathTaken: route.path,
        stepsExecuted,
      });

      return this.createResponse({
        decomposition: null,
        duration,
        enhancement: null,
        fittedContext: {
          includedCount: 0,
          includedResults: [],
          truncatedCount: 0,
        },
        params,
        pathTaken: route.path,
        prompt,
        retrieval: {
          count: 0,
          results: [],
          retrievalMetadata: {
            alternativesCount: 0,
            filtersApplied: [],
            relatedCount: 0,
            retrievalDuration: 0,
            totalDocumentsSearched: 0,
            usedHyDE: false,
          },
        },
        stepsExecuted,
        validation: {
          rejectedCount: 0,
          validCount: 0,
          validResults: [],
          validationMetadata: {
            avgValidationScore: 0,
            failedCount: 0,
            passedCount: 0,
            totalResults: 0,
            validationDuration: 0,
          },
        },
      });
    }

    const enhancement = await this.executeEnhancement({
      params,
      route,
      stepsExecuted,
    });
    const decomposition = await this.executeDecomposition({
      params,
      route,
      stepsExecuted,
    });

    stepsExecuted.push('retrieve', 'validate', 'fit');
    const retrieval = await this.executeRetrieval({ enhancement, params, route });
    const validation = await this.ragValidator.validate({
      query: params.query,
      results: retrieval.results,
    });
    const fittedContext = this.contextWindowManager.fitContext({
      reservedTokens: 512,
      results: validation.validResults.map((v) => v.result),
    });

    await this.executeToolPlanning({
      fittedContext,
      params,
      route,
      stepsExecuted,
    });

    stepsExecuted.push('build_prompt');
    const prompt = this.buildFinalPrompt({
      fittedContext,
      params,
      route,
      validation,
    });

    const duration = Date.now() - startTime;

    this.logOrchestrationComplete({
      contextFitted: fittedContext.includedCount,
      duration,
      pathTaken: route.path,
      stepsExecuted,
    });

    return this.createResponse({
      decomposition,
      duration,
      enhancement,
      fittedContext,
      params,
      pathTaken: route.path,
      prompt,
      retrieval,
      stepsExecuted,
      validation,
    });
  }

  /**
   * Build prompt without context (for conversational queries)
   */
  private buildPromptWithoutContext(opts: {
    params: RAGOrchestrationRequest;
    route: QueryRoute;
  }): BuiltPrompt {
    return this.advancedPromptBuilder.buildPrompt({
      query: opts.params.query,
      queryIntent: opts.route.classification.category as
        | 'comparative'
        | 'conversational'
        | 'factual'
        | 'hybrid'
        | 'listBuilding'
        | 'semantic'
        | 'temporal',
      validatedResults: [],
    });
  }

  /**
   * Build final prompt with context
   */
  private buildFinalPrompt(opts: {
    fittedContext: FittedContext;
    params: RAGOrchestrationRequest;
    route: QueryRoute;
    validation: ValidatedContext;
  }): BuiltPrompt {
    const promptParams: PromptBuildParams = {
      query: opts.params.query,
      validatedResults: opts.validation.validResults.slice(
        0,
        opts.fittedContext.includedCount
      ),
    };

    const validIntents = [
      'comparative',
      'conversational',
      'factual',
      'hybrid',
      'listBuilding',
      'semantic',
      'temporal',
    ];
    if (validIntents.includes(opts.route.classification.category)) {
      promptParams.queryIntent = opts.route.classification.category as
        | 'comparative'
        | 'conversational'
        | 'factual'
        | 'hybrid'
        | 'listBuilding'
        | 'semantic'
        | 'temporal';
    }

    return this.advancedPromptBuilder.buildPrompt(promptParams);
  }

  /**
   * Create final orchestration response
   */
  private createResponse(opts: {
    decomposition: DecomposedQuery | null;
    duration: number;
    enhancement: EnhancedQuery | null;
    fittedContext: FittedContext;
    params: RAGOrchestrationRequest;
    pathTaken: 'complex' | 'fast';
    prompt: BuiltPrompt;
    retrieval: RetrievedContext;
    stepsExecuted: string[];
    validation: ValidatedContext;
  }): RAGOrchestrationResponse {
    this.logger.debug({
      message: 'Quality grading should be initiated after LLM response',
      metadata: { messageId: opts.params.messageId },
    });

    return {
      builtPrompt: opts.prompt,
      messageId: opts.params.messageId,
      metadata: {
        contextStats: {
          fitted: opts.fittedContext.includedCount,
          retrieved: opts.retrieval.count,
          validated: opts.validation.validCount,
        },
        decomposed: opts.decomposition !== null,
        duration: opts.duration,
        enhanced: opts.enhancement !== null,
        stepsExecuted: opts.stepsExecuted,
      },
      pathTaken: opts.pathTaken,
    };
  }

  /**
   * Execute decomposition if needed
   */
  private async executeDecomposition(opts: {
    params: RAGOrchestrationRequest;
    route: QueryRoute;
    stepsExecuted: string[];
  }): Promise<DecomposedQuery | null> {
    if (!opts.route.strategy.useDecomposition) {
      return null;
    }

    opts.stepsExecuted.push('decompose');
    return this.queryDecomposer.decompose({ query: opts.params.query });
  }

  /**
   * Execute enhancement if needed
   */
  private async executeEnhancement(opts: {
    params: RAGOrchestrationRequest;
    route: QueryRoute;
    stepsExecuted: string[];
  }): Promise<EnhancedQuery | null> {
    if (!opts.route.strategy.useHyDE && !opts.route.strategy.useQueryExpansion) {
      return null;
    }

    opts.stepsExecuted.push('enhance');
    return this.queryEnhancer.enhance({
      query: opts.params.query,
      useExpansion: opts.route.strategy.useQueryExpansion,
      useHyDE: opts.route.strategy.useHyDE,
    });
  }

  /**
   * Calculate retrieval limit based on query complexity
   *
   * Scales limit based on complexity, but respects configured maximum.
   *
   * @param complexity - Query complexity score (1-10)
   * @param maxResults - Maximum results from configuration
   * @returns Calculated retrieval limit
   */
  private calculateRetrievalLimit(complexity: number, maxResults: number): number {
    // Simple queries (greetings, basic questions): minimal context
    if (complexity <= 3) {
      return Math.min(10, maxResults);
    }

    // Moderate queries (single-topic questions): moderate context
    if (complexity <= 6) {
      return Math.min(30, maxResults);
    }

    // Complex queries (multi-part, comparative): use configured maximum
    return maxResults;
  }

  /**
   * Execute retrieval with enhancement params
   */
  private async executeRetrieval(opts: {
    enhancement: EnhancedQuery | null;
    params: RAGOrchestrationRequest;
    route: QueryRoute;
  }): Promise<RetrievedContext> {
    // Scale retrieval limit by query complexity and configured maximum
    const maxResults = this.hybridSearchRetriever.getMaxResultsPerQuery();
    const limit = this.calculateRetrievalLimit(opts.route.classification.complexity, maxResults);

    const retrievalParams: HybridSearchParams = {
      filters: {
        // Remove sessionId hard filter to enable cross-session memory
        // userId will still filter by user in the MCP layer
      },
      limit,
      query: opts.params.query,
      userId: opts.params.userId,
    };

    if (opts.enhancement?.expansion?.alternatives !== undefined) {
      retrievalParams.alternativeQueries = opts.enhancement.expansion.alternatives;
    }

    if (opts.enhancement?.hyde?.hypotheticalAnswer !== undefined) {
      retrievalParams.hypotheticalAnswer =
        opts.enhancement.hyde.hypotheticalAnswer;
    }

    if (opts.enhancement?.expansion?.related !== undefined) {
      retrievalParams.relatedQueries = opts.enhancement.expansion.related;
    }

    return this.hybridSearchRetriever.retrieve(retrievalParams);
  }

  /**
   * Execute tool planning if enabled
   */
  private async executeToolPlanning(opts: {
    fittedContext: FittedContext;
    params: RAGOrchestrationRequest;
    route: QueryRoute;
    stepsExecuted: string[];
  }): Promise<void> {
    if (!opts.route.strategy.useToolPlanning) {
      return;
    }

    opts.stepsExecuted.push('plan_tools');
    await this.toolPlanner.planTools({
      availableContext: opts.fittedContext.includedResults.map(
        (r) => r.payload.content
      ),
      complexity: opts.route.classification.complexity,
      query: opts.params.query,
    });
  }

  /**
   * Log orchestration completion
   */
  private logOrchestrationComplete(opts: {
    contextFitted: number;
    duration: number;
    pathTaken: string;
    stepsExecuted: string[];
  }): void {
    this.logger.info({
      message: 'RAG orchestration completed',
      metadata: {
        contextFitted: opts.contextFitted,
        duration: opts.duration,
        pathTaken: opts.pathTaken,
        stepsExecuted: opts.stepsExecuted,
      },
    });
  }

  /**
   * Log orchestration start
   */
  private logOrchestrationStart(params: RAGOrchestrationRequest): void {
    this.logger.info({
      message: 'RAG orchestration started',
      metadata: {
        messageId: params.messageId,
        query: params.query,
      },
    });
  }

  /**
   * Log routing decision
   */
  private logRouting(opts: {
    classification: QueryClassification;
    path: string;
  }): void {
    this.logger.debug({
      message: `Query routed to ${opts.path} path`,
      metadata: {
        complexity: opts.classification.complexity,
      },
    });
  }
}
