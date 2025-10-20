/**
 * BaseErrorHandler Module
 *
 * Exports the BaseErrorHandler abstract class, DomainError, and related types.
 */

export { BaseErrorHandler } from './BaseErrorHandlerImplementation';

// Re-export DomainError from subdirectory
export { DomainError } from './DomainError';
export type { DomainErrorParams } from './DomainError';

export type {
  CreateErrorParams,
  CreateValidationErrorParams,
  HandleErrorParams,
  IsOperationalParams,
} from './interfaces';
