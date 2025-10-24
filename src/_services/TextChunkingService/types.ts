/**
 * Text Chunking Service - Type Definitions
 *
 * Defines types for domain-agnostic text chunking.
 */

/**
 * Chunking strategy types
 */
export type ChunkingStrategy = 'simple' | 'semantic';

/**
 * Text chunk with position and metadata
 */
export interface TextChunk {
  content: string;
  endPosition: number;
  metadata?: {
    coherenceScore?: number;
    entities?: string[];
    isComplete?: boolean;
    keyPhrases?: string[];
    relationship?: {
      nextChunkId?: string;
      position?: string;
      prevChunkId?: string;
    };
    strategy?: string;
    tags?: string[];
    topics?: string[];
  };
  startPosition: number;
}
