/**
 * RuleValidator Interfaces
 *
 * Interface definitions for RuleValidator configuration and rules.
 */

/**
 * Validation rule for a field
 */
export interface ValidationRule {
  message?: string;
  pattern?: RegExp;
  required?: boolean;
  type?: 'array' | 'boolean' | 'number' | 'object' | 'string';
}

/**
 * Constructor parameters for RuleValidator
 */
export interface RuleValidatorParams {
  rules: Record<string, ValidationRule>;
}
