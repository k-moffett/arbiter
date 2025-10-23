/**
 * Quality Grader Implementation
 *
 * Feedback loop component that grades LLM responses and extracts entities.
 * Designed to run asynchronously in the background.
 *
 * Results can be used to:
 * 1. Update Qdrant metadata with quality scores
 * 2. Enrich context with extracted entities
 * 3. Improve future retrieval through learning
 */

import type { Logger } from '../../../../_shared/_infrastructure';
import type { CompletionParams, LLMResponse } from '../../../_shared/types';
import type { QualityGrader } from './interfaces';
import type {
  ExtractedEntities,
  GradingParams,
  GradingResult,
  QualityGrade,
  QualityGraderConfig,
} from './types';

import { buildGradingPrompt } from './prompts';

/**
 * Ollama provider interface (minimal subset needed)
 */
interface OllamaProvider {
  complete(params: CompletionParams): Promise<LLMResponse>;
}

/**
 * Quality Grader Implementation
 *
 * @example
 * ```typescript
 * const grader = new QualityGraderImplementation({
 *   config,
 *   logger,
 *   ollamaProvider
 * });
 *
 * // Run in background after response delivery
 * grader.grade({
 *   messageId: 'msg_123',
 *   query: 'What did we discuss?',
 *   response: 'We discussed...',
 *   retrievedContext: [...]
 * }).then(result => {
 *   // Update Qdrant with quality scores and entities
 *   updateQdrantMetadata(result);
 * }).catch(err => {
 *   logger.error('Background grading failed', err);
 * });
 * ```
 */
export class QualityGraderImplementation implements QualityGrader {
  private readonly config: QualityGraderConfig;
  private readonly logger: Logger;
  private readonly ollamaProvider: OllamaProvider;

  constructor(params: {
    config: QualityGraderConfig;
    logger: Logger;
    ollamaProvider: OllamaProvider;
  }) {
    this.config = params.config;
    this.logger = params.logger;
    this.ollamaProvider = params.ollamaProvider;
  }

  /**
   * Grade a response for quality
   */
  public async grade(params: GradingParams): Promise<GradingResult> {
    const startTime = Date.now();

    try {
      const prompt = buildGradingPrompt({
        query: params.query,
        response: params.response,
      });

      const llmResponse = await this.ollamaProvider.complete({
        maxTokens: 512,
        model: this.config.llmModel,
        prompt,
        temperature: this.config.temperature,
      });

      const parsed = this.parseGradingResponse({ response: llmResponse.text });

      const grade = this.calculateQualityGrade({
        clarity: parsed.clarity,
        completeness: parsed.completeness,
        rationale: parsed.rationale,
        relevance: parsed.relevance,
      });

      const entities: ExtractedEntities = {
        concepts: parsed.concepts,
        entities: parsed.entities,
        keywords: parsed.keywords,
      };

      const duration = Date.now() - startTime;

      this.logger.info({
        message: 'Response graded',
        metadata: {
          duration,
          entitiesCount: entities.entities.length,
          messageId: params.messageId,
          overallScore: grade.overallScore,
        },
      });

      return {
        entities,
        grade,
        messageId: params.messageId,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error({
        message: 'Quality grading failed',
        metadata: { error, messageId: params.messageId },
      });

      // Return default grading on error
      return {
        entities: {
          concepts: [],
          entities: [],
          keywords: [],
        },
        grade: {
          clarity: 0.5,
          completeness: 0.5,
          overallScore: 0.5,
          rationale: 'Grading failed, default scores applied',
          relevance: 0.5,
        },
        messageId: params.messageId,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Calculate overall quality score from individual metrics
   */
  private calculateQualityGrade(params: {
    clarity: number;
    completeness: number;
    rationale: string;
    relevance: number;
  }): QualityGrade {
    const { clarity, completeness, rationale, relevance } = params;

    // Ensure scores are in valid range
    const validRelevance = Math.max(0, Math.min(1, relevance));
    const validCompleteness = Math.max(0, Math.min(1, completeness));
    const validClarity = Math.max(0, Math.min(1, clarity));

    // Calculate weighted average
    const overallScore =
      validRelevance * this.config.weights.relevance +
      validCompleteness * this.config.weights.completeness +
      validClarity * this.config.weights.clarity;

    return {
      clarity: validClarity,
      completeness: validCompleteness,
      overallScore,
      rationale,
      relevance: validRelevance,
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
   * Parse LLM grading response
   */
  private parseGradingResponse(params: { response: string }): {
    clarity: number;
    completeness: number;
    concepts: string[];
    entities: string[];
    keywords: string[];
    rationale: string;
    relevance: number;
  } {
    const jsonStr = this.extractJsonFromResponse({ response: params.response });

    const parsed = JSON.parse(jsonStr) as {
      clarity: number;
      completeness: number;
      concepts: string[];
      entities: string[];
      keywords: string[];
      rationale: string;
      relevance: number;
    };

    return {
      clarity: parsed.clarity,
      completeness: parsed.completeness,
      concepts: parsed.concepts,
      entities: parsed.entities,
      keywords: parsed.keywords,
      rationale: parsed.rationale,
      relevance: parsed.relevance,
    };
  }
}
