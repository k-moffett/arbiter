/**
 * Semantic Chunker Configuration Loader
 *
 * Loads configuration from environment variables with sensible defaults.
 */

import type { SemanticChunkerConfig } from './types';

/**
 * Load semantic chunker configuration from environment variables
 *
 * Defaults based on cogitator's proven configuration:
 * - minSize: 300 chars
 * - maxSize: 1500 chars
 * - targetSize: 1000 chars
 * - atomicMaxSize: 2000 chars (embedding limit)
 * - overlapSize: 225 chars
 * - Weights: topic(0.35), discourse(0.25), structure(0.20), semantic(0.20)
 */
/**
 * Load chunk sizes from environment
 */
function loadChunkSizes(): {
  atomicMaxSize: number;
  maxSize: number;
  minSize: number;
  overlapSize: number;
  targetSize: number;
} {
  return {
    minSize: parseInt(process.env['SEMANTIC_CHUNK_MIN_SIZE'] ?? '300', 10),
    maxSize: parseInt(process.env['SEMANTIC_CHUNK_MAX_SIZE'] ?? '1500', 10),
    targetSize: parseInt(process.env['SEMANTIC_CHUNK_TARGET_SIZE'] ?? '1000', 10),
    atomicMaxSize: parseInt(process.env['SEMANTIC_CHUNK_ATOMIC_MAX_SIZE'] ?? '2000', 10),
    overlapSize: parseInt(process.env['SEMANTIC_CHUNK_OVERLAP_SIZE'] ?? '225', 10),
  };
}

/**
 * Load model configuration from environment
 */
function loadModels(): SemanticChunkerConfig['models'] {
  const semanticModel = process.env['OLLAMA_SEMANTIC_CHUNKER_MODEL'] ?? 'llama3.2:3b';
  const topicModel = process.env['OLLAMA_TOPIC_MODEL'];
  const discourseModel = process.env['OLLAMA_DISCOURSE_MODEL'];
  const structureModel = process.env['OLLAMA_STRUCTURE_MODEL'];
  const tagModel = process.env['OLLAMA_TAG_MODEL'];

  return {
    semantic: semanticModel,
    ...(topicModel !== undefined ? { topic: topicModel } : {}),
    ...(discourseModel !== undefined ? { discourse: discourseModel } : {}),
    ...(structureModel !== undefined ? { structure: structureModel } : {}),
    ...(tagModel !== undefined ? { tag: tagModel } : {}),
  };
}

/**
 * Load temperature settings from environment
 */
function loadTemperatures(): SemanticChunkerConfig['temperatures'] {
  return {
    topic: parseFloat(process.env['OLLAMA_TOPIC_TEMPERATURE'] ?? '0.1'),
    discourse: parseFloat(process.env['OLLAMA_DISCOURSE_TEMPERATURE'] ?? '0.1'),
    structure: parseFloat(process.env['OLLAMA_STRUCTURE_TEMPERATURE'] ?? '0.1'),
    tag: parseFloat(process.env['OLLAMA_TAG_TEMPERATURE'] ?? '0.3'),
  };
}

/**
 * Load token limits from environment
 *
 * Generous defaults ensure ANY PDF can be processed without truncation.
 * Philosophy: Accuracy > Speed
 */
function loadTokenLimits(): SemanticChunkerConfig['tokenLimits'] {
  return {
    structure: parseInt(process.env['OLLAMA_STRUCTURE_NUM_PREDICT'] ?? '500', 10),
    tag: parseInt(process.env['OLLAMA_TAG_NUM_PREDICT'] ?? '500', 10),
    topic: parseInt(process.env['OLLAMA_TOPIC_NUM_PREDICT'] ?? '300', 10),
    discourse: parseInt(process.env['OLLAMA_DISCOURSE_NUM_PREDICT'] ?? '400', 10),
  };
}

/**
 * Load threshold configuration from environment
 */
function loadThresholds(): {
  boundaryThreshold: number;
  confidenceThreshold: number;
  semanticThreshold: number;
} {
  return {
    boundaryThreshold: parseFloat(process.env['SEMANTIC_BOUNDARY_THRESHOLD'] ?? '0.6'),
    confidenceThreshold: parseFloat(process.env['SEMANTIC_CONFIDENCE_THRESHOLD'] ?? '0.7'),
    semanticThreshold: parseFloat(process.env['SEMANTIC_SIMILARITY_THRESHOLD'] ?? '0.75'),
  };
}

/**
 * Load boundary detection weights from environment
 */
function loadWeights(): SemanticChunkerConfig['weights'] {
  const topicWeight = parseFloat(process.env['SEMANTIC_WEIGHT_TOPIC'] ?? '0.35');
  const discourseWeight = parseFloat(process.env['SEMANTIC_WEIGHT_DISCOURSE'] ?? '0.25');
  const structureWeight = parseFloat(process.env['SEMANTIC_WEIGHT_STRUCTURE'] ?? '0.20');
  const semanticEmbedWeight = parseFloat(process.env['SEMANTIC_WEIGHT_SEMANTIC_EMBED'] ?? '0.20');

  // Validate weights sum to ~1.0
  validateWeightSum({
    topicWeight,
    discourseWeight,
    structureWeight,
    semanticEmbedWeight,
  });

  return {
    ollamaTopic: topicWeight,
    ollamaDiscourse: discourseWeight,
    ollamaStructure: structureWeight,
    semanticEmbed: semanticEmbedWeight,
  };
}

/**
 * Validate weight sum
 */
function validateWeightSum(params: {
  discourseWeight: number;
  semanticEmbedWeight: number;
  structureWeight: number;
  topicWeight: number;
}): void {
  const weightSum =
    params.topicWeight +
    params.discourseWeight +
    params.structureWeight +
    params.semanticEmbedWeight;

  if (Math.abs(weightSum - 1.0) > 0.01) {
    const sumStr = weightSum.toFixed(2);
    const topicStr = String(params.topicWeight);
    const discStr = String(params.discourseWeight);
    const structStr = String(params.structureWeight);
    const semStr = String(params.semanticEmbedWeight);

    console.warn(
      `[WARN] Semantic chunker weights sum to ${sumStr}, expected 1.0. ` +
        `Weights: topic=${topicStr}, discourse=${discStr}, ` +
        `structure=${structStr}, semantic=${semStr}`
    );
  }
}

/**
 * Load semantic chunker configuration from environment variables
 *
 * NOTE: Assumes loadAllEnvFiles() has been called at application startup.
 * All ENV files (including env/.env.text-chunking) should already be loaded.
 */
export function loadSemanticChunkerConfig(): SemanticChunkerConfig {
  return {
    ...loadChunkSizes(),
    models: loadModels(),
    temperatures: loadTemperatures(),
    tokenLimits: loadTokenLimits(),
    weights: loadWeights(),
    ...loadThresholds(),
  };
}
