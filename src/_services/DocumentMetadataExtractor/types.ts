/**
 * Document Metadata Extractor Types
 *
 * Types for automatic metadata extraction from document content.
 */

import type { DocumentMetadata } from '../PDFIngestionService/types/index.js';

/**
 * Metadata extraction result with confidence scores
 */
export interface MetadataExtractionResult {
  /** Overall confidence in the extraction (0-1) */
  confidence: number;

  /** Extracted metadata */
  metadata: DocumentMetadata;
}

/**
 * Text sample for metadata extraction
 */
export interface TextSample {
  /** Sample from conclusion/summary pages */
  conclusion?: string;

  /** Sample from first pages */
  introduction: string;

  /** Sample from table of contents if found */
  tableOfContents?: string;
}

/**
 * Configuration for metadata extraction
 */
export interface MetadataExtractionConfig {
  /** Model to use for extraction */
  model: string;

  /** Number of pages to sample from start */
  samplePages: number;

  /** Temperature for LLM (low = deterministic) */
  temperature: number;
}
