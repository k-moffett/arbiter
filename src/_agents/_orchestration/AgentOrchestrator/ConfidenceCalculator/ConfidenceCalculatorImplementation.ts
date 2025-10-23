/**
 * Confidence Calculator Utility
 *
 * Calculates dynamic confidence scores based on RAG metadata.
 * Replaces static 0.8 confidence with intelligent scoring.
 */

import type { Citation } from '../AdvancedPromptBuilder/types';
import type { RAGOrchestrationMetadata } from '../types';

/**
 * Confidence Calculator
 *
 * Calculates confidence score (0-1) based on:
 * 1. Number of validated results (more = higher confidence)
 * 2. Average citation relevance scores
 * 3. Path taken (complex path = more thorough = higher confidence)
 * 4. Whether HyDE was used (hypothetical answers = higher confidence)
 * 5. Whether decomposition was used (complex analysis = varies)
 *
 * @example
 * ```typescript
 * const confidence = ConfidenceCalculatorImplementation.calculate({
 *   metadata: {
 *     contextStats: { validated: 8, retrieved: 20, fitted: 8 },
 *     enhanced: true,
 *     decomposed: false,
 *     stepsExecuted: ['route', 'enhance', 'retrieve', 'validate'],
 *     duration: 4500
 *   },
 *   citations: [
 *     { relevanceScore: 0.9, ... },
 *     { relevanceScore: 0.85, ... },
 *     // ...
 *   ]
 * });
 * // confidence ≈ 0.85
 * ```
 */
// Static utility class with pure calculation methods
/* eslint-disable perfectionist/sort-classes, @typescript-eslint/no-extraneous-class */
export class ConfidenceCalculatorImplementation {
  /**
   * Private constructor to prevent instantiation
   */
  private constructor() {
    // Static-only class
  }

  /**
   * Calculate confidence score from RAG metadata
   */
  public static calculate(params: {
    citations: Citation[];
    metadata: RAGOrchestrationMetadata;
  }): number {
    let confidence = 0.5;

    const validatedCount = params.metadata.contextStats.validated;
    const retrievedCount = params.metadata.contextStats.retrieved;

    confidence += this.calculateValidatedBoost({ validatedCount });
    confidence += this.calculateRelevanceBoost({ citations: params.citations });

    if (params.metadata.enhanced) {
      confidence += 0.1;
    }

    if (params.metadata.decomposed && validatedCount >= 5) {
      confidence += 0.05;
    }

    confidence += this.calculateValidationRatioBoost({
      retrievedCount,
      validatedCount,
    });

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * Calculate confidence with explanation (for debugging)
   */
  public static calculateWithExplanation(params: {
    citations: Citation[];
    metadata: RAGOrchestrationMetadata;
  }): {
    confidence: number;
    explanation: string[];
  } {
    const boosts = this.calculateAllBoosts(params);
    const confidence = Math.min(1.0, Math.max(0.0, boosts.total));
    const explanation = this.buildExplanation(boosts);

    return { confidence, explanation };
  }

  /**
   * Build explanation string array from boosts
   */
  private static buildExplanation(params: {
    enhanced: number;
    ratioBoost: number;
    ratioValue: number;
    relevanceBoost: number;
    total: number;
    validatedBoost: number;
    validatedCount: number;
  }): string[] {
    const explanation: string[] = ['Base confidence: 0.5'];
    const { validatedBoost, validatedCount } = params;
    const { relevanceBoost, enhanced, ratioBoost, ratioValue } = params;

    explanation.push(
      `+${validatedBoost.toFixed(2)} (validated: ${String(validatedCount)})`
    );
    explanation.push(`+${relevanceBoost.toFixed(2)} (avg relevance)`);

    if (enhanced > 0) {
      explanation.push('+0.1 (query enhanced with HyDE/expansion)');
    }

    if (ratioValue > 0) {
      const sign = ratioBoost >= 0 ? '+' : '';
      explanation.push(
        `${sign}${ratioBoost.toFixed(2)} (ratio: ${ratioValue.toFixed(2)})`
      );
    }

    explanation.push(`Final: ${params.total.toFixed(2)}`);
    return explanation;
  }

  /**
   * Calculate all boost values
   */
  private static calculateAllBoosts(params: {
    citations: Citation[];
    metadata: RAGOrchestrationMetadata;
  }): {
    decomposed: number;
    enhanced: number;
    ratioBoost: number;
    ratioValue: number;
    relevanceBoost: number;
    total: number;
    validatedBoost: number;
    validatedCount: number;
  } {
    const validatedCount = params.metadata.contextStats.validated;
    const retrievedCount = params.metadata.contextStats.retrieved;

    const validatedBoost = this.calculateValidatedBoost({ validatedCount });
    const relevanceBoost = this.calculateRelevanceBoost({
      citations: params.citations,
    });
    const enhanced = params.metadata.enhanced ? 0.1 : 0;
    const decomposed =
      params.metadata.decomposed && validatedCount >= 5 ? 0.05 : 0;
    const ratioBoost = this.calculateValidationRatioBoost({
      retrievedCount,
      validatedCount,
    });
    const ratioValue =
      retrievedCount > 0 ? validatedCount / retrievedCount : 0;

    const total =
      0.5 + validatedBoost + relevanceBoost + enhanced + decomposed + ratioBoost;

    return {
      decomposed,
      enhanced,
      ratioBoost,
      ratioValue,
      relevanceBoost,
      total,
      validatedBoost,
      validatedCount,
    };
  }

  /**
   * Calculate average relevance boost from citations
   */
  private static calculateRelevanceBoost(params: {
    citations: Citation[];
  }): number {
    if (params.citations.length === 0) {
      return 0;
    }

    let totalRelevance = 0;
    for (const citation of params.citations) {
      totalRelevance += citation.relevanceScore;
    }
    const avgRelevance = totalRelevance / params.citations.length;
    return avgRelevance * 0.2;
  }

  /**
   * Calculate boost from validated result count
   */
  private static calculateValidatedBoost(params: {
    validatedCount: number;
  }): number {
    const { validatedCount } = params;
    if (validatedCount >= 8) {
      return 0.2;
    }
    if (validatedCount >= 5) {
      return 0.15;
    }
    if (validatedCount >= 3) {
      return 0.1;
    }
    if (validatedCount >= 1) {
      return 0.05;
    }
    return 0;
  }

  /**
   * Calculate validation ratio boost/penalty
   */
  private static calculateValidationRatioBoost(params: {
    retrievedCount: number;
    validatedCount: number;
  }): number {
    if (params.retrievedCount === 0) {
      return 0;
    }

    const ratio = params.validatedCount / params.retrievedCount;
    if (ratio >= 0.5) {
      return 0.05;
    }
    if (ratio < 0.2) {
      return -0.05;
    }
    return 0;
  }
}
