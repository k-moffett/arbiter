/**
 * ZodValidator
 *
 * Zod-based schema validator implementation.
 * Validates data against Zod schemas with full type safety.
 *
 * Features:
 * - TypeScript-first validation with static type inference
 * - Support for any Zod schema (objects, arrays, unions, etc.)
 * - Automatic conversion of ZodIssues to ValidationErrors
 * - Non-throwing validation with safeParse
 * - Custom error messages
 * - Field-level validation
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 *
 * const userSchema = z.object({
 *   email: z.string().email(),
 *   age: z.number().min(18, 'Must be at least 18')
 * });
 *
 * const validator = new ZodValidator({ schema: userSchema });
 * const result = validator.validate({ data: userData });
 *
 * if (!result.isValid) {
 *   console.log(result.errors); // [{ field: 'email', message: '...' }]
 * }
 * ```
 */

import type { ValidateFieldParams, ValidateParams } from '../../_base/BaseValidator/index.js';
import type { ValidationError, ValidationResult } from '../../_base/BaseValidator/index.js';
import type { ZodIssue, ZodSchema, ZodValidatorParams } from './interfaces.js';

import { BaseValidator } from '../../_base/BaseValidator/index.js';

/* eslint-disable perfectionist/sort-classes -- Public methods before private is correct */
export class ZodValidator<T = unknown> extends BaseValidator {
  private readonly schema: ZodSchema<T>;

  constructor(params: ZodValidatorParams<T>) {
    super();
    this.schema = params.schema;
  }

  public validate(params: ValidateParams): ValidationResult {
    const result = this.schema.safeParse(params.data);

    if (result.success) {
      return {
        errors: [],
        isValid: true,
        warnings: [],
      };
    }

    return {
      errors: this.convertZodErrors({ zodError: result.error }),
      isValid: false,
      warnings: [],
    };
  }

  public validateField(params: ValidateFieldParams): ValidationResult {
    // For field validation, wrap the value in the field name and validate
    // This allows validating a single field against the full schema
    const testData = { [params.field]: params.value };
    const result = this.schema.safeParse(testData);

    if (result.success) {
      return {
        errors: [],
        isValid: true,
        warnings: [],
      };
    }

    // Filter errors to only those for this field
    const fieldErrors = this.convertZodErrors({ zodError: result.error }).filter(
      (error) =>
        error.field !== undefined &&
        (error.field === params.field || error.field.startsWith(`${params.field}.`))
    );

    return {
      errors: fieldErrors,
      isValid: fieldErrors.length === 0,
      warnings: [],
    };
  }

  /**
   * Type guard to check if error has Zod v4 issues structure
   */
  private isZodErrorWithIssues(
    error: unknown
  ): error is { issues: unknown[] } {
    if (typeof error !== 'object') {
      return false;
    }
    if (error === null) {
      return false;
    }
    if (!('issues' in error)) {
      return false;
    }
    return Array.isArray(error.issues);
  }

  /**
   * Type guard to check if issue has a valid path array
   */
  private hasValidPath(issue: ZodIssue): boolean {
    if (issue.path === undefined) {
      return false;
    }
    if (!Array.isArray(issue.path)) {
      return false;
    }
    return issue.path.length > 0;
  }

  /**
   * Convert ZodError to our ValidationError format
   */
  private convertZodErrors(params: { zodError: unknown }): ValidationError[] {
    // Type guard: Check if zodError has an issues array (Zod v4)
    if (!this.isZodErrorWithIssues(params.zodError)) {
      return [
        {
          code: undefined,
          field: undefined,
          message: 'Unknown validation error',
          value: undefined,
        },
      ];
    }

    return params.zodError.issues.map((issue: unknown) => this.convertZodIssue({ issue }));
  }

  /**
   * Convert a single ZodIssue to ValidationError
   */
  private convertZodIssue(params: { issue: unknown }): ValidationError {
    // Type guard: Check if issue has the expected structure
    if (typeof params.issue !== 'object' || params.issue === null) {
      return {
        code: undefined,
        field: undefined,
        message: 'Invalid error format',
        value: undefined,
      };
    }

    const issue = params.issue as ZodIssue;

    // Extract path
    let field: string | undefined;
    if (this.hasValidPath(issue)) {
      field = (issue.path as string[]).join('.');
    }

    // Extract code
    const code = typeof issue.code === 'string' ? issue.code : undefined;

    // Extract message
    const message = typeof issue.message === 'string' ? issue.message : 'Validation failed';

    return {
      code,
      field,
      message,
      value: undefined, // Zod doesn't expose the invalid value in issues
    };
  }
}
