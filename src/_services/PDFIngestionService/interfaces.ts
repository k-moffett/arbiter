/**
 * PDF Ingestion Service - Interfaces
 *
 * Interfaces for PDF ingestion functionality.
 */

import type { ChunkingStrategy } from '../TextChunkingService/types.js';
import type { PDFIngestionResult } from './types.js';
import type { DocumentMetadata } from './types/metadata.js';

/**
 * Parameters for PDF ingestion
 */
export interface IngestPDFParams {
  chunkingStrategy?: ChunkingStrategy;
  chunkOverlap?: number;
  collectionNameOverride?: string;
  force?: boolean;
  maxChunkSize?: number;
  metadata?: DocumentMetadata;
  minChunkSize?: number;
  pdfPath: string;
}

/**
 * PDF Ingestion Service Interface
 */
export interface IPDFIngestionService {
  /**
   * Ingest a PDF file into Qdrant
   */
  ingest(params: IngestPDFParams): Promise<PDFIngestionResult>;
}
