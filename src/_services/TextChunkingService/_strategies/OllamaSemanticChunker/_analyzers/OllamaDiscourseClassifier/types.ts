/**
 * Ollama Discourse Classifier Types
 *
 * LLM-based discourse relationship detection for semantic boundary detection.
 */

/**
 * Discourse relationship types
 */
export type DiscourseRelation =
  | 'cause_effect'
  | 'elaboration'
  | 'temporal'
  | 'comparison'
  | 'contrast'
  | 'example'
  | 'background'
  | 'none';

/**
 * Discourse analysis result
 */
export interface DiscourseAnalysis {
  /** Overall confidence in the analysis (0-1) */
  confidence: number;

  /** Brief explanation of the relationship */
  explanation: string;

  /** Detected discourse relationship */
  relation: DiscourseRelation;

  /** Whether there is a strong discourse relationship (false = boundary) */
  strongRelation: boolean;
}

/**
 * Discourse boundary detection result
 */
export interface DiscourseBoundary {
  /** Discourse analysis */
  analysis: DiscourseAnalysis;

  /** Boundary strength (0-1, higher = stronger discourse boundary) */
  boundaryStrength: number;
}
