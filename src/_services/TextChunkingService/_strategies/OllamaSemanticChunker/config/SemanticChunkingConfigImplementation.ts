/**
 * Semantic Chunking Configuration Implementation
 *
 * Loads configuration from env/.env.text-chunking file with validation.
 * Provides type-safe access to all semantic chunking parameters.
 *
 * Single Responsibility: Load, validate, and provide semantic chunking configuration
 */

import type {
  AdaptiveThresholdConfig,
  SemanticBoundaryWeights,
  SemanticChunkingConfigConstructorParams,
  SemanticChunkingConfigParams,
} from './interfaces.js';

import { resolve } from 'path';

import { getEnv } from '@shared/_utils';
import { config as dotenvConfig } from 'dotenv';

/**
 * Semantic Chunking Configuration
 *
 * Loads and validates configuration from ENV file.
 * All parameters have sensible defaults.
 *
 * @example
 * ```typescript
 * // Use default ENV file (env/.env.text-chunking)
 * const config = new SemanticChunkingConfig();
 *
 * // Use custom ENV file
 * const config = new SemanticChunkingConfig({
 *   envFile: 'env/.env.text-chunking.test'
 * });
 *
 * // Access configuration
 * const weights = config.getWeights();
 * const maxSize = config.getMaxChunkSize();
 * ```
 */
export class SemanticChunkingConfig {
  private readonly config: SemanticChunkingConfigParams;

  /**
   * Create semantic chunking configuration
   *
   * @param params - Constructor parameters
   * @param params.envFile - Path to ENV file (default: 'env/.env.text-chunking')
   * @param params.overrides - Override specific values (for testing)
   */
  constructor(params: SemanticChunkingConfigConstructorParams = {}) {
    // Load ENV file
    const envFile = params.envFile ?? 'env/.env.text-chunking';
    const envPath = resolve(process.cwd(), envFile);
    dotenvConfig({ path: envPath });

    // Load configuration from ENV with defaults
    this.config = this.loadConfiguration();

    // Apply overrides if provided
    if (params.overrides !== undefined) {
      Object.assign(this.config, params.overrides);
    }

    // Validate configuration
    this.validate();
  }

  /**
   * Get adaptive threshold configuration
   */
  public getAdaptiveThreshold(): AdaptiveThresholdConfig {
    return this.config.adaptiveThreshold;
  }

  /**
   * Get always preserve structure flag
   */
  public getAlwaysPreserveStructure(): boolean {
    return this.config.alwaysPreserveStructure;
  }

  /**
   * Get complete configuration parameters
   */
  public getConfig(): SemanticChunkingConfigParams {
    return { ...this.config };
  }

  /**
   * Get maximum chunk size
   */
  public getMaxChunkSize(): number {
    return this.config.maxChunkSize;
  }

  /**
   * Get minimum chunk size
   */
  public getMinChunkSize(): number {
    return this.config.minChunkSize;
  }

  /**
   * Get overlap percentage
   */
  public getOverlapPercentage(): number {
    return this.config.overlapPercentage;
  }

  /**
   * Get progress feedback interval
   */
  public getProgressFeedbackInterval(): number {
    return this.config.progressFeedbackInterval;
  }

  /**
   * Get tag extraction enabled flag
   */
  public getTagExtractionEnabled(): boolean {
    return this.config.tagExtractionEnabled;
  }

  /**
   * Get target chunk size
   */
  public getTargetChunkSize(): number {
    return this.config.targetChunkSize;
  }

  /**
   * Get boundary score weights
   */
  public getWeights(): SemanticBoundaryWeights {
    return this.config.weights;
  }

  /**
   * Load configuration from ENV variables
   */
  private loadConfiguration(): SemanticChunkingConfigParams {
    // Load adaptive threshold config
    const adaptiveThreshold: AdaptiveThresholdConfig = {
      enabled: getEnv({ key: 'SEMANTIC_ADAPTIVE_THRESHOLD_ENABLED', defaultValue: 'true' }) === 'true',
      minThreshold: Number(getEnv({ key: 'SEMANTIC_ADAPTIVE_THRESHOLD_MIN', defaultValue: '0.3' })),
      maxThreshold: Number(getEnv({ key: 'SEMANTIC_ADAPTIVE_THRESHOLD_MAX', defaultValue: '0.8' })),
      candidateBoundaryLimit: Number(getEnv({ key: 'SEMANTIC_ADAPTIVE_CANDIDATE_LIMIT', defaultValue: '500' })),
    };

    // Load boundary weights
    const weights: SemanticBoundaryWeights = {
      embedding: Number(getEnv({ key: 'SEMANTIC_WEIGHT_EMBEDDING', defaultValue: '0.30' })),
      topic: Number(getEnv({ key: 'SEMANTIC_WEIGHT_TOPIC', defaultValue: '0.25' })),
      discourse: Number(getEnv({ key: 'SEMANTIC_WEIGHT_DISCOURSE', defaultValue: '0.25' })),
      structure: Number(getEnv({ key: 'SEMANTIC_WEIGHT_STRUCTURE', defaultValue: '0.20' })),
    };

    // Load other configuration
    return {
      adaptiveThreshold,
      weights,
      alwaysPreserveStructure: getEnv({ key: 'SEMANTIC_PRESERVE_STRUCTURE', defaultValue: 'true' }) === 'true',
      minChunkSize: Number(getEnv({ key: 'SEMANTIC_MIN_CHUNK_SIZE', defaultValue: '300' })),
      maxChunkSize: Number(getEnv({ key: 'SEMANTIC_MAX_CHUNK_SIZE', defaultValue: '1500' })),
      targetChunkSize: Number(getEnv({ key: 'SEMANTIC_TARGET_CHUNK_SIZE', defaultValue: '1000' })),
      overlapPercentage: Number(getEnv({ key: 'SEMANTIC_OVERLAP_PERCENTAGE', defaultValue: '15' })),
      progressFeedbackInterval: Number(getEnv({ key: 'SEMANTIC_PROGRESS_INTERVAL', defaultValue: '10' })),
      tagExtractionEnabled: getEnv({ key: 'SEMANTIC_TAG_EXTRACTION_ENABLED', defaultValue: 'true' }) === 'true',
    };
  }

