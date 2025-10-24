/**
 * Ollama NLP Service
 *
 * JSON schema-enforced generation wrapper for Ollama.
 * Provides structured outputs with retry logic for parsing failures.
 */

import type { JSONSchema, OllamaGenerationOptions, OllamaProvider } from './types';
import type { BaseLogger } from '@shared/_base/BaseLogger/index.js';

import { parseWithRepair } from '@shared/_utils/JsonRepair/JsonRepairImplementation.js';

/**
 * Ollama NLP Service Configuration
 */
export interface OllamaNLPServiceConfig {
  /** Logger for repair operations */
  logger?: BaseLogger;

  /** Maximum retry attempts for parsing failures */
  maxRetries?: number;

  /** Model to use for generation */
  model: string;

  /** Ollama provider instance */
  ollamaProvider: OllamaProvider;
}

/**
 * Ollama NLP Service
 *
 * Wraps Ollama provider with JSON schema enforcement and retry logic.
 *
 * @example
 * ```typescript
 * const nlpService = new OllamaNLPService({
 *   model: 'llama3.2:3b',
 *   ollamaProvider
 * });
 *
 * const result = await nlpService.generate(prompt, {
 *   temperature: 0.1,
 *   format: {
 *     type: 'object',
 *     required: ['answer', 'confidence'],
 *     properties: {
 *       answer: { type: 'string' },
 *       confidence: { type: 'number', minimum: 0, maximum: 1 }
 *     }
 *   }
 * });
 * ```
 */
export class OllamaNLPService {
  private readonly logger: BaseLogger | undefined;
  private readonly maxRetries: number;
  private readonly model: string;
  private readonly ollamaProvider: OllamaProvider;

  constructor(config: OllamaNLPServiceConfig) {
    this.model = config.model;
    this.ollamaProvider = config.ollamaProvider;
    this.maxRetries = config.maxRetries ?? 3;
    this.logger = config.logger;
  }

