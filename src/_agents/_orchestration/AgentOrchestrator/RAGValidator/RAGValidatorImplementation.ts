/**
 * RAG Validator Implementation
 *
 * Validates retrieved context for relevance using LLM-based scoring.
 * Filters out low-quality or irrelevant results.
 */

import type { Logger } from '../../../../_shared/_infrastructure';
import type { CompletionParams, LLMResponse } from '../../../_shared/types';
import type { RAGValidator } from './interfaces';
import type {
  RAGValidatorConfig,
  ValidatedContext,
  ValidationParams,
  ValidationResult,
} from './types';

import { buildValidationPrompt } from './prompts';

/**
 * Ollama provider interface (minimal subset needed)
 */
interface OllamaProvider {
  complete(params: CompletionParams): Promise<LLMResponse>;
}

/**
 * RAG Validator Implementation
 *
 * @example
 * ```typescript
 * const validator = new RAGValidatorImplementation({
 *   config,
 *   logger,
 *   ollamaProvider
 * });
 *
 * const validated = await validator.validate({
 *   query: 'What did we discuss?',
 *   results: searchResults,
 *   minScore: 0.3
 * });
 * // validated.validResults contains only relevant results
 * ```
 */
export class RAGValidatorImplementation implements RAGValidator {
  private readonly config: RAGValidatorConfig;
  private readonly logger: Logger;
  private readonly ollamaProvider: OllamaProvider;

  constructor(params: {
    config: RAGValidatorConfig;
    logger: Logger;
    ollamaProvider: OllamaProvider;
  }) {
    this.config = params.config;
    this.logger = params.logger;
    this.ollamaProvider = params.ollamaProvider;
  }

  /**
   * Validate retrieved context
   */
  public async validate(params: ValidationParams): Promise<ValidatedContext> {
    if (params.results.length === 0) {
      return this.createEmptyValidation();
    }

    const startTime = Date.now();
    const minScore = params.minScore ?? this.config.defaultMinScore;
    const useLLM = params.useLLM ?? true;

    this.logValidationStart({ minScore, resultsCount: params.results.length, useLLM });

    const validationResults = useLLM
      ? await this.validateWithLLM({
          query: params.query,
          results: params.results,
        })
      : this.validateWithHeuristics({
          query: params.query,
          results: params.results,
        });

    const validResults = this.filterAndSortResults({
      minScore,
      results: validationResults,
    });
    const avgScore = this.calculateAverageScore({ results: validationResults });
    const duration = Date.now() - startTime;

    this.logValidationComplete({
      avgScore,
      duration,
      passedCount: validResults.length,
      rejectedCount: params.results.length - validResults.length,
      totalResults: params.results.length,
    });

    return this.createValidatedContext({
      avgScore,
      duration,
      totalResults: params.results.length,
      validResults,
    });
  }

  /**
   * Calculate average validation score
   */
  private calculateAverageScore(opts: {
    results: ValidationResult[];
  }): number {
    let totalScore = 0;
    for (const result of opts.results) {
      totalScore += result.validationScore;
    }
    return totalScore / opts.results.length;
  }

  /**
   * Create empty validation result
   */
  private createEmptyValidation(): ValidatedContext {
    return {
      rejectedCount: 0,
      validCount: 0,
      validResults: [],
      validationMetadata: {
        avgValidationScore: 0,
        failedCount: 0,
        passedCount: 0,
        totalResults: 0,
        validationDuration: 0,
      },
    };
  }

  /**
   * Create validated context result
   */
  private createValidatedContext(opts: {
    avgScore: number;
    duration: number;
    totalResults: number;
    validResults: ValidationResult[];
  }): ValidatedContext {
    const rejectedCount = opts.totalResults - opts.validResults.length;

    return {
      rejectedCount,
      validCount: opts.validResults.length,
      validResults: opts.validResults,
      validationMetadata: {
        avgValidationScore: opts.avgScore,
        failedCount: rejectedCount,
        passedCount: opts.validResults.length,
        totalResults: opts.totalResults,
        validationDuration: opts.duration,
      },
    };
  }

  /**
   * Extract JSON from LLM response
   */
  private extractJsonFromResponse(params: { response: string }): string {
    let jsonStr = params.response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.includes('```json')) {
      const match = /```json\s*(\{[\s\S]*?\})\s*```/.exec(jsonStr);
      const extracted = match?.[1];
      if (extracted !== undefined && extracted !== '') {
        jsonStr = extracted;
      }
    } else if (jsonStr.includes('```')) {
      const match = /```\s*(\{[\s\S]*?\})\s*```/.exec(jsonStr);
      const extracted = match?.[1];
      if (extracted !== undefined && extracted !== '') {
        jsonStr = extracted;
      }
    }

