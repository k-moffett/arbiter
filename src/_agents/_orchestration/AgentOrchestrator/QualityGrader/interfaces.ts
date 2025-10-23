/**
 * Quality Grader Interfaces
 *
 * Interface definitions for quality grading feedback loop.
 */

import type { GradingParams, GradingResult } from './types';

/**
 * Quality grader interface
 *
 * Grades LLM responses for quality and extracts entities for learning.
 * This is the feedback loop component that improves future retrievals.
 *
 * NOTE: Designed to run asynchronously in the background.
 * Does not block query processing.
 */
export interface QualityGrader {
  /**
   * Grade a response for quality
   *
   * Analyzes the LLM response and:
   * 1. Scores quality on multiple dimensions (relevance, completeness, clarity)
   * 2. Extracts entities, concepts, and keywords
   * 3. Returns grading result for background processing
   *
   * This method should be called asynchronously after response delivery.
   * Results can be used to update Qdrant metadata for future searches.
   *
   * @param params - Grading parameters
   * @param params.messageId - Message ID to associate with grading
   * @param params.query - Original user query
   * @param params.response - LLM response to grade
   * @param params.retrievedContext - Retrieved context used (optional)
   * @returns Grading result with quality scores and extracted entities
   */
  grade(params: GradingParams): Promise<GradingResult>;
}
