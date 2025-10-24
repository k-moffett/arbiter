/**
 * pdf-parse PDF Parser Implementation
 *
 * Concrete implementation of PDFParserService using the pdf-parse library.
 * Migrated from cogitator with refactoring to follow arbiter standards.
 */

import type {
  CleanTextParams,
  ExtractPatternsParams,
  ParseParams,
  PDFParseResult,
} from '../../PDFParserService/index.js';
import type { PDFMetadata, PDFTable } from '../../PDFParserService/types.js';
import type { PdfParsePDFParserParams } from './types.js';

import { readFile } from 'fs/promises';

import { ConsoleLogger } from '@shared/_infrastructure/ConsoleLogger/index.js';
import pdf from 'pdf-parse';

import { PDFParserService } from '../../PDFParserService/index.js';
import {
  createPageFilter,
  extractPageTexts,
  processTableData,
} from './utils.js';

/**
 * PDF Parser using pdf-parse library
 *
 * Provides PDF parsing functionality using the pdf-parse npm package.
 */
export class PdfParsePDFParser extends PDFParserService {
  constructor(params: PdfParsePDFParserParams = {}) {
    const logger = params.logger ?? new ConsoleLogger({});
    super(logger);
  }

  /**
   * Clean and normalize text extracted from PDF
   */
  public cleanText(params: CleanTextParams): string {
    const { text } = params;

    if (text === undefined) {
      return '';
    }

    return text
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]+/g, '\n')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim();
  }

  /**
   * Extract specific patterns from PDF text
   */
  public extractPatterns(params: ExtractPatternsParams): Record<string, string[]> {
    const { patterns, text } = params;
    const results: Record<string, string[]> = {};

    if (text === undefined) {
      return this.getEmptyPatternResults({ patterns });
    }

    for (const [key, pattern] of Object.entries(patterns)) {
      const matches = text.match(new RegExp(pattern, 'g'));
      results[key] = matches ?? [];
    }

    return results;
  }

  /**
   * Parse a PDF file from buffer or file path
   */
  public async parse(params: ParseParams): Promise<PDFParseResult> {
    const { input, options = {} } = params;

    try {
      const buffer = await this.getBuffer({ input });

      const pagerender = options.pageRange !== undefined
        ? createPageFilter(options.pageRange)
        : undefined;

      const pdfData = await pdf(buffer, { pagerender });

      return this.buildParseResult({ options, pdfData });
    } catch (error) {
      this.logger.error({ message: 'Failed to parse PDF', context: { error } });
      throw new Error(`PDF parsing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Build metadata object from PDF info dict
   */
  private buildMetadataObject(params: {
    info: Record<string, unknown>;
    numpages: number | undefined;
  }): PDFMetadata {
    const { info, numpages } = params;
    const metadata: PDFMetadata = {};

    this.setStringField({ field: 'title', info, key: 'Title', metadata });
    this.setStringField({ field: 'author', info, key: 'Author', metadata });
    this.setStringField({ field: 'subject', info, key: 'Subject', metadata });
    this.setStringField({ field: 'keywords', info, key: 'Keywords', metadata });
    this.setDateField({ field: 'creationDate', info, key: 'CreationDate', metadata });
    this.setDateField({ field: 'modDate', info, key: 'ModDate', metadata });

    if (numpages !== undefined) {
      metadata.pages = numpages;
    }

    return metadata;
  }

  /**
   * Build parse result from pdf-parse output
   */
  private buildParseResult(params: {
    options: ParseParams['options'];
    pdfData: Awaited<ReturnType<typeof pdf>>;
  }): PDFParseResult {
    const { options = {}, pdfData } = params;
    const result: PDFParseResult = {};

    if (options.extractMetadata !== false) {
      const metadata = this.extractMetadata({ pdfData });
      if (metadata !== null) {
        result.metadata = metadata;
      }
    }

    if (options.extractText !== false) {
      result.text = pdfData.text;
    }

    if (options.extractTables === true) {
      result.tables = this.extractTables({ text: pdfData.text });
    }

    if (options.pageRange !== undefined) {
      result.pageTexts = extractPageTexts({ pdfData });
    }

    return result;
  }

  /**
   * Extract metadata from PDF
   */
  private extractMetadata(params: {
    pdfData: Awaited<ReturnType<typeof pdf>>;
  }): PDFMetadata | null {
    const { pdfData } = params;

    const rawInfo: unknown = pdfData.info;
    const rawPages: unknown = pdfData.numpages;

    if (rawInfo === null || rawInfo === undefined) {
      if (typeof rawPages === 'number') {
        return { pages: rawPages };
      }
      return null;
    }

    const info = rawInfo as Record<string, unknown>;
    const hasNoInfo = Object.keys(info).length === 0;
    const hasNoPages = typeof rawPages !== 'number';

    if (hasNoInfo && hasNoPages) {
      return null;
    }

    const numpages = typeof rawPages === 'number' ? rawPages : undefined;
    return this.buildMetadataObject({ info, numpages });
  }

  /**
   * Extract tables from PDF text
   *
   * Basic implementation - looks for table-like structures in text.
   */
  private extractTables(params: { text: string }): PDFTable[] {
    const { text } = params;
    const state = {
      currentTable: [] as string[][],
      inTable: false,
      pageNumber: 1,
      tables: [] as PDFTable[],
    };
    const lines = text.split('\n');

    for (const line of lines) {
      this.processTableLine({ line, state });
    }

    this.finalizeTable({ state });

    return state.tables;
  }

  /**
   * Finalize table extraction
   */
  private finalizeTable(params: {
    state: { currentTable: string[][]; inTable: boolean; pageNumber: number; tables: PDFTable[] };
  }): void {
    const { state } = params;

    if (!state.inTable) {
      return;
    }

    if (state.currentTable.length > 1) {
      const tableParams = { pageNumber: state.pageNumber, rows: state.currentTable };
      state.tables.push(processTableData(tableParams));
    }
  }

  /**
   * Get buffer from input (file path or buffer)
   */
  private async getBuffer(params: { input: Buffer | string }): Promise<Buffer> {
    const { input } = params;

    if (typeof input === 'string') {
      return await readFile(input);
    }

    return input;
  }

  /**
   * Get empty pattern results for all patterns
   */
  private getEmptyPatternResults(
    params: { patterns: Record<string, RegExp> }
  ): Record<string, string[]> {
    const { patterns } = params;
    const results: Record<string, string[]> = {};

    for (const key of Object.keys(patterns)) {
      results[key] = [];
    }

    return results;
  }

  /**
   * Handle page number detection
   */
  private handlePageNumber(params: {
    line: string;
    state: { pageNumber: number };
  }): void {
    const { line, state } = params;
    const pageMatch = line.match(/Page\s*(\d+)/i);

    if (pageMatch?.[1] !== undefined) {
      state.pageNumber = parseInt(pageMatch[1], 10);
    }
  }

  /**
   * Handle end of table
   */
  private handleTableEnd(params: {
    state: { currentTable: string[][]; inTable: boolean; pageNumber: number; tables: PDFTable[] };
  }): void {
    const { state } = params;

    if (state.currentTable.length > 1) {
      const tableParams = { pageNumber: state.pageNumber, rows: state.currentTable };
      state.tables.push(processTableData(tableParams));
    }

    state.currentTable = [];
    state.inTable = false;
  }

  /**
   * Handle table row detection
   */
  private handleTableRow(params: {
    cells: string[];
    state: { currentTable: string[][]; inTable: boolean };
  }): void {
    const { cells, state } = params;

    if (!state.inTable) {
      state.inTable = true;
      state.currentTable = [];
    }

    state.currentTable.push(cells);
  }

  /**
   * Process a single line for table extraction
   */
  private processTableLine(params: {
    line: string;
    state: { currentTable: string[][]; inTable: boolean; pageNumber: number; tables: PDFTable[] };
  }): void {
    const { line, state } = params;
    const cells = line.trim().split(/\s{2,}/);

    const isTableRow = cells.length > 1;
    if (isTableRow) {
      this.handleTableRow({ cells, state });
      return;
    }

    const isEmptyLine = line.trim() === '';
    if (state.inTable && isEmptyLine) {
      this.handleTableEnd({ state });
      return;
    }

    this.handlePageNumber({ line, state });
  }

  /**
   * Set date field in metadata if present in info
   */
  private setDateField(params: {
    field: keyof PDFMetadata;
    info: Record<string, unknown>;
    key: string;
    metadata: PDFMetadata;
  }): void {
    const { field, info, key, metadata } = params;
    const value = info[key];

    if (value !== undefined) {
      (metadata[field] as Date | undefined) = new Date(value as string);
    }
  }

  /**
   * Set string field in metadata if present in info
   */
  private setStringField(params: {
    field: keyof PDFMetadata;
    info: Record<string, unknown>;
    key: string;
    metadata: PDFMetadata;
  }): void {
    const { field, info, key, metadata } = params;
    const value = info[key];

    if (value !== undefined) {
      (metadata[field] as string | undefined) = value as string;
    }
  }
}
