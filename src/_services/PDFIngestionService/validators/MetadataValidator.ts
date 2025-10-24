/**
 * Metadata Validator
 *
 * Validates document metadata before ingestion.
 * Ensures required fields are present when enforcement is enabled.
 */

import type { DocumentMetadata, MetadataValidationError } from '../types/metadata';

import { REQUIRED_METADATA_FIELDS } from '../types/metadata';

/**
 * Metadata Validator Configuration
 */
export interface MetadataValidatorConfig {
  /** Whether to enforce metadata requirements */
  enforceMetadata: boolean;
}

/**
 * Metadata Validator
 *
 * Validates document metadata against required fields.
 *
 * @example
 * ```typescript
 * const validator = new MetadataValidator({
 *   enforceMetadata: true
 * });
 *
 * // Throws error if metadata is missing required fields
 * validator.validate({
 *   title: 'My Document',
 *   author: 'John Doe',
 *   description: 'A technical document',
 *   tags: ['technical', 'documentation'],
 *   category: 'engineering'
 * });
 * ```
 */
export class MetadataValidator {
  private readonly enforceMetadata: boolean;

  constructor(config: MetadataValidatorConfig) {
    this.enforceMetadata = config.enforceMetadata;
  }

  /**
   * Validate document metadata
   *
   * @throws {Error} If enforcement is enabled and required fields are missing
   */
  public validate(metadata: Partial<DocumentMetadata> | undefined): void {
    // Skip validation if enforcement is disabled
    if (!this.enforceMetadata) {
      return;
    }

    // Metadata is required when enforcement is enabled
    if (metadata === undefined) {
      throw this.createValidationError({
        missingFields: [...REQUIRED_METADATA_FIELDS],
      });
    }

    // Check for missing required fields
    const missingFields = this.checkRequiredFields({ metadata });

    // Throw error if any fields are missing
    if (missingFields.length > 0) {
      throw this.createValidationError({ missingFields });
    }
  }

  /**
   * Check required fields and return list of missing ones
   */
  private checkRequiredFields(params: {
    metadata: Partial<DocumentMetadata>;
  }): string[] {
    const missingFields: string[] = [];

    for (const field of REQUIRED_METADATA_FIELDS) {
      const value = params.metadata[field];

      // Check if field exists and is not empty
      if (value === undefined) {
        missingFields.push(field);
        continue;
      }

      // Field-specific validation
      const fieldError = this.validateField({ field, value });
      if (fieldError !== null) {
        missingFields.push(fieldError);
      }
    }

    return missingFields;
  }

  /**
   * Create validation error
   */
  private createValidationError(params: {
    missingFields: string[];
  }): Error {
    const error: MetadataValidationError = {
      message:
        `Document metadata validation failed. Missing required fields:\n` +
        params.missingFields.map((field) => `  - ${field}`).join('\n') +
        `\n\nRequired fields: ${REQUIRED_METADATA_FIELDS.join(', ')}\n\n` +
        `Provide metadata using --metadata-file <path-to-json> or individual flags:\n` +
        `  --title "Document Title"\n` +
        `  --author "Author Name"\n` +
        `  --description "Document description"\n` +
        `  --category "category"\n` +
        `  --tags "tag1,tag2,tag3"\n\n` +
        `To disable metadata enforcement, set REQUIRE_DOCUMENT_METADATA=false in .env`,
      missingFields: params.missingFields,
    };

    return new Error(error.message);
  }

  /**
   * Validate a single field value
   */
  private validateField(params: {
    field: string;
    value: unknown;
  }): string | null {
    // Special validation for tags (must be non-empty array)
    if (params.field === 'tags') {
      if (!Array.isArray(params.value) || params.value.length === 0) {
        return `${params.field} (must be non-empty array)`;
      }
      return null;
    }

    // String fields must not be empty
    if (typeof params.value === 'string' && params.value.trim() === '') {
      return `${params.field} (must not be empty)`;
    }

    return null;
  }
}
