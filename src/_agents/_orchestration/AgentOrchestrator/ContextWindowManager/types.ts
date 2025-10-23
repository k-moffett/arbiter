/**
 * Context Window Manager Type Definitions
 *
 * Types for managing context window limits and token budgets.
 */

import type { HybridSearchResult } from '../HybridSearchRetriever/types';

/**
 * Fitted context result
 *
 * Contains context that has been fitted within the available token budget.
 */
export interface FittedContext {
  /**
   * Number of results included in fitted context
   */
  includedCount: number;

  /**
   * Results that were included (ordered by priority)
   */
  includedResults: HybridSearchResult[];

  /**
   * Token usage summary
   */
  tokenUsage: TokenUsage;

  /**
   * Number of results truncated due to token limit
   */
  truncatedCount: number;
}

/**
 * Token usage summary
 */
export interface TokenUsage {
  /**
   * Available tokens for context
   */
  available: number;

  /**
   * Tokens reserved for system prompt
   */
  reserved: number;

  /**
   * Total context window size
   */
  total: number;

  /**
   * Tokens used by fitted context
   */
  used: number;

  /**
   * Utilization percentage (0-1)
   */
  utilization: number;
}

/**
 * Context window fit parameters
 */
export interface ContextFitParams {
  /**
   * Maximum tokens available for context
   * If not specified, uses config default
   */
  maxTokens?: number;

  /**
   * Tokens reserved for other parts of prompt (query, instructions, etc.)
   * Default: 512
   */
  reservedTokens?: number;

  /**
   * Search results to fit within context window
   */
  results: HybridSearchResult[];
}

/**
 * Context window manager configuration
 */
export interface ContextWindowManagerConfig {
  /**
   * Average characters per token (rough estimate)
   * Typical: 4 characters per token
   */
  charsPerToken: number;

  /**
   * Maximum context window size in tokens
   * Should match the LLM model being used
   */
  maxContextTokens: number;

  /**
   * Minimum tokens to reserve for response generation
   * Ensures LLM has room to generate a response
   */
  minResponseTokens: number;
}
