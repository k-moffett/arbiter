/**
 * Quality Grader Type Definitions
 *
 * Types for the feedback loop quality grading system.
 */

/**
 * Quality grade result
 */
export interface QualityGrade {
  /**
   * Clarity score (0-1)
   * How clear and understandable is the response?
   */
  clarity: number;

  /**
   * Completeness score (0-1)
   * Does the response fully answer the query?
   */
  completeness: number;

  /**
   * Overall quality score (0-1)
   * Weighted average of all metrics
   */
  overallScore: number;

  /**
   * Grading rationale/explanation
   */
  rationale: string;

  /**
   * Relevance score (0-1)
   * How relevant is the response to the query?
   */
  relevance: number;
}

/**
 * Extracted entities from response
 */
export interface ExtractedEntities {
  /**
   * Key concepts mentioned in the response
   */
  concepts: string[];

  /**
   * Named entities (people, places, technologies, etc.)
   */
  entities: string[];

  /**
   * Keywords for future search enhancement
   */
  keywords: string[];
}

/**
 * Quality grading result with extracted information
 */
export interface GradingResult {
  /**
   * Extracted entities and topics
   */
  entities: ExtractedEntities;

  /**
   * Quality grade metrics
   */
  grade: QualityGrade;

  /**
   * Message ID that was graded
   */
  messageId: string;

  /**
   * Timestamp of grading
   */
  timestamp: number;
}

/**
 * Quality grading parameters
 */
export interface GradingParams {
  /**
   * Message ID to associate with grading
   */
  messageId: string;

  /**
   * Original user query
   */
  query: string;

  /**
   * LLM response to grade
   */
  response: string;

  /**
   * Retrieved context that was used (optional)
   * Used to assess if response utilized the context well
   */
  retrievedContext?: string[];
}

/**
 * Quality grader configuration
 */
export interface QualityGraderConfig {
  /**
   * LLM model to use for grading
   */
  llmModel: string;

  /**
   * Temperature for LLM grading
   */
  temperature: number;

  /**
   * Weights for quality score calculation
   */
  weights: {
    clarity: number;
    completeness: number;
    relevance: number;
  };
}
