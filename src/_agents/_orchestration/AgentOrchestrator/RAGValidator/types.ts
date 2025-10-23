/**
 * RAG Validator Type Definitions
 *
 * Types for validating and filtering retrieved context.
 */

import type { HybridSearchResult } from '../HybridSearchRetriever/types';

/**
 * Validation result for a single context item
 */
export interface ValidationResult {
  /**
   * Validation rationale/explanation
   */
  rationale: string;

  /**
   * Original hybrid search result
   */
  result: HybridSearchResult;

  /**
   * Whether this result passed validation
   */
  valid: boolean;

  /**
   * Validation score (0-1)
   * 0 = completely irrelevant, 1 = highly relevant
   */
  validationScore: number;
}

/**
 * Validated context results
 */
export interface ValidatedContext {
  /**
   * Number of results rejected
   */
  rejectedCount: number;

  /**
   * Validation metadata for monitoring
   */
  validationMetadata: ValidationMetadata;

  /**
   * Number of results after validation
   */
  validCount: number;

  /**
   * Results that passed validation, ordered by validation score
   */
  validResults: ValidationResult[];
}

/**
 * Validation metadata
 */
export interface ValidationMetadata {
  /**
   * Average validation score across all results
   */
  avgValidationScore: number;

  /**
   * Number of results that failed validation
   */
  failedCount: number;

  /**
   * Number of results that passed validation
   */
  passedCount: number;

  /**
   * Total results validated
   */
  totalResults: number;

  /**
   * Validation duration in milliseconds
   */
  validationDuration: number;
}

/**
 * Validation parameters
 */
export interface ValidationParams {
  /**
   * Minimum validation score to pass (0-1)
   * Default: 0.3
   */
  minScore?: number;

  /**
   * Original query for relevance checking
   */
  query: string;

  /**
   * Search results to validate
   */
  results: HybridSearchResult[];

  /**
   * Whether to use LLM for validation or simple heuristics
   * Default: true (use LLM)
   */
  useLLM?: boolean;
}

/**
 * RAG validator configuration
 */
export interface RAGValidatorConfig {
  /**
   * Default minimum validation score threshold
   * Results below this score are filtered out
   */
  defaultMinScore: number;

  /**
   * LLM model to use for validation
   */
  llmModel: string;

  /**
   * Maximum results to validate in parallel
   * Large batches may exceed rate limits
   */
  maxParallelValidations: number;

  /**
   * Temperature for LLM validation
   */
  temperature: number;
}
