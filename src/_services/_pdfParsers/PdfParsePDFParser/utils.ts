/**
 * pdf-parse PDF Parser - Utility Functions
 *
 * Helper functions for PDF parsing operations.
 */

import type { PDFPageTexts, PDFTable } from '../../PDFParserService/types.js';
import type pdf from 'pdf-parse';

/**
 * Parameters for createPageFilter
 */
export interface CreatePageFilterParams {
  end: number;
  start: number;
}

/**
 * Parameters for processTableData
 */
export interface ProcessTableDataParams {
  pageNumber: number;
  rows: string[][];
}

/**
 * Parameters for extractPageTexts
 */
export interface ExtractPageTextsParams {
  pdfData: Awaited<ReturnType<typeof pdf>>;
}

/**
 * Create a page filter for selective PDF parsing
 */
export function createPageFilter(range: CreatePageFilterParams) {
  return (pageData: { pageIndex: number; str: string }) => {
    const pageNum = pageData.pageIndex + 1;

    if (pageNum < range.start) {
      return '';
    }
    if (pageNum > range.end) {
      return '';
    }

    return pageData.str;
  };
}

/**
 * Process raw table data into structured format
 */
export function processTableData(params: ProcessTableDataParams): PDFTable {
  const { pageNumber, rows } = params;

  if (rows.length === 0) {
    return { headers: [], pageNumber, rows: [] };
  }

  const headers = rows[0] ?? [];
  const dataRows = rows.slice(1);

  return {
    headers,
    pageNumber,
    rows: dataRows,
  };
}

/**
 * Extract text by page from PDF data
 */
export function extractPageTexts(params: ExtractPageTextsParams): PDFPageTexts {
  const { pdfData } = params;
  const pageTexts = new Map<number, string>();

  const pages = pdfData.text.split(/\f/);

  for (const [index, pageText] of pages.entries()) {
    pageTexts.set(index + 1, pageText);
  }

  return pageTexts;
}
