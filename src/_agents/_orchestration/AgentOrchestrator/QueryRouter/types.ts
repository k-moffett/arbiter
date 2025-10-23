/**
 * Query Router Type Definitions
 *
 * Types for query classification, routing, and strategy determination.
 */

/**
 * Query classification result
 */
export interface QueryClassification {
  category: 'conversational' | 'factual' | 'retrieval-required' | 'semantic' | 'temporal' | 'complex';
  complexity: number;
  confidence: number;
  needsRetrieval: boolean;
}

/**
 * Routing strategy flags
 */
export interface QueryStrategy {
  useDecomposition: boolean;
  useHybridSearch: boolean;
  useHyDE: boolean;
  useQueryExpansion: boolean;
  useToolPlanning: boolean;
}

/**
 * Complete query route
 */
export interface QueryRoute {
  classification: QueryClassification;
  metadata: {
    cacheKey?: string;
    estimatedLatency: number;
  };
  path: 'complex' | 'fast';
  rationale: string;
  strategy: QueryStrategy;
}

/**
 * Query router configuration
 */
export interface QueryRouterConfig {
  complexityThreshold: number;
  decompositionThreshold: number;
  fastPathMaxLatency: number;
  hydeThreshold: number;
}
