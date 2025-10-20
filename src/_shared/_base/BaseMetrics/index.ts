/**
 * BaseMetrics Module
 *
 * Exports the BaseMetrics abstract class and related types.
 */

export { BaseMetrics } from './BaseMetricsImplementation';
export type {
  GetMetricParams,
  IncrementParams,
  RecordHistogramParams,
  ResetParams,
  SetGaugeParams,
  StartTimerParams,
} from './interfaces';
export type { EndTimerParams, TimerFunction } from './types';
