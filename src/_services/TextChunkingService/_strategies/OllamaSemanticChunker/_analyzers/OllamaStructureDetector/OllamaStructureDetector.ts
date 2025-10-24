/**
 * Ollama Structure Detector
 *
 * LLM-based document structure detection for atomic unit preservation.
 * Identifies special structures like tables, Q&A pairs, definitions that should stay intact.
 */

import type { OllamaNLPService } from '../OllamaNLPService';
import type { StructureAnalysis, StructureBoundary, StructureType } from './types';

/**
 * Ollama Structure Detector Configuration
 */
export interface OllamaStructureDetectorConfig {
  /** NLP service for LLM generation */
  nlpService: OllamaNLPService;

  /** Temperature for structure analysis (low = more deterministic) */
  temperature: number;
}

/**
 * Ollama Structure Detector
 *
 * Detects document structural elements to preserve atomic units
 * and identify structural boundaries.
 *
 * @example
 * ```typescript
 * const detector = new OllamaStructureDetector({
 *   nlpService,
 *   temperature: 0.1
 * });
 *
 * const boundary = await detector.detectStructureBoundary(
 *   "Q: What is the capital of France?",
 *   "A: The capital of France is Paris."
 * );
 *
 * console.log(boundary.analysis.structureType); // "qa_pair"
 * console.log(boundary.analysis.shouldKeepAtomic); // true
 * ```
 */
export class OllamaStructureDetector {
  private readonly nlpService: OllamaNLPService;
  private readonly temperature: number;

  constructor(config: OllamaStructureDetectorConfig) {
    this.nlpService = config.nlpService;
    this.temperature = config.temperature;
  }

  /**
   * Detect structure boundary between two text segments
   */
  public async detectStructureBoundary(params: {
    textAfter: string;
    textBefore: string;
  }): Promise<StructureBoundary> {
    const analysis = await this.analyzeStructure({
      textAfter: params.textAfter,
      textBefore: params.textBefore,
    });

    const boundaryStrength = this.calculateBoundaryStrength({ analysis });

    return { analysis, boundaryStrength };
  }

  /**
   * Analyze document structure
   */
  private async analyzeStructure(params: {
    textAfter: string;
    textBefore: string;
  }): Promise<StructureAnalysis> {
    const prompt = this.buildStructurePrompt({
      textAfter: params.textAfter,
      textBefore: params.textBefore,
    });

    const schema = {
      type: 'object' as const,
      required: ['structureType', 'shouldKeepAtomic', 'confidence', 'explanation'],
      properties: {
        structureType: {
          type: 'string' as const,
          enum: [
            'header',
            'list',
            'table',
            'qa_pair',
            'definition',
            'code_block',
            'quote',
            'paragraph',
            'none',
          ],
        },
        shouldKeepAtomic: { type: 'boolean' as const },
        confidence: { type: 'number' as const, minimum: 0, maximum: 1 },
        explanation: { type: 'string' as const },
      },
    };

    return await this.nlpService.generate<StructureAnalysis>({
      prompt,
      options: {
        format: schema,
        numPredict: 150,
        temperature: this.temperature,
      },
    });
  }

  /**
   * Build prompt for structure detection
   */
  private buildStructurePrompt(params: {
    textAfter: string;
    textBefore: string;
  }): string {
    return (
      `Analyze the document structure of these two text segments:\n\n` +
      `SEGMENT 1:\n${params.textBefore}\n\n` +
      `SEGMENT 2:\n${params.textAfter}\n\n` +
      `Determine:\n` +
      `1. What type of structure do they form together? (structureType: one of the enum values)\n` +
      `2. Should they be kept as an atomic unit (not split)? (shouldKeepAtomic: boolean)\n` +
      `3. How confident are you? (confidence: 0-1)\n` +
      `4. Brief explanation (explanation: string)\n\n` +
      `Structure Types:\n` +
      `- header: Section header or title\n` +
      `- list: Bulleted or numbered list\n` +
      `- table: Tabular data or structured fields\n` +
      `- qa_pair: Question and answer pair\n` +
      `- definition: Term and its definition\n` +
      `- code_block: Code snippet or technical syntax\n` +
      `- quote: Quoted text or citation\n` +
      `- paragraph: Regular paragraph text\n` +
      `- none: No specific structure\n\n` +
      `Atomic structures (tables, Q&A pairs, definitions, code blocks) should NOT be split.\n` +
      `Headers indicate strong section boundaries.`
    );
  }

  /**
   * Calculate boundary strength from structure analysis
   */
  private calculateBoundaryStrength(params: { analysis: StructureAnalysis }): number {
    // Atomic structures should stay together (low boundary)
    if (params.analysis.shouldKeepAtomic) {
      return 0.1 * params.analysis.confidence;
    }

    // Structural boundaries indicate good split points
    /* eslint-disable @typescript-eslint/naming-convention */
    const structureBoundaryStrengths: Record<StructureType, number> = {
      header: 0.9, // Headers are strong boundaries
      list: 0.4, // Lists can be split but prefer to keep together
      table: 0.2, // Tables should generally stay together
      qa_pair: 0.2, // Q&A pairs should stay together - Snake case matches LLM prompt format
      definition: 0.3, // Definitions should stay with their term
      code_block: 0.2, // Code blocks should stay intact - Snake case matches LLM prompt format
      quote: 0.5, // Quotes can be boundaries
      paragraph: 0.6, // Paragraph breaks are medium boundaries
      none: 0.5, // No structure = medium boundary
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Fallback for safety
    const baseStrength = structureBoundaryStrengths[params.analysis.structureType] ?? 0.5;

    return baseStrength * params.analysis.confidence;
  }
}
