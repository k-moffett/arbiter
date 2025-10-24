/**
 * Collection Selector Implementation
 *
 * LLM-based service for intelligent collection selection.
 */

import type { CollectionSelector } from './interfaces';
import type {
  CollectionSelectionLLMResponse,
  CollectionSelectionParams,
  CollectionSelectionResult,
  SelectedCollection,
} from './types';

import { buildCollectionSelectionPrompt } from './prompts';

/**
 * Collection Selector Configuration
 */
export interface CollectionSelectorConfig {
  /** LLM client for collection selection */
  llm: {
    /** Generate completion from prompt */
    generate(params: { prompt: string; temperature?: number }): Promise<string>;
  };
}

/**
 * Collection Selector Implementation
 *
 * Uses LLM to analyze queries and collection metadata to determine
 * which collections should be searched for relevant information.
 *
 * @example
 * ```typescript
 * const selector = new CollectionSelectorImplementation({
 *   llm: ollamaClient
 * });
 *
 * const result = await selector.selectCollections({
 *   query: "Tell me about Project Odyssey",
 *   collections: [
 *     { name: "conversation-history", pointCount: 150 },
 *     { name: "project-odyssey", pointCount: 392 }
 *   ]
 * });
 *
 * console.log(result.selectedCollections);
 * // [
 * //   { collectionName: "project-odyssey", confidence: 0.95, reasoning: "..." },
 * //   { collectionName: "conversation-history", confidence: 0.85, reasoning: "..." }
 * // ]
 * ```
 */
export class CollectionSelectorImplementation implements CollectionSelector {
  private readonly llm: CollectionSelectorConfig['llm'];

  constructor(config: CollectionSelectorConfig) {
    this.llm = config.llm;
  }

  /**
   * Select collections relevant to the query
   */
  public async selectCollections(
    params: CollectionSelectionParams
  ): Promise<CollectionSelectionResult> {
    // Build prompt with query and collection metadata
    const prompt = buildCollectionSelectionPrompt({
      collections: params.collections,
      query: params.query,
    });

    // Get LLM selection with low temperature for consistency
    const response = await this.llm.generate({
      prompt,
      temperature: 0.3,
    });

    // Parse and validate LLM response
    const llmResult = this.parseLLMResponse({ response });

    // Convert to result format
    return this.convertToResult({ llmResult, params });
  }

  /**
   * Convert LLM response to result format
   */
  private convertToResult(params: {
    llmResult: CollectionSelectionLLMResponse;
    params: CollectionSelectionParams;
  }): CollectionSelectionResult {
    const selectedCollections: SelectedCollection[] = [];

    // Validate each selection exists in available collections
    for (const selection of params.llmResult.selections) {
      const exists = params.params.collections.some((c) => c.name === selection.collection);

      if (exists) {
        selectedCollections.push({
          collectionName: selection.collection,
          confidence: selection.confidence,
          reasoning: selection.reasoning,
        });
      }
    }

    // Sort by confidence (highest first)
    const sortedCollections = this.sortByConfidenceDescending(selectedCollections);

    return {
      confidence: params.llmResult.confidence,
      selectedCollections: sortedCollections,
    };
  }

  /**
   * Parse LLM response JSON
   */
  private parseLLMResponse(params: { response: string }): CollectionSelectionLLMResponse {
    try {
      // Extract JSON from response (may have markdown code blocks)
      const jsonMatch = params.response.match(/\{[\s\S]*\}/);
      if (jsonMatch === null) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as CollectionSelectionLLMResponse;

      // Validate structure
      if (
        typeof parsed.confidence !== 'number' ||
        !Array.isArray(parsed.selections)
      ) {
        throw new Error('Invalid response structure');
      }

      // Validate each selection
      for (const selection of parsed.selections) {
        this.validateSelection({ selection });
      }

      return parsed;
    } catch (error) {
      // Fallback: return conversation-history only
      console.error('[ERROR] Failed to parse collection selection:', {
        error: error instanceof Error ? error.message : String(error),
        response: params.response,
      });

      return {
        confidence: 0.5,
        selections: [
          {
            collection: 'conversation-history',
            confidence: 0.8,
            reasoning: 'Default fallback - LLM response parsing failed',
          },
        ],
      };
    }
  }

  /**
   * Sort collections by confidence (highest first)
   */
  private sortByConfidenceDescending(
    collections: SelectedCollection[]
  ): SelectedCollection[] {
    // Manual bubble sort to avoid multi-param arrow functions
    const sorted = [...collections];
    const { length } = sorted;
    for (let i = 0; i < length; i++) {
      for (let j = 0; j < length - 1 - i; j++) {
        const current = sorted[j];
        const next = sorted[j + 1];
        if (current === undefined || next === undefined) {
          continue;
        }
        if (current.confidence < next.confidence) {
          sorted[j] = next;
          sorted[j + 1] = current;
        }
      }
    }
    return sorted;
  }

  /**
   * Validate single selection structure
   */
  private validateSelection(params: {
    selection: { collection?: unknown; confidence?: unknown; reasoning?: unknown };
  }): void {
    if (typeof params.selection.collection !== 'string') {
      throw new Error('Invalid selection: collection must be string');
    }
    if (typeof params.selection.confidence !== 'number') {
      throw new Error('Invalid selection: confidence must be number');
    }
    if (typeof params.selection.reasoning !== 'string') {
      throw new Error('Invalid selection: reasoning must be string');
    }
  }
}
