/**
 * BaseErrorHandler
 *
 * Abstract base class for error handling infrastructure.
 * All error handlers in the project must extend this class.
 *
 * Features:
 * - Consistent error formatting
 * - Error categorization (operational vs programmer errors)
 * - Context enrichment
 * - Stack trace management
 *
 * @example
 * ```typescript
 * const errorHandler = new StandardErrorHandler({ logger });
 *
 * // Handle an error
 * try {
 *   // ...
 * } catch (error) {
 *   throw errorHandler.handle({ error });
 * }
 *
 * // Create domain errors
 * throw errorHandler.createError({
 *   code: 'DB_CONNECTION_FAILED',
 *   message: 'Failed to connect to database',
 *   context: { host: 'localhost', port: 5432 }
 * });
 * ```
 */

import type {
  CreateErrorParams,
  CreateValidationErrorParams,
  HandleErrorParams,
  IsOperationalParams,
} from './interfaces.js';

import { DomainError } from './DomainError/index.js';

export abstract class BaseErrorHandler {
  /**
   * Create a domain-specific error
   * Use this for expected, operational errors
   *
   * @param params - Error creation parameters
   * @param params.code - Error code (e.g., 'DB_CONNECTION_FAILED')
   * @param params.message - Human-readable error message
   * @param params.context - Additional context about the error
   * @returns A DomainError instance
   *
   * @example
   * ```typescript
   * throw errorHandler.createError({
   *   code: 'USER_NOT_FOUND',
   *   message: 'User does not exist',
   *   context: { userId: '123' }
   * });
   * ```
   */
  public abstract createError(params: CreateErrorParams): DomainError;

  /**
   * Create a validation error
   * Use this when validation fails
   *
   * @param params - Validation error parameters
   * @param params.errors - Array of validation errors
   * @returns A DomainError instance with validation details
   *
   * @example
   * ```typescript
   * throw errorHandler.createValidationError({
   *   errors: [
   *     { field: 'email', message: 'Invalid email format' },
   *     { field: 'age', message: 'Must be at least 18' }
   *   ]
   * });
   * ```
   */
  public abstract createValidationError(params: CreateValidationErrorParams): DomainError;

  /**
   * Handle an error (log, transform, re-throw)
   * This method NEVER returns - it always throws
   *
   * @param params - Error handling parameters
   * @param params.error - The error to handle
   * @param params.context - Additional context to attach
   * @throws Always throws a transformed error
   *
   * @example
   * ```typescript
   * try {
   *   await database.connect();
   * } catch (error) {
   *   throw errorHandler.handle({
   *     error,
   *     context: { operation: 'database_connect' }
   *   });
   * }
   * ```
   */
  public abstract handle(params: HandleErrorParams): never;

  /**
   * Check if an error is operational (expected/recoverable)
   * vs a programmer error (unexpected/non-recoverable)
   *
   * @param params - Parameters for checking error type
   * @param params.error - The error to check
   * @returns True if operational, false if programmer error
   *
   * @example
   * ```typescript
   * if (errorHandler.isOperational({ error: err })) {
   *   // Log and continue
   *   logger.warn({ message: 'Operational error occurred', context: { error: err } });
   * } else {
   *   // Critical - shut down
   *   logger.fatal({ message: 'Programmer error - shutting down', context: { error: err } });
   *   process.exit(1);
   * }
   * ```
   */
  public abstract isOperational(params: IsOperationalParams): boolean;
}
