/**
 * Document Metadata Types
 *
 * Defines required and optional metadata for document ingestion.
 */

/**
 * Document metadata for ingestion
 */
export interface DocumentMetadata {
  /** Document author (required) */
  author: string;

  /** Document category (required) */
  category: string;

  /** Document description (required) */
  description: string;

  /** Document language (optional, defaults to 'en') */
  language?: string;

  /** Publication date (optional, ISO 8601 format) */
  publishDate?: string;

  /** Document source/origin (optional) */
  source?: string;

  /** Document tags for categorization (required, at least one tag) */
  tags: string[];

  /** Document title (required) */
  title: string;

  /** Document version (optional) */
  version?: string;
}

/**
 * Required metadata fields
 */
export const REQUIRED_METADATA_FIELDS = ['title', 'author', 'description', 'tags', 'category'] as const;

/**
 * Validation error details
 */
export interface MetadataValidationError {
  /** Human-readable error message */
  message: string;

  /** List of missing required fields */
  missingFields: string[];
}
