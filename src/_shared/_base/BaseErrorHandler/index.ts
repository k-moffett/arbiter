/**
 * BaseErrorHandler Module
 *
 * Exports the BaseErrorHandler abstract class, DomainError, and related types.
 */

export { BaseErrorHandler } from './BaseErrorHandlerImplementation.js';

// Re-export DomainError from subdirectory
export { DomainError } from './DomainError/index.js';
export type { DomainErrorParams } from './DomainError/index.js';

export type {
  CreateErrorParams,
  CreateValidationErrorParams,
  HandleErrorParams,
  IsOperationalParams,
} from './interfaces.js';
