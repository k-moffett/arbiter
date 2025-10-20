/**
 * SimpleMetrics Utilities
 *
 * Pure utility functions for metrics operations.
 */

/**
 * Check if two label sets match
 *
 * @param params - Comparison parameters
 * @param params.labels - First label set
 * @param params.query - Second label set (query)
 * @returns True if label sets match exactly
 */
export function labelsMatch(params: {
  labels: Record<string, string>;
  query: Record<string, string>;
}): boolean {
  const labelKeys = Object.keys(params.labels);
  const queryKeys = Object.keys(params.query);

  if (labelKeys.length !== queryKeys.length) {
    return false;
  }

  return queryKeys.every((key) => params.labels[key] === params.query[key]);
}
