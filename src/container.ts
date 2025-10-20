/**
 * Global Dependency Injection Container
 *
 * Configures and exports the application's global DI container.
 * Register all singleton services here that should live for the entire
 * application lifetime.
 *
 * IMPORTANT: Import 'reflect-metadata' at the top of your application entry point
 * before importing this file.
 *
 * @example Application entry point (index.ts)
 * ```typescript
 * import 'reflect-metadata'
 * import { globalContainer } from './container'
 * ```
 */

import 'reflect-metadata';

import type { BaseServiceContainer } from './_shared/_base';

import {
  ConsoleLogger,
  InversifyServiceContainer,
  LogLevel,
  MemoryCache,
  SimpleMetrics,
  StandardErrorHandler,
} from './_shared/_infrastructure';
import { SERVICE_TYPES } from './_shared/serviceTypes';

/**
 * Global Application Container
 *
 * Singleton services registered here are shared across the entire application.
 * Use createScope() on this container for request-scoped services (e.g., Discord messages).
 */
export const globalContainer = new InversifyServiceContainer();

// Logger - Singleton (shared across application)
globalContainer.singleton({
  factory: () =>
    new ConsoleLogger({
      level: LogLevel.INFO,
      useColors: true,
    }),
  identifier: SERVICE_TYPES.LOGGER,
  name: 'ConsoleLogger',
});

// Error Handler - Singleton (shared across application)
globalContainer.singleton({
  factory: (container: BaseServiceContainer) =>
    new StandardErrorHandler({
      logger: container.resolve({
        identifier: SERVICE_TYPES.LOGGER,
      }),
    }),
  identifier: SERVICE_TYPES.ERROR_HANDLER,
  name: 'StandardErrorHandler',
});

// Cache - Singleton (shared across application)
globalContainer.singleton({
  factory: () =>
    new MemoryCache({
      defaultTTL: 3600000, // 1 hour in milliseconds
    }),
  identifier: SERVICE_TYPES.CACHE,
  name: 'MemoryCache',
});

// Metrics - Singleton (shared across application)
globalContainer.singleton({
  factory: () => new SimpleMetrics(),
  identifier: SERVICE_TYPES.METRICS,
  name: 'SimpleMetrics',
});

/**
 * Example: Creating Request Scopes
 *
 * For multi-context applications like Discord bots, create a new scope
 * per request (message, interaction, etc.):
 *
 * ```typescript
 * discordClient.on('messageCreate', async (message) => {
 *   const requestScope = globalContainer.createScope()
 *
 *   try {
 *     // Register request-scoped services
 *     requestScope.scoped({
 *       identifier: Symbol.for('ChatContext'),
 *       factory: () => new ChatContext({ message })
 *     })
 *
 *     // Resolve and use services
 *     const handler = requestScope.resolve({
 *       identifier: Symbol.for('MessageHandler')
 *     })
 *     await handler.process()
 *   } finally {
 *     requestScope.dispose() // CRITICAL: Prevent memory leaks
 *   }
 * })
 * ```
 */
