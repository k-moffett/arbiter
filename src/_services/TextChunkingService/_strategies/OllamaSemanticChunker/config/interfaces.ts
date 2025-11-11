/**
 * Semantic Chunking Configuration - Type Definitions
 *
 * Defines all interfaces for semantic chunking configuration.
 * Configuration is loaded from env/.env.text-chunking file.
 */

/**
 * Weights for boundary score calculation
 *
 * All weights must sum to 1.0 (validated at startup with ±0.01 tolerance)
 *
 * @example
 * ```typescript
 * const weights: SemanticBoundaryWeights = {
 *   embedding: 0.30,
 *   topic: 0.25,
 *   discourse: 0.25,
 *   structure: 0.20
 * };
 * // Sum = 1.0 ✓
 * ```
 */
export interface SemanticBoundaryWeights {
  /** Weight for discourse relationship analysis (LLM-based, 0.0 - 1.0) */
  discourse: number;

  /** Weight for embedding distance (always calculated, 0.0 - 1.0) */
  embedding: number;

  /** Weight for structural boundary detection (0.0 - 1.0) */
  structure: number;

  /** Weight for topic shift analysis (LLM-based, 0.0 - 1.0) */
  topic: number;
}

/**
 * Adaptive threshold configuration
 *
 * Adaptive thresholding automatically adjusts boundary detection sensitivity
 * based on document statistics (mean + 1.5*stdDev of semantic distances).
 *
 * @example
 * ```typescript
 * const config: AdaptiveThresholdConfig = {
 *   enabled: true,
 *   minThreshold: 0.3,
 *   maxThreshold: 0.8,
 *   candidateBoundaryLimit: 500
 * };
 * ```
 */
export interface AdaptiveThresholdConfig {
  /**
   * Maximum candidate boundaries to analyze with LLM
   *
   * Limits the number of boundaries that receive full LLM analysis.
   * Higher = better quality but slower, Lower = faster but may miss boundaries.
   *
   * Recommended: 500 for 400-page documents
   */
  candidateBoundaryLimit: number;

  /**
   * Enable adaptive threshold calculation
   *
   * When true, threshold is calculated based on document statistics.
   * When false, maxThreshold is used for all boundaries.
   */
  enabled: boolean;

  /**
   * Maximum threshold (upper bound, 0.0 - 1.0)
   *
   * Used as:
   * - Fixed threshold when adaptive is disabled
   * - Upper bound when adaptive is enabled
   *
   * Higher values = less sensitive, only major topic shifts detected
   */
  maxThreshold: number;

  /**
   * Minimum threshold (lower bound, 0.0 - 1.0)
   *
   * Lower bound for adaptive threshold calculation.
   * Lower values = more sensitive, catches subtle topic shifts
   */
  minThreshold: number;
}

/**
 * Configuration parameters for semantic chunking
 *
 * Complete configuration for the semantic chunking service.
 * All parameters loaded from env/.env.text-chunking with sensible defaults.
 *
 * @example
 * ```typescript
 * const params: SemanticChunkingConfigParams = {
 *   adaptiveThreshold: {
 *     enabled: true,
 *     minThreshold: 0.3,
 *     maxThreshold: 0.8,
 *     candidateBoundaryLimit: 500
 *   },
 *   weights: {
 *     embedding: 0.30,
 *     topic: 0.25,
 *     discourse: 0.25,
 *     structure: 0.20
 *   },
 *   minChunkSize: 300,
 *   maxChunkSize: 1500,
 *   targetChunkSize: 1000,
 *   overlapPercentage: 15,
 *   alwaysPreserveStructure: true,
 *   progressFeedbackInterval: 10,
 *   tagExtractionEnabled: true
 * };
 * ```
 */
export interface SemanticChunkingConfigParams {
  /** Adaptive threshold settings */
  adaptiveThreshold: AdaptiveThresholdConfig;

  /**
   * Always preserve atomic units (tables, lists, code blocks)
   *
   * When true, atomic units are never split across chunks.
   * Recommended: true (prevents breaking structured content)
   */
  alwaysPreserveStructure: boolean;

  /**
   * Maximum chunk size in characters
   *
   * Chunks exceeding this size will be force-split even at non-boundaries.
   * Should be less than LLM context window minus prompt overhead.
   *
   * Recommended: 1500 (leaves room for prompts in 4K context window)
   */
  maxChunkSize: number;

  /**
   * Minimum chunk size in characters
   *
   * Prevents overly small chunks that lack sufficient context.
   * Chunks smaller than this will be merged with adjacent chunks if possible.
   *
   * Recommended: 300 (enough context for most queries)
   */
  minChunkSize: number;

  /**
   * Overlap percentage between chunks (0-100)
   *
   * Provides context continuity at chunk boundaries.
   * Higher = more overlap, better context but more storage.
   *
   * Recommended: 15 (15% overlap provides good continuity)
   */
  overlapPercentage: number;

  /**
   * Log progress every N sentences during boundary analysis
   *
   * Lower = more frequent updates (verbose)
   * Higher = less frequent updates (quieter logs)
   *
   * Recommended: 10 (good UX without log spam)
   */
  progressFeedbackInterval: number;

  /**
   * Enable tag extraction after chunking
   *
   * When true, each chunk is analyzed with NLM to extract:
   * - tags (keywords)
   * - entities (proper nouns)
   * - topics (themes)
   * - keyPhrases (important multi-word terms)
   *
   * Recommended: true (significantly improves search quality)
   */
  tagExtractionEnabled: boolean;

  /**
   * Target chunk size in characters
   *
   * Preferred size when no boundary constraints force different size.
   * Actual chunks will vary based on semantic boundaries.
   *
   * Recommended: 1000 (good balance of context and specificity)
   */
  targetChunkSize: number;

  /** Boundary score weights (must sum to 1.0) */
  weights: SemanticBoundaryWeights;
}

/**
 * Constructor parameters for SemanticChunkingConfig
 *
 * Allows customization of ENV file path and config overrides for testing.
 *
 * @example
 * ```typescript
 * // Use default ENV file
 * const config = new SemanticChunkingConfig();
 *
 * // Use custom ENV file
 * const config = new SemanticChunkingConfig({
 *   envFile: 'env/.env.text-chunking.test'
 * });
 *
 * // Override specific values (for testing)
 * const config = new SemanticChunkingConfig({
 *   overrides: {
 *     maxChunkSize: 2000,
 *     tagExtractionEnabled: false
 *   }
 * });
 * ```
 */
export interface SemanticChunkingConfigConstructorParams {
  /**
   * Path to ENV file
   *
   * If not specified, defaults to 'env/.env.text-chunking'
   */
  envFile?: string;

  /**
   * Override specific config values (primarily for testing)
   *
   * These overrides are applied after loading from ENV file.
   * Useful for test scenarios without modifying ENV files.
   */
  overrides?: Partial<SemanticChunkingConfigParams>;
}
