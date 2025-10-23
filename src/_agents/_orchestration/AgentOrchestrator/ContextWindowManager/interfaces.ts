/**
 * Context Window Manager Interfaces
 *
 * Interface definitions for context window management.
 */

import type { ContextFitParams, FittedContext } from './types';

/**
 * Context window manager interface
 *
 * Manages LLM context window limits by fitting retrieved context
 * within available token budget, prioritizing by relevance.
 */
export interface ContextWindowManager {
  /**
   * Estimate token count for text
   *
   * Uses a simple character-based heuristic (chars / charsPerToken).
   * For production, consider using a proper tokenizer like tiktoken.
   *
   * @param params - Estimation parameters
   * @param params.text - Text to estimate token count for
   * @returns Estimated token count
   */
  estimateTokens(params: { text: string }): number;

  /**
   * Fit context within available token budget
   *
   * Takes search results and fits them within the available context window,
   * prioritizing by combined relevance score. Results are included in order
   * until the token budget is exhausted.
   *
   * @param params - Fit parameters
   * @param params.results - Search results to fit
   * @param params.reservedTokens - Tokens reserved for prompt/query (default: 512)
   * @param params.maxTokens - Override max tokens (uses config default if not specified)
   * @returns Fitted context with token usage metadata
   */
  fitContext(params: ContextFitParams): FittedContext;
}
