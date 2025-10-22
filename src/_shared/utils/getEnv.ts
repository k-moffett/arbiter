/**
 * Get environment variable
 *
 * Helper to access process.env with bracket notation for TypeScript strict mode.
 *
 * @param params - Environment variable parameters
 * @returns Environment variable value or default
 */
export function getEnv(params: { defaultValue: string; key: string }): string {
  const value = process.env[params.key];
  return value ?? params.defaultValue;
}
