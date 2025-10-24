/**
 * Retry With Backoff Implementation
 *
 * Provides retry functionality with exponential backoff for transient failures.
 * Follows pattern: Try → Wait → Retry → Wait (longer) → Retry → Give up
 */

import type { RetryConfig, RetryResult } from './types.js';

import { sleep } from '../sleep.js';

/**
 * Execute an async operation with retry and exponential backoff
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration
 * @returns Promise resolving to the function result
 * @throws Error if all retries fail
 */
export async function retryWithBackoff<T>(params: {
  config: RetryConfig;
  fn(): Promise<T>;
}): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Arrow functions expected
  const { config, fn } = params;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === config.maxRetries;

      if (isLastAttempt) {
        config.logger.error({
          context: { attempt: attempt + 1, error, maxRetries: config.maxRetries },
          message: `${config.operation} failed after ${String(config.maxRetries)} retries`,
        });
        throw error;
      }

      const delay = config.delays[attempt] ?? config.delays[config.delays.length - 1] ?? 1000;

      config.logger.warn({
        context: {
          attempt: attempt + 1,
          delay,
          error: (error as Error).message,
          maxRetries: config.maxRetries,
        },
        message: `${config.operation} failed, retry ${String(attempt + 1)}/${String(config.maxRetries)}`,
      });

      await sleep({ ms: delay });
    }
  }

  throw new Error('Unreachable code');
}

/**
 * Execute an async operation with retry and detailed result
 *
 * Returns information about retry attempts
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration
 * @returns Promise resolving to retry result with metadata
 * @throws Error if all retries fail
 */
export async function retryWithBackoffDetailed<T>(params: {
  config: RetryConfig;
  fn(): Promise<T>;
}): Promise<RetryResult<T>> {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Arrow functions expected
  const { config, fn } = params;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const data = await fn();
      const totalTimeMs = Date.now() - startTime;

      return {
        attempts: attempt + 1,
        data,
        totalTimeMs,
        wasRetried: attempt > 0,
      };
    } catch (error) {
      const isLastAttempt = attempt === config.maxRetries;

      if (isLastAttempt) {
        config.logger.error({
          context: { attempt: attempt + 1, error, maxRetries: config.maxRetries },
          message: `${config.operation} failed after ${String(config.maxRetries)} retries`,
        });
        throw error;
      }

      const delay = config.delays[attempt] ?? config.delays[config.delays.length - 1] ?? 1000;

      config.logger.warn({
        context: {
          attempt: attempt + 1,
          delay,
          error: (error as Error).message,
          maxRetries: config.maxRetries,
        },
        message: `${config.operation} failed, retry ${String(attempt + 1)}/${String(config.maxRetries)}`,
      });

      await sleep({ ms: delay });
    }
  }

  throw new Error('Unreachable code');
}
