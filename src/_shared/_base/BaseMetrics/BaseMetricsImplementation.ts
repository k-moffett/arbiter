/**
 * BaseMetrics
 *
 * Abstract base class for metrics collection infrastructure.
 * All metrics implementations in the project must extend this class.
 *
 * Features:
 * - Counter metrics (increment-only values)
 * - Gauge metrics (current values that can increase/decrease)
 * - Histogram metrics (value distributions)
 * - Timer metrics (duration tracking)
 *
 * @example
 * ```typescript
 * const metrics = new SimpleMetrics();
 *
 * // Track API calls
 * metrics.increment({ name: 'api.requests', labels: { endpoint: '/users' } });
 *
 * // Track response time
 * metrics.recordHistogram({ name: 'api.duration', value: 150, labels: { endpoint: '/users' } });
 *
 * // Use timer helper
 * const end = metrics.startTimer({ name: 'database.query' });
 * await database.query('SELECT * FROM users');
 * end();
 * ```
 */

import type {
  GetMetricParams,
  IncrementParams,
  RecordHistogramParams,
  ResetParams,
  SetGaugeParams,
  StartTimerParams,
} from './interfaces';
import type { TimerFunction } from './types';

export abstract class BaseMetrics {
  /**
   * Get the current value of a metric
   * Useful for testing and debugging
   *
   * @param params - Metric retrieval parameters
   * @param params.name - Metric name
   * @param params.labels - Optional labels to filter by
   * @returns Current metric value or null if not found
   *
   * @example
   * ```typescript
   * const count = metrics.getMetric({ name: 'api.requests' });
   * const queueSize = metrics.getMetric({ name: 'queue.size', labels: { queue: 'jobs' } });
   * ```
   */
  public abstract getMetric(params: GetMetricParams): number | null;

  /**
   * Increment a counter metric
   * Use this for counting events (requests, errors, etc.)
   *
   * @param params - Counter parameters
   * @param params.name - Metric name (e.g., 'api.requests')
   * @param params.amount - Amount to increment by (default: 1)
   * @param params.labels - Optional labels for the metric
   *
   * @example
   * ```typescript
   * metrics.increment({ name: 'api.requests', labels: { method: 'GET' } });
   * metrics.increment({ name: 'errors', amount: 1, labels: { type: 'validation' } });
   * ```
   */
  public abstract increment(params: IncrementParams): void;

  /**
   * Record a histogram value
   * Use this for distributions (response times, payload sizes, etc.)
   *
   * @param params - Histogram parameters
   * @param params.name - Metric name (e.g., 'api.duration')
   * @param params.value - Value to record
   * @param params.labels - Optional labels for the metric
   *
   * @example
   * ```typescript
   * metrics.recordHistogram({ name: 'api.duration', value: 150 });
   * metrics.recordHistogram({ name: 'payload.size', value: 2048, labels: { type: 'json' } });
   * ```
   */
  public abstract recordHistogram(params: RecordHistogramParams): void;

  /**
   * Reset metrics
   * If name is provided, resets only that metric
   * Otherwise, resets all metrics
   *
   * @param params - Reset parameters
   * @param params.name - Optional metric name to reset
   *
   * @example
   * ```typescript
   * metrics.reset({ name: 'api.requests' }); // Reset specific metric
   * metrics.reset({}); // Reset all metrics
   * ```
   */
  public abstract reset(params: ResetParams): void;

  /**
   * Set a gauge metric to a specific value
   * Use this for values that can go up or down (memory, queue size, etc.)
   *
   * @param params - Gauge parameters
   * @param params.name - Metric name (e.g., 'memory.used')
   * @param params.value - Current value
   * @param params.labels - Optional labels for the metric
   *
   * @example
   * ```typescript
   * metrics.setGauge({ name: 'memory.used', value: 1024 });
   * metrics.setGauge({ name: 'queue.size', value: 42, labels: { queue: 'jobs' } });
   * ```
   */
  public abstract setGauge(params: SetGaugeParams): void;

  /**
   * Start a timer for duration tracking
   * Returns a function that stops the timer and records the duration
   *
   * @param params - Timer parameters
   * @param params.name - Metric name (e.g., 'database.query')
   * @param params.labels - Optional labels for the metric
   * @returns Function to stop the timer
   *
   * @example
   * ```typescript
   * const end = metrics.startTimer({ name: 'database.query' });
   * await database.query('SELECT * FROM users');
   * end(); // Records duration automatically
   * ```
   */
  public abstract startTimer(params: StartTimerParams): TimerFunction;
}
