/**
 * Embedding Distance Calculator - Type Definitions
 *
 * Defines interfaces for cosine distance calculations between embeddings.
 * Used in two-pass boundary detection to identify semantic shifts.
 */

/**
 * Parameters for calculating distance between two embeddings
 *
 * @example
 * ```typescript
 * const params: CalculateDistanceParams = {
 *   embeddingA: [0.1, 0.2, 0.3, ...], // 768d vector
 *   embeddingB: [0.15, 0.18, 0.32, ...] // 768d vector
 * };
 * const distance = calculator.calculateDistance(params);
 * // Returns: 0.0234 (0.0 = identical, 2.0 = opposite)
 * ```
 */
export interface CalculateDistanceParams {
  /**
   * First embedding vector
   *
   * Should be same dimension as embeddingB (typically 768d for nomic-embed-text)
   */
  embeddingA: number[];

  /**
   * Second embedding vector
   *
   * Should be same dimension as embeddingA (typically 768d for nomic-embed-text)
   */
  embeddingB: number[];
}

/**
 * Parameters for batch distance calculation
 *
 * Calculates distances between consecutive embeddings efficiently.
 * Used in Pass 1 of two-pass boundary detection.
 *
 * @example
 * ```typescript
 * const params: CalculateBatchDistancesParams = {
 *   embeddings: [
 *     [0.1, 0.2, ...], // Sentence 1
 *     [0.15, 0.18, ...], // Sentence 2
 *     [0.2, 0.25, ...], // Sentence 3
 *   ]
 * };
 * const distances = calculator.calculateBatchDistances(params);
 * // Returns: [0.0234, 0.0512] (distance between 1→2, 2→3)
 * ```
 */
export interface CalculateBatchDistancesParams {
  /**
   * Array of embedding vectors
   *
   * Distances calculated between consecutive embeddings:
   * - result[0] = distance(embeddings[0], embeddings[1])
   * - result[1] = distance(embeddings[1], embeddings[2])
   * - ...
   * - result[n-1] = distance(embeddings[n-1], embeddings[n])
   *
   * All embeddings should have same dimension.
   */
  embeddings: number[][];
}
