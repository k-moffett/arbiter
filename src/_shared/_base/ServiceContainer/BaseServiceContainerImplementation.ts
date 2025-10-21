/**
 * BaseServiceContainer
 *
 * Abstract base class for dependency injection service containers.
 *
 * Provides type-safe service registration and resolution with support for
 * singleton, transient, and scoped lifetimes. Maintains typed object parameter
 * pattern while enabling request scoping for multi-context applications.
 *
 * Features:
 * - Type-safe service registration with Symbol or string identifiers
 * - Singleton, transient, and scoped lifetimes
 * - Request scoping via child containers
 * - Constructor injection support
 * - Factory-based service creation
 * - Proper disposal and cleanup
 *
 * @example Basic usage
 * ```typescript
 * const container = new InversifyServiceContainer();
 *
 * // Register singleton with Symbol
 * container.singleton({
 *   identifier: Symbol.for('Logger'),
 *   factory: () => new ConsoleLogger({ level: LogLevel.INFO })
 * });
 *
 * // Resolve service
 * const logger = container.resolve<BaseLogger>({
 *   identifier: Symbol.for('Logger')
 * });
 * ```
 *
 * @example Request scoping (Discord multi-chat)
 * ```typescript
 * // Global container
 * const globalContainer = new InversifyServiceContainer();
 * globalContainer.singleton({
 *   identifier: Symbol.for('Logger'),
 *   factory: () => new ConsoleLogger()
 * });
 *
 * // Per-message scope
 * discordClient.on('messageCreate', async (message) => {
 *   const requestScope = globalContainer.createScope();
 *
 *   requestScope.scoped({
 *     identifier: Symbol.for('ChatContext'),
 *     factory: () => new ChatContext({ message })
 *   });
 *
 *   try {
 *     const handler = requestScope.resolve({ identifier: Symbol.for('Handler') });
 *     await handler.process();
 *   } finally {
 *     requestScope.dispose(); // Cleanup!
 *   }
 * });
 * ```
 */

import type {
  ClearParams,
  HasParams,
  RegisterParams,
  ResolveParams,
  ScopedParams,
  SingletonParams,
  TransientParams,
} from './interfaces.js';

export abstract class BaseServiceContainer {
  /**
   * Clear all services or a specific service
   *
   * @param params - Clear parameters
   * @param params.identifier - Optional service identifier to clear. If not provided, clears all.
   *
   * @example Clear specific service
   * ```typescript
   * container.clear({ identifier: Symbol.for('Logger') });
   * ```
   *
   * @example Clear all services
   * ```typescript
   * container.clear({});
   * ```
   */
  public abstract clear(params: ClearParams): void;

  /**
   * Create a new request scope (child container)
   *
   * Request scopes inherit singleton services from parent but maintain
   * their own scoped service instances. Critical for multi-context apps
   * like Discord bots handling multiple concurrent chats.
   *
   * @returns New child container with access to parent singletons
   *
   * @example Discord message handling
   * ```typescript
   * discordClient.on('messageCreate', async (message) => {
   *   const requestScope = globalContainer.createScope();
   *   try {
   *     requestScope.scoped({
   *       identifier: Symbol.for('ChatContext'),
   *       factory: () => new ChatContext({ message })
   *     });
   *     await requestScope.resolve({ identifier: Symbol.for('Handler') }).process();
   *   } finally {
   *     requestScope.dispose();
   *   }
   * });
   * ```
   */
  public abstract createScope(): BaseServiceContainer;

  /**
   * Dispose and cleanup the container
   *
   * Releases all scoped service instances. Critical for preventing memory
   * leaks in request-scoped scenarios. Always call in finally block.
   *
   * @example Proper disposal
   * ```typescript
   * const scope = container.createScope();
   * try {
   *   // Use scope
   * } finally {
   *   scope.dispose(); // Always cleanup
   * }
   * ```
   */
  public abstract dispose(): void;

  /**
   * Check if a service is registered
   *
   * @param params - Check parameters
   * @param params.identifier - Unique service identifier
   * @returns True if the service is registered
   *
   * @example
   * ```typescript
   * if (container.has({ identifier: Symbol.for('Logger') })) {
   *   const logger = container.resolve({ identifier: Symbol.for('Logger') });
   * }
   * ```
   */
  public abstract has(params: HasParams): boolean;

  /**
   * Register a service with explicit lifetime
   *
   * @template T - The service type
   * @param params - Registration parameters
   * @param params.identifier - Unique service identifier
   * @param params.factory - Factory function that creates the service
   * @param params.lifetime - Service lifetime (SINGLETON, TRANSIENT, or SCOPED)
   * @param params.name - Optional name for debugging
   *
   * @example
   * ```typescript
   * container.register({
   *   identifier: Symbol.for('Logger'),
   *   factory: () => new ConsoleLogger(),
   *   lifetime: ServiceLifetime.SINGLETON
   * });
   * ```
   */
  public abstract register<T>(params: RegisterParams<T>): void;

  /**
   * Resolve a service from the container
   *
   * Type parameter is required for type-safe resolution, even though it's only used in return type.
   *
   * @template T - The service type
   * @param params - Resolution parameters
   * @param params.identifier - Unique service identifier
   * @returns The resolved service instance
   * @throws {Error} If service is not registered
   *
   * @example
   * ```typescript
   * const logger = container.resolve<BaseLogger>({
   *   identifier: Symbol.for('Logger')
   * });
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- T required for type-safe resolution
  public abstract resolve<T>(params: ResolveParams): T;

  /**
   * Register a scoped service
   *
   * Scoped services create one instance per request scope (child container).
   * Perfect for per-request state like chat context, conversation history, etc.
   *
   * @template T - The service type
   * @param params - Registration parameters
   * @param params.identifier - Unique service identifier
   * @param params.factory - Factory function that creates the service
   * @param params.name - Optional name for debugging
   *
   * @example
   * ```typescript
   * // In request scope
   * requestScope.scoped({
   *   identifier: Symbol.for('ChatContext'),
   *   factory: () => new ChatContext({ message })
   * });
   * ```
   */
  public abstract scoped<T>(params: ScopedParams<T>): void;

  /**
   * Register a singleton service
   *
   * Singleton services return the same instance for the entire container lifetime.
   * Use for stateless services like loggers, databases, caches.
   *
   * @template T - The service type
   * @param params - Registration parameters
   * @param params.identifier - Unique service identifier
   * @param params.factory - Factory function that creates the service
   * @param params.name - Optional name for debugging
   *
   * @example
   * ```typescript
   * container.singleton({
   *   identifier: Symbol.for('Logger'),
   *   factory: () => new ConsoleLogger({ level: LogLevel.INFO })
   * });
   * ```
   */
  public abstract singleton<T>(params: SingletonParams<T>): void;

  /**
   * Register a transient service
   *
   * Transient services create a new instance on every resolution.
   * Use for stateful services or when you need fresh instances.
   *
   * @template T - The service type
   * @param params - Registration parameters
   * @param params.identifier - Unique service identifier
   * @param params.factory - Factory function that creates the service
   * @param params.name - Optional name for debugging
   *
   * @example
   * ```typescript
   * container.transient({
   *   identifier: Symbol.for('UseCase'),
   *   factory: (c) => new UseCase({
   *     logger: c.resolve({ identifier: Symbol.for('Logger') })
   *   })
   * });
   * ```
   */
  public abstract transient<T>(params: TransientParams<T>): void;
}
