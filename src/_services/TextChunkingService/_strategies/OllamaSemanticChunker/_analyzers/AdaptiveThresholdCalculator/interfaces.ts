/**
 * Adaptive Threshold Calculator - Type Definitions
 *
 * Defines interfaces for statistical threshold calculation.
 * Used in Pass 1 of two-pass boundary detection to identify candidate boundaries.
 */

/**
 * Parameters for adaptive threshold calculation
 *
 * Calculates threshold based on document statistics to identify boundaries
 * that warrant LLM analysis (Pass 2).
 *
 * Algorithm:
 * 1. Calculate mean and standard deviation of distances
 * 2. Set threshold = mean + 1.5 * stdDev
 * 3. Clamp to [minThreshold, maxThreshold]
 * 4. If too many candidates (> candidateBoundaryLimit), raise threshold
 *    to select only top N% of distances
 *
 * @example
 * ```typescript
 * const params: CalculateThresholdParams = {
 *   distances: [0.02, 0.03, 0.05, 0.08, 0.12, 0.15, ...],
 *   minThreshold: 0.3,
 *   maxThreshold: 0.8,
 *   candidateBoundaryLimit: 500
 * };
 * const threshold = calculator.calculateThreshold(params);
 * // Returns: 0.45 (mean + 1.5*stdDev, clamped to [0.3, 0.8])
 * ```
 */
export interface CalculateThresholdParams {
  /**
   * Maximum number of candidate boundaries to return
   *
   * If more boundaries exceed the statistical threshold, the threshold
   * is raised to select only the top N boundaries by distance.
   *
   * Recommended: 500 for 400-page documents
   */
  candidateBoundaryLimit: number;

  /**
   * Array of embedding distances between consecutive sentences
   *
   * These are the cosine distances calculated in Pass 1.
   * Used to calculate mean and standard deviation.
   *
   * Example: [0.02, 0.03, 0.05, 0.08, 0.12, ...]
   */
  distances: number[];

  /**
   * Maximum threshold value (upper bound, 0.0 - 1.0)
   *
   * Statistical threshold will be clamped to this value if exceeded.
   * Higher = less sensitive, only major topic shifts detected.
   *
   * From config: SEMANTIC_ADAPTIVE_THRESHOLD_MAX
   */
  maxThreshold: number;

  /**
   * Minimum threshold value (lower bound, 0.0 - 1.0)
   *
   * Statistical threshold will be raised to this value if too low.
   * Lower = more sensitive, catches subtle topic shifts.
   *
   * From config: SEMANTIC_ADAPTIVE_THRESHOLD_MIN
   */
  minThreshold: number;
}
