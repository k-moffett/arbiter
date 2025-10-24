/**
 * PDF Ingestion Service - Type Definitions
 *
 * Types for PDF ingestion and Qdrant storage.
 */

/**
 * Ingestion result with success/failure info
 */
export interface PDFIngestionResult {
  collectionName: string;
  documentsIngested: number;
  error?: Error;
  pdfMetadata: {
    author?: string;
    filename: string;
    pages?: number;
    title?: string;
  };
  success: boolean;
}
