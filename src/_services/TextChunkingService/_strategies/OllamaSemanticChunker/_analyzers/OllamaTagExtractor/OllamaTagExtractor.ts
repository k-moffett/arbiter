/**
 * Ollama Tag Extractor
 *
 * LLM-based semantic metadata extraction for chunk enrichment.
 * Extracts entities, topics, key phrases, and tags from text.
 */

import type { OllamaNLPService } from '../OllamaNLPService';
import type { ExtractedTags } from './types';

/**
 * Ollama Tag Extractor Configuration
 */
export interface OllamaTagExtractorConfig {
  /** NLP service for LLM generation */
  nlpService: OllamaNLPService;

  /** Temperature for tag extraction (slightly higher for creativity) */
  temperature: number;
}

/**
 * Ollama Tag Extractor
 *
 * Extracts semantic metadata from text chunks to improve searchability
 * and enable better filtering.
 *
 * @example
 * ```typescript
 * const extractor = new OllamaTagExtractor({
 *   nlpService,
 *   temperature: 0.3
 * });
 *
 * const tags = await extractor.extractTags(
 *   "Project Odyssey is a Mars colonization mission scheduled for 2035. " +
 *   "Led by NASA and SpaceX, it represents humanity's first attempt at " +
 *   "establishing a permanent settlement on another planet."
 * );
 *
 * console.log(tags.entities); // ["Project Odyssey", "NASA", "SpaceX", "Mars"]
 * console.log(tags.topics); // ["space exploration", "colonization", "Mars mission"]
 * console.log(tags.keyPhrases); // ["Mars colonization", "2035 launch", "permanent settlement"]
 * console.log(tags.tags); // ["space", "technology", "exploration"]
 * ```
 */
export class OllamaTagExtractor {
  private readonly nlpService: OllamaNLPService;
  private readonly temperature: number;

  constructor(config: OllamaTagExtractorConfig) {
    this.nlpService = config.nlpService;
    this.temperature = config.temperature;
  }

  /**
   * Extract semantic metadata from text
   */
  public async extractTags(params: { text: string }): Promise<ExtractedTags> {
    const prompt = this.buildTagExtractionPrompt({ text: params.text });

    const schema = {
      type: 'object' as const,
      required: ['entities', 'topics', 'keyPhrases', 'tags', 'confidence'],
      properties: {
        entities: {
          type: 'array' as const,
          items: { type: 'string' as const },
        },
        topics: {
          type: 'array' as const,
          items: { type: 'string' as const },
        },
        keyPhrases: {
          type: 'array' as const,
          items: { type: 'string' as const },
        },
        tags: {
          type: 'array' as const,
          items: { type: 'string' as const },
        },
        confidence: { type: 'number' as const, minimum: 0, maximum: 1 },
      },
    };

    return await this.nlpService.generate<ExtractedTags>({
      prompt,
      options: {
        format: schema,
        numPredict: 300,
        temperature: this.temperature,
      },
    });
  }

  /**
   * Build prompt for tag extraction
   */
  private buildTagExtractionPrompt(params: { text: string }): string {
    return (
      `Extract semantic metadata from the following text:\n\n` +
      `TEXT:\n${params.text}\n\n` +
      `Extract:\n` +
      `1. entities: Named entities (people, places, organizations, projects)\n` +
      `2. topics: Main topics or themes discussed\n` +
      `3. keyPhrases: Important phrases or terms (2-4 words each)\n` +
      `4. tags: General categorization tags (single words)\n` +
      `5. confidence: Your confidence in these extractions (0-1)\n\n` +
      `Guidelines:\n` +
      `- Extract 0-5 items for each category (only include relevant ones)\n` +
      `- Entities should be proper nouns (e.g., "NASA", "Project Odyssey")\n` +
      `- Topics should be themes or subjects (e.g., "space exploration", "technology")\n` +
      `- Key phrases should be important multi-word terms (e.g., "Mars colonization")\n` +
      `- Tags should be single-word categories (e.g., "space", "science")\n` +
      `- Use lowercase for topics, keyPhrases, and tags\n` +
      `- Keep original capitalization for entities`
    );
  }
}
