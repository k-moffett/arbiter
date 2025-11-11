/**
 * Ollama Topic Analyzer
 *
 * LLM-based topic shift detection for semantic boundary detection.
 * Uses sliding window context to detect topic transitions.
 */

import type { OllamaNLPService } from '../OllamaNLPService';
import type { TopicBoundary, TopicShiftAnalysis } from './types';

/**
 * Ollama Topic Analyzer Configuration
 */
export interface OllamaTopicAnalyzerConfig {
  /** NLP service for LLM generation */
  nlpService: OllamaNLPService;

  /** Maximum tokens for LLM response generation */
  numPredict: number;

  /** Temperature for topic analysis (low = more deterministic) */
  temperature: number;
}

/**
 * Ollama Topic Analyzer
 *
 * Detects topic shifts between text segments using LLM analysis.
 *
 * @example
 * ```typescript
 * const analyzer = new OllamaTopicAnalyzer({
 *   nlpService,
 *   temperature: 0.1
 * });
 *
 * const boundary = await analyzer.detectTopicBoundary(
 *   "The Renaissance was a period of cultural rebirth.",
 *   "Meanwhile, in the Americas, indigenous civilizations thrived."
 * );
 *
 * console.log(boundary.boundaryStrength); // 0.85 (strong topic shift)
 * ```
 */
export class OllamaTopicAnalyzer {
  private readonly nlpService: OllamaNLPService;
  private readonly numPredict: number;
  private readonly temperature: number;

  constructor(config: OllamaTopicAnalyzerConfig) {
    this.nlpService = config.nlpService;
    this.numPredict = config.numPredict;
    this.temperature = config.temperature;
  }

  /**
   * Detect topic boundary between two text segments
   */
  public async detectTopicBoundary(params: {
    textAfter: string;
    textBefore: string;
  }): Promise<TopicBoundary> {
    const shift = await this.detectTopicShift({
      textAfter: params.textAfter,
      textBefore: params.textBefore,
    });

    const boundaryStrength = this.calculateBoundaryStrength({ shift });

    return { boundaryStrength, shift };
  }

  /**
   * Build prompt for topic shift detection
   */
  private buildTopicShiftPrompt(params: {
    textAfter: string;
    textBefore: string;
  }): string {
    return (
      `Analyze the topic relationship between these two text segments:\n\n` +
      `SEGMENT 1:\n${params.textBefore}\n\n` +
      `SEGMENT 2:\n${params.textAfter}\n\n` +
      `Determine:\n` +
      `1. Do they discuss the same topic? (sameTopic: boolean)\n` +
      `2. How confident are you? (confidence: 0-1)\n` +
      `3. What is their relationship? (relationship: one of the enum values)\n` +
      `4. Brief explanation (reason: string)\n\n` +
      `Relationships:\n` +
      `- continuation: Direct continuation of the same thought\n` +
      `- elaboration: Expanding on the same topic with more detail\n` +
      `- related: Related topics but distinct concepts\n` +
      `- contrast: Contrasting or comparing different aspects\n` +
      `- new_topic: Completely different topic`
    );
  }

  /**
   * Calculate boundary strength from topic shift analysis
   */
  private calculateBoundaryStrength(params: { shift: TopicShiftAnalysis }): number {
    // Map relationship to base strength
    /* eslint-disable @typescript-eslint/naming-convention */
    const relationshipStrengths: Record<string, number> = {
      continuation: 0.0,
      elaboration: 0.2,
      related: 0.5,
      contrast: 0.7,
      new_topic: 1.0, // Snake case matches LLM prompt format
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    const baseStrength = relationshipStrengths[params.shift.relationship] ?? 0.5;

    // Adjust by confidence and sameTopic flag
    const topicPenalty = params.shift.sameTopic ? 0.5 : 1.0;

    return baseStrength * params.shift.confidence * topicPenalty;
  }

  /**
   * Detect topic shift between text segments
   */
  private async detectTopicShift(params: {
    textAfter: string;
    textBefore: string;
  }): Promise<TopicShiftAnalysis> {
    const prompt = this.buildTopicShiftPrompt({
      textAfter: params.textAfter,
      textBefore: params.textBefore,
    });

    const schema = {
      type: 'object' as const,
      required: ['sameTopic', 'confidence', 'relationship', 'reason'],
      properties: {
        sameTopic: { type: 'boolean' as const },
        confidence: { type: 'number' as const, minimum: 0, maximum: 1 },
        relationship: {
          type: 'string' as const,
          enum: ['continuation', 'new_topic', 'elaboration', 'contrast', 'related'],
        },
        reason: { type: 'string' as const },
      },
    };

    return await this.nlpService.generate<TopicShiftAnalysis>({
      prompt,
      options: {
        format: schema,
        numPredict: this.numPredict,
        temperature: this.temperature,
      },
    });
  }
}
