/**
 * Ollama NLP Service Types
 *
 * JSON schema-enforced generation wrapper for Ollama.
 */

/**
 * JSON schema definition (subset of JSON Schema spec)
 */
export interface JSONSchema {
  /** Enum values (for string/number types) */
  enum?: Array<string | number | boolean>;

  /** Item schema (for array type) */
  items?: JSONSchemaProperty;

  /** Maximum value (for number type) */
  maximum?: number;

  /** Minimum value (for number type) */
  minimum?: number;

  /** Property definitions (for object type) */
  properties?: Record<string, JSONSchemaProperty>;

  /** Required properties (for object type) */
  required?: string[];

  /** Schema type */
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
}

/**
 * JSON schema property definition
 */
export interface JSONSchemaProperty {
  /** Enum values */
  enum?: Array<string | number | boolean>;

  /** Item schema (for arrays) */
  items?: JSONSchemaProperty;

  /** Maximum value (for numbers) */
  maximum?: number;

  /** Minimum value (for numbers) */
  minimum?: number;

  /** Nested properties (for nested objects) */
  properties?: Record<string, JSONSchemaProperty>;

  /** Required properties (for nested objects) */
  required?: string[];

  /** Property type */
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
}

/**
 * Ollama generation options
 */
export interface OllamaGenerationOptions {
  /** Response format (JSON schema for structured outputs) */
  format?: JSONSchema;

  /** Maximum tokens to generate */
  numPredict?: number;

  /** Temperature (0-1, lower = more deterministic) */
  temperature?: number;
}

/**
 * Ollama provider interface
 */
export interface OllamaProvider {
  /** Generate completion from prompt */
  complete(params: {
    maxTokens: number;
    model: string;
    prompt: string;
    temperature: number;
  }): Promise<{ text: string }>;
}
