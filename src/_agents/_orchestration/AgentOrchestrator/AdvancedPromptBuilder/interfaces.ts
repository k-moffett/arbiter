/**
 * Advanced Prompt Builder Interfaces
 *
 * Interface definitions for prompt building with citations.
 */

import type { BuiltPrompt, PromptBuildParams } from './types';

/**
 * Advanced prompt builder interface
 *
 * Builds final LLM prompts with formatted context and citations.
 */
export interface AdvancedPromptBuilder {
  /**
   * Build prompt from validated context
   *
   * Constructs a well-formatted prompt including:
   * 1. System instructions based on query intent
   * 2. Retrieved context with citations
   * 3. User query
   * 4. Response instructions
   *
   * Citations allow for source attribution in responses.
   *
   * @param params - Prompt building parameters
   * @param params.query - Original user query
   * @param params.validatedResults - Validated context results
   * @param params.queryIntent - Query intent type (affects prompt structure)
   * @param params.instructions - Additional custom instructions
   * @returns Built prompt with citations and metadata
   */
  buildPrompt(params: PromptBuildParams): BuiltPrompt;
}
