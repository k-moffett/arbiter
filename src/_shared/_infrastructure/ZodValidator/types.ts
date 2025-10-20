/**
 * ZodValidator Types
 *
 * Type definitions for Zod validation results.
 */

/**
 * Zod validation result structure
 */
export interface ZodValidationSuccess<T> {
  data: T;
  success: true;
}

export interface ZodValidationFailure {
  error: unknown;
  success: false;
}

export type ZodValidationResult<T> = ZodValidationSuccess<T> | ZodValidationFailure;
