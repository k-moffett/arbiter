/**
 * Hybrid Search Retriever Utilities
 *
 * Pure helper functions for hybrid search, including BM25 implementation.
 */

import type { ContextSearchResult } from '../../../../_services/_mcpServer/ContextToolRegistry/types';
import type { HybridSearchFilters, HybridSearchResult, TemporalScope } from './types';

/**
 * Tokenize text into terms for BM25
 *
 * Simple tokenization: lowercase, split on whitespace and punctuation.
 * For production, consider more sophisticated tokenization.
 */
export function tokenize(params: { text: string }): string[] {
  return params.text
    .toLowerCase()
    .split(/[\s.,;:!?'"()[\]{}<>/\\|@#$%^&*+=~`-]+/)
    .filter((term) => term.length > 0);
}

/**
 * Calculate term frequency for a document
 */
export function calculateTermFrequency(params: {
  document: string;
}): Map<string, number> {
  const terms = tokenize({ text: params.document });
  const tf = new Map<string, number>();

  for (const term of terms) {
    const current = tf.get(term);
    tf.set(term, current === undefined ? 1 : current + 1);
  }

  return tf;
}

/**
 * Calculate BM25 score for a document given a query
 *
 * BM25 formula:
 * score = Σ(idf(qi) * (tf(qi, D) * (k1 + 1)) / (tf(qi, D) + k1 * (1 - b + b * |D| / avgdl)))
 *
 * Where:
 * - qi: query term i
 * - tf(qi, D): frequency of qi in document D
 * - |D|: length of document D (in terms)
 * - avgdl: average document length in the collection
 * - k1: term frequency saturation parameter (typical: 1.2-2.0)
 * - b: length normalization parameter (typical: 0.75)
 * - idf(qi): inverse document frequency of qi
 */
export function calculateBM25Score(params: {
  avgDocLength: number;
  b: number;
  document: string;
  idf: Map<string, number>;
  k1: number;
  query: string;
}): number {
  const { avgDocLength, b, document, idf, k1, query } = params;

  const queryTerms = tokenize({ text: query });
  const docTerms = tokenize({ text: document });
  const docLength = docTerms.length;

  // Calculate term frequency for this document
  const tf = calculateTermFrequency({ document });

  let score = 0;

  for (const queryTerm of queryTerms) {
    const termFreq = tf.get(queryTerm) ?? 0;
    const termIdf = idf.get(queryTerm) ?? 0;

    // BM25 formula
    const numerator = termFreq * (k1 + 1);
    const denominator = termFreq + k1 * (1 - b + (b * docLength) / avgDocLength);

    score += termIdf * (numerator / denominator);
  }

  return score;
}

/**
 * Calculate IDF (Inverse Document Frequency) for all terms in the corpus
 *
 * IDF formula: log((N - df(t) + 0.5) / (df(t) + 0.5))
 * Where:
 * - N: total number of documents
 * - df(t): number of documents containing term t
 */
export function calculateIDF(params: { documents: string[] }): Map<string, number> {
  const { documents } = params;
  const n = documents.length;

  // Count document frequency for each term
  const df = new Map<string, number>();

  for (const doc of documents) {
    const uniqueTerms = new Set(tokenize({ text: doc }));
    for (const term of uniqueTerms) {
      const current = df.get(term);
      df.set(term, current === undefined ? 1 : current + 1);
    }
  }

  // Calculate IDF for each term
  const idf = new Map<string, number>();

  for (const [term, docFreq] of df.entries()) {
    const idfValue = Math.log((n - docFreq + 0.5) / (docFreq + 0.5));
    idf.set(term, idfValue);
  }

  return idf;
}

/**
 * Calculate average document length
 */
export function calculateAvgDocLength(params: { documents: string[] }): number {
  if (params.documents.length === 0) {
    return 0;
  }

  let totalLength = 0;
  for (const doc of params.documents) {
    totalLength += tokenize({ text: doc }).length;
  }

  return totalLength / params.documents.length;
}

/**
 * Normalize BM25 scores to 0-1 range
 */
export function normalizeBM25Scores(params: { scores: number[] }): number[] {
  if (params.scores.length === 0) {
    return [];
  }

  const maxScore = Math.max(...params.scores);
  const minScore = Math.min(...params.scores);

  if (maxScore === minScore) {
    return params.scores.map(() => 0.5);
  }

  return params.scores.map((score) => (score - minScore) / (maxScore - minScore));
}

/**
 * Combine BM25 and dense scores with weighted average
 */
export function combineScores(params: {
  bm25Score: number;
  bm25Weight: number;
  denseScore: number;
  denseWeight: number;
}): number {
  const { bm25Score, bm25Weight, denseScore, denseWeight } = params;
  return denseWeight * denseScore + bm25Weight * bm25Score;
}

/**
 * Deduplicate search results by ID, keeping highest scoring version
 */
export function deduplicateResults(params: {
  results: HybridSearchResult[];
}): HybridSearchResult[] {
  const resultMap = new Map<string, HybridSearchResult>();

  for (const result of params.results) {
    const existing = resultMap.get(result.id);

    if (existing === undefined) {
      resultMap.set(result.id, result);
    } else if (result.combinedScore > existing.combinedScore) {
      resultMap.set(result.id, result);
    }
  }

  return Array.from(resultMap.values());
}

/**
 * Apply temporal filtering based on scope
 */
export function applyTemporalFilter(params: {
  results: ContextSearchResult[];
  temporalScope: TemporalScope;
  thresholds: {
    lastMessage: number;
    recent: number;
    session: number;
  };
}): ContextSearchResult[] {
  const { results, temporalScope, thresholds } = params;

  if (temporalScope === 'all_time') {
    return results;
  }

  const now = Date.now();
  const threshold = thresholds[temporalScope];

  return results.filter((result) => {
    const age = now - result.payload.timestamp;
    return age <= threshold;
  });
}

/**
 * Apply metadata filters to search results
 */
export function applyMetadataFilters(params: {
  filters: HybridSearchFilters;
  results: ContextSearchResult[];
}): ContextSearchResult[] {
  let filtered = params.results;

  // Role filter
  if (params.filters.role !== undefined) {
    filtered = filtered.filter((result) => result.payload.role === params.filters.role);
  }

  // Tag inclusion filter (AND logic - all tags must match)
  if (params.filters.tags !== undefined && params.filters.tags.length > 0) {
    const requiredTags = params.filters.tags;
    filtered = filtered.filter((result) => {
      const resultTags = result.payload.tags;
      return requiredTags.every((tag) => resultTags.includes(tag));
    });
  }

  // Tag exclusion filter
  if (params.filters.excludeTags !== undefined && params.filters.excludeTags.length > 0) {
    const excludedTags = params.filters.excludeTags;
    filtered = filtered.filter((result) => {
      const resultTags = result.payload.tags;
      return !excludedTags.some((tag) => resultTags.includes(tag));
    });
  }

  // Quality filter
  if (params.filters.minQuality !== undefined && params.filters.minQuality > 0) {
    filtered = filtered.filter((result) => {
      const feedback = result.payload.userFeedback;
      // Only keep success or neutral feedback
      return feedback === 'success' || feedback === 'neutral' || feedback === undefined;
    });
  }

  return filtered;
}

/**
 * Merge and sort results from multiple queries
 */
export function mergeResults(params: {
  resultSets: HybridSearchResult[][];
}): HybridSearchResult[] {
  const allResults = params.resultSets.flat();
  const deduplicated = deduplicateResults({ results: allResults });

  // Sort by combined score descending
  // Manual sort to comply with single-parameter rule
  for (let i = 0; i < deduplicated.length - 1; i++) {
    for (let j = i + 1; j < deduplicated.length; j++) {
      const resultI = deduplicated[i];
      const resultJ = deduplicated[j];
      if (resultI === undefined || resultJ === undefined) {
        continue;
      }
      if (resultJ.combinedScore > resultI.combinedScore) {
        deduplicated[i] = resultJ;
        deduplicated[j] = resultI;
      }
    }
  }
  return deduplicated;
}
