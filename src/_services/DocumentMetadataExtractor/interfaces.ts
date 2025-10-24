/**
 * Document Metadata Extractor Interfaces
 *
 * Service for extracting metadata from document content using LLM analysis.
 */

import type { MetadataExtractionResult, TextSample } from './types.js';

/**
 * Document Metadata Extractor Service
 *
 * Automatically extracts document metadata (title, author, category, etc.)
 * from document content using LLM analysis.
 */
export interface DocumentMetadataExtractor {
  /**
   * Create text sample from full document text
   *
   * Uses smart sampling strategy to extract relevant sections
   * for metadata analysis (introduction, TOC, conclusion).
   *
   * @param params - Sampling parameters
   * @returns Structured text sample
   */
  createTextSample(params: { text: string }): TextSample;

  /**
   * Extract metadata from document text
   *
   * @param params - Extraction parameters
   * @returns Extracted metadata with confidence score
   */
  extract(params: { text: string }): Promise<MetadataExtractionResult>;
}
