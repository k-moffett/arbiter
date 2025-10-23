/**
 * RAG Validator Interfaces
 *
 * Interface definitions for RAG validation.
 */

import type { ValidatedContext, ValidationParams } from './types';

/**
 * RAG validator interface
 *
 * Validates retrieved context for relevance to the query.
 * Filters out low-quality or irrelevant results.
 */
export interface RAGValidator {
  /**
   * Validate retrieved context
   *
   * Scores each result for relevance to the query using LLM-based validation.
   * Filters out results below the minimum score threshold.
   * Returns validated results ordered by validation score.
   *
   * @param params - Validation parameters
   * @param params.query - Original query for relevance checking
   * @param params.results - Search results to validate
   * @param params.minScore - Minimum validation score to pass (default: 0.3)
   * @param params.useLLM - Whether to use LLM validation (default: true)
   * @returns Validated context with filtered results
   */
  validate(params: ValidationParams): Promise<ValidatedContext>;
}
