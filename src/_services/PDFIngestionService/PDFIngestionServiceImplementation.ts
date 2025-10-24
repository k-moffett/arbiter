/**
 * PDF Ingestion Service Implementation
 *
 * Orchestrates PDF parsing, chunking, embedding, and storage in Qdrant.
 * Domain-agnostic service that works with any PDF.
 */

import type { QdrantClientAdapter } from '../../_data/_repositories/QdrantClientAdapter/index.js';
import type { OllamaEmbeddingService } from '../OllamaEmbeddingService/index.js';
import type { PDFParserService } from '../PDFParserService/index.js';
import type { TextChunkingService } from '../TextChunkingService/index.js';
import type { ChunkingStrategy, TextChunk } from '../TextChunkingService/types.js';
import type { IngestPDFParams, IPDFIngestionService } from './interfaces.js';
import type { PDFIngestionResult } from './types.js';
import type { BaseLogger } from '@shared/_base/BaseLogger/index.js';

import { randomUUID } from 'crypto';
import { basename, extname } from 'path';

/**
 * Constructor parameters for PDFIngestionService
 */
export interface PDFIngestionServiceParams {
  embeddingDimensions?: number;
  embeddingService?: OllamaEmbeddingService;
  logger: BaseLogger;
  pdfParser: PDFParserService;
  qdrantAdapter: QdrantClientAdapter;
  textChunker: TextChunkingService;
}

/**
 * PDF Ingestion Service
 *
 * Coordinates PDF ingestion pipeline:
 * 1. Parse PDF
 * 2. Chunk text
 * 3. Generate embeddings
 * 4. Store in Qdrant
 */
export class PDFIngestionService implements IPDFIngestionService {
  private readonly embeddingDimensions: number;
  private readonly embeddingService: OllamaEmbeddingService | undefined;
  private readonly logger: BaseLogger;
  private readonly pdfParser: PDFParserService;
  private readonly qdrantAdapter: QdrantClientAdapter;
  private readonly textChunker: TextChunkingService;

  constructor(params: PDFIngestionServiceParams) {
    this.logger = params.logger;
    this.pdfParser = params.pdfParser;
    this.textChunker = params.textChunker;
    this.qdrantAdapter = params.qdrantAdapter;
    this.embeddingService = params.embeddingService;
    this.embeddingDimensions = params.embeddingDimensions ?? 768;
  }

  /**
   * Ingest a PDF file into Qdrant
   */
  public async ingest(params: IngestPDFParams): Promise<PDFIngestionResult> {
    const { chunkingStrategy = 'simple', force = false, pdfPath } = params;

    try {
      this.logger.info({ message: 'Starting PDF ingestion', context: { pdfPath, chunkingStrategy } });

      const parseResult = await this.pdfParser.parse({ input: pdfPath });

      if (parseResult.text === undefined) {
        throw new Error('No text extracted from PDF');
      }

      const filename = basename(pdfPath);
      const collectionName =
        params.collectionNameOverride ?? this.sanitizeCollectionName({ filename });

      await this.ensureCollection({ collectionName, force });

      const chunks = await this.chunkText({
        chunkOverlap: params.chunkOverlap,
        chunkingStrategy,
        maxChunkSize: params.maxChunkSize,
        minChunkSize: params.minChunkSize,
        text: parseResult.text,
      });

      this.logger.info({ context: { chunkCount: chunks.length }, message: 'Text chunked' });

      // Store chunks in Qdrant
      // TODO: Replace placeholder vectors with real embeddings
      await this.storeChunks({ chunks, collectionName, pdfPath });

      this.logger.info({
        context: { chunkCount: chunks.length, collectionName },
        message: 'Chunks stored in Qdrant',
      });

      const pdfMetadata = this.extractPdfMetadata({ filename, metadata: parseResult.metadata });

      const result: PDFIngestionResult = {
        collectionName,
        documentsIngested: chunks.length,
        pdfMetadata,
        success: true,
      };

      this.logger.info({
        context: {
          collectionName: result.collectionName,
          documentsIngested: result.documentsIngested,
        },
        message: 'PDF ingestion complete',
      });

      return result;
    } catch (error) {
      this.logger.error({ message: 'PDF ingestion failed', context: { error, pdfPath } });

      return {
        collectionName: '',
        documentsIngested: 0,
        error: error as Error,
        pdfMetadata: {
          filename: basename(pdfPath),
        },
        success: false,
      };
    }
  }

  /**
   * Chunk text with optional parameters
   */
  private async chunkText(params: {
    chunkingStrategy: ChunkingStrategy;
    chunkOverlap: number | undefined;
    maxChunkSize: number | undefined;
    minChunkSize: number | undefined;
    text: string;
  }): Promise<TextChunk[]> {
    const chunkParams: {
      chunkOverlap?: number;
      maxChunkSize?: number;
      minChunkSize?: number;
      strategy: ChunkingStrategy;
      text: string;
    } = {
      strategy: params.chunkingStrategy,
      text: params.text,
    };

    if (params.chunkOverlap !== undefined) {
      chunkParams.chunkOverlap = params.chunkOverlap;
    }
    if (params.maxChunkSize !== undefined) {
      chunkParams.maxChunkSize = params.maxChunkSize;
    }
    if (params.minChunkSize !== undefined) {
      chunkParams.minChunkSize = params.minChunkSize;
    }

    return this.textChunker.chunk(chunkParams);
  }

