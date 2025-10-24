/**
 * Ollama Boundary Scorer
 *
 * Weighted combination of boundary signals for final chunking decisions.
 * Combines topic, discourse, structure, and semantic signals.
 */

import type { BoundaryScore, BoundarySignal, BoundaryWeights } from './types';

/**
 * Ollama Boundary Scorer Configuration
 */
export interface OllamaBoundaryScorerConfig {
  /** Boundary detection weights */
  weights: BoundaryWeights;
}

/**
 * Ollama Boundary Scorer
 *
 * Combines multiple boundary detection signals with configurable weights
 * to produce a final boundary score.
 *
 * @example
 * ```typescript
 * const scorer = new OllamaBoundaryScorer({
 *   weights: {
 *     ollamaTopic: 0.35,
 *     ollamaDiscourse: 0.25,
 *     ollamaStructure: 0.20,
 *     semanticEmbed: 0.20
 *   }
 * });
 *
 * const score = scorer.calculateBoundaryScore({
 *   topicStrength: 0.8,
 *   discourseStrength: 0.3,
 *   structureStrength: 0.9,
 *   semanticDistance: 0.6
 * });
 *
 * console.log(score.weightedScore); // 0.67 (strong boundary)
 * ```
 */
export class OllamaBoundaryScorer {
  private readonly weights: BoundaryWeights;

  constructor(config: OllamaBoundaryScorerConfig) {
    this.weights = config.weights;
    this.validateWeights();
  }

  /**
   * Calculate weighted boundary score from multiple signals
   */
  public calculateBoundaryScore(params: {
    /** Discourse relationship strength (0-1) */
    discourseStrength: number;

    /** Semantic embedding distance (0-1, higher = more different) */
    semanticDistance: number;

    /** Document structure strength (0-1) */
    structureStrength: number;

    /** Topic shift strength (0-1) */
    topicStrength: number;
  }): BoundaryScore {
    const signals: BoundarySignal[] = [
      {
        confidence: 1.0, // Topic analyzer has its own confidence
        name: 'topic',
        strength: params.topicStrength,
      },
      {
        confidence: 1.0, // Discourse classifier has its own confidence
        name: 'discourse',
        strength: params.discourseStrength,
      },
      {
        confidence: 1.0, // Structure detector has its own confidence
        name: 'structure',
        strength: params.structureStrength,
      },
      {
        confidence: 1.0, // Embedding distance is deterministic
        name: 'semantic',
        strength: params.semanticDistance,
      },
    ];

    const weightedScore = this.calculateWeightedScore({ signals });

    return { signals, weightedScore };
  }

  /**
   * Calculate weighted score from signals
   */
  private calculateWeightedScore(params: { signals: BoundarySignal[] }): number {
    let totalScore = 0;
    let totalWeight = 0;

    const weightMap: Record<string, number> = {
      topic: this.weights.ollamaTopic,
      discourse: this.weights.ollamaDiscourse,
      structure: this.weights.ollamaStructure,
      semantic: this.weights.semanticEmbed,
    };

    for (const signal of params.signals) {
      const weight = weightMap[signal.name] ?? 0;
      totalScore += signal.strength * weight;
      totalWeight += weight;
    }

    // Normalize by total weight (should be ~1.0 but handle edge cases)
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Validate weights sum to ~1.0
   */
  private validateWeights(): void {
    const sum =
      this.weights.ollamaTopic +
      this.weights.ollamaDiscourse +
      this.weights.ollamaStructure +
      this.weights.semanticEmbed;

    if (Math.abs(sum - 1.0) > 0.01) {
      console.warn(
        `[WARN] BoundaryScorer weights sum to ${sum.toFixed(2)}, expected 1.0. ` +
          `Results may be skewed.`
      );
    }
  }
}
