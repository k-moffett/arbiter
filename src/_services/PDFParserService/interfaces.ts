/**
 * PDF Parser Service - Interfaces
 *
 * Defines interfaces for PDF parsing functionality.
 */

import type { PDFMetadata, PDFPageTexts, PDFTable } from './types.js';

/**
 * Options for PDF parsing
 */
export interface PDFParserOptions {
  extractMetadata?: boolean;
  extractTables?: boolean;
  extractText?: boolean;
  pageRange?: {
    end: number;
    start: number;
  };
}

/**
 * Parameters for parse method
 */
export interface ParseParams {
  input: Buffer | string;
  options?: PDFParserOptions;
}

/**
 * Result from PDF parsing
 */
export interface PDFParseResult {
  metadata?: PDFMetadata;
  pageTexts?: PDFPageTexts;
  tables?: PDFTable[];
  text?: string;
}

/**
 * Parameters for cleanText method
 */
export interface CleanTextParams {
  text: string | undefined;
}

/**
 * Parameters for extractPatterns method
 */
export interface ExtractPatternsParams {
  patterns: Record<string, RegExp>;
  text: string | undefined;
}

/**
 * Abstract PDF Parser Service interface
 *
 * Defines the contract for PDF parsing implementations.
 */
export interface IPDFParserService {
  /**
   * Clean and normalize text extracted from PDF
   */
  cleanText(params: CleanTextParams): string;

  /**
   * Extract specific patterns from PDF text
   */
  extractPatterns(params: ExtractPatternsParams): Record<string, string[]>;

  /**
   * Parse a PDF file from buffer or file path
   */
  parse(params: ParseParams): Promise<PDFParseResult>;
}