  /**
   * Generate structured response with JSON schema enforcement
   */
  // eslint-disable-next-line complexity -- Necessary for comprehensive error handling and validation logic
  public async generate<T = unknown>(params: {
    options?: OllamaGenerationOptions;
    prompt: string;
  }): Promise<T> {
    const { format, numPredict = 200, temperature = 0.1 } = params.options ?? {};

    let lastError: Error | undefined;

    // Retry loop for parsing failures
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Call Ollama provider
        const promptText = format !== undefined
          ? this.buildPromptWithSchema({ format, prompt: params.prompt })
          : params.prompt;

        const response = await this.ollamaProvider.complete({
          maxTokens: numPredict,
          model: this.model,
          prompt: promptText,
          temperature,
        });

        // Parse response
        const parsed = format !== undefined
          ? this.parseResponseWithSchema<T>({ format, response: response.text })
          : this.parseResponsePlain<T>({ response: response.text });

        // Validate against schema if provided
        if (format !== undefined) {
          this.validateAgainstSchema({ parsed, schema: format });
        }

        return parsed;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Collect retry info for single log after loop
        if (attempt === this.maxRetries - 1) {
          // Only log once after all retries exhausted
          const attemptNum = attempt + 1;
          const message = lastError.message;
          throw new Error(
            `OllamaNLPService failed after ${String(attemptNum)} attempts: ${message}`
          );
        }
      }
    }

    // All retries exhausted
    throw new Error(
      `OllamaNLPService failed after ${String(this.maxRetries)} attempts: ${lastError?.message ?? 'unknown error'}`
    );
  }

  /**
   * Build prompt with JSON schema instructions
   */
  private buildPromptWithSchema(params: { format: JSONSchema; prompt: string }): string {
    return (
      `${params.prompt}\n\n` +
      `You must respond with valid JSON matching this schema:\n` +
      `${JSON.stringify(params.format, null, 2)}\n\n` +
      `Respond with only the JSON object, no additional text.`
    );
  }

  /**
   * Parse response as plain value
   */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Generic type T provides type safety for caller
  private parseResponsePlain<T>(params: { response: string }): T {
    return params.response as T;
  }

  /**
   * Parse response text as JSON with automatic repair
   */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Generic type T provides type safety for caller
  private parseResponseWithSchema<T>(params: { format: JSONSchema; response: string }): T {
    // Extract JSON from response (may have markdown code blocks or extra text)
    const jsonMatch = params.response.match(/\{[\s\S]*\}/);
    if (jsonMatch === null) {
      throw new Error('No JSON object found in response');
    }

    // Use JSON repair if logger is available, otherwise fallback to regular parse
    if (this.logger !== undefined) {
      return parseWithRepair<T>({
        context: {
          logger: this.logger,
          operation: 'OllamaNLPService.parseResponseWithSchema',
        },
        jsonString: jsonMatch[0],
      });
    }

    // Fallback to standard parse if no logger
    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch (error) {
      throw new Error(
        `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validate parsed response against JSON schema
   */
  private validateAgainstSchema(params: {
    parsed: unknown;
    schema: JSONSchema;
  }): void {
    const { parsed, schema } = params;

    // Validate type
    if (schema.type === 'object') {
      this.validateObjectSchema({ parsed, schema });
      return;
    }

    if (schema.type === 'array') {
      this.validateArraySchema({ parsed });
      return;
    }

    // Primitive types
    this.validatePrimitiveType({ parsed, expectedType: schema.type });
  }

  /**
   * Validate array schema
   */
  private validateArraySchema(params: { parsed: unknown }): void {
    if (!Array.isArray(params.parsed)) {
      throw new Error(`Expected array, got ${typeof params.parsed}`);
    }
  }

  /**
   * Validate number value against min/max
   */
  private validateNumberRange(params: {
    maximum?: number;
    minimum?: number;
    value: number;
  }): void {
    const minStr = params.minimum !== undefined ? String(params.minimum) : '';
    const maxStr = params.maximum !== undefined ? String(params.maximum) : '';
    const valStr = String(params.value);

    if (params.minimum !== undefined && params.value < params.minimum) {
      throw new Error(`Value ${valStr} below minimum ${minStr}`);
    }
    if (params.maximum !== undefined && params.value > params.maximum) {
      throw new Error(`Value ${valStr} above maximum ${maxStr}`);
    }
  }

  /**
   * Validate object schema
   */
  private validateObjectSchema(params: {
    parsed: unknown;
    schema: JSONSchema;
  }): void {
    if (typeof params.parsed !== 'object' || params.parsed === null) {
      throw new Error(`Expected object, got ${typeof params.parsed}`);
    }

    const parsedObj = params.parsed as Record<string, unknown>;

    // Check required fields
    if (params.schema.required !== undefined) {
      this.validateRequiredFields({
        parsed: parsedObj,
        required: params.schema.required,
      });
    }

    // Validate properties
    if (params.schema.properties !== undefined) {
      this.validateProperties({
        parsed: parsedObj,
        properties: params.schema.properties,
      });
    }
  }

  /**
   * Validate primitive type
   */
  private validatePrimitiveType(params: {
    expectedType: string;
    parsed: unknown;
  }): void {
    const actualType = typeof params.parsed;
    if (actualType !== params.expectedType) {
      throw new Error(`Expected ${params.expectedType}, got ${actualType}`);
    }
  }

  /**
   * Validate properties against schema
   */
  private validateProperties(params: {
    parsed: Record<string, unknown>;
    properties: Record<string, { maximum?: number; minimum?: number; type: string }>;
  }): void {
    for (const [key, propSchema] of Object.entries(params.properties)) {
      const value = params.parsed[key];
      if (value === undefined) {
        continue;
      }

      this.validatePropertyValue({ propSchema, value });
    }
  }

  /**
   * Validate property value against schema
   */
  private validatePropertyValue(params: {
    propSchema: { maximum?: number; minimum?: number; type: string };
    value: unknown;
  }): void {
    // Handle array type specially (typeof array returns 'object')
    if (params.propSchema.type === 'array') {
      if (!Array.isArray(params.value)) {
        throw new Error(`Expected array, got ${typeof params.value}`);
      }
      return;
    }

    const actualType = typeof params.value;
    if (actualType !== params.propSchema.type) {
      throw new Error(`Expected ${params.propSchema.type}, got ${actualType}`);
    }

    // Validate number ranges
    if (params.propSchema.type === 'number') {
      const rangeParams: { maximum?: number; minimum?: number; value: number; } = {
        value: params.value as number,
      };

      if (params.propSchema.minimum !== undefined) {
        rangeParams.minimum = params.propSchema.minimum;
      }

      if (params.propSchema.maximum !== undefined) {
        rangeParams.maximum = params.propSchema.maximum;
      }

      this.validateNumberRange(rangeParams);
    }
  }

  /**
   * Validate required fields exist
   */
  private validateRequiredFields(params: {
    parsed: Record<string, unknown>;
    required: string[];
  }): void {
    for (const field of params.required) {
      if (!(field in params.parsed)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }
}
