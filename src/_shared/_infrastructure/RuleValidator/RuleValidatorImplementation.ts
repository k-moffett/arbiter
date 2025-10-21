/**
 * RuleValidator
 *
 * Simple rule-based validator implementation.
 * Validates data against provided validation rules.
 *
 * Features:
 * - Rule-based validation
 * - Field-level validation
 * - Custom error messages
 * - Type checking (string, number, boolean, object, array)
 * - Required field validation
 * - Pattern matching (regex)
 *
 *
 * Note: For complex validation with type inference, use ZodValidator instead.
 *
 * @example
 * ```typescript
 * const validator = new RuleValidator({
 *   rules: {
 *     email: { type: 'string', required: true, pattern: /^.+@.+\..+$/ },
 *     age: { type: 'number', required: true }
 *   }
 * });
 *
 * const result = validator.validate({ data: { email: 'user@example.com', age: 25 } });
 * console.log(result.isValid); // true
 * ```
 */

import type { ValidateFieldParams, ValidateParams } from '../../_base/BaseValidator/index.js';
import type { ValidationError, ValidationResult } from '../../_base/BaseValidator/index.js';
import type { RuleValidatorParams, ValidationRule } from './interfaces.js';

import { BaseValidator } from '../../_base/BaseValidator/index.js';

/* eslint-disable perfectionist/sort-classes -- Public methods before private is correct */
export class RuleValidator extends BaseValidator {
  private readonly rules: Record<string, ValidationRule>;

  constructor(params: RuleValidatorParams) {
    super();
    this.rules = params.rules;
  }

  public validate(params: ValidateParams): ValidationResult {
    const errors: ValidationError[] = [];
    const data = params.data as Record<string, unknown> | null | undefined;

    // Handle null/undefined/non-object data
    if (!this.isValidObject(data)) {
      return {
        errors: [
          {
            code: undefined,
            field: undefined,
            message: 'Data must be an object',
            value: undefined,
          },
        ],
        isValid: false,
        warnings: [],
      };
    }

    // Validate each rule
    for (const field of Object.keys(this.rules)) {
      const value = data[field];
      const fieldResult = this.validateField({ field, value });

      if (!fieldResult.isValid) {
        errors.push(...fieldResult.errors);
      }
    }

    return {
      errors,
      isValid: errors.length === 0,
      warnings: [],
    };
  }

  public validateField(params: ValidateFieldParams): ValidationResult {
    const errors: ValidationError[] = [];
    const rule = this.rules[params.field];

    // No rule for this field - consider valid
    if (rule === undefined) {
      return {
        errors: [],
        isValid: true,
        warnings: [],
      };
    }

    // Check required
    const requiredError = this.checkRequired({ field: params.field, rule, value: params.value });
    if (requiredError !== null) {
      return {
        errors: [requiredError],
        isValid: false,
        warnings: [],
      };
    }

    // Skip further validation if value is not provided
    if (params.value === undefined || params.value === null) {
      return {
        errors: [],
        isValid: true,
        warnings: [],
      };
    }

    // Check type
    const typeError = this.checkType({ field: params.field, rule, value: params.value });
    if (typeError !== null) {
      errors.push(typeError);
    }

    // Check pattern
    const patternError = this.checkPattern({ field: params.field, rule, value: params.value });
    if (patternError !== null) {
      errors.push(patternError);
    }

    return {
      errors,
      isValid: errors.length === 0,
      warnings: [],
    };
  }

  /**
   * Check if data is a valid object (not null, not undefined, and is an object)
   */
  private isValidObject(data: unknown): data is Record<string, unknown> {
    if (data === null) {
      return false;
    }
    if (data === undefined) {
      return false;
    }
    return typeof data === 'object';
  }

  /**
   * Check if value is missing (null or undefined)
   */
  private isValueMissing(value: unknown): boolean {
    if (value === undefined) {
      return true;
    }
    return value === null;
  }

  /**
   * Check if required field is provided
   */
  private checkRequired(params: {
    field: string;
    rule: ValidationRule;
    value: unknown;
  }): ValidationError | null {
    if (params.rule.required !== true) {
      return null;
    }

    if (this.isValueMissing(params.value)) {
      return {
        code: undefined,
        field: params.field,
        message: params.rule.message ?? `Field '${params.field}' is required`,
        value: params.value,
      };
    }

    return null;
  }

  /**
   * Check if value matches expected type
   */
  private checkType(params: {
    field: string;
    rule: ValidationRule;
    value: unknown;
  }): ValidationError | null {
    if (params.rule.type === undefined) {
      return null;
    }

    const actualType = Array.isArray(params.value) ? 'array' : typeof params.value;

    if (actualType !== params.rule.type) {
      return {
        code: undefined,
        field: params.field,
        message:
          params.rule.message ?? `Field '${params.field}' must be of type '${params.rule.type}'`,
        value: params.value,
      };
    }

    return null;
  }

  /**
   * Check if string value matches pattern
   */
  private checkPattern(params: {
    field: string;
    rule: ValidationRule;
    value: unknown;
  }): ValidationError | null {
    if (params.rule.pattern === undefined) {
      return null;
    }

    if (typeof params.value !== 'string') {
      return null;
    }

    if (params.rule.pattern.test(params.value)) {
      return null;
    }

    return {
      code: undefined,
      field: params.field,
      message: params.rule.message ?? `Field '${params.field}' does not match required pattern`,
      value: params.value,
    };
  }
}
