/**
 * PDF Parser Service - Abstract Base Class
 *
 * Provides abstract base class for PDF parsing implementations.
 * Concrete implementations (e.g., PdfParsePDFParser) extend this class.
 */

import type {
  CleanTextParams,
  ExtractPatternsParams,
  IPDFParserService,
  ParseParams,
  PDFParseResult,
} from './interfaces.js';
import type { BaseLogger } from '@shared/_base/BaseLogger/index.js';

/**
 * Abstract PDF Parser Service
 *
 * Base class for all PDF parser implementations.
 * Follows the same pattern as BaseLogger, BaseCache, etc.
 */
export abstract class PDFParserService implements IPDFParserService {
  protected readonly logger: BaseLogger;

  constructor(logger: BaseLogger) {
    this.logger = logger;
  }

  /**
   * Clean and normalize text extracted from PDF
   *
   * Removes extra whitespace, non-printable characters, etc.
   *
   * @param params - Clean text parameters
   * @param params.text - Text to clean (may be undefined)
   * @returns Cleaned text string
   */
  public abstract cleanText(params: CleanTextParams): string;

  /**
   * Extract specific patterns from PDF text
   *
   * Useful for extracting structured data like prices, codes, dates, etc.
   *
   * @param params - Extract patterns parameters
   * @param params.text - Text to search (may be undefined)
   * @param params.patterns - Named regex patterns to search for
   * @returns Object mapping pattern names to arrays of matches
   */
  public abstract extractPatterns(params: ExtractPatternsParams): Record<string, string[]>;

  /**
   * Parse a PDF file from buffer or file path
   *
   * @param params - Parse parameters
   * @param params.input - PDF file path (string) or buffer (Buffer)
   * @param params.options - Optional parsing options
   * @returns Promise resolving to parsed PDF data
   */
  public abstract parse(params: ParseParams): Promise<PDFParseResult>;
}
