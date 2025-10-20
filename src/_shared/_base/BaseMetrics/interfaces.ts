/**
 * BaseMetrics Interfaces
 *
 * Interface definitions for BaseMetrics method parameters.
 */

/**
 * Parameters for incrementing counters
 */
export interface IncrementParams {
  amount?: number;
  labels?: Record<string, string>;
  name: string;
}

/**
 * Parameters for setting gauge values
 */
export interface SetGaugeParams {
  labels?: Record<string, string>;
  name: string;
  value: number;
}

/**
 * Parameters for recording histogram values
 */
export interface RecordHistogramParams {
  labels?: Record<string, string>;
  name: string;
  value: number;
}

/**
 * Parameters for starting timers
 */
export interface StartTimerParams {
  labels?: Record<string, string>;
  name: string;
}

/**
 * Parameters for getting metric values
 */
export interface GetMetricParams {
  labels?: Record<string, string>;
  name: string;
}

/**
 * Parameters for resetting metrics
 */
export interface ResetParams {
  name?: string;
}
