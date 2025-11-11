/**
 * Ollama Semantic Chunker Implementation
 *
 * LLM-powered semantic chunking with boundary detection and metadata extraction.
 * Coordinates multiple analyzers to create semantically coherent chunks.
 */

/* eslint-disable max-lines */

import type { ChunkTextParams } from '../../interfaces';
import type { IChunkingStrategy } from '../../TextChunkingServiceImplementation';
import type { TextChunk } from '../../types';
import type { OllamaBoundaryScorer } from './_analyzers/OllamaBoundaryScorer';
import type { OllamaDiscourseClassifier } from './_analyzers/OllamaDiscourseClassifier';
import type { OllamaStructureDetector } from './_analyzers/OllamaStructureDetector';
import type { OllamaTagExtractor } from './_analyzers/OllamaTagExtractor';
import type { OllamaTopicAnalyzer } from './_analyzers/OllamaTopicAnalyzer';
import type { SemanticChunkerConfig } from './config';
import type { BoundaryCandidate } from './types';
import type { BaseLogger } from '@shared/_base/BaseLogger';

import { ConsoleLogger } from '@shared/_infrastructure/ConsoleLogger';

import { AdaptiveThresholdCalculator } from './_analyzers/AdaptiveThresholdCalculator';
import { EmbeddingDistanceCalculator } from './_analyzers/EmbeddingDistanceCalculator';

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
    this.logger.info({
      message: 'Starting boundary analysis',
    });
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
   * Analyze structure for all sentences
   *
   * @param params - Structure analysis parameters
   * @param params.sentences - Array of sentences to analyze
   * @returns Map of sentence index to atomic unit flag
   */
  private async analyzeAllStructure(params: {
    sentences: Array<{ content: string; startPosition: number }>;
  }): Promise<Map<number, boolean>> {
    const { sentences } = params;
    const structureMap = new Map<number, boolean>();

    this.logger.info({
      context: { totalSentences: sentences.length },
      message: 'Starting structure analysis (Pass 2)',
    });

    for (let i = 0; i < sentences.length - 1; i++) {
      const currentSentence = sentences[i];
      const nextSentence = sentences[i + 1];

      if (currentSentence === undefined || nextSentence === undefined) {
        continue;
      }

      const structureBoundary = await this.structureDetector.detectStructureBoundary({
        textBefore: currentSentence.content,
        textAfter: nextSentence.content,
      });

      structureMap.set(i, structureBoundary.analysis.shouldKeepAtomic);

      // Log progress every 100 sentences
      if ((i + 1) % 100 === 0) {
        this.logger.info({
          context: {
            current: i + 1,
            percent: Math.round(((i + 1) / sentences.length) * 100),
            total: sentences.length,
          },
          message: 'Structure analysis progress',
        });
      }
    }

    this.logger.info({
      message: 'Structure analysis complete',
    });

    return structureMap;
  }

  /**
   * Analyze boundaries between sentences using two-pass algorithm
   *
   * Pass 1: Calculate embeddings and identify high-distance candidates
   * Pass 2: Run structure detection on all sentences
   * Pass 3: Run LLM analysis (topic/discourse) only on candidates
   *
   * This reduces LLM calls from N*4 to ~100-200, dramatically improving performance.
   */
  private async analyzeBoundaries(params: {
    sentences: Array<{ content: string; startPosition: number }>;
  }): Promise<SentenceWithBoundary[]> {
    const { sentences } = params;

    this.logger.info({
      context: { totalSentences: sentences.length },
      message: 'Starting two-pass boundary analysis',
    });

    // PASS 1: Calculate embeddings and semantic distances
    const embeddings = await this.batchCalculateEmbeddings({ sentences });
    const distances = this.calculateAllSemanticDistances({ embeddings });

    // Identify candidates using adaptive thresholding
    const { candidates } = this.identifyCandidates({
      distances,
      sentences,
      adaptiveThresholdEnabled: true, // TODO: Load from config
      minThreshold: 0.3, // TODO: Load from config
      maxThreshold: 0.8, // TODO: Load from config
      candidateLimit: 500, // TODO: Load from config
    });

    // PASS 2: Analyze structure for ALL sentences
    const structureMap = await this.analyzeAllStructure({ sentences });

    // PASS 3: LLM analysis ONLY on candidates
    const candidateAnalysis = await this.analyzeCandidatesWithLLM({ candidates });

    // Build final sentence boundaries with weighted scores
    const sentencesWithBoundaries = this.buildSentenceBoundaries({
      sentences,
      distances,
      structureMap,
      candidateAnalysis,
    });

    this.logger.info({
      context: { totalBoundaries: sentencesWithBoundaries.length },
      message: 'Two-pass boundary analysis complete',
    });

    return sentencesWithBoundaries;
  }

  /**
   * Analyze candidates with LLM (topic and discourse analysis)
   *
   * @param params - Analysis parameters
   * @param params.candidates - Boundary candidates to analyze
   * @returns Map of sentence index to LLM analysis results
   */
  private async analyzeCandidatesWithLLM(params: {
    candidates: BoundaryCandidate[];
  }): Promise<Map<number, { discourse: number; topic: number }>> {
    const { candidates } = params;
    const analysisMap = new Map<number, { discourse: number; topic: number }>();

    this.logger.info({
      context: { candidateCount: candidates.length },
      message: 'Starting LLM analysis on candidates (Pass 3)',
    });

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (candidate === undefined) {
        continue;
      }

      const [topicResult, discourseResult] = await Promise.all([
        this.topicAnalyzer.detectTopicBoundary({
          textBefore: candidate.text,
          textAfter: candidate.nextText,
        }),
        this.discourseClassifier.detectDiscourseBoundary({
          textBefore: candidate.text,
          textAfter: candidate.nextText,
        }),
      ]);

      analysisMap.set(candidate.sentenceIndex, {
        topic: topicResult.boundaryStrength,
        discourse: discourseResult.boundaryStrength,
      });

      if ((i + 1) % 10 === 0) {
        this.logger.info({
          context: {
            current: i + 1,
            percent: Math.round(((i + 1) / candidates.length) * 100),
            total: candidates.length,
          },
          message: 'LLM analysis progress',
        });
      }
    }

    this.logger.info({
      message: 'LLM analysis complete',
    });

    return analysisMap;
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
   * Calculate embeddings for all sentences in batch
   *
   * @param params - Batch embedding parameters
   * @param params.sentences - Array of sentences to embed
   * @returns Array of embeddings (768-dimensional vectors)
   */
  private async batchCalculateEmbeddings(params: {
    sentences: Array<{ content: string; startPosition: number }>;
  }): Promise<number[][]> {
    const { sentences } = params;
    const embeddings: number[][] = [];

    this.logger.info({
      context: { totalSentences: sentences.length },
      message: 'Starting batch embedding calculation (Pass 1)',
    });

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (sentence === undefined) {
        throw new Error(`Sentence at index ${String(i)} is undefined`);
      }

      const embedding = await this.embeddingService.embed({ text: sentence.content });
      embeddings.push(embedding);

      // Log progress every 50 sentences
      if ((i + 1) % 50 === 0) {
        this.logger.info({
          context: {
            current: i + 1,
            percent: Math.round(((i + 1) / sentences.length) * 100),
            total: sentences.length,
          },
          message: 'Embedding calculation progress',
        });
      }
    }

    this.logger.info({
      context: { totalEmbeddings: embeddings.length },
      message: 'Batch embedding calculation complete',
    });

    return embeddings;
  }

  /**
   * Build sentence boundaries with weighted scores
   *
   * @param params - Build parameters
   * @param params.sentences - Original sentences
   * @param params.distances - Semantic distances
   * @param params.structureMap - Structure analysis results
   * @param params.candidateAnalysis - LLM analysis results for candidates
   * @returns Array of sentences with boundary scores
   */
  private buildSentenceBoundaries(params: {
    candidateAnalysis: Map<number, { discourse: number; topic: number }>;
    distances: number[];
    sentences: Array<{ content: string; startPosition: number }>;
    structureMap: Map<number, boolean>;
  }): SentenceWithBoundary[] {
    const { sentences, distances, structureMap, candidateAnalysis } = params;
    const sentencesWithBoundaries: SentenceWithBoundary[] = [];

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (sentence === undefined) {
        continue;
      }

      // Last sentence always has boundary score of 1.0
      if (i === sentences.length - 1) {
        sentencesWithBoundaries.push({
          boundaryScore: 1.0,
          content: sentence.content,
          isAtomic: false,
          startPosition: sentence.startPosition,
        });
        continue;
      }

      // Build boundary for regular sentence
      const boundary = this.buildSingleBoundary({
        sentenceIndex: i,
        sentence,
        distances,
        structureMap,
        candidateAnalysis,
      });
      sentencesWithBoundaries.push(boundary);
    }

    return sentencesWithBoundaries;
  }

  /**
   * Build a single sentence boundary with weighted score
   *
   * @param params - Build parameters
   * @param params.sentenceIndex - Index of the sentence
   * @param params.sentence - Sentence data
   * @param params.distances - All semantic distances
   * @param params.structureMap - Structure analysis results
   * @param params.candidateAnalysis - LLM analysis results
   * @returns Sentence with boundary score
   */
  private buildSingleBoundary(params: {
    candidateAnalysis: Map<number, { discourse: number; topic: number }>;
    distances: number[];
    sentence: { content: string; startPosition: number };
    sentenceIndex: number;
    structureMap: Map<number, boolean>;
  }): SentenceWithBoundary {
    const { sentenceIndex, sentence, distances, structureMap, candidateAnalysis } = params;

    const distance = distances[sentenceIndex] ?? 0;
    const isAtomic = structureMap.get(sentenceIndex) ?? false;
    const llmAnalysis = candidateAnalysis.get(sentenceIndex);

    // Calculate weighted boundary score
    const boundaryScore = this.boundaryScorer.calculateBoundaryScore({
      semanticDistance: distance,
      topicStrength: llmAnalysis?.topic ?? 0,
      discourseStrength: llmAnalysis?.discourse ?? 0,
      structureStrength: isAtomic ? 1.0 : 0,
    });

    return {
      boundaryScore: boundaryScore.weightedScore,
      content: sentence.content,
      isAtomic,
      startPosition: sentence.startPosition,
    };
  }

  /**
   * Calculate semantic distances between consecutive embeddings
   *
   * @param params - Distance calculation parameters
   * @param params.embeddings - Array of sentence embeddings
   * @returns Array of cosine distances between consecutive embeddings
   */
  private calculateAllSemanticDistances(params: {
    embeddings: number[][];
  }): number[] {
    const { embeddings } = params;

    this.logger.info({
      message: 'Calculating semantic distances between consecutive sentences',
    });

    const distanceCalculator = new EmbeddingDistanceCalculator();
    const distances = distanceCalculator.calculateBatchDistances({ embeddings });

    this.logger.info({
      context: { totalDistances: distances.length },
      message: 'Semantic distance calculation complete',
    });

    return distances;
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
   * Finalize and add a sentence to the collection
   *
   * @param params - Finalization parameters
   * @param params.currentSentence - Current sentence text
   * @param params.position - Starting position
   * @param params.sentences - Sentence collection to append to
   */
  private finalizeSentence(params: {
    currentSentence: string;
    position: number;
    sentences: Array<{ content: string; startPosition: number }>;
  }): void {
    const { currentSentence, position, sentences } = params;
    const trimmed = currentSentence.trim();
    if (trimmed.length > 0) {
      sentences.push({ content: trimmed, startPosition: position });
    }
  }

  /**
   * Identify candidate boundaries using adaptive thresholding
   *
   * @param params - Candidate identification parameters
   * @param params.distances - Semantic distances between sentences
   * @param params.sentences - Original sentences
   * @param params.adaptiveThresholdEnabled - Whether to use adaptive thresholding
   * @param params.minThreshold - Minimum threshold value
   * @param params.maxThreshold - Maximum threshold value (used if adaptive disabled)
   * @param params.candidateLimit - Maximum number of candidates
   * @returns Array of boundary candidates and threshold used
   */
  private identifyCandidates(params: {
    adaptiveThresholdEnabled: boolean;
    candidateLimit: number;
    distances: number[];
    maxThreshold: number;
    minThreshold: number;
    sentences: Array<{ content: string; startPosition: number }>;
  }): { candidates: BoundaryCandidate[]; threshold: number } {
    const {
      distances,
      sentences,
      adaptiveThresholdEnabled,
      minThreshold,
      maxThreshold,
      candidateLimit,
    } = params;

    let threshold: number;

    if (adaptiveThresholdEnabled) {
      const thresholdCalculator = new AdaptiveThresholdCalculator();
      threshold = thresholdCalculator.calculateThreshold({
        distances,
        minThreshold,
        maxThreshold,
        candidateBoundaryLimit: candidateLimit,
      });
    } else {
      threshold = maxThreshold;
    }

    this.logger.info({
      context: {
        adaptiveEnabled: adaptiveThresholdEnabled,
        threshold: threshold.toFixed(3),
      },
      message: 'Using threshold for candidate selection',
    });

    // Identify candidates that exceed threshold
    const candidates: BoundaryCandidate[] = [];
    for (let i = 0; i < distances.length; i++) {
      const distance = distances[i];
      if (distance === undefined) {
        continue;
      }

      const sentence = sentences[i];
      const nextSentence = sentences[i + 1];
      if (sentence === undefined || nextSentence === undefined) {
        continue;
      }

      if (distance >= threshold) {
        candidates.push({
          sentenceIndex: i,
          embeddingDistance: distance,
          text: sentence.content,
          nextText: nextSentence.content,
        });
      }
    }

    this.logger.info({
      context: {
        candidateCount: candidates.length,
        totalBoundaries: distances.length,
      },
      message: 'Pass 1 complete - candidates identified',
    });

    return { candidates, threshold };
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
    this.logger.debug({
      context: { textLength: params.text.length },
      message: 'Starting sentence splitting',
    });

    const sentences: Array<{ content: string; startPosition: number }> = [];

    // Use split() instead of exec() loop for better performance on large texts
    // Split on sentence boundaries while keeping the delimiter
    const parts = params.text.split(/([.!?]+\s*)/);

    let position = 0;
    let currentSentence = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === undefined || part === '') {
        continue;
      }

      // Check if this part is a delimiter (ends with punctuation)
      if (/^[.!?]+\s*$/.test(part)) {
        currentSentence += part;
        this.finalizeSentence({
          currentSentence,
          position,
          sentences,
        });
        position += currentSentence.length;
        currentSentence = '';
      } else {
        currentSentence += part;
      }
    }

    // Handle any remaining text
    this.finalizeSentence({
      currentSentence,
      position,
      sentences,
    });

    this.logger.info({
      context: { sentenceCount: sentences.length },
      message: 'Sentence splitting complete',
    });

    return sentences;
  }
}
