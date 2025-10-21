/**
 * BaseErrorHandler Interfaces
 *
 * Interface definitions for BaseErrorHandler method parameters.
 */

import type { ValidationError } from '../BaseValidator/index.js';

/**
 * Parameters for error handling
 */
export interface HandleErrorParams {
  context?: Record<string, unknown>;
  error: unknown;
}

/**
 * Parameters for creating domain errors
 */
export interface CreateErrorParams {
  code: string;
  context?: Record<string, unknown>;
  message: string;
}

/**
 * Parameters for creating validation errors
 */
export interface CreateValidationErrorParams {
  errors: ValidationError[];
}

/**
 * Parameters for checking if error is operational
 */
export interface IsOperationalParams {
  error: Error;
}
