/**
 * Sleep Utility
 *
 * Provides async delay functionality.
 */

/**
 * Sleep for a specified duration
 *
 * @param params - Sleep configuration
 * @param params.ms - Duration in milliseconds
 * @returns Promise that resolves after the delay
 */
export async function sleep(params: { ms: number }): Promise<void> {
  // eslint-disable-next-line local-rules/no-promise-constructor -- Low-level utility needs Promise constructor
  await new Promise<void>((resolve) => {
    setTimeout(resolve, params.ms);
  });
}
