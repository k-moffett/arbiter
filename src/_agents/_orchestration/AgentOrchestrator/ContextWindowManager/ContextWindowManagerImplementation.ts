/**
 * Context Window Manager Implementation
 *
 * Manages LLM context window limits by fitting retrieved context
 * within available token budget.
 *
 * NOTE: Uses simple character-based token estimation (chars / 4).
 * For production, consider using proper tokenizer like tiktoken.
 */

import type { Logger } from '../../../../_shared/_infrastructure';
import type { HybridSearchResult } from '../HybridSearchRetriever/types';
import type { ContextWindowManager } from './interfaces';
import type {
  ContextFitParams,
  ContextWindowManagerConfig,
  FittedContext,
  TokenUsage,
} from './types';

/**
 * Context Window Manager Implementation
 *
 * @example
 * ```typescript
 * const manager = new ContextWindowManagerImplementation({
 *   config: {
 *     maxContextTokens: 4096,
 *     minResponseTokens: 512,
 *     charsPerToken: 4
 *   },
 *   logger
 * });
 *
 * const fitted = manager.fitContext({
 *   results: searchResults,
 *   reservedTokens: 512
 * });
 * // fitted.includedResults contains results that fit
 * // fitted.tokenUsage shows token utilization
 * ```
 */
export class ContextWindowManagerImplementation implements ContextWindowManager {
  private readonly config: ContextWindowManagerConfig;
  private readonly logger: Logger;

  constructor(params: { config: ContextWindowManagerConfig; logger: Logger }) {
    this.config = params.config;
    this.logger = params.logger;
  }

  /**
   * Estimate token count for text
   */
  public estimateTokens(params: { text: string }): number {
    // Simple character-based estimation
    // For production, use a proper tokenizer like tiktoken
    const charCount = params.text.length;
    return Math.ceil(charCount / this.config.charsPerToken);
  }

  /**
   * Fit context within available token budget
   */
  public fitContext(params: ContextFitParams): FittedContext {
    const reservedTokens = params.reservedTokens ?? 512;
    const maxTokens =
      params.maxTokens ??
      this.config.maxContextTokens - this.config.minResponseTokens;
    const availableTokens = maxTokens - reservedTokens;

    if (availableTokens <= 0) {
      return this.createEmptyContext({
        availableTokens,
        maxTokens,
        reservedTokens,
        totalResults: params.results.length,
      });
    }

    const sortedResults = this.sortByScore({ results: params.results });
    const fitted = this.fitResultsWithinBudget({
      availableTokens,
      results: sortedResults,
    });

    const tokenUsage = this.createTokenUsage({
      availableTokens,
      maxTokens,
      reservedTokens,
      usedTokens: fitted.usedTokens,
    });

    const truncatedCount = params.results.length - fitted.includedResults.length;

    this.logger.info({
      message: 'Context fitted within token budget',
      metadata: {
        includedCount: fitted.includedResults.length,
        tokenUsage,
        truncatedCount,
      },
    });

    return {
      includedCount: fitted.includedResults.length,
      includedResults: fitted.includedResults,
      tokenUsage,
      truncatedCount,
    };
  }

  /**
   * Create empty context when no tokens available
   */
  private createEmptyContext(params: {
    availableTokens: number;
    maxTokens: number;
    reservedTokens: number;
    totalResults: number;
  }): FittedContext {
    this.logger.warn({
      message: 'No tokens available for context after reservations',
      metadata: {
        maxTokens: params.maxTokens,
        reservedTokens: params.reservedTokens,
      },
    });

    return {
      includedCount: 0,
      includedResults: [],
      tokenUsage: {
        available: params.availableTokens,
        reserved: params.reservedTokens,
        total: params.maxTokens,
        used: 0,
        utilization: 0,
      },
      truncatedCount: params.totalResults,
    };
  }

  /**
   * Create token usage summary
   */
  private createTokenUsage(params: {
    availableTokens: number;
    maxTokens: number;
    reservedTokens: number;
    usedTokens: number;
  }): TokenUsage {
    const utilization =
      params.availableTokens > 0 ? params.usedTokens / params.availableTokens : 0;

    return {
      available: params.availableTokens,
      reserved: params.reservedTokens,
      total: params.maxTokens,
      used: params.usedTokens,
      utilization,
    };
  }

  /**
   * Fit results within token budget
   */
  private fitResultsWithinBudget(params: {
    availableTokens: number;
    results: HybridSearchResult[];
  }): {
    includedResults: HybridSearchResult[];
    usedTokens: number;
  } {
    const includedResults: HybridSearchResult[] = [];
    let usedTokens = 0;

    for (const result of params.results) {
      const contentTokens = this.estimateTokens({
        text: result.payload.content,
      });

      if (usedTokens + contentTokens <= params.availableTokens) {
        includedResults.push(result);
        usedTokens += contentTokens;
      } else {
        break;
      }
    }

    return { includedResults, usedTokens };
  }

  /**
   * Sort results by combined score (highest first)
   */
  private sortByScore(params: {
    results: HybridSearchResult[];
  }): HybridSearchResult[] {
    const sorted: HybridSearchResult[] = [...params.results];
    for (let i = 0; i < sorted.length - 1; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const resultI: HybridSearchResult | undefined = sorted[i];
        const resultJ: HybridSearchResult | undefined = sorted[j];
        if (resultI === undefined || resultJ === undefined) {
          continue;
        }
        if (resultJ.combinedScore > resultI.combinedScore) {
          sorted[i] = resultJ;
          sorted[j] = resultI;
        }
      }
    }
    return sorted;
  }
}
