/**
 * Embedding Distance Calculator Implementation
 *
 * Calculates cosine distance between embedding vectors.
 * Used in Pass 1 of two-pass boundary detection.
 *
 * Single Responsibility: Efficient cosine distance calculations for embeddings
 *
 * @example
 * ```typescript
 * const calculator = new EmbeddingDistanceCalculator();
 *
 * // Single distance calculation
 * const distance = calculator.calculateDistance({
 *   embeddingA: [0.1, 0.2, 0.3],
 *   embeddingB: [0.15, 0.18, 0.32]
 * });
 *
 * // Batch calculation (more efficient)
 * const distances = calculator.calculateBatchDistances({
 *   embeddings: [
 *     [0.1, 0.2, 0.3],
 *     [0.15, 0.18, 0.32],
 *     [0.2, 0.25, 0.35]
 *   ]
 * });
 * // Returns: [distance(0→1), distance(1→2)]
 * ```
 */

import type {
  CalculateBatchDistancesParams,
  CalculateDistanceParams,
} from './interfaces.js';

/**
 * Embedding Distance Calculator
 *
 * Provides efficient cosine distance calculations for semantic embeddings.
 * Cosine distance = 1 - cosine similarity, range [0, 2]:
 * - 0.0 = identical vectors
 * - 1.0 = orthogonal vectors
 * - 2.0 = opposite vectors
 */
export class EmbeddingDistanceCalculator {
  /**
   * Calculate distances between consecutive embeddings (batch)
   *
   * More efficient than calling calculateDistance repeatedly.
   * Used in Pass 1 to calculate distances for all sentence boundaries.
   *
   * @param params - Batch calculation parameters
   * @param params.embeddings - Array of embedding vectors
   * @returns Array of distances between consecutive embeddings
   *
   * @throws {Error} If fewer than 2 embeddings provided
   * @throws {Error} If embeddings have inconsistent dimensions
   *
   * @example
   * ```typescript
   * const distances = calculator.calculateBatchDistances({
   *   embeddings: [
   *     [1.0, 0.0],
   *     [0.9, 0.1],
   *     [0.5, 0.5]
   *   ]
   * });
   * // Returns: [distance(0→1), distance(1→2)]
   * ```
   */
  public calculateBatchDistances(params: CalculateBatchDistancesParams): number[] {
    const { embeddings } = params;

    // Validate embeddings
    this.validateBatchEmbeddings({ embeddings });

    // Calculate distances between consecutive pairs
    const distances: number[] = [];
    for (let i = 0; i < embeddings.length - 1; i++) {
      const currentEmbedding = embeddings[i];
      const nextEmbedding = embeddings[i + 1];
      if (currentEmbedding === undefined || nextEmbedding === undefined) {
        throw new Error(
          `Embedding at index ${String(i)} or ${String(i + 1)} is undefined`
        );
      }
      const distance = this.calculateDistance({
        embeddingA: currentEmbedding,
        embeddingB: nextEmbedding,
      });
      distances.push(distance);
    }

    return distances;
  }

  /**
   * Calculate cosine distance between two embeddings
   *
   * @param params - Calculation parameters
   * @param params.embeddingA - First embedding vector
   * @param params.embeddingB - Second embedding vector
   * @returns Cosine distance [0, 2]
   *
   * @throws {Error} If embeddings have different dimensions
   * @throws {Error} If embeddings have zero magnitude
   *
   * @example
   * ```typescript
   * const distance = calculator.calculateDistance({
   *   embeddingA: [1.0, 0.0, 0.0],
   *   embeddingB: [0.0, 1.0, 0.0]
   * });
   * // Returns: 1.0 (orthogonal)
   * ```
   */
  public calculateDistance(params: CalculateDistanceParams): number {
    const { embeddingA, embeddingB } = params;

    // Validate dimensions match
    if (embeddingA.length !== embeddingB.length) {
      throw new Error(
        `Embedding dimensions must match. ` +
        `Got ${String(embeddingA.length)} and ${String(embeddingB.length)}`
      );
    }

    // Calculate cosine similarity
    const similarity = this.cosineSimilarity({ embeddingA, embeddingB });

    // Convert to distance (1 - similarity)
    return 1.0 - similarity;
  }

  /**
   * Calculate cosine similarity between two embeddings
   *
   * Private helper method. Cosine similarity = (A · B) / (||A|| * ||B||)
   *
   * @param params - Calculation parameters
   * @param params.embeddingA - First embedding vector
   * @param params.embeddingB - Second embedding vector
   * @returns Cosine similarity [-1, 1]
   *
   * @throws {Error} If either embedding has zero magnitude
   */
  private cosineSimilarity(params: CalculateDistanceParams): number {
    const { embeddingA, embeddingB } = params;

    // Calculate dot product (A · B)
    let dotProduct = 0;
    for (let i = 0; i < embeddingA.length; i++) {
      const valueA = embeddingA[i];
      const valueB = embeddingB[i];
      if (valueA === undefined || valueB === undefined) {
        throw new Error(
          `Embedding value at index ${String(i)} is undefined`
        );
      }
      dotProduct += valueA * valueB;
    }

    // Calculate magnitudes (||A|| and ||B||)
    const magnitudeA = this.magnitude({ embedding: embeddingA });
    const magnitudeB = this.magnitude({ embedding: embeddingB });

    // Validate non-zero magnitudes
    if (magnitudeA === 0 || magnitudeB === 0) {
      throw new Error(
        `Cannot calculate cosine similarity with zero-magnitude vector`
      );
    }

    // Return similarity
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calculate magnitude (L2 norm) of embedding vector
   *
   * Private helper method. Magnitude = sqrt(sum(x^2))
   *
   * @param params - Calculation parameters
   * @param params.embedding - Embedding vector
   * @returns Magnitude (non-negative)
   */
  private magnitude(params: { embedding: number[] }): number {
    const { embedding } = params;

    let sumOfSquares = 0;
    for (let i = 0; i < embedding.length; i++) {
      const value = embedding[i];
      if (value === undefined) {
        throw new Error(
          `Embedding value at index ${String(i)} is undefined`
        );
      }
      sumOfSquares += value * value;
    }

    return Math.sqrt(sumOfSquares);
  }

  /**
   * Validate batch embeddings for consistency
   *
   * @param params - Validation parameters
   * @param params.embeddings - Array of embeddings to validate
   * @throws {Error} If embeddings are invalid
   */
  private validateBatchEmbeddings(params: { embeddings: number[][] }): void {
    const { embeddings } = params;

    // Validate we have at least 2 embeddings
    if (embeddings.length < 2) {
      throw new Error(
        `Need at least 2 embeddings for batch calculation. ` +
        `Got ${String(embeddings.length)}`
      );
    }

    // Validate all embeddings have same dimension
    const firstEmbedding = embeddings[0];
    if (firstEmbedding === undefined) {
      throw new Error('First embedding is undefined');
    }
    const dimension = firstEmbedding.length;

    for (let i = 1; i < embeddings.length; i++) {
      const currentEmbedding = embeddings[i];
      if (currentEmbedding === undefined) {
        throw new Error(`Embedding at index ${String(i)} is undefined`);
      }
      if (currentEmbedding.length !== dimension) {
        throw new Error(
          `All embeddings must have same dimension. ` +
          `Embedding 0 has ${String(dimension)} dimensions, ` +
          `but embedding ${String(i)} has ${String(currentEmbedding.length)}`
        );
      }
    }
  }
}
