/**
 * RAG Component Configurations
 *
 * Centralized configuration for all RAG system components.
 * Provides sensible production-ready defaults based on 2024-2025 RAG research.
 */

import type { AdvancedPromptBuilderConfig } from '../AdvancedPromptBuilder/types';
import type { CacheConfig } from '../CacheManager/types';
import type { ContextWindowManagerConfig } from '../ContextWindowManager/types';
import type { HybridSearchRetrieverConfig } from '../HybridSearchRetriever/types';
import type { QualityGraderConfig } from '../QualityGrader/types';
import type { QueryDecomposerConfig } from '../QueryDecomposer/types';
import type { QueryEnhancerConfig } from '../QueryEnhancer/types';
import type { QueryRouterConfig } from '../QueryRouter/types';
import type { RAGValidatorConfig } from '../RAGValidator/types';
import type { ToolPlannerConfig } from '../ToolPlanner/types';

/**
 * Complete RAG system configuration
 */
export interface RAGSystemConfig {
  /**
   * Advanced prompt builder configuration
   */
  advancedPromptBuilder: AdvancedPromptBuilderConfig;

  /**
   * Cache manager configuration
   */
  cacheManager: CacheConfig;

  /**
   * Context window manager configuration
   */
  contextWindowManager: ContextWindowManagerConfig;

  /**
   * Default embedding model
   */
  embeddingModel: string;

  /**
   * Hybrid search retriever configuration
   */
  hybridSearchRetriever: HybridSearchRetrieverConfig;

  /**
   * Default LLM model for all components
   */
  llmModel: string;

  /**
   * Quality grader configuration
   */
  qualityGrader: QualityGraderConfig;

  /**
   * Query decomposer configuration
   */
  queryDecomposer: QueryDecomposerConfig;

  /**
   * Query enhancer configuration
   */
  queryEnhancer: QueryEnhancerConfig;

  /**
   * Query router configuration
   */
  queryRouter: QueryRouterConfig;

  /**
   * RAG validator configuration
   */
  ragValidator: RAGValidatorConfig;

  /**
   * Tool planner configuration
   */
  toolPlanner: ToolPlannerConfig;
}

/**
 * Default production-ready RAG configuration
 *
 * Based on research-backed best practices:
 * - Complexity threshold 7 for 70/30 fast/complex split
 * - 60/40 dense/BM25 weighting for hybrid search
 * - BM25 k1=1.5, b=0.75 (Okapi BM25 standards)
 * - 24576 context token window (Qwen2.5:32b, 75% of 32K max)
 * - 0.15 minimum relevance score (permissive for conversational context)
 * - Quality weights: 40% relevance, 30% completeness, 30% clarity
 */
export const DEFAULT_RAG_CONFIG: RAGSystemConfig = {
  // Global models
  llmModel: 'qwen2.5:14b',
  embeddingModel: 'nomic-embed-text',

  // QueryRouter
  queryRouter: {
    complexityThreshold: 7, // Fast path for ≤7, complex for >7
    decompositionThreshold: 7, // Decompose if complexity > 7
    fastPathMaxLatency: 5000, // 5 seconds max for fast path
    hydeThreshold: 6, // Use HyDE if complexity >= 6
  },

  // CacheManager
  cacheManager: {
    cacheDecompositions: true,
    cacheHyDE: true,
    cacheRoutes: true,
    cacheSearchResults: true,
    defaultTTL: 3600000, // 1 hour
    enabled: true,
    maxSize: 1000, // ~10MB memory for typical queries
  },

  // QueryDecomposer
  queryDecomposer: {
    llmModel: 'qwen2.5:32b',
    maxSubQueries: 5, // Limit complexity
    temperature: 0.4, // Balance creativity and consistency
  },

  // QueryEnhancer
  queryEnhancer: {
    llmModel: 'qwen2.5:32b',
    maxAlternatives: 3, // 3 alternative phrasings
    maxRelated: 2, // 2 related queries
    temperature: 0.5, // More creative for variations
  },

  // HybridSearchRetriever
  hybridSearchRetriever: {
    bm25B: 0.75, // Standard length normalization
    bm25K1: 1.5, // Standard term frequency saturation
    bm25Weight: 0.4, // 40% sparse
    denseWeight: 0.6, // 60% dense (semantic search weighted higher)
    maxResultsPerQuery: 50, // Per query variation (increased for historical context)
    temporalThresholds: {
      lastMessage: 300000, // 5 minutes
      recent: 3600000, // 1 hour
      session: 86400000, // 24 hours
    },
  },

  // ContextWindowManager
  contextWindowManager: {
    charsPerToken: 4, // Rough estimate (upgrade to tiktoken later)
    maxContextTokens: 24576, // Qwen2.5:32b (75% of 32K max)
    minResponseTokens: 512, // Reserve for response generation
  },

  // RAGValidator
  ragValidator: {
    defaultMinScore: 0.15, // More permissive for conversational context (was 0.3)
    llmModel: 'qwen2.5:32b',
    maxParallelValidations: 5, // Balance speed vs rate limits
    temperature: 0.3, // Consistent relevance scoring
  },

  // QualityGrader (feedback loop)
  qualityGrader: {
    llmModel: 'qwen2.5:32b',
    temperature: 0.3, // Consistent grading
    weights: {
      clarity: 0.3, // 30% - how clear
      completeness: 0.3, // 30% - how complete
      relevance: 0.4, // 40% - most important
    },
  },

  // ToolPlanner
  toolPlanner: {
    llmModel: 'qwen2.5:32b',
    maxSteps: 5, // Limit execution complexity
    temperature: 0.4, // Balance creativity and consistency
  },

  // AdvancedPromptBuilder
  advancedPromptBuilder: {
    charsPerToken: 4, // Rough estimate
    includeCitations: true, // Always include source attribution
    maxCitationLength: 500, // Truncate long citations
  },
};

