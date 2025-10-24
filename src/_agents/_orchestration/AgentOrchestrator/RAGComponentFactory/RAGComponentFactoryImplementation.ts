/**
 * RAG Component Factory
 *
 * Factory for creating and wiring RAGOrchestrationService with all dependencies.
 * Implements dependency injection pattern for clean, testable architecture.
 */

import type { Logger } from '../../../../_shared/_infrastructure';
import type { MCPClient } from '../../../_shared/_lib/MCPClient';
import type { CompletionParams, LLMResponse } from '../../../_shared/types';
import type { RAGSystemConfig } from '../RAGComponentConfigs';

import { AdvancedPromptBuilder } from '../AdvancedPromptBuilder';
import { CacheManager } from '../CacheManager';
import { CollectionSelectorImplementation } from '../CollectionSelector';
import { ContextWindowManager } from '../ContextWindowManager';
import { EmbeddingProviderAdapter } from '../EmbeddingProviderAdapter';
import { HybridSearchRetriever } from '../HybridSearchRetriever';
import { MultiCollectionRetrieverImplementation } from '../MultiCollectionRetriever';
import { QualityGrader } from '../QualityGrader';
import { QueryDecomposer } from '../QueryDecomposer';
import { QueryEnhancer } from '../QueryEnhancer';
import { QueryRouter } from '../QueryRouter';
import { RAGOrchestrationService } from '../RAGOrchestrationService';
import { RAGValidator } from '../RAGValidator';
import { ToolPlanner } from '../ToolPlanner';
import { VectorSearchToolAdapter } from '../VectorSearchToolAdapter';

/**
 * Ollama provider interface
 */
interface OllamaProvider {
  complete(params: CompletionParams): Promise<LLMResponse>;
  embed(params: { model: string; text: string }): Promise<number[]>;
}

/**
 * Factory parameters
 */
export interface RAGComponentFactoryParams {
  /**
   * RAG system configuration
   */
  config: RAGSystemConfig;

  /**
   * Logger instance
   */
  logger: Logger;

  /**
   * MCP client for context operations
   */
  mcpClient: MCPClient;

  /**
   * Ollama provider for LLM and embeddings
   */
  ollamaProvider: OllamaProvider;

  /**
   * User ID for component initialization
   * (Will be overridden per request, but needed for cache key generation)
   */
  userId: string;
}

/**
 * RAG Component Factory Implementation
 *
 * Creates fully initialized RAGOrchestrationService with all components.
 *
 * Dependency Graph:
 * ```
 * RAGOrchestrationService
 *   ├── QueryRouter (CacheManager, OllamaProvider)
 *   ├── QueryEnhancer (CacheManager, OllamaProvider)
 *   ├── QueryDecomposer (CacheManager, OllamaProvider)
 *   ├── MultiCollectionRetriever
 *   │   ├── CollectionSelector (OllamaProvider)
 *   │   ├── HybridSearchRetriever (EmbeddingProvider, VectorSearchTool)
 *   │   ├── EmbeddingProvider (OllamaProvider)
 *   │   └── MCPClient
 *   ├── RAGValidator (OllamaProvider)
 *   ├── ContextWindowManager
 *   ├── AdvancedPromptBuilder
 *   ├── ToolPlanner (OllamaProvider)
 *   └── QualityGrader (OllamaProvider)
 * ```
 *
 * @example
 * ```typescript
 * const ragService = RAGComponentFactoryImplementation.create({
 *   config: DEFAULT_RAG_CONFIG,
 *   logger,
 *   mcpClient,
 *   ollamaProvider,
 *   userId: 'system'
 * });
 *
 * const result = await ragService.orchestrate({
 *   messageId: 'msg_123',
 *   query: 'What did we discuss?',
 *   userId: 'user_123',
 *   sessionId: 'session_123'
 * });
 * ```
 */
/* eslint-disable @typescript-eslint/no-extraneous-class */
export class RAGComponentFactoryImplementation {
  /**
   * Private constructor to prevent instantiation
   */
  private constructor() {
    // Static-only class
  }

  /**
   * Create RAG orchestration service with all components
   */
  public static create(params: RAGComponentFactoryParams): RAGOrchestrationService {
    params.logger.info({
      message: 'Initializing RAG system components',
      metadata: {
        embeddingModel: params.config.embeddingModel,
        llmModel: params.config.llmModel,
      },
    });

    const foundationComponents = this.createFoundationComponents(params);
    const queryComponents = this.createQueryComponents({
      ...params,
      cacheManager: foundationComponents.cacheManager,
    });
    const retrievalComponents = this.createRetrievalComponents({
      ...params,
      ...foundationComponents,
    });
    const contextComponents = this.createContextComponents(params);
    const feedbackComponents = this.createFeedbackComponents(params);

    const ragService = new RAGOrchestrationService({
      ...contextComponents,
      ...feedbackComponents,
      ...queryComponents,
      ...retrievalComponents,
      logger: params.logger,
    });

    this.logInitializationComplete(params.logger);

    return ragService;
  }

  /**
   * Create context management components
   */
  private static createContextComponents(
    params: RAGComponentFactoryParams
  ): {
    advancedPromptBuilder: AdvancedPromptBuilder;
    contextWindowManager: ContextWindowManager;
  } {
    const contextWindowManager = new ContextWindowManager({
      config: params.config.contextWindowManager,
      logger: params.logger,
    });

    const advancedPromptBuilder = new AdvancedPromptBuilder({
      config: params.config.advancedPromptBuilder,
      logger: params.logger,
    });

    params.logger.debug({ message: 'Context components initialized' });

    return { advancedPromptBuilder, contextWindowManager };
  }

