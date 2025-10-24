/**
 * Ollama Structure Detector Types
 *
 * LLM-based document structure detection for atomic unit preservation.
 */

/**
 * Document structure types
 */
export type StructureType =
  | 'header'
  | 'list'
  | 'table'
  | 'qa_pair'
  | 'definition'
  | 'code_block'
  | 'quote'
  | 'paragraph'
  | 'none';

/**
 * Structure analysis result
 */
export interface StructureAnalysis {
  /** Overall confidence in the analysis (0-1) */
  confidence: number;

  /** Brief explanation of the structure */
  explanation: string;

  /** Whether this structure should be kept as an atomic unit */
  shouldKeepAtomic: boolean;

  /** Detected structure type */
  structureType: StructureType;
}

/**
 * Structure boundary detection result
 */
export interface StructureBoundary {
  /** Structure analysis */
  analysis: StructureAnalysis;

  /** Boundary strength (0-1, higher = stronger structural boundary) */
  boundaryStrength: number;
}
