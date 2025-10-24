/**
 * Ollama Topic Analyzer Types
 *
 * LLM-based topic shift detection for semantic boundary detection.
 */

/**
 * Topic shift analysis result
 */
export interface TopicShiftAnalysis {
  /** Overall confidence in the analysis (0-1) */
  confidence: number;

  /** Brief explanation of the topic relationship */
  reason: string;

  /** Relationship between the two segments */
  relationship: 'continuation' | 'new_topic' | 'elaboration' | 'contrast' | 'related';

  /** Whether the segments discuss the same topic */
  sameTopic: boolean;
}

/**
 * Topic boundary detection result
 */
export interface TopicBoundary {
  /** Boundary strength (0-1, higher = stronger topic shift) */
  boundaryStrength: number;

  /** Topic shift analysis */
  shift: TopicShiftAnalysis;
}
