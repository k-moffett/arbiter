/**
 * Arbiter - Domain-Agnostic Knowledge Hub
 *
 * Main entry point for the application.
 */

import { Logger } from './_shared/_infrastructure';

const logger = new Logger({
  metadata: {
    serviceName: 'Arbiter Main',
  },
});

// Placeholder - will be implemented in next phase
export function main(): void {
  logger.info({ message: 'Arbiter starting' });
}

// Only run if this is the main module
const mainModule = process.argv[1];
if (mainModule !== undefined && import.meta.url === `file://${mainModule}`) {
  main();
}