/**
 * Create custom RAG config from environment variables
 *
 * Allows override of defaults via environment variables.
 * Useful for deployment-specific tuning.
 */
export function createRAGConfigFromEnv(): RAGSystemConfig {
  const config = { ...DEFAULT_RAG_CONFIG };

  applyGlobalConfigFromEnv(config);
  applyQueryRouterConfigFromEnv(config);
  applyCacheConfigFromEnv(config);
  applyHybridSearchConfigFromEnv(config);
  applyContextWindowConfigFromEnv(config);
  applyValidatorConfigFromEnv(config);

  return config;
}

/**
 * Apply global config from environment
 */
function applyGlobalConfigFromEnv(config: RAGSystemConfig): void {
  if (process.env['LLM_MODEL'] !== undefined) {
    config.llmModel = process.env['LLM_MODEL'];
  }
  if (process.env['EMBEDDING_MODEL'] !== undefined) {
    config.embeddingModel = process.env['EMBEDDING_MODEL'];
  }
}

/**
 * Apply query router config from environment
 */
function applyQueryRouterConfigFromEnv(config: RAGSystemConfig): void {
  if (process.env['QUERY_ROUTER_COMPLEXITY_THRESHOLD'] !== undefined) {
    config.queryRouter.complexityThreshold = parseInt(
      process.env['QUERY_ROUTER_COMPLEXITY_THRESHOLD'],
      10
    );
  }
}

/**
 * Apply cache config from environment
 */
function applyCacheConfigFromEnv(config: RAGSystemConfig): void {
  if (process.env['CACHE_MAX_SIZE'] !== undefined) {
    config.cacheManager.maxSize = parseInt(process.env['CACHE_MAX_SIZE'], 10);
  }
  if (process.env['CACHE_TTL'] !== undefined) {
    config.cacheManager.defaultTTL = parseInt(process.env['CACHE_TTL'], 10);
  }
}

/**
 * Apply hybrid search config from environment
 */
function applyHybridSearchConfigFromEnv(config: RAGSystemConfig): void {
  if (process.env['HYBRID_SEARCH_BM25_K1'] !== undefined) {
    config.hybridSearchRetriever.bm25K1 = parseFloat(process.env['HYBRID_SEARCH_BM25_K1']);
  }
  if (process.env['HYBRID_SEARCH_BM25_B'] !== undefined) {
    config.hybridSearchRetriever.bm25B = parseFloat(process.env['HYBRID_SEARCH_BM25_B']);
  }
  if (process.env['HYBRID_SEARCH_DENSE_WEIGHT'] !== undefined) {
    config.hybridSearchRetriever.denseWeight = parseFloat(
      process.env['HYBRID_SEARCH_DENSE_WEIGHT']
    );
  }
  if (process.env['HYBRID_SEARCH_BM25_WEIGHT'] !== undefined) {
    config.hybridSearchRetriever.bm25Weight = parseFloat(
      process.env['HYBRID_SEARCH_BM25_WEIGHT']
    );
  }
}

/**
 * Apply context window config from environment
 */
function applyContextWindowConfigFromEnv(config: RAGSystemConfig): void {
  if (process.env['CONTEXT_MAX_TOKENS'] !== undefined) {
    config.contextWindowManager.maxContextTokens = parseInt(
      process.env['CONTEXT_MAX_TOKENS'],
      10
    );
  }
}

/**
 * Apply validator config from environment
 */
function applyValidatorConfigFromEnv(config: RAGSystemConfig): void {
  if (process.env['RAG_VALIDATOR_MIN_SCORE'] !== undefined) {
    config.ragValidator.defaultMinScore = parseFloat(process.env['RAG_VALIDATOR_MIN_SCORE']);
  }
}
