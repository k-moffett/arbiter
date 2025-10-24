/**
 * Ollama Semantic Chunker Implementation
 *
 * LLM-powered semantic chunking with boundary detection and metadata extraction.
 * Coordinates multiple analyzers to create semantically coherent chunks.
 */

import type { ChunkTextParams } from '../../interfaces';
import type { IChunkingStrategy } from '../../TextChunkingServiceImplementation';
import type { TextChunk } from '../../types';
import type { OllamaBoundaryScorer } from './_analyzers/OllamaBoundaryScorer';
import type { OllamaDiscourseClassifier } from './_analyzers/OllamaDiscourseClassifier';
import type { OllamaStructureDetector } from './_analyzers/OllamaStructureDetector';
import type { OllamaTagExtractor } from './_analyzers/OllamaTagExtractor';
import type { OllamaTopicAnalyzer } from './_analyzers/OllamaTopicAnalyzer';
import type { SemanticChunkerConfig } from './config';
import type { BaseLogger } from '@shared/_base/BaseLogger';

import { ConsoleLogger } from '@shared/_infrastructure/ConsoleLogger';

/**
 * Ollama Semantic Chunker Configuration
 */
export interface OllamaSemanticChunkerParams {
  /** Boundary scorer for weighted signal combination */
  boundaryScorer: OllamaBoundaryScorer;

  /** Semantic chunker configuration */
  config: SemanticChunkerConfig;

  /** Discourse classifier analyzer */
  discourseClassifier: OllamaDiscourseClassifier;

  /** Embedding service for semantic similarity */
  embeddingService: {
    embed(params: { text: string }): Promise<number[]>;
  };

  /** Optional logger */
  logger?: BaseLogger;

  /** Structure detector analyzer */
  structureDetector: OllamaStructureDetector;

  /** Tag extractor for metadata enrichment */
  tagExtractor: OllamaTagExtractor;

  /** Topic analyzer */
  topicAnalyzer: OllamaTopicAnalyzer;
}

/**
 * Sentence with boundary analysis
 */
interface SentenceWithBoundary {
  /** Weighted boundary score (0-1) */
  boundaryScore: number;

  /** Sentence content */
  content: string;

  /** Whether this should be kept as an atomic unit */
  isAtomic: boolean;

  /** Start position in original text */
  startPosition: number;
}

/**
 * Ollama Semantic Chunker
 *
 * Implements intelligent semantic chunking using LLM analyzers.
 *
 * Features:
 * - Topic shift detection
 * - Discourse relationship analysis
 * - Document structure preservation
 * - Atomic unit detection (tables, Q&A pairs)
 * - Weighted boundary scoring
 * - Force-split for oversized chunks (>2KB embedding limit)
 * - Metadata extraction (entities, topics, tags, key phrases)
 * - Chunk relationship tracking
 */
export class OllamaSemanticChunker implements IChunkingStrategy {
  private readonly boundaryScorer: OllamaBoundaryScorer;
  private readonly config: SemanticChunkerConfig;
  private readonly discourseClassifier: OllamaDiscourseClassifier;
  private readonly embeddingService: OllamaSemanticChunkerParams['embeddingService'];
  private readonly logger: BaseLogger;
  private readonly structureDetector: OllamaStructureDetector;
  private readonly tagExtractor: OllamaTagExtractor;
  private readonly topicAnalyzer: OllamaTopicAnalyzer;

  constructor(params: OllamaSemanticChunkerParams) {
    this.boundaryScorer = params.boundaryScorer;
    this.config = params.config;
    this.discourseClassifier = params.discourseClassifier;
    this.embeddingService = params.embeddingService;
    this.logger = params.logger ?? new ConsoleLogger({});
    this.structureDetector = params.structureDetector;
    this.tagExtractor = params.tagExtractor;
    this.topicAnalyzer = params.topicAnalyzer;
  }

  /**
   * Chunk text using semantic analysis
   */
  public async chunk(params: ChunkTextParams): Promise<TextChunk[]> {
    this.logger.debug({
      context: { textLength: params.text.length },
      message: 'Starting semantic chunking',
    });

    // Split into sentences
    const sentences = await this.splitIntoSentences({ text: params.text });

    // Analyze boundaries
    const sentencesWithBoundaries = await this.analyzeBoundaries({ sentences });

    // Create chunks based on boundaries and size constraints
    const chunks = this.createChunks({
      maxSize: params.maxChunkSize ?? this.config.maxSize,
      minSize: params.minChunkSize ?? this.config.minSize,
      sentences: sentencesWithBoundaries,
    });

    // Extract metadata for each chunk
    const chunksWithMetadata = await this.enrichWithMetadata({ chunks });

    // Add relationship linking
    const linkedChunks = this.linkChunks({ chunks: chunksWithMetadata });

    this.logger.debug({
      context: { chunkCount: linkedChunks.length },
      message: 'Semantic chunking complete',
    });

    return linkedChunks;
  }

