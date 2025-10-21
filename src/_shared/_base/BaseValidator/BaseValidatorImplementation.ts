/**
 * BaseValidator
 *
 * Abstract base class for validation infrastructure.
 * All validators in the project must extend this class.
 *
 * Features:
 * - Schema validation
 * - Field-level validation
 * - Custom validation rules
 * - Detailed error messages
 * - Warning support for non-blocking issues
 *
 * @example
 * ```typescript
 * const validator = new SchemaValidator({ schema: userSchema });
 *
 * const result = validator.validate({ data: { email: 'invalid' } });
 * if (!result.isValid) {
 *   console.log(result.errors); // [{ field: 'email', message: '...' }]
 * }
 * ```
 */

import type { ValidateFieldParams, ValidateParams } from './interfaces.js';
import type { ValidationResult } from './types.js';

export abstract class BaseValidator {
  /**
   * Validate data against the validator's rules
   * Returns detailed validation results with errors and warnings
   *
   * @param params - Validation parameters
   * @param params.data - Data to validate
   * @returns Validation result with isValid flag, errors, and warnings
   *
   * @example
   * ```typescript
   * const result = validator.validate({ data: userInput });
   * if (!result.isValid) {
   *   result.errors.forEach(err => {
   *     console.log(`${err.field}: ${err.message}`);
   *   });
   * }
   * ```
   */
  public abstract validate(params: ValidateParams): ValidationResult;

  /**
   * Validate a single field
   * Useful for incremental validation in forms
   *
   * @param params - Field validation parameters
   * @param params.field - Field name to validate
   * @param params.value - Field value to validate
   * @returns Validation result for the field
   *
   * @example
   * ```typescript
   * const result = validator.validateField({ field: 'email', value: 'user@example.com' });
   * if (!result.isValid) {
   *   console.log(`Email validation failed: ${result.errors[0].message}`);
   * }
   * ```
   */
  public abstract validateField(params: ValidateFieldParams): ValidationResult;
}
