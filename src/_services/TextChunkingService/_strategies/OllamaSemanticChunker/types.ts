/**
 * Ollama Semantic Chunker - Type Definitions
 *
 * Defines types for two-pass boundary detection and semantic analysis.
 */

/**
 * Boundary candidate for Pass 2 LLM analysis
 *
 * Represents a sentence boundary that exceeded the adaptive threshold
 * in Pass 1 and warrants detailed LLM analysis in Pass 2.
 *
 * @example
 * ```typescript
 * const candidate: BoundaryCandidate = {
 *   sentenceIndex: 42,
 *   embeddingDistance: 0.52,
 *   text: "This is the sentence text.",
 *   nextText: "This is the next sentence."
 * };
 * ```
 */
export interface BoundaryCandidate {
  /**
   * Cosine distance between this sentence and next sentence embeddings
   *
   * Higher values indicate greater semantic shift.
   * Range: [0, 2] where 0 = identical, 2 = opposite
   */
  embeddingDistance: number;

  /**
   * Text of the next sentence (after the boundary)
   *
   * Used by LLM analyzers for context.
   */
  nextText: string;

  /**
   * Index of the sentence in the document
   *
   * Used to identify the boundary location in the sentence array.
   * Boundary is between sentence[sentenceIndex] and sentence[sentenceIndex + 1]
   */
  sentenceIndex: number;

  /**
   * Text of the current sentence (before the boundary)
   *
   * Used by LLM analyzers for context.
   */
  text: string;
}

/**
 * Result from structure detection analysis
 *
 * Indicates whether the boundary represents a structural element
 * (heading, list start/end, table, etc.) that should be preserved.
 *
 * @example
 * ```typescript
 * const result: StructureAnalysisResult = {
 *   isStructuralBoundary: true,
 *   structureType: 'heading',
 *   confidence: 0.95
 * };
 * ```
 */
export interface StructureAnalysisResult {
  /**
   * Confidence in the structure detection (0.0 - 1.0)
   *
   * Higher = more confident in the structure type.
   * Used to weight structural boundaries in final scoring.
   */
  confidence: number;

  /**
   * Whether this boundary represents a structural element
   *
   * When true, boundary should be strongly preserved even if
   * semantic scores are low.
   */
  isStructuralBoundary: boolean;

  /**
   * Type of structural element detected
   *
   * Examples: 'heading', 'list-start', 'list-end', 'table', 'code-block'
   * Only present when isStructuralBoundary is true.
   */
  structureType?: string;
}

/**
 * Sentence with boundary detection metadata
 *
 * Represents a sentence in the document with its embedding
 * and boundary analysis results.
 *
 * @example
 * ```typescript
 * const sentence: SentenceWithBoundary = {
 *   text: "This is a sentence.",
 *   embedding: [0.1, 0.2, ...],
 *   isBoundary: true,
 *   boundaryScore: 0.85,
 *   embeddingDistance: 0.52
 * };
 * ```
 */
export interface SentenceWithBoundary {
  /**
   * Final boundary score (0.0 - 1.0)
   *
   * Weighted combination of embedding, topic, discourse, and structure scores.
   * Only present after Pass 2 LLM analysis.
   * Higher = stronger boundary.
   */
  boundaryScore?: number;

  /**
   * Sentence embedding vector
   *
   * 768-dimensional vector from nomic-embed-text model.
   */
  embedding: number[];

  /**
   * Cosine distance to next sentence
   *
   * Only present after Pass 1 distance calculation.
   * Range: [0, 2]
   */
  embeddingDistance?: number;

  /**
   * Whether this is a chunk boundary
   *
   * Final decision based on boundaryScore exceeding threshold.
   * Only present after boundary selection.
   */
  isBoundary?: boolean;

  /**
   * Sentence text
   */
  text: string;
}