  /**
   * Analyze boundaries between sentences
   */
  private async analyzeBoundaries(params: {
    sentences: Array<{ content: string; startPosition: number }>;
  }): Promise<SentenceWithBoundary[]> {
    const sentencesWithBoundaries: SentenceWithBoundary[] = [];

    for (let i = 0; i < params.sentences.length; i++) {
      const currentSentence = params.sentences[i];
      const nextSentence = params.sentences[i + 1];

      if (currentSentence === undefined) {
        continue;
      }

      // Last sentence always has boundary score of 1.0 (end of document)
      if (nextSentence === undefined) {
        sentencesWithBoundaries.push({
          boundaryScore: 1.0,
          content: currentSentence.content,
          isAtomic: false,
          startPosition: currentSentence.startPosition,
        });
        continue;
      }

      // Analyze boundary with all analyzers in parallel
      const [topicBoundary, discourseBoundary, structureBoundary, semanticDistance] =
        await Promise.all([
          this.topicAnalyzer.detectTopicBoundary({
            textAfter: nextSentence.content,
            textBefore: currentSentence.content,
          }),
          this.discourseClassifier.detectDiscourseBoundary({
            textAfter: nextSentence.content,
            textBefore: currentSentence.content,
          }),
          this.structureDetector.detectStructureBoundary({
            textAfter: nextSentence.content,
            textBefore: currentSentence.content,
          }),
          this.calculateSemanticDistance({
            textA: currentSentence.content,
            textB: nextSentence.content,
          }),
        ]);

      // Calculate weighted boundary score
      const boundaryScore = this.boundaryScorer.calculateBoundaryScore({
        discourseStrength: discourseBoundary.boundaryStrength,
        semanticDistance,
        structureStrength: structureBoundary.boundaryStrength,
        topicStrength: topicBoundary.boundaryStrength,
      });

      sentencesWithBoundaries.push({
        boundaryScore: boundaryScore.weightedScore,
        content: currentSentence.content,
        isAtomic: structureBoundary.analysis.shouldKeepAtomic,
        startPosition: currentSentence.startPosition,
      });
    }

    return sentencesWithBoundaries;
  }

  /**
   * Append sentence to current chunk
   */
  private appendSentence(params: {
    sentence: SentenceWithBoundary;
    state: {
      boundaryCount: number;
      currentChunk: string;
      currentCoherenceScore: number;
      currentStart: number;
    };
  }): void {
    const { sentence, state } = params;
    state.currentChunk =
      state.currentChunk === ''
        ? sentence.content
        : `${state.currentChunk} ${sentence.content}`;
    state.currentCoherenceScore += sentence.boundaryScore;
    state.boundaryCount++;
  }

