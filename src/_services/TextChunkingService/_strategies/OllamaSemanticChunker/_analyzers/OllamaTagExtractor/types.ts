/**
 * Ollama Tag Extractor Types
 *
 * LLM-based semantic metadata extraction for chunk enrichment.
 */

/**
 * Extracted semantic metadata from text
 */
export interface ExtractedTags {
  /** Confidence in the extraction (0-1) */
  confidence: number;

  /** Named entities (people, places, organizations) */
  entities: string[];

  /** Key phrases or important terms */
  keyPhrases: string[];

  /** General tags or categories */
  tags: string[];

  /** Main topics or themes */
  topics: string[];
}
