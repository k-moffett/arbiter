/**
 * Text Chunking Service Implementation
 *
 * Domain-agnostic service for chunking text into semantic units.
 * Supports multiple chunking strategies (simple and semantic).
 */

import type { ChunkTextParams, ITextChunkingService } from './interfaces.js';
import type { TextChunk } from './types.js';
import type { BaseLogger } from '@shared/_base/BaseLogger/index.js';

/**
 * Chunking strategy interface
 */
export interface IChunkingStrategy {
  chunk(params: ChunkTextParams): Promise<TextChunk[]>;
}

/**
 * Constructor parameters for TextChunkingService
 */
export interface TextChunkingServiceParams {
  logger: BaseLogger;
  semanticChunker?: IChunkingStrategy;
  simpleChunker: IChunkingStrategy;
}

/**
 * Text Chunking Service
 *
 * Orchestrates text chunking using different strategies.
 * Delegates to strategy implementations (SimpleChunker, OllamaSemanticChunker).
 */
export class TextChunkingService implements ITextChunkingService {
  private readonly logger: BaseLogger;
  private readonly semanticChunker: IChunkingStrategy | null;
  private readonly simpleChunker: IChunkingStrategy;

  constructor(params: TextChunkingServiceParams) {
    this.logger = params.logger;
    this.simpleChunker = params.simpleChunker;
    this.semanticChunker = params.semanticChunker ?? null;
  }

  /**
   * Chunk text using the specified strategy
   */
  public async chunk(params: ChunkTextParams): Promise<TextChunk[]> {
    const { strategy = 'simple' } = params;

    if (strategy === 'semantic') {
      return this.chunkWithSemanticStrategy({ params });
    }

    return this.chunkWithSimpleStrategy({ params });
  }

  /**
   * Chunk using semantic strategy (Ollama-powered)
   */
  private async chunkWithSemanticStrategy(innerParams: {
    params: ChunkTextParams;
  }): Promise<TextChunk[]> {
    const { params } = innerParams;

    if (this.semanticChunker === null) {
      this.logger.warn({
        message: 'Semantic chunker not available, falling back to simple chunker',
      });
      return this.chunkWithSimpleStrategy({ params });
    }

    try {
      return await this.semanticChunker.chunk(params);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error({
        context: {
          errorMessage,
          errorStack,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        },
        message: 'Semantic chunking failed, falling back to simple chunker',
      });
      return this.chunkWithSimpleStrategy({ params });
    }
  }

  /**
   * Chunk using simple strategy (paragraph/sentence-based)
   */
  private async chunkWithSimpleStrategy(innerParams: {
    params: ChunkTextParams;
  }): Promise<TextChunk[]> {
    const { params } = innerParams;
    return this.simpleChunker.chunk(params);
  }
}
