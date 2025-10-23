/**
 * Advanced Prompt Builder Type Definitions
 *
 * Types for building prompts with citations and formatted context.
 */

import type { ValidationResult } from '../RAGValidator/types';

/**
 * Built prompt with all components
 */
export interface BuiltPrompt {
  /**
   * Citations/references for attribution
   */
  citations: Citation[];

  /**
   * Full formatted prompt ready for LLM
   */
  prompt: string;

  /**
   * Prompt metadata
   */
  promptMetadata: PromptMetadata;
}

/**
 * Citation for a context source
 */
export interface Citation {
  /**
   * Citation ID (1, 2, 3, etc.)
   */
  citationId: number;

  /**
   * Content snippet
   */
  content: string;

  /**
   * Message ID
   */
  messageId: string;

  /**
   * Relevance score
   */
  relevanceScore: number;

  /**
   * Timestamp of original message
   */
  timestamp: number;
}

/**
 * Prompt building parameters
 */
export interface PromptBuildParams {
  /**
   * Additional instructions based on query intent
   */
  instructions?: string;

  /**
   * Original user query
   */
  query: string;

  /**
   * Query intent type (affects prompt structure)
   */
  queryIntent?: 'comparative' | 'factual' | 'hybrid' | 'listBuilding' | 'semantic' | 'temporal';

  /**
   * Validated context results
   */
  validatedResults: ValidationResult[];
}

/**
 * Prompt metadata
 */
export interface PromptMetadata {
  /**
   * Number of citations included
   */
  citationsCount: number;

  /**
   * Number of context items included
   */
  contextItemsCount: number;

  /**
   * Estimated prompt tokens
   */
  estimatedTokens: number;

  /**
   * Whether citations are included
   */
  includeCitations: boolean;
}

/**
 * Advanced prompt builder configuration
 */
export interface AdvancedPromptBuilderConfig {
  /**
   * Average characters per token for estimation
   */
  charsPerToken: number;

  /**
   * Whether to include citations by default
   */
  includeCitations: boolean;

  /**
   * Maximum content length per citation
   * Long content will be truncated with "..."
   */
  maxCitationLength: number;
}
