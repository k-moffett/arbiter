/**
 * OllamaProvider Utilities
 *
 * Pure utility functions for OllamaProvider.
 */

import type { FetchWithTimeoutParams } from './interfaces';

/**
 * Fetch with timeout and error handling
 */
export async function fetchWithTimeout<T>(params: FetchWithTimeoutParams): Promise<T> {
  const { controller, options, timeout, url } = params;
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${String(response.status)}: ${errorText}`);
    }

    const data = (await response.json()) as T;
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}
