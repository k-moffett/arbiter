/**
 * Simple Chunker Implementation
 *
 * Basic paragraph and sentence-based text chunking.
 * Fast fallback when Ollama semantic chunking is unavailable.
 */

import type { ChunkTextParams } from '../../interfaces.js';
import type { IChunkingStrategy } from '../../TextChunkingServiceImplementation.js';
import type { TextChunk } from '../../types.js';
import type { SimpleChunkerParams } from './types.js';
import type { BaseLogger } from '@shared/_base/BaseLogger/index.js';

import { ConsoleLogger } from '@shared/_infrastructure/ConsoleLogger/index.js';

/**
 * Simple Chunker
 *
 * Chunks text using basic paragraph and sentence boundaries.
 * No LLM or semantic analysis - purely rule-based.
 */
export class SimpleChunker implements IChunkingStrategy {
  private readonly logger: BaseLogger;

  constructor(params: SimpleChunkerParams = {}) {
    this.logger = params.logger ?? new ConsoleLogger({});
  }

  /**
   * Chunk text using simple paragraph/sentence-based strategy
   */
  public async chunk(params: ChunkTextParams): Promise<TextChunk[]> {
    const { chunkOverlap: overlapParam, maxChunkSize = 1500, minChunkSize = 200, text } = params;

    // Calculate overlap: use percentage-based (15% default) if not specified
    const overlapPercentage = 0.15; // 15% overlap
    const chunkOverlap = overlapParam ?? Math.floor(maxChunkSize * overlapPercentage);

    this.logger.debug({
      context: { chunkOverlap, maxChunkSize, minChunkSize },
      message: 'Chunking text with simple strategy',
    });

    const paragraphs = await this.splitIntoParagraphs({ text });
    const chunks = this.createChunksWithRelationships({
      chunkOverlap,
      maxChunkSize,
      minChunkSize,
      paragraphs,
    });

    this.logger.debug({
      context: { chunkCount: chunks.length },
      message: 'Simple chunking complete',
    });

    return chunks;
  }

  /**
   * Append paragraph to current chunk
   */
  private appendParagraph(params: { currentChunk: string; paragraph: string }): string {
    const { currentChunk, paragraph } = params;

    if (currentChunk === '') {
      return paragraph;
    }

    return `${currentChunk}\n\n${paragraph}`;
  }

  /**
   * Create a text chunk object
   */
  private createChunk(params: { content: string; startPosition: number }): TextChunk {
    const { content, startPosition } = params;

    return {
      content,
      endPosition: startPosition + content.length,
      metadata: {
        isComplete: true,
        strategy: 'simple',
      },
      startPosition,
    };
  }

  /**
   * Create chunks from paragraphs with relationship linking
   */
  private createChunksWithRelationships(params: {
    chunkOverlap: number;
    maxChunkSize: number;
    minChunkSize: number;
    paragraphs: string[];
  }): TextChunk[] {
    const { chunkOverlap, maxChunkSize, minChunkSize, paragraphs } = params;
    const chunks: TextChunk[] = [];
    let currentChunk = '';
    let currentStart = 0;

    for (const paragraph of paragraphs) {
      const wouldExceedMax = currentChunk.length + paragraph.length + 2 > maxChunkSize;
      const meetsMin = currentChunk.length >= minChunkSize;

      if (wouldExceedMax && meetsMin) {
        chunks.push(this.createChunk({ content: currentChunk, startPosition: currentStart }));
        currentStart += currentChunk.length - chunkOverlap;
        currentChunk = this.getOverlapText({ chunkOverlap, text: currentChunk });
      }

      currentChunk = this.appendParagraph({ currentChunk, paragraph });
    }

    if (currentChunk.length > 0) {
      chunks.push(this.createChunk({ content: currentChunk, startPosition: currentStart }));
    }

    // Add relationship linking (prev/next chunk IDs)
    return this.linkChunks({ chunks });
  }

  /**
   * Get overlap text from end of chunk
   */
  private getOverlapText(params: { chunkOverlap: number; text: string }): string {
    const { chunkOverlap, text } = params;

    if (text.length <= chunkOverlap) {
      return text;
    }

    return text.slice(-chunkOverlap);
  }

  /**
   * Link chunks with bidirectional relationships
   */
  private linkChunks(params: { chunks: TextChunk[] }): TextChunk[] {
    const { chunks } = params;
    const linkedChunks: TextChunk[] = [];

    for (let index = 0; index < chunks.length; index++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Index is within bounds
      const chunk = chunks[index]!;
      const prevChunkId = index > 0 ? `chunk-${String(index - 1)}` : undefined;
      const nextChunkId = index < chunks.length - 1 ? `chunk-${String(index + 1)}` : undefined;

      linkedChunks.push({
        ...chunk,
        metadata: {
          ...chunk.metadata,
          relationship: {
            ...(nextChunkId !== undefined ? { nextChunkId } : {}),
            position: `${String(index + 1)}/${String(chunks.length)}`,
            ...(prevChunkId !== undefined ? { prevChunkId } : {}),
          },
        },
      });
    }

    return linkedChunks;
  }

  /**
   * Split text into paragraphs
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async splitIntoParagraphs(params: { text: string }): Promise<string[]> {
    const { text } = params;
    return text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }
}
