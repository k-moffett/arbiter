/**
 * Advanced Prompt Builder Implementation
 *
 * Builds final LLM prompts with formatted context and citations.
 */

import type { Logger } from '../../../../_shared/_infrastructure';
import type { AdvancedPromptBuilder } from './interfaces';
import type {
  AdvancedPromptBuilderConfig,
  BuiltPrompt,
  Citation,
  PromptBuildParams,
} from './types';

import {
  BASE_SYSTEM_PROMPT,
  buildContextSection,
  buildFullPrompt,
  INTENT_INSTRUCTIONS,
} from './templates';

/**
 * Advanced Prompt Builder Implementation
 *
 * @example
 * ```typescript
 * const builder = new AdvancedPromptBuilderImplementation({
 *   config,
 *   logger
 * });
 *
 * const built = builder.buildPrompt({
 *   query: 'What did we discuss?',
 *   validatedResults,
 *   queryIntent: 'semantic'
 * });
 * // built.prompt = formatted prompt with citations
 * // built.citations = source references
 * ```
 */
export class AdvancedPromptBuilderImplementation implements AdvancedPromptBuilder {
  private readonly config: AdvancedPromptBuilderConfig;
  private readonly logger: Logger;

  constructor(params: { config: AdvancedPromptBuilderConfig; logger: Logger }) {
    this.config = params.config;
    this.logger = params.logger;
  }

  /**
   * Build prompt from validated context
   */
  public buildPrompt(params: PromptBuildParams): BuiltPrompt {
    const startTime = Date.now();

    // Build citations from validated results
    const citations = this.buildCitations({ results: params.validatedResults });

    // Build context section with citations
    const contextSection = buildContextSection({
      citations: citations.map((citation) => ({
        citationId: citation.citationId,
        content: citation.content,
      })),
    });

    // Get intent-specific instructions
    let intentInstructions = this.getIntentInstructions({
      customInstructions: params.instructions,
      queryIntent: params.queryIntent,
    });

    // Add first message greeting instructions if applicable
    if (params.isFirstMessage === true) {
      const greetingInstruction =
        '\n\n**IMPORTANT**: This is the user\'s first message in this session. Generate a personality-appropriate greeting before responding to their query. Output ONLY the greeting and response - do NOT include any meta-commentary, notes, or explanations about your thought process.';
      intentInstructions =
        intentInstructions !== '' ? intentInstructions + greetingInstruction : greetingInstruction;
    }

    // Add user name context if discovered
    if (params.userName !== undefined && params.userName !== '') {
      const nameInstruction = `\n\nThe user's name is ${params.userName}. Use it naturally in your response.`;
      intentInstructions =
        intentInstructions !== '' ? intentInstructions + nameInstruction : nameInstruction;
    }

    // Combine base system prompt with personality (if provided)
    const systemPrompt =
      params.personalityPrompt !== undefined && params.personalityPrompt !== ''
        ? `${BASE_SYSTEM_PROMPT}\n\n${params.personalityPrompt}`
        : BASE_SYSTEM_PROMPT;

    // Build full prompt
    const prompt = buildFullPrompt({
      contextSection,
      intentInstructions,
      query: params.query,
      systemPrompt,
    });

    // Estimate tokens
    const estimatedTokens = Math.ceil(prompt.length / this.config.charsPerToken);

    const duration = Date.now() - startTime;

    this.logger.info({
      message: 'Prompt built',
      metadata: {
        citationsCount: citations.length,
        duration,
        estimatedTokens,
      },
    });

    return {
      citations,
      prompt,
      promptMetadata: {
        citationsCount: citations.length,
        contextItemsCount: params.validatedResults.length,
        estimatedTokens,
        includeCitations: this.config.includeCitations,
      },
    };
  }

  /**
   * Build citations from validated results
   */
  private buildCitations(params: {
    results: import('../RAGValidator/types').ValidationResult[];
  }): Citation[] {
    return params.results.map((result) => {
      const index = params.results.indexOf(result);
      let content = result.result.payload.content;

      // Truncate if too long
      if (content.length > this.config.maxCitationLength) {
        content = content.slice(0, this.config.maxCitationLength) + '...';
      }

      return {
        citationId: index + 1,
        content,
        messageId: result.result.id,
        relevanceScore: result.validationScore,
        timestamp: result.result.payload.timestamp,
      };
    });
  }

  /**
   * Get intent-specific instructions
   */
  private getIntentInstructions(params: {
    customInstructions: string | undefined;
    queryIntent:
      | 'comparative'
      | 'factual'
      | 'hybrid'
      | 'listBuilding'
      | 'semantic'
      | 'temporal'
      | undefined;
  }): string {
    // Custom instructions take precedence
    if (params.customInstructions !== undefined && params.customInstructions !== '') {
      return params.customInstructions;
    }

    // Use intent-specific instructions
    if (params.queryIntent !== undefined) {
      const instructions = INTENT_INSTRUCTIONS[params.queryIntent];
      return instructions;
    }

    // Default: no additional instructions
    return '';
  }
}
