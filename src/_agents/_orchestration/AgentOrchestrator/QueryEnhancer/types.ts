/**
 * Query Enhancer Type Definitions
 *
 * Types for query enhancement including HyDE and query expansion.
 */

/**
 * HyDE (Hypothetical Document Embeddings) result
 *
 * Contains the generated hypothetical answer that can be used
 * for semantic search alongside the original query.
 */
export interface HyDEResult {
  /**
   * Confidence in the hypothetical answer (0-1)
   */
  confidence: number;

  /**
   * The generated hypothetical answer/document
   */
  hypotheticalAnswer: string;

  /**
   * The original query that was enhanced
   */
  originalQuery: string;
}

/**
 * Query expansion result
 *
 * Contains alternative phrasings and related queries that can
 * improve recall by searching for multiple variations.
 */
export interface QueryExpansion {
  /**
   * Alternative phrasings of the same query
   */
  alternatives: string[];

  /**
   * The original query that was expanded
   */
  originalQuery: string;

  /**
   * Related queries that might help answer the original
   */
  related: string[];
}

/**
 * Enhanced query containing all enhancement techniques
 *
 * This is the output of the QueryEnhancer, containing the original
 * query plus any enhancements (HyDE, expansions) that were applied.
 */
export interface EnhancedQuery {
  /**
   * Query expansion (alternatives + related queries)
   * null if expansion was not performed
   */
  expansion: QueryExpansion | null;

  /**
   * HyDE hypothetical answer
   * null if HyDE was not performed
   */
  hyde: HyDEResult | null;

  /**
   * The original query before enhancement
   */
  originalQuery: string;
}

/**
 * Query enhancer configuration
 */
export interface QueryEnhancerConfig {
  /**
   * LLM model to use for enhancement
   */
  llmModel: string;

  /**
   * Maximum number of alternative phrasings to generate
   */
  maxAlternatives: number;

  /**
   * Maximum number of related queries to generate
   */
  maxRelated: number;

  /**
   * Temperature for LLM generation
   */
  temperature: number;
}
