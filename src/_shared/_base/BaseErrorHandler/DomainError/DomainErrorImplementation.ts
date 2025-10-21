/**
 * DomainError
 *
 * Domain-specific error with code and context.
 * All domain errors are operational by default (expected, recoverable).
 *
 * @example
 * ```typescript
 * throw new DomainError({
 *   code: 'USER_NOT_FOUND',
 *   message: 'User does not exist',
 *   context: { userId: '123' }
 * });
 * ```
 */

import type { DomainErrorParams } from './interfaces.js';

export class DomainError extends Error {
  public readonly code: string;
  public readonly context: Record<string, unknown> | undefined;
  public readonly isOperational: boolean;

  constructor(params: DomainErrorParams) {
    super(params.message);
    this.name = 'DomainError';
    this.code = params.code;
    this.context = params.context;
    this.isOperational = true; // Domain errors are operational by default
    Error.captureStackTrace(this, this.constructor);
  }
}
