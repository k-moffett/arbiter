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
    /** Semantic coherence score (0-1) from boundary analysis */
    coherenceScore?: number;

    /** Document author (from document-level metadata) */
    documentAuthor?: string;

    /** Document category (from document-level metadata) */
    documentCategory?: string;

    /** Document-level tags (from document-level metadata) */
    documentTags?: string[];

    /** Document title (from document-level metadata) */
    documentTitle?: string;

    /** Named entities extracted from chunk */
    entities?: string[];

    /** Whether chunk represents complete semantic unit */
    isComplete?: boolean;

    /** Key phrases extracted from chunk */
    keyPhrases?: string[];

    /** Relationship to adjacent chunks */
    relationship?: {
      nextChunkId?: string;
      position?: string;
      prevChunkId?: string;
    };

    /** Chunking strategy used */
    strategy?: string;

    /** Confidence in tag extraction (0-1) */
    tagConfidence?: number;

    /** Tags extracted from chunk */
    tags?: string[];

    /** Topics extracted from chunk */
    topics?: string[];
  };
  startPosition: number;
}
