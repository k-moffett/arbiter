/**
 * Centralized ENV File Loader
 *
 * Loads all environment files in the correct order following industry best practices.
 * Call this ONCE at application startup before any other code that reads process.env.
 *
 * Load Order (first file wins for duplicate keys):
 * 1. Main .env file (project root)
 * 2. All domain-specific env/.env.* files (alphabetically)
 *
 * This ensures domain-specific values override general defaults.
 */

import { config as dotenvConfig } from 'dotenv';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Load all environment files
 *
 * Industry standard pattern:
 * - Load multiple .env files by calling dotenv.config() for each
 * - First file wins for duplicate variables (specific overrides general)
 * - Automatically discovers all domain ENV files in env/ directory
 *
 * @example
 * ```typescript
 * // At top of main entry point (index.ts, server.ts, etc.)
 * import { loadAllEnvFiles } from '@shared/_utils';
 * loadAllEnvFiles();
 *
 * // Now all ENV variables from all files are loaded
 * const value = process.env['SOME_VARIABLE'];
 * ```
 */
export function loadAllEnvFiles(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = join(__dirname, '../../..');

  // 1. Load main .env file first (lowest priority)
  const mainEnvPath = join(projectRoot, '.env');
  if (existsSync(mainEnvPath)) {
    dotenvConfig({ path: mainEnvPath });
    console.log(`[ENV] Loaded: ${mainEnvPath}`);
  }

  // 2. Load all domain-specific ENV files from env/ directory
  const envDir = join(projectRoot, 'env');
  if (existsSync(envDir)) {
    const envFiles = readdirSync(envDir)
      .filter((file) => {
        // Only load actual .env.* files (not .example files)
        return file.startsWith('.env.') && !file.endsWith('.example');
      })
      .sort(); // Alphabetical order for deterministic loading

    for (const file of envFiles) {
      const envPath = join(envDir, file);
      // Use override: true so domain-specific values win over main .env
      dotenvConfig({ path: envPath, override: true });
      console.log(`[ENV] Loaded: ${envPath}`);
    }

    console.log(`[ENV] Total domain ENV files loaded: ${envFiles.length}`);
  }

  console.log('[ENV] All environment files loaded successfully');
}
