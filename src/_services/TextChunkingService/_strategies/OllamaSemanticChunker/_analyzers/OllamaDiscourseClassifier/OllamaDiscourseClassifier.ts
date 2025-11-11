/**
 * Ollama Discourse Classifier
 *
 * LLM-based discourse relationship detection for semantic boundary detection.
 * Identifies rhetorical relationships like cause-effect, elaboration, etc.
 */

import type { OllamaNLPService } from '../OllamaNLPService';
import type { DiscourseAnalysis, DiscourseBoundary, DiscourseRelation } from './types';

/**
 * Ollama Discourse Classifier Configuration
 */
export interface OllamaDiscourseClassifierConfig {
  /** NLP service for LLM generation */
  nlpService: OllamaNLPService;

  /** Maximum tokens for LLM response generation */
  numPredict: number;

  /** Temperature for discourse analysis (low = more deterministic) */
  temperature: number;
}

/**
 * Ollama Discourse Classifier
 *
 * Classifies discourse relationships between text segments to identify
 * natural breaking points in document structure.
 *
 * @example
 * ```typescript
 * const classifier = new OllamaDiscourseClassifier({
 *   nlpService,
 *   temperature: 0.1
 * });
 *
 * const boundary = await classifier.detectDiscourseBoundary(
 *   "The project failed due to poor planning.",
 *   "As a result, the team was disbanded."
 * );
 *
 * console.log(boundary.analysis.relation); // "cause_effect"
 * console.log(boundary.analysis.strongRelation); // true (keep together)
 * ```
 */
export class OllamaDiscourseClassifier {
  private readonly nlpService: OllamaNLPService;
  private readonly numPredict: number;
  private readonly temperature: number;

  constructor(config: OllamaDiscourseClassifierConfig) {
    this.nlpService = config.nlpService;
    this.numPredict = config.numPredict;
    this.temperature = config.temperature;
  }

  /**
   * Detect discourse boundary between two text segments
   */
  public async detectDiscourseBoundary(params: {
    textAfter: string;
    textBefore: string;
  }): Promise<DiscourseBoundary> {
    const analysis = await this.classifyDiscourse({
      textAfter: params.textAfter,
      textBefore: params.textBefore,
    });

    const boundaryStrength = this.calculateBoundaryStrength({ analysis });

    return { analysis, boundaryStrength };
  }

  /**
   * Build prompt for discourse classification
   */
  private buildDiscoursePrompt(params: {
    textAfter: string;
    textBefore: string;
  }): string {
    return (
      `Analyze the discourse relationship between these two text segments:\n\n` +
      `SEGMENT 1:\n${params.textBefore}\n\n` +
      `SEGMENT 2:\n${params.textAfter}\n\n` +
      `Determine:\n` +
      `1. What discourse relationship connects them? (relation: one of the enum values)\n` +
      `2. Is it a strong relationship that should keep them together? (strongRelation: boolean)\n` +
      `3. How confident are you? (confidence: 0-1)\n` +
      `4. Brief explanation (explanation: string)\n\n` +
      `Discourse Relations:\n` +
      `- cause_effect: One segment causes or results from the other\n` +
      `- elaboration: Second segment expands on or clarifies the first\n` +
      `- temporal: Segments describe events in sequence\n` +
      `- comparison: Segments compare similar things\n` +
      `- contrast: Segments contrast different things\n` +
      `- example: Second segment provides an example of the first\n` +
      `- background: Second segment provides context for the first\n` +
      `- none: No clear discourse relationship\n\n` +
      `Strong relationships (cause_effect, elaboration, example) suggest keeping segments together.\n` +
      `Weak or no relationships suggest a potential boundary.`
    );
  }

  /**
   * Calculate boundary strength from discourse analysis
   */
  private calculateBoundaryStrength(params: { analysis: DiscourseAnalysis }): number {
    // Strong discourse relationships should stay together (low boundary)
    if (params.analysis.strongRelation) {
      return 0.1 * params.analysis.confidence;
    }

    // Weak or no relationship = good boundary point
    /* eslint-disable @typescript-eslint/naming-convention */
    const relationBoundaryStrengths: Record<DiscourseRelation, number> = {
      cause_effect: 0.2, // Keep cause-effect together - Snake case matches LLM prompt format
      elaboration: 0.3, // Keep elaborations together
      example: 0.3, // Keep examples with their context
      temporal: 0.5, // Time shifts can be boundaries
      comparison: 0.6, // Comparisons can separate
      contrast: 0.7, // Contrasts suggest new section
      background: 0.5, // Background info can separate
      none: 0.9, // No relationship = strong boundary
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Fallback for safety
    const baseStrength = relationBoundaryStrengths[params.analysis.relation] ?? 0.5;

    return baseStrength * params.analysis.confidence;
  }

  /**
   * Classify discourse relationship between text segments
   */
  private async classifyDiscourse(params: {
    textAfter: string;
    textBefore: string;
  }): Promise<DiscourseAnalysis> {
    const prompt = this.buildDiscoursePrompt({
      textAfter: params.textAfter,
      textBefore: params.textBefore,
    });

    const schema = {
      type: 'object' as const,
      required: ['relation', 'strongRelation', 'confidence', 'explanation'],
      properties: {
        relation: {
          type: 'string' as const,
          enum: [
            'cause_effect',
            'elaboration',
            'temporal',
            'comparison',
            'contrast',
            'example',
            'background',
            'none',
          ],
        },
        strongRelation: { type: 'boolean' as const },
        confidence: { type: 'number' as const, minimum: 0, maximum: 1 },
        explanation: { type: 'string' as const },
      },
    };

    return await this.nlpService.generate<DiscourseAnalysis>({
      prompt,
      options: {
        format: schema,
        numPredict: this.numPredict,
        temperature: this.temperature,
      },
    });
  }
}
