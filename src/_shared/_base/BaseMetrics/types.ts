/**
 * BaseMetrics Types
 *
 * Type definitions for metrics operations.
 */

/**
 * Parameters for ending a timer
 */
export interface EndTimerParams {
  labels?: Record<string, string>;
}

/**
 * Timer function returned by metrics.startTimer()
 * Call this function to stop the timer and record the duration
 */
export type TimerFunction = (params?: EndTimerParams) => void;