  /**
   * Validate configuration values
   *
   * Ensures all values are within valid ranges and meet requirements.
   *
   * @throws {Error} If validation fails
   */
  private validate(): void {
    this.validateWeights();
    this.validateThresholds();
    this.validateChunkSizes();
    this.validateOtherParameters();
  }

  /**
   * Validate chunk size parameters
   */
  private validateChunkSizes(): void {
    const { minChunkSize, maxChunkSize, targetChunkSize } = this.config;

    if (minChunkSize <= 0) {
      throw new Error(
        `SEMANTIC_MIN_CHUNK_SIZE must be positive. Current value: ${String(minChunkSize)}`
      );
    }

    if (maxChunkSize <= 0) {
      throw new Error(
        `SEMANTIC_MAX_CHUNK_SIZE must be positive. Current value: ${String(maxChunkSize)}`
      );
    }

    if (targetChunkSize <= 0) {
      throw new Error(
        `SEMANTIC_TARGET_CHUNK_SIZE must be positive. Current value: ${String(targetChunkSize)}`
      );
    }

    if (minChunkSize >= targetChunkSize) {
      throw new Error(
        `SEMANTIC_MIN_CHUNK_SIZE (${String(minChunkSize)}) ` +
        `must be < SEMANTIC_TARGET_CHUNK_SIZE (${String(targetChunkSize)})`
      );
    }

    if (targetChunkSize >= maxChunkSize) {
      throw new Error(
        `SEMANTIC_TARGET_CHUNK_SIZE (${String(targetChunkSize)}) ` +
        `must be < SEMANTIC_MAX_CHUNK_SIZE (${String(maxChunkSize)})`
      );
    }
  }

  /**
   * Validate other configuration parameters
   */
  private validateOtherParameters(): void {
    const { overlapPercentage, progressFeedbackInterval, adaptiveThreshold } = this.config;

    if (overlapPercentage < 0 || overlapPercentage > 100) {
      throw new Error(
        `SEMANTIC_OVERLAP_PERCENTAGE must be between 0 and 100. ` +
        `Current value: ${String(overlapPercentage)}`
      );
    }

    if (progressFeedbackInterval <= 0) {
      throw new Error(
        `SEMANTIC_PROGRESS_INTERVAL must be positive. ` +
        `Current value: ${String(progressFeedbackInterval)}`
      );
    }

    if (adaptiveThreshold.candidateBoundaryLimit <= 0) {
      throw new Error(
        `SEMANTIC_ADAPTIVE_CANDIDATE_LIMIT must be positive. ` +
        `Current value: ${String(adaptiveThreshold.candidateBoundaryLimit)}`
      );
    }
  }

  /**
   * Validate adaptive threshold values
   */
  private validateThresholds(): void {
    const { minThreshold, maxThreshold } = this.config.adaptiveThreshold;

    if (minThreshold < 0 || minThreshold > 1) {
      throw new Error(
        `SEMANTIC_ADAPTIVE_THRESHOLD_MIN must be between 0.0 and 1.0. ` +
        `Current value: ${String(minThreshold)}`
      );
    }

    if (maxThreshold < 0 || maxThreshold > 1) {
      throw new Error(
        `SEMANTIC_ADAPTIVE_THRESHOLD_MAX must be between 0.0 and 1.0. ` +
        `Current value: ${String(maxThreshold)}`
      );
    }

    if (minThreshold > maxThreshold) {
      throw new Error(
        `SEMANTIC_ADAPTIVE_THRESHOLD_MIN (${String(minThreshold)}) ` +
        `must be <= SEMANTIC_ADAPTIVE_THRESHOLD_MAX (${String(maxThreshold)})`
      );
    }
  }

  /**
   * Validate boundary weights sum to 1.0
   */
  private validateWeights(): void {
    const weightSum = this.config.weights.embedding +
      this.config.weights.topic +
      this.config.weights.discourse +
      this.config.weights.structure;

    const tolerance = 0.01;
    const diff = Math.abs(weightSum - 1.0);
    if (diff > tolerance) {
      throw new Error(
        `Boundary weights must sum to 1.0 (±${String(tolerance)}). ` +
        `Current sum: ${weightSum.toFixed(3)}. ` +
        `Check SEMANTIC_WEIGHT_* variables in env/.env.text-chunking`
      );
    }
  }
}
