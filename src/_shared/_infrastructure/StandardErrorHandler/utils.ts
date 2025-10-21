/**
 * StandardErrorHandler Utilities
 *
 * Pure utility functions for error handling operations.
 */

import { DomainError } from '../../_base/BaseErrorHandler/index.js';

/**
 * Enrich an error with additional context
 *
 * @param params - Enrichment parameters
 * @param params.error - The error to enrich
 * @param params.context - Additional context to add
 * @returns Enriched error instance
 */
export function enrichError(params: { context?: Record<string, unknown>; error: Error }): Error {
  if (params.context === undefined || Object.keys(params.context).length === 0) {
    return params.error;
  }

  // If it's a DomainError, create a new one with merged context
  if (params.error instanceof DomainError) {
    return new DomainError({
      code: params.error.code,
      context: { ...params.error.context, ...params.context },
      message: params.error.message,
    });
  }

  // For other errors, add context as a property
  const enriched = params.error as Error & { context?: Record<string, unknown> };
  enriched.context = params.context;
  return enriched;
}

/**
 * Normalize unknown error to Error instance
 *
 * @param error - The error value to normalize
 * @returns Normalized Error instance
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (typeof error === 'object' && error !== null) {
    return new Error(JSON.stringify(error));
  }

  return new Error('Unknown error occurred');
}
