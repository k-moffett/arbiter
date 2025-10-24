/**
 * Retry With Backoff - Type Definitions
 *
 * Types for retry operations with exponential backoff.
 */

import type { BaseLogger } from '@shared/_base/BaseLogger/index.js';

/**
 * Configuration for retry operations
 */
export interface RetryConfig {
  /** Delay durations in milliseconds for each retry attempt */
  delays: number[];

  /** Logger instance */
  logger: BaseLogger;

  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Operation name for logging */
  operation: string;
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  /** Number of attempts made (1 = success on first try) */
  attempts: number;

  /** The successful result */
  data: T;

  /** Total time spent in milliseconds */
  totalTimeMs: number;

  /** Whether any retries were needed */
  wasRetried: boolean;
}