    // Find first JSON object
    const jsonMatch = /\{[\s\S]*?\}/.exec(jsonStr);
    if (jsonMatch !== null) {
      jsonStr = jsonMatch[0];
    }

    return jsonStr;
  }

  /**
   * Filter and sort results by validation score
   */
  private filterAndSortResults(opts: {
    minScore: number;
    results: ValidationResult[];
  }): ValidationResult[] {
    const filtered = opts.results.filter(
      (result) => result.validationScore >= opts.minScore
    );

    return this.sortByValidationScore({ results: filtered });
  }

  /**
   * Log validation completion
   */
  private logValidationComplete(opts: {
    avgScore: number;
    duration: number;
    passedCount: number;
    rejectedCount: number;
    totalResults: number;
  }): void {
    this.logger.info({
      message: 'Context validation completed',
      metadata: {
        avgScore: opts.avgScore,
        duration: opts.duration,
        passedCount: opts.passedCount,
        rejectedCount: opts.rejectedCount,
        totalResults: opts.totalResults,
      },
    });
  }

  /**
   * Log validation start
   */
  private logValidationStart(opts: {
    minScore: number;
    resultsCount: number;
    useLLM: boolean;
  }): void {
    this.logger.debug({
      message: 'Validating context relevance',
      metadata: {
        minScore: opts.minScore,
        resultsCount: opts.resultsCount,
        useLLM: opts.useLLM,
      },
    });
  }

  /**
   * Sort results by validation score (descending)
   */
  private sortByValidationScore(opts: {
    results: ValidationResult[];
  }): ValidationResult[] {
    const sorted = [...opts.results];
    for (let i = 0; i < sorted.length - 1; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const resultI = sorted[i];
        const resultJ = sorted[j];
        if (resultI === undefined || resultJ === undefined) {
          continue;
        }
        if (resultJ.validationScore > resultI.validationScore) {
          sorted[i] = resultJ;
          sorted[j] = resultI;
        }
      }
    }
    return sorted;
  }

  /**
   * Validate a single result with LLM
   */
  private async validateSingleResult(params: {
    query: string;
    result: import('../HybridSearchRetriever/types').HybridSearchResult;
  }): Promise<ValidationResult> {
    try {
      const prompt = buildValidationPrompt({
        context: params.result.payload.content,
        query: params.query,
      });

      const response = await this.ollamaProvider.complete({
        maxTokens: 256,
        model: this.config.llmModel,
        prompt,
        temperature: this.config.temperature,
      });

      const jsonStr = this.extractJsonFromResponse({ response: response.text });
      const parsed = JSON.parse(jsonStr) as {
        rationale: string;
        score: number;
      };

      const validationScore = Math.max(0, Math.min(1, parsed.score));

      return {
        rationale: parsed.rationale,
        result: params.result,
        valid: validationScore >= this.config.defaultMinScore,
        validationScore,
      };
    } catch (error) {
      this.logger.error({
        message: 'LLM validation failed, using fallback',
        metadata: { error, resultId: params.result.id },
      });

      // Fallback to combined score as validation score
      return {
        rationale: 'Fallback validation (LLM unavailable)',
        result: params.result,
        valid: params.result.combinedScore >= this.config.defaultMinScore,
        validationScore: params.result.combinedScore,
      };
    }
  }

  /**
   * Validate results using heuristics (fallback when LLM disabled)
   */
  private validateWithHeuristics(params: {
    query: string;
    results: import('../HybridSearchRetriever/types').HybridSearchResult[];
  }): ValidationResult[] {
    // Simple heuristic: use combined score as validation score
    return params.results.map((result) => ({
      rationale: 'Heuristic validation (combined score)',
      result,
      valid: result.combinedScore >= this.config.defaultMinScore,
      validationScore: result.combinedScore,
    }));
  }

  /**
   * Validate results with LLM in parallel batches
   */
  private async validateWithLLM(params: {
    query: string;
    results: import('../HybridSearchRetriever/types').HybridSearchResult[];
  }): Promise<ValidationResult[]> {
    const { query, results } = params;
    const batchSize = this.config.maxParallelValidations;
    const validationResults: ValidationResult[] = [];

    // Process in batches to avoid rate limits
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);

      const batchPromises = batch.map((result) =>
        this.validateSingleResult({ query, result })
      );

      const batchResults = await Promise.all(batchPromises);
      validationResults.push(...batchResults);
    }

    return validationResults;
  }
}
