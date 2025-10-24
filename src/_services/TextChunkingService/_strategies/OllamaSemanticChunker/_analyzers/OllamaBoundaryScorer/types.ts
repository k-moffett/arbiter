/**
 * Ollama Boundary Scorer Types
 *
 * Weighted combination of boundary signals for final chunking decisions.
 */

/**
 * Individual boundary signal from an analyzer
 */
export interface BoundarySignal {
  /** Signal confidence (0-1) */
  confidence: number;

  /** Signal name (for debugging) */
  name: string;

  /** Signal strength (0-1, higher = stronger boundary) */
  strength: number;
}

/**
 * Final boundary score combining all signals
 */
export interface BoundaryScore {
  /** Individual signals that contributed to the score */
  signals: BoundarySignal[];

  /** Weighted combined score (0-1, higher = stronger boundary) */
  weightedScore: number;
}

/**
 * Weighted boundary detection weights
 */
export interface BoundaryWeights {
  /** Discourse relationship weight (0-1) */
  ollamaDiscourse: number;

  /** Structure analysis weight (0-1) */
  ollamaStructure: number;

  /** Topic shift weight (0-1) */
  ollamaTopic: number;

  /** Semantic embedding weight (0-1) */
  semanticEmbed: number;
}
