/**
 * BaseValidator Types
 *
 * Type definitions for validation operations.
 */

/**
 * Validation error details
 */
export interface ValidationError {
  code: string | undefined;
  field: string | undefined;
  message: string;
  value: unknown;
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  code: string | undefined;
  field: string | undefined;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  errors: ValidationError[];
  isValid: boolean;
  warnings: ValidationWarning[];
}
