/**
 * User ID Generation Utility
 *
 * Generates a persistent userId for CLI sessions.
 * In Docker containers, stores a UUID in a volume.
 * On host machines, uses MAC address hash.
 */

import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { hostname, networkInterfaces } from 'node:os';
import { join } from 'node:path';

/**
 * Get persistent userId
 *
 * For Docker: Stores UUID in /app/.arbiter/user_id
 * For Host: Uses MAC address hash
 *
 * @returns Persistent userId
 *
 * @example
 * ```typescript
 * const userId = getUserId();
 * // Returns: "a3f5c2d8b1e4..."
 * ```
 */
export function getUserId(): string {
  // Check if running in Docker (common Docker indicators)
  const isDocker = existsSync('/.dockerenv') || existsSync('/run/.containerenv');

  if (isDocker) {
    // In Docker: use persistent storage
    const userIdPath = join('/app', '.arbiter', 'user_id');
    const dirPath = join('/app', '.arbiter');

    try {
      // Try to read existing user ID
      if (existsSync(userIdPath)) {
        return readFileSync(userIdPath, 'utf8').trim();
      }

      // Generate new user ID
      const userId = randomUUID();

      // Create directory if needed
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }

      // Store user ID
      writeFileSync(userIdPath, userId, 'utf8');
      return userId;
    } catch {
      // Fallback if filesystem operations fail
      return hashString({ input: `docker-${hostname()}` });
    }
  }

  // On host: use MAC address from network interfaces
  const macAddress = getMacAddress();
  if (macAddress !== null) {
    return hashString({ input: macAddress });
  }

  // Final fallback: hostname hash
  return hashString({ input: hostname() });
}

/**
 * Get MAC address from network interfaces
 */
function getMacAddress(): string | null {
  const interfaces = networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (networkInterface === undefined) {
      continue;
    }

    for (const net of networkInterface) {
      if (net.internal) {
        continue;
      }

      if (net.mac !== '00:00:00:00:00:00') {
        return net.mac;
      }
    }
  }

  return null;
}

/**
 * Hash a string using SHA-256
 */
function hashString(params: { input: string }): string {
  const hash = createHash('sha256');
  hash.update(params.input);
  return hash.digest('hex');
}
