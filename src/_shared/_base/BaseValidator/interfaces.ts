/**
 * BaseValidator Interfaces
 *
 * Interface definitions for BaseValidator method parameters.
 */

/**
 * Parameters for validation
 */
export interface ValidateParams {
  data: unknown;
}

/**
 * Parameters for field validation
 */
export interface ValidateFieldParams {
  field: string;
  value: unknown;
}
