/**
 * DomainError Interfaces
 *
 * Interface definitions for DomainError constructor parameters.
 */

/**
 * Parameters for creating a DomainError
 */
export interface DomainErrorParams {
  code: string;
  context?: Record<string, unknown>;
  message: string;
}
