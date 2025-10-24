/**
 * Text Chunking Service - Interfaces
 *
 * Defines interfaces for text chunking functionality.
 */

import type { ChunkingStrategy, TextChunk } from './types.js';

/**
 * Parameters for chunking text
 */
export interface ChunkTextParams {
  chunkOverlap?: number;
  maxChunkSize?: number;
  minChunkSize?: number;
  strategy?: ChunkingStrategy;
  text: string;
}

/**
 * Text Chunking Service Interface
 *
 * Domain-agnostic service for chunking text into semantic units.
 */
export interface ITextChunkingService {
  /**
   * Chunk text using the specified strategy
   */
  chunk(params: ChunkTextParams): Promise<TextChunk[]>;
}