  /**
   * Create collection if it doesn't exist
   */
  private async createCollectionIfNotExists(params: { collectionName: string }): Promise<void> {
    const { collectionName } = params;

    try {
      await this.qdrantAdapter.createCollection({
        dimensions: this.embeddingDimensions,
        name: collectionName,
      });
      this.logger.info({ message: 'Created new collection', context: { collectionName } });
    } catch (error) {
      const errorMessage = (error as Error).message;
      const collectionExists = errorMessage.includes('already exists') || errorMessage.includes('exist');

      if (collectionExists) {
        throw new Error(
          `Collection '${collectionName}' already exists. Use --force to overwrite.`
        );
      }

      throw error;
    }
  }

  /**
   * Delete collection if it exists
   */
  private async deleteCollectionIfExists(params: {
    collectionName: string;
  }): Promise<void> {
    const { collectionName } = params;

    try {
      await this.qdrantAdapter.deleteCollection({ name: collectionName });
      this.logger.info({
        context: { collectionName },
        message: 'Deleted existing collection',
      });
    } catch {
      // Collection doesn't exist, that's fine
      this.logger.debug({
        context: { collectionName },
        message: 'No collection to delete',
      });
    }
  }

  /**
   * Ensure collection exists, handle collision detection
   */
  private async ensureCollection(params: {
    collectionName: string;
    force: boolean;
  }): Promise<void> {
    const { collectionName, force } = params;

    if (force) {
      await this.deleteCollectionIfExists({ collectionName });
    }

    await this.createCollectionIfNotExists({ collectionName });
  }

  /**
   * Extract PDF metadata with optional properties
   */
  private extractPdfMetadata(params: {
    filename: string;
    metadata: { author?: string; pages?: number; title?: string } | undefined;
  }): {
    author?: string;
    filename: string;
    pages?: number;
    title?: string;
  } {
    const pdfMetadata: {
      author?: string;
      filename: string;
      pages?: number;
      title?: string;
    } = {
      filename: params.filename,
    };

    if (params.metadata?.author !== undefined) {
      pdfMetadata.author = params.metadata.author;
    }
    if (params.metadata?.pages !== undefined) {
      pdfMetadata.pages = params.metadata.pages;
    }
    if (params.metadata?.title !== undefined) {
      pdfMetadata.title = params.metadata.title;
    }

    return pdfMetadata;
  }

  /**
   * Generate embeddings for chunks
   */
  private async generateEmbeddings(params: { chunks: TextChunk[] }): Promise<number[][]> {
    const { chunks } = params;

    // If embedding service is available, use it
    if (this.embeddingService !== undefined) {
      this.logger.info({
        context: { chunkCount: chunks.length },
        message: 'Generating embeddings',
      });

      const requests = [];
      for (let index = 0; index < chunks.length; index++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Index is within bounds
        const chunk = chunks[index]!;
        requests.push({
          id: String(index),
          text: chunk.content,
        });
      }

      const result = await this.embeddingService.generateBatchEmbeddings({ requests });

      this.logger.info({
        context: {
          cacheHits: result.cacheHits,
          cacheMisses: result.cacheMisses,
          totalTimeMs: result.totalTimeMs,
        },
        message: 'Embeddings generated',
      });

      return result.results.map((r) => r.embedding);
    }

    // Fallback to placeholder vectors
    this.logger.warn({
      message: 'No embedding service available, using placeholder vectors',
    });

    const placeholderVector = new Array<number>(this.embeddingDimensions).fill(0);
    return chunks.map(() => placeholderVector);
  }

  /**
   * Get Qdrant URL from environment or default
   */
  private getQdrantUrl(): string {
    const host = process.env['QDRANT_HOST'] ?? 'localhost';
    const port = process.env['QDRANT_PORT'] ?? '6333';
    return `http://${host}:${port}`;
  }

  /**
   * Sanitize filename to valid Qdrant collection name
   *
   * Rules:
   * - Lowercase
   * - Replace spaces and special chars with hyphens
   * - Remove extension
   * - Must start with letter or underscore
   * - Only alphanumeric, hyphens, underscores
   */
  private sanitizeCollectionName(params: { filename: string }): string {
    const { filename } = params;

    const nameWithoutExt = basename(filename, extname(filename));

    let sanitized = nameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!/^[a-z_]/.test(sanitized)) {
      sanitized = `pdf_${sanitized}`;
    }

    return sanitized;
  }

  /**
   * Store chunks in Qdrant with embeddings
   */
  private async storeChunks(params: {
    chunks: TextChunk[];
    collectionName: string;
    pdfPath: string;
  }): Promise<void> {
    const { chunks, collectionName, pdfPath } = params;

    // Generate embeddings for all chunks
    const vectors = await this.generateEmbeddings({ chunks });

    const placeholderVector = new Array<number>(this.embeddingDimensions).fill(0);

    const documents = Array.from(chunks.entries()).map(([index, chunk]) => ({
      content: chunk.content,
      id: randomUUID(),
      metadata: {
        chunkIndex: index,
        endPosition: chunk.endPosition,
        pdfPath,
        source: basename(pdfPath),
        startPosition: chunk.startPosition,
        ...chunk.metadata,
      },
      vector: vectors[index] ?? placeholderVector,
    }));

    // Create adapter for target collection and upsert
    // Note: We need a separate adapter because collection is set at construction
    const targetAdapter = new (this.qdrantAdapter.constructor as new (config: {
      collection: string;
      url: string;
    }) => QdrantClientAdapter)({
      collection: collectionName,
      url: this.getQdrantUrl(),
    });

    await targetAdapter.upsert(documents);
  }
}
