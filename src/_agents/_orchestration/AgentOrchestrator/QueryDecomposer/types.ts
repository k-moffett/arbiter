/**
 * Query Decomposer Type Definitions
 *
 * Types for query analysis and decomposition.
 */

/**
 * Query intent analysis
 */
export interface QueryIntent {
  confidence: number;
  requiresContext: boolean;
  requiresTools: boolean;
  temporalScope: 'all_time' | 'lastMessage' | 'recent' | 'session' | null;
  topics: string[];
  type: 'comparative' | 'factual' | 'hybrid' | 'listBuilding' | 'semantic' | 'temporal';
}

/**
 * Query analysis result
 */
export interface QueryAnalysis {
  complexity: number;
  decomposition: import('../types').DecomposedQuery;
  intent: QueryIntent;
  originalQuery: string;
  suggestedApproach: 'agent-spawn' | 'multi-step' | 'single-shot';
}

/**
 * Query decomposer configuration
 */
export interface QueryDecomposerConfig {
  llmModel: string;
  maxSubQueries: number;
  temperature: number;
}