  /**
   * Create feedback loop components
   */
  private static createFeedbackComponents(
    params: RAGComponentFactoryParams
  ): {
    qualityGrader: QualityGrader;
    toolPlanner: ToolPlanner;
  } {
    const toolPlanner = new ToolPlanner({
      config: params.config.toolPlanner,
      logger: params.logger,
      ollamaProvider: params.ollamaProvider,
    });

    const qualityGrader = new QualityGrader({
      config: params.config.qualityGrader,
      logger: params.logger,
      ollamaProvider: params.ollamaProvider,
    });

    params.logger.debug({ message: 'Feedback components initialized' });

    return { qualityGrader, toolPlanner };
  }

  /**
   * Create foundation components (cache and adapters)
   */
  private static createFoundationComponents(
    params: RAGComponentFactoryParams
  ): {
    cacheManager: CacheManager;
    embeddingProvider: EmbeddingProviderAdapter;
    vectorSearchTool: VectorSearchToolAdapter;
  } {
    const cacheManager = new CacheManager({
      config: params.config.cacheManager,
      logger: params.logger,
    });

    const embeddingProvider = new EmbeddingProviderAdapter({
      embeddingModel: params.config.embeddingModel,
      logger: params.logger,
      ollamaProvider: params.ollamaProvider,
    });

    const vectorSearchTool = new VectorSearchToolAdapter({
      logger: params.logger,
      mcpClient: params.mcpClient,
    });

    params.logger.debug({ message: 'Foundation components initialized' });

    return { cacheManager, embeddingProvider, vectorSearchTool };
  }

  /**
   * Create query processing components
   */
  private static createQueryComponents(
    params: RAGComponentFactoryParams & { cacheManager: CacheManager }
  ): {
    queryDecomposer: QueryDecomposer;
    queryEnhancer: QueryEnhancer;
    queryRouter: QueryRouter;
  } {
    const queryRouter = new QueryRouter({
      cacheManager: params.cacheManager,
      config: params.config.queryRouter,
      logger: params.logger,
      ollamaProvider: params.ollamaProvider,
    });

    const queryEnhancer = new QueryEnhancer({
      cacheManager: params.cacheManager,
      config: params.config.queryEnhancer,
      logger: params.logger,
      ollamaProvider: params.ollamaProvider,
      userId: params.userId,
    });

    const queryDecomposer = new QueryDecomposer({
      cacheManager: params.cacheManager,
      config: params.config.queryDecomposer,
      logger: params.logger,
      ollamaProvider: params.ollamaProvider,
      userId: params.userId,
    });

    params.logger.debug({ message: 'Query processing components initialized' });

    return { queryDecomposer, queryEnhancer, queryRouter };
  }

  /**
   * Create retrieval and validation components
   */
  private static createRetrievalComponents(
    params: RAGComponentFactoryParams & {
      embeddingProvider: EmbeddingProviderAdapter;
      vectorSearchTool: VectorSearchToolAdapter;
    }
  ): {
    multiCollectionRetriever: MultiCollectionRetrieverImplementation;
    ragValidator: RAGValidator;
  } {
    // Create HybridSearchRetriever (still used for conversation-history)
    const hybridSearchRetriever = new HybridSearchRetriever({
      config: params.config.hybridSearchRetriever,
      embeddingProvider: params.embeddingProvider,
      logger: params.logger,
      vectorSearchTool: params.vectorSearchTool,
    });

    // Create CollectionSelector for intelligent collection discovery
    const collectionSelector = new CollectionSelectorImplementation({
      llm: {
        generate: async (generateParams: { prompt: string; temperature?: number }) => {
          const response = await params.ollamaProvider.complete({
            maxTokens: 500,
            model: params.config.llmModel,
            prompt: generateParams.prompt,
            temperature: generateParams.temperature ?? 0.7,
          });
          return response.text;
        },
      },
    });

    // Create MultiCollectionRetriever (wraps HybridSearchRetriever)
    const multiCollectionRetriever = new MultiCollectionRetrieverImplementation({
      collectionSelector,
      embeddingService: {
        embed: async (embedParams: { text: string }) => {
          return await params.ollamaProvider.embed({
            model: params.config.embeddingModel,
            text: embedParams.text,
          });
        },
      },
      hybridSearchRetriever,
      mcpClient: params.mcpClient,
    });

    const ragValidator = new RAGValidator({
      config: params.config.ragValidator,
      logger: params.logger,
      ollamaProvider: params.ollamaProvider,
    });

    params.logger.debug({ message: 'Retrieval components initialized (multi-collection)' });

    return { multiCollectionRetriever, ragValidator };
  }

  /**
   * Log initialization complete
   */
  private static logInitializationComplete(logger: Logger): void {
    logger.info({
      message: 'RAG system initialization complete',
      metadata: {
        components: [
          'QueryRouter',
          'QueryEnhancer',
          'QueryDecomposer',
          'CollectionSelector',
          'MultiCollectionRetriever',
          'HybridSearchRetriever',
          'RAGValidator',
          'ContextWindowManager',
          'AdvancedPromptBuilder',
          'ToolPlanner',
          'QualityGrader',
        ],
        totalComponents: 12,
      },
    });
  }
}
