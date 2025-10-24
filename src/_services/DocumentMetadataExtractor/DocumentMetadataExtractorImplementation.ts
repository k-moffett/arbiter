/**
 * Document Metadata Extractor Implementation
 *
 * LLM-powered automatic metadata extraction from document content.
 */

import type { DocumentMetadata } from '../PDFIngestionService/types/index.js';
import type { OllamaNLPService } from '../TextChunkingService/_strategies/OllamaSemanticChunker/_analyzers/OllamaNLPService/index.js';
import type { DocumentMetadataExtractor } from './interfaces.js';
import type {
  MetadataExtractionConfig,
  MetadataExtractionResult,
  TextSample,
} from './types.js';

/**
 * Configuration for Document Metadata Extractor
 */
export interface DocumentMetadataExtractorConfig {
  /** Extraction configuration */
  extraction: MetadataExtractionConfig;

  /** NLP service for LLM generation */
  nlpService: OllamaNLPService;
}

/**
 * Document Metadata Extractor Implementation
 *
 * Extracts metadata from document content using smart sampling
 * and LLM analysis.
 *
 * @example
 * ```typescript
 * const extractor = new DocumentMetadataExtractorImplementation({
 *   nlpService,
 *   extraction: {
 *     model: 'llama3.2:3b',
 *     samplePages: 5,
 *     temperature: 0.1
 *   }
 * });
 *
 * const result = await extractor.extract({ text: fullDocumentText });
 * console.log(result.metadata.title);
 * console.log(result.confidence); // 0-1
 * ```
 */
export class DocumentMetadataExtractorImplementation implements DocumentMetadataExtractor {
  private readonly extraction: MetadataExtractionConfig;
  private readonly nlpService: OllamaNLPService;

  constructor(config: DocumentMetadataExtractorConfig) {
    this.nlpService = config.nlpService;
    this.extraction = config.extraction;
  }

  /**
   * Create text sample from full document text
   *
   * Smart sampling strategy:
   * - First N pages for title, author, abstract, introduction
   * - Look for table of contents markers
   * - Last 2 pages for conclusion, references
   */
  public createTextSample(params: { text: string }): TextSample {
    const lines = params.text.split('\n');
    const totalLines = lines.length;

    // Estimate lines per page (rough heuristic: 50 lines per page)
    const linesPerPage = 50;
    const introLines = this.extraction.samplePages * linesPerPage;
    const conclusionLines = 2 * linesPerPage;

    // Extract introduction (first N pages)
    const introduction = lines.slice(0, Math.min(introLines, totalLines)).join('\n');

    // Extract conclusion (last 2 pages)
    const conclusionStart = Math.max(0, totalLines - conclusionLines);
    const conclusionText = conclusionStart > 0 ? lines.slice(conclusionStart).join('\n') : undefined;

    // Look for table of contents markers
    const tocStart = lines.findIndex((line) =>
      /table of contents|contents|index/i.test(line.trim())
    );

    let tableOfContentsText: string | undefined;
    if (tocStart !== -1) {
      // Extract ~100 lines after TOC marker
      const tocEnd = Math.min(tocStart + 100, totalLines);
      tableOfContentsText = lines.slice(tocStart, tocEnd).join('\n');
    }

    const sample: TextSample = {
      introduction,
    };

    if (conclusionText !== undefined) {
      sample.conclusion = conclusionText;
    }

    if (tableOfContentsText !== undefined) {
      sample.tableOfContents = tableOfContentsText;
    }

    return sample;
  }

  /**
   * Extract metadata from document text
   */
  public async extract(params: { text: string }): Promise<MetadataExtractionResult> {
    // Create smart sample from document
    const sample = this.createTextSample({ text: params.text });

    // Build prompt for metadata extraction
    const prompt = this.buildExtractionPrompt({ sample });

    // Define JSON schema for structured output
    const schema = {
      type: 'object' as const,
      required: ['title', 'author', 'description', 'category', 'tags', 'confidence'],
      properties: {
        title: { type: 'string' as const },
        author: { type: 'string' as const },
        description: { type: 'string' as const },
        category: { type: 'string' as const },
        tags: {
          type: 'array' as const,
          items: { type: 'string' as const },
        },
        language: { type: 'string' as const },
        publishDate: { type: 'string' as const },
        source: { type: 'string' as const },
        confidence: { type: 'number' as const, minimum: 0, maximum: 1 },
      },
    };

    // Call LLM to extract metadata
    const result = await this.nlpService.generate<DocumentMetadata & { confidence: number }>({
      prompt,
      options: {
        format: schema,
        numPredict: 400,
        temperature: this.extraction.temperature,
      },
    });

    // Extract confidence and metadata
    const { confidence, ...metadata } = result;

    return {
      confidence,
      metadata,
    };
  }

  /**
   * Build prompt for metadata extraction
   */
  // eslint-disable-next-line max-statements -- Comprehensive prompt building requires detailed instructions
  private buildExtractionPrompt(params: { sample: TextSample }): string {
    let prompt =
      'Analyze the following document sections and extract structured metadata.\n\n';

    // Add introduction section
    prompt += '=== INTRODUCTION ===\n';
    prompt += params.sample.introduction;
    prompt += '\n\n';

    // Add TOC if available
    if (params.sample.tableOfContents !== undefined) {
      prompt += '=== TABLE OF CONTENTS ===\n';
      prompt += params.sample.tableOfContents;
      prompt += '\n\n';
    }

    // Add conclusion if available
    if (params.sample.conclusion !== undefined) {
      prompt += '=== CONCLUSION ===\n';
      prompt += params.sample.conclusion;
      prompt += '\n\n';
    }

    // Add extraction instructions
    prompt += '=== EXTRACTION TASK ===\n';
    prompt += 'Extract the following metadata:\n\n';
    prompt += '1. title: The document title (string)\n';
    prompt += '2. author: Primary author(s) (string, comma-separated if multiple)\n';
    prompt +=
      '3. description: Brief 2-3 sentence summary of the document content (string)\n';
    prompt +=
      '4. category: Document category/type (e.g., "research", "technical", "guide", "report")\n';
    prompt += '5. tags: Array of 3-8 relevant keywords/topics (array of strings)\n';
    prompt += '6. language: Document language code (e.g., "en", "es") - optional\n';
    prompt += '7. publishDate: Publication date or year if mentioned - optional\n';
    prompt += '8. source: Publishing organization or source if mentioned - optional\n';
    prompt += '9. confidence: Your confidence in the extraction quality (0-1)\n\n';
    prompt += 'Important guidelines:\n';
    prompt += '- Be concise and accurate\n';
    prompt += '- If author is not explicitly mentioned, use "Unknown Author"\n';
    prompt += '- Category should be lowercase and hyphenated (e.g., "research-paper")\n';
    prompt += '- Tags should be relevant, specific, and lowercase\n';
    prompt += '- Confidence should reflect how clearly the metadata is stated in the text\n';

    return prompt;
  }
}
