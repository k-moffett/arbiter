/**
 * StandardErrorHandler
 *
 * Standard implementation of error handling.
 * Provides consistent error formatting, logging, and categorization.
 *
 * Features:
 * - Automatic error logging
 * - Context enrichment
 * - Stack trace preservation
 * - Operational vs programmer error detection
 *
 * @example
 * ```typescript
 * const errorHandler = new StandardErrorHandler({ logger });
 *
 * try {
 *   throw new Error('Something failed');
 * } catch (error) {
 *   throw errorHandler.handle({ error, context: { userId: '123' } });
 * }
 * ```
 */

import type {
  CreateErrorParams,
  CreateValidationErrorParams,
  HandleErrorParams,
  IsOperationalParams,
} from '../../_base/BaseErrorHandler';
import type { BaseLogger } from '../../_base/BaseLogger';
import type { StandardErrorHandlerParams } from './interfaces';

import { BaseErrorHandler, DomainError } from '../../_base/BaseErrorHandler';
import { enrichError, normalizeError } from './utils';

 
export class StandardErrorHandler extends BaseErrorHandler {
  private readonly logger: BaseLogger;

  /**
   * Create a new StandardErrorHandler
   *
   * @param params - Configuration parameters
   * @param params.logger - Logger instance for error logging
   */
  constructor(params: StandardErrorHandlerParams) {
    super();
    this.logger = params.logger.child({ context: { component: 'ErrorHandler' } });
  }

  public createError(params: CreateErrorParams): DomainError {
    const error = new DomainError({
      code: params.code,
      message: params.message,
      ...(params.context !== undefined && { context: params.context }),
    });

    // Log error creation
    this.logger.error({
      context: {
        code: params.code,
        errorContext: params.context,
      },
      message: `Domain error created: ${params.message}`,
    });

    return error;
  }

  public createValidationError(params: CreateValidationErrorParams): DomainError {
    const errorMessages = params.errors
      .map((err) => `${err.field ?? 'unknown'}: ${err.message}`)
      .join(', ');

    const error = new DomainError({
      code: 'VALIDATION_ERROR',
      context: { validationErrors: params.errors },
      message: `Validation failed: ${errorMessages}`,
    });

    // Log validation error
    this.logger.warn({
      context: {
        validationErrors: params.errors,
      },
      message: 'Validation error created',
    });

    return error;
  }

  public handle(params: HandleErrorParams): never {
    const error = normalizeError(params.error);
    const isOperational = this.isOperational({ error });

    // Enrich error with additional context
    const enrichedError = enrichError({
      error,
      ...(params.context !== undefined && { context: params.context }),
    });

    // Log based on error type
    if (isOperational) {
      this.logger.warn({
        context: {
          code: enrichedError instanceof DomainError ? enrichedError.code : 'UNKNOWN',
          errorContext: enrichedError instanceof DomainError ? enrichedError.context : undefined,
          stack: enrichedError.stack,
        },
        message: `Operational error: ${enrichedError.message}`,
      });
    } else {
      this.logger.error({
        context: {
          errorContext: enrichedError instanceof DomainError ? enrichedError.context : undefined,
          stack: enrichedError.stack,
        },
        message: `Programmer error: ${enrichedError.message}`,
      });
    }

    // Always throw
    throw enrichedError;
  }

  public isOperational(params: IsOperationalParams): boolean {
    const { error } = params;

    // DomainErrors are always operational
    if (error instanceof DomainError) {
      return error.isOperational;
    }

    // Check for common operational error indicators
    if (error.name === 'ValidationError') {
      return true;
    }

    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      return true;
    }

    // Everything else is a programmer error
    return false;
  }
}
