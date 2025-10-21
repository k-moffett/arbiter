/**
 * ZodValidator Interfaces
 *
 * Interface definitions for ZodValidator configuration and Zod structures.
 */

import type { ZodValidationResult } from './types.js';

/**
 * Zod schema interface
 */
export interface ZodSchema<T = unknown> {
  safeParse(data: unknown): ZodValidationResult<T>;
}

/**
 * Zod issue structure (from Zod v4)
 */
export interface ZodIssue {
  code?: string;
  message?: string;
  path?: unknown;
}

/**
 * Constructor parameters for ZodValidator
 */
export interface ZodValidatorParams<T = unknown> {
  schema: ZodSchema<T>;
}
