/**
 * Semantic Chunker Configuration Types
 *
 * ENV-driven configuration for Ollama-powered semantic chunking.
 */

/**
 * Semantic chunking configuration
 */
export interface SemanticChunkerConfig {
  /** Maximum size for atomic units (can exceed maxSize for complete logical units) */
  atomicMaxSize: number;

  /** Threshold for boundary detection (0-1) */
  boundaryThreshold: number;

  /** Confidence threshold (0-1) */
  confidenceThreshold: number;

  /** Maximum chunk size in characters (for non-atomic content) */
  maxSize: number;

  /** Minimum chunk size in characters */
  minSize: number;

  /** Model configuration for analyzers */
  models: SemanticChunkerModels;

  /** Overlap size for context preservation */
  overlapSize: number;

  /** Semantic similarity threshold (0-1) */
  semanticThreshold: number;

  /** Target/ideal chunk size */
  targetSize: number;

  /** Temperature settings for each analyzer */
  temperatures: SemanticChunkerTemperatures;

  /** Signal weights for boundary detection */
  weights: SemanticChunkerWeights;
}

/**
 * Model configuration for semantic analyzers
 */
export interface SemanticChunkerModels {
  /** Discourse classifier model (falls back to semantic if not set) */
  discourse?: string;

  /** Base model for all analyzers */
  semantic: string;

  /** Structure detector model (falls back to semantic if not set) */
  structure?: string;

  /** Tag extractor model (falls back to semantic if not set) */
  tag?: string;

  /** Topic analyzer model (falls back to semantic if not set) */
  topic?: string;
}

/**
 * Temperature settings for analyzers
 */
export interface SemanticChunkerTemperatures {
  /** Discourse classifier temperature */
  discourse: number;

  /** Structure detector temperature */
  structure: number;

  /** Tag extractor temperature */
  tag: number;

  /** Topic analyzer temperature */
  topic: number;
}

/**
 * Boundary detection weights
 */
export interface SemanticChunkerWeights {
  /** Discourse relationship weight */
  ollamaDiscourse: number;

  /** Structure analysis weight */
  ollamaStructure: number;

  /** Topic shift weight */
  ollamaTopic: number;

  /** Semantic embedding weight */
  semanticEmbed: number;
}