  /**
   * Calculate semantic distance between two texts using embeddings
   */
  private async calculateSemanticDistance(params: {
    textA: string;
    textB: string;
  }): Promise<number> {
    try {
      const [embeddingA, embeddingB] = await Promise.all([
        this.embeddingService.embed({ text: params.textA }),
        this.embeddingService.embed({ text: params.textB }),
      ]);

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity({ a: embeddingA, b: embeddingB });

      // Convert similarity to distance (0 = identical, 1 = completely different)
      return 1 - similarity;
    } catch (error) {
      this.logger.warn({
        context: { error: error instanceof Error ? error.message : String(error) },
        message: 'Failed to calculate semantic distance, using default 0.5',
      });
      return 0.5;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(params: { a: number[]; b: number[] }): number {
    if (params.a.length !== params.b.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < params.a.length; i++) {
      const valueA = params.a[i] ?? 0;
      const valueB = params.b[i] ?? 0;
      dotProduct += valueA * valueB;
      magnitudeA += valueA * valueA;
      magnitudeB += valueB * valueB;
    }

    const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Create chunks from sentences with boundaries
   */
  private createChunks(params: {
    maxSize: number;
    minSize: number;
    sentences: SentenceWithBoundary[];
  }): TextChunk[] {
    const chunks: TextChunk[] = [];
    const state = {
      boundaryCount: 0,
      currentChunk: '',
      currentCoherenceScore: 0,
      currentStart: 0,
    };

    for (const sentence of params.sentences) {
      const shouldChunk = this.shouldCreateChunk({
        sentence,
        state,
        maxSize: params.maxSize,
        minSize: params.minSize,
      });

      if (shouldChunk && state.currentChunk.length > 0) {
        this.finalizeChunk({ chunks, state });
      }

      // Append sentence
      this.appendSentence({ sentence, state });
    }

    // Add final chunk
    if (state.currentChunk.length > 0) {
      this.finalizeChunk({ chunks, state });
    }

    return chunks;
  }

  /**
   * Enrich chunks with semantic metadata
   */
  private async enrichWithMetadata(params: { chunks: TextChunk[] }): Promise<TextChunk[]> {
    const enrichedChunks: TextChunk[] = [];

    for (const chunk of params.chunks) {
      try {
        const tags = await this.tagExtractor.extractTags({ text: chunk.content });

        enrichedChunks.push({
          ...chunk,
          metadata: {
            ...chunk.metadata,
            entities: tags.entities,
            keyPhrases: tags.keyPhrases,
            tags: tags.tags,
            topics: tags.topics,
          },
        });
      } catch (error) {
        this.logger.warn({
          context: { error: error instanceof Error ? error.message : String(error) },
          message: 'Failed to extract tags for chunk, using chunk without metadata',
        });
        enrichedChunks.push(chunk);
      }
    }

    return enrichedChunks;
  }

  /**
   * Finalize current chunk and add to chunks array
   */
  private finalizeChunk(params: {
    chunks: TextChunk[];
    state: {
      boundaryCount: number;
      currentChunk: string;
      currentCoherenceScore: number;
      currentStart: number;
    };
  }): void {
    const { chunks, state } = params;
    const avgCoherence =
      state.boundaryCount > 0 ? 1 - state.currentCoherenceScore / state.boundaryCount : 1.0;

    chunks.push({
      content: state.currentChunk.trim(),
      endPosition: state.currentStart + state.currentChunk.length,
      metadata: {
        coherenceScore: avgCoherence,
        isComplete: true,
        strategy: 'semantic',
      },
      startPosition: state.currentStart,
    });

    state.currentStart += state.currentChunk.length + 1;
    state.currentChunk = '';
    state.currentCoherenceScore = 0;
    state.boundaryCount = 0;
  }

  /**
   * Link chunks with bidirectional relationships
   */
  private linkChunks(params: { chunks: TextChunk[] }): TextChunk[] {
    const linkedChunks: TextChunk[] = [];

    for (let index = 0; index < params.chunks.length; index++) {
      const chunk = params.chunks[index];
      if (chunk === undefined) {
        continue;
      }

      const prevChunkId = index > 0 ? `chunk-${String(index - 1)}` : undefined;
      const nextChunkId = index < params.chunks.length - 1 ? `chunk-${String(index + 1)}` : undefined;

      linkedChunks.push({
        ...chunk,
        metadata: {
          ...chunk.metadata,
          relationship: {
            ...(nextChunkId !== undefined ? { nextChunkId } : {}),
            position: `${String(index + 1)}/${String(params.chunks.length)}`,
            ...(prevChunkId !== undefined ? { prevChunkId } : {}),
          },
        },
      });
    }

    return linkedChunks;
  }

  /**
   * Determine if we should create a chunk at this point
   */
  private shouldCreateChunk(params: {
    maxSize: number;
    minSize: number;
    sentence: SentenceWithBoundary;
    state: { currentChunk: string };
  }): boolean {
    const wouldExceedMax =
      params.state.currentChunk.length + params.sentence.content.length + 1 > params.maxSize;
    const meetsMin = params.state.currentChunk.length >= params.minSize;
    const isStrongBoundary = params.sentence.boundaryScore >= this.config.boundaryThreshold;

    // Force-split if would exceed atomic max size (embedding limit)
    const wouldExceedAtomic =
      params.state.currentChunk.length + params.sentence.content.length + 1 >
      this.config.atomicMaxSize;

    return (
      wouldExceedAtomic ||
      (wouldExceedMax && meetsMin && isStrongBoundary && !params.sentence.isAtomic)
    );
  }

  /**
   * Split text into sentences
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async splitIntoSentences(params: {
    text: string;
  }): Promise<Array<{ content: string; startPosition: number }>> {
    const sentences: Array<{ content: string; startPosition: number }> = [];
    let position = 0;

    // Simple sentence splitting (could be enhanced with NLP library)
    const sentenceRegex = /[^.!?]+[.!?]+\s*/g;
    let match = sentenceRegex.exec(params.text);

    while (match !== null) {
      const content = match[0].trim();
      if (content.length > 0) {
        sentences.push({ content, startPosition: position });
        position += match[0].length;
      }
      match = sentenceRegex.exec(params.text);
    }

    // Handle remaining text without sentence ending
    if (position < params.text.length) {
      const remaining = params.text.slice(position).trim();
      if (remaining.length > 0) {
        sentences.push({ content: remaining, startPosition: position });
      }
    }

    return sentences;
  }
}
