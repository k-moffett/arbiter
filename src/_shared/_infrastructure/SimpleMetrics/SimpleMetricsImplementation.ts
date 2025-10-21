/**
 * SimpleMetrics
 *
 * Simple in-memory metrics implementation.
 * Stores counters, gauges, and histograms in memory for development/testing.
 *
 * Features:
 * - In-memory storage (not persistent)
 * - Label support for metric dimensions
 * - Timer helpers for duration tracking
 * - Histogram statistics (min, max, avg, count)
 *
 * @example
 * ```typescript
 * const metrics = new SimpleMetrics();
 *
 * // Count API calls
 * metrics.increment({ name: 'api.requests', labels: { method: 'GET' } });
 *
 * // Track memory usage
 * metrics.setGauge({ name: 'memory.used', value: 1024 });
 *
 * // Time operations
 * const end = metrics.startTimer({ name: 'db.query' });
 * await database.query();
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
} from '../../_base/BaseMetrics/index.js';
import type { TimerFunction } from '../../_base/BaseMetrics/index.js';
import type { MetricEntry } from './interfaces.js';

import { BaseMetrics } from '../../_base/BaseMetrics/index.js';
import { labelsMatch } from './utils.js';

 
export class SimpleMetrics extends BaseMetrics {
  private readonly metrics: Map<string, MetricEntry[]>;

  constructor() {
    super();
    this.metrics = new Map();
  }

  public getMetric(params: GetMetricParams): number | null {
    const entries = this.metrics.get(params.name);
    if (entries === undefined) {
      return null;
    }

    // Find entry matching labels
    const entry = params.labels !== undefined
      ? entries.find((e) => labelsMatch({ labels: e.labels, query: params.labels ?? {} }))
      : entries[0];

    return entry?.value ?? null;
  }

  public increment(params: IncrementParams): void {
    const amount = params.amount ?? 1;
    const labels = params.labels ?? {};

    const entries = this.metrics.get(params.name) ?? [];
    const entry = entries.find((e) => labelsMatch({ labels: e.labels, query: labels }));

    if (entry !== undefined) {
      entry.value += amount;
    } else {
      entries.push({ labels, value: amount });
      this.metrics.set(params.name, entries);
    }
  }

  public recordHistogram(params: RecordHistogramParams): void {
    const labels = params.labels ?? {};

    const entries = this.metrics.get(params.name) ?? [];
    const entry = entries.find((e) => labelsMatch({ labels: e.labels, query: labels }));

    if (entry !== undefined) {
      // Update existing histogram
      entry.values = entry.values ?? [];
      entry.values.push(params.value);
      // Update aggregated value (average)
      // eslint-disable-next-line local-rules/require-typed-params, @typescript-eslint/max-params -- Standard array reduce callback
      entry.value = entry.values.reduce((a, b) => a + b, 0) / entry.values.length;
    } else {
      // Create new histogram entry
      entries.push({
        labels,
        value: params.value,
        values: [params.value],
      });
      this.metrics.set(params.name, entries);
    }
  }

  public reset(params: ResetParams): void {
    if (params.name !== undefined) {
      this.metrics.delete(params.name);
    } else {
      this.metrics.clear();
    }
  }

  public setGauge(params: SetGaugeParams): void {
    const labels = params.labels ?? {};

    const entries = this.metrics.get(params.name) ?? [];
    const entry = entries.find((e) => labelsMatch({ labels: e.labels, query: labels }));

    if (entry !== undefined) {
      entry.value = params.value;
    } else {
      entries.push({ labels, value: params.value });
      this.metrics.set(params.name, entries);
    }
  }

  public startTimer(params: StartTimerParams): TimerFunction {
    const startTime = Date.now();
    const labels = params.labels;

    return (endParams?: { labels?: Record<string, string> }): void => {
      const duration = Date.now() - startTime;
      const mergedLabels = { ...labels, ...endParams?.labels };
      const hasLabels = Object.keys(mergedLabels).length > 0;

      this.recordHistogram({
        name: params.name,
        value: duration,
        ...(hasLabels && { labels: mergedLabels }),
      });
    };
  }
}
