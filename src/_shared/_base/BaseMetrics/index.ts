/**
 * BaseMetrics Module
 *
 * Exports the BaseMetrics abstract class and related types.
 */

export { BaseMetrics } from './BaseMetricsImplementation.js';
export type {
  GetMetricParams,
  IncrementParams,
  RecordHistogramParams,
  ResetParams,
  SetGaugeParams,
  StartTimerParams,
} from './interfaces.js';
export type { EndTimerParams, TimerFunction } from './types.js';
