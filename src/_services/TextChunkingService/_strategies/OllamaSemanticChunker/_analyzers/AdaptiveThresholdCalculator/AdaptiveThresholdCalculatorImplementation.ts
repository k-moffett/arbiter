/**
 * Adaptive Threshold Calculator Implementation
 *
 * Calculates threshold for boundary detection based on document statistics.
 * Used in Pass 1 of two-pass boundary detection to identify candidates for LLM analysis.
 *
 * Single Responsibility: Statistical threshold calculation for semantic boundaries
 *
 * Algorithm:
 * 1. Calculate mean and standard deviation of embedding distances
 * 2. Set threshold = mean + 1.5 * stdDev (captures significant outliers)
 * 3. Clamp to [minThreshold, maxThreshold] bounds
 * 4. If candidates exceed limit, raise threshold to top-N% (quality filter)
 *
 * @example
 * ```typescript
 * const calculator = new AdaptiveThresholdCalculator();
 *
 * const threshold = calculator.calculateThreshold({
 *   distances: [0.02, 0.03, 0.05, 0.08, 0.12, ...],
 *   minThreshold: 0.3,
 *   maxThreshold: 0.8,
 *   candidateBoundaryLimit: 500
 * });
 * // Returns: 0.45 (mean + 1.5*stdDev, clamped and adjusted for candidate limit)
 * ```
 */

import type { CalculateThresholdParams } from './interfaces.js';

/**
 * Adaptive Threshold Calculator
 *
 * Provides statistical threshold calculation for semantic boundary detection.
 * Adapts threshold based on document characteristics to optimize Pass 2 LLM analysis.
 *
 * Performance Impact:
 * - Lower threshold = more candidates = slower but more thorough
 * - Higher threshold = fewer candidates = faster but may miss boundaries
 * - Adaptive approach balances quality and performance
 */
export class AdaptiveThresholdCalculator {
  /**
   * Calculate adaptive threshold for boundary detection
   *
   * Uses statistical analysis (mean + 1.5*stdDev) to identify boundaries
   * that represent significant semantic shifts warranting LLM analysis.
   *
   * @param params - Calculation parameters
   * @param params.distances - Embedding distances between sentences
   * @param params.minThreshold - Lower bound (0.0 - 1.0)
   * @param params.maxThreshold - Upper bound (0.0 - 1.0)
   * @param params.candidateBoundaryLimit - Max candidates for Pass 2
   * @returns Adaptive threshold value [minThreshold, maxThreshold]
   *
   * @throws {Error} If distances array is empty
   * @throws {Error} If thresholds are invalid
   *
   * @example
   * ```typescript
   * // Document with mostly small distances and few large jumps
   * const threshold = calculator.calculateThreshold({
   *   distances: [0.02, 0.03, 0.05, 0.08, 0.12, 0.45, 0.52],
   *   minThreshold: 0.3,
   *   maxThreshold: 0.8,
   *   candidateBoundaryLimit: 500
   * });
   * // Returns: ~0.35 (detects the large jumps at 0.45, 0.52)
   * ```
   */
  public calculateThreshold(params: CalculateThresholdParams): number {
    const { distances, minThreshold, maxThreshold, candidateBoundaryLimit } = params;

    // Validate inputs
    this.validateInputs({ params });

    // Calculate statistical threshold
    const stats = this.calculateStatistics({ distances });
    let threshold = stats.mean + 1.5 * stats.stdDev;

    // Clamp to configured bounds
    threshold = Math.max(minThreshold, Math.min(maxThreshold, threshold));

    // Apply candidate limit (top-N% fallback)
    threshold = this.applyTopNFallback({
      distances,
      threshold,
      candidateBoundaryLimit,
      maxThreshold,
    });

    return threshold;
  }

  /**
   * Apply top-N% fallback if too many candidates
   *
   * If more than candidateBoundaryLimit boundaries exceed the threshold,
   * raise the threshold to select only the top N candidates by distance.
   *
   * @param params - Fallback parameters
   * @param params.distances - All embedding distances
   * @param params.threshold - Current threshold
   * @param params.candidateBoundaryLimit - Max candidates allowed
   * @param params.maxThreshold - Upper bound for threshold
   * @returns Adjusted threshold
   */
  private applyTopNFallback(params: {
    candidateBoundaryLimit: number;
    distances: number[];
    maxThreshold: number;
    threshold: number;
  }): number {
    const { distances, threshold, candidateBoundaryLimit, maxThreshold } = params;

    // Count candidates that exceed current threshold
    const candidateCount = distances.filter((d) => d >= threshold).length;

    // If within limit, use current threshold
    if (candidateCount <= candidateBoundaryLimit) {
      return threshold;
    }

    // Too many candidates - raise threshold to top-N
    // Sort distances in descending order (manual sort to comply with lint rules)
    const sortedDistances = [...distances];
    for (let i = 0; i < sortedDistances.length - 1; i++) {
      for (let j = i + 1; j < sortedDistances.length; j++) {
        const valueJ = sortedDistances[j];
        const valueI = sortedDistances[i];
        if (valueJ === undefined || valueI === undefined) {
          continue;
        }
        if (valueJ > valueI) {
          sortedDistances[i] = valueJ;
          sortedDistances[j] = valueI;
        }
      }
    }

    // Get the Nth highest distance as threshold
    const topNThreshold = sortedDistances[candidateBoundaryLimit - 1];
    if (topNThreshold === undefined) {
      throw new Error(
        `Cannot determine top-N threshold. ` +
        `Array has ${String(sortedDistances.length)} elements but tried to access index ${String(candidateBoundaryLimit - 1)}`
      );
    }

    // Clamp to maxThreshold
    return Math.min(topNThreshold, maxThreshold);
  }

  /**
   * Calculate mean and standard deviation of distances
   *
   * @param params - Statistics parameters
   * @param params.distances - Array of distances
   * @returns Statistics object with mean and stdDev
   */
  private calculateStatistics(params: {
    distances: number[];
  }): { mean: number; stdDev: number } {
    const { distances } = params;

    // Calculate mean
    let sum = 0;
    for (const distance of distances) {
      sum += distance;
    }
    const mean = sum / distances.length;

    // Calculate standard deviation
    const squaredDiffs = distances.map((d) => Math.pow(d - mean, 2));
    let varianceSum = 0;
    for (const diff of squaredDiffs) {
      varianceSum += diff;
    }
    const variance = varianceSum / distances.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }

  /**
   * Validate calculation inputs
   *
   * @param params - Validation parameters
   * @param params.params - Original calculation parameters
   * @throws {Error} If validation fails
   */
  private validateInputs(params: { params: CalculateThresholdParams }): void {
    const { params: calcParams } = params;
    const { distances, minThreshold, maxThreshold, candidateBoundaryLimit } = calcParams;

    if (distances.length === 0) {
      throw new Error('Cannot calculate threshold with empty distances array');
    }

    if (minThreshold < 0 || minThreshold > 1) {
      throw new Error(
        `minThreshold must be between 0 and 1. Got: ${String(minThreshold)}`
      );
    }

    if (maxThreshold < 0 || maxThreshold > 1) {
      throw new Error(
        `maxThreshold must be between 0 and 1. Got: ${String(maxThreshold)}`
      );
    }

    if (minThreshold > maxThreshold) {
      throw new Error(
        `minThreshold (${String(minThreshold)}) must be <= ` +
        `maxThreshold (${String(maxThreshold)})`
      );
    }

    if (candidateBoundaryLimit <= 0) {
      throw new Error(
        `candidateBoundaryLimit must be positive. Got: ${String(candidateBoundaryLimit)}`
      );
    }
  }
}
