/**
 * SimpleMetrics Interfaces
 *
 * Interface definitions for SimpleMetrics internal structures.
 */

/**
 * Metric storage entry with labels
 */
export interface MetricEntry {
  labels: Record<string, string>;
  value: number;
  values?: number[]; // For histograms
}
