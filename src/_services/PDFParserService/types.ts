/**
 * PDF Parser Service - Type Definitions
 *
 * Defines types used by the PDF Parser Service.
 */

/**
 * PDF Metadata extracted from PDF info dict
 */
export interface PDFMetadata {
  author?: string;
  creationDate?: Date;
  keywords?: string;
  modDate?: Date;
  pages?: number;
  subject?: string;
  title?: string;
}

/**
 * Table data extracted from PDF
 */
export interface PDFTable {
  headers: string[];
  pageNumber: number;
  rows: string[][];
}

/**
 * Page-specific text mapping
 */
export type PDFPageTexts = Map<number, string>;
