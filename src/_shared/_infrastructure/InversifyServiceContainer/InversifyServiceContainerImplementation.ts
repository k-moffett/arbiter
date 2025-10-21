/**
 * InversifyServiceContainer
 *
 * InversifyJS-based dependency injection container implementation.
 *
 * Wraps InversifyJS Container while maintaining typed object parameter pattern.
 * Provides request scoping, singleton/transient/scoped lifetimes, and proper
 * disposal for multi-context applications like Discord bots.
 *
 * Features:
 * - Wraps InversifyJS for production-grade DI
 * - Maintains project's typed object parameter pattern
 * - Request scoping via child containers
 * - Singleton, transient, and scoped lifetimes
 * - Type-safe Symbol-based service identification
 * - Proper disposal and cleanup
 *
 * @example Global container setup
 * ```typescript
 * import 'reflect-metadata'
 * import { InversifyServiceContainer } from '@shared/_infrastructure'
 * import { SERVICE_TYPES } from '@shared/serviceTypes'
 *
 * const globalContainer = new InversifyServiceContainer()
 *
 * globalContainer.singleton({
 *   identifier: SERVICE_TYPES.Logger,
 *   factory: () => new ConsoleLogger({ level: LogLevel.INFO })
 * })
 * ```
 *
 * @example Discord request scoping
 * ```typescript
 * discordClient.on('messageCreate', async (message) => {
 *   const requestScope = globalContainer.createScope()
 *
 *   try {
 *     requestScope.scoped({
 *       identifier: SERVICE_TYPES.ChatContext,
 *       factory: () => new ChatContext({ message })
 *     })
 *
 *     const handler = requestScope.resolve<MessageHandler>({
 *       identifier: SERVICE_TYPES.MessageHandler
 *     })
 *     await handler.process()
 *   } finally {
 *     requestScope.dispose() // Critical cleanup!
 *   }
 * })
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
} from '../../_base/ServiceContainer';

import { Container } from 'inversify';

import {
  BaseServiceContainer,
  ServiceLifetime,
} from '../../_base/ServiceContainer';

 
export class InversifyServiceContainer extends BaseServiceContainer {
  private readonly container: Container;
  private readonly registeredIdentifiers: Set<symbol | string>;

  /**
   * Create a new InversifyServiceContainer
   *
   * @param parentContainer - Optional parent container for creating scopes
   */
  constructor(parentContainer?: Container) {
    super();
    this.container = parentContainer !== undefined
      ? new Container({ parent: parentContainer })
      : new Container();
    this.registeredIdentifiers = new Set();
  }

  public clear(params: ClearParams): void {
    if (params.identifier !== undefined) {
      // Clear specific service
      if (this.container.isBound(params.identifier)) {
        this.container.unbindSync(params.identifier);
        this.registeredIdentifiers.delete(params.identifier);
      }
    } else {
      // Clear all services - InversifyJS v7 has no unbindAllSync,
      // so we iterate through our tracked identifiers
      for (const identifier of this.registeredIdentifiers) {
        if (this.container.isBound(identifier)) {
          this.container.unbindSync(identifier);
        }
      }
      this.registeredIdentifiers.clear();
    }
  }

  public createScope(): BaseServiceContainer {
    return new InversifyServiceContainer(this.container);
  }

  public dispose(): void {
    // Unbind all services in this container (child containers only affect themselves)
    // InversifyJS v7 has no unbindAllSync, so we iterate through our tracked identifiers
    for (const identifier of this.registeredIdentifiers) {
      if (this.container.isBound(identifier)) {
        this.container.unbindSync(identifier);
      }
    }
    this.registeredIdentifiers.clear();
  }

  public has(params: HasParams): boolean {
    return this.container.isBound(params.identifier);
  }

  public register<T>(params: RegisterParams<T>): void {
    const binding = this.container
      .bind<T>(params.identifier)
      .toDynamicValue(() => params.factory(this));

    // Track registered identifier for cleanup
    this.registeredIdentifiers.add(params.identifier);

    // Apply lifetime scope
    if (params.lifetime === ServiceLifetime.SINGLETON) {
      binding.inSingletonScope();
    } else if (params.lifetime === ServiceLifetime.SCOPED) {
      // For scoped services, use singleton scope at the container level.
      // The "scope" is defined by which container the service is registered in.
      // This works for our Discord use case where each child container represents
      // a request scope (chat message).
      binding.inSingletonScope();
    }
    // TRANSIENT is default (no scope needed)
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- T required for type-safe resolution
  public resolve<T>(params: ResolveParams): T {
    try {
      return this.container.get<T>(params.identifier);
    } catch (error) {
      // Enhance error message with available services
      if (error instanceof Error) {
        const availableServices = this.getRegisteredServiceNames();
        throw new Error(
          `Service '${String(params.identifier)}' is not registered. ` +
            `Available services: ${availableServices}. ` +
            `Original error: ${error.message}`
        );
      }
      throw error;
    }
  }

  public scoped<T>(params: ScopedParams<T>): void {
    this.register({
      factory: params.factory,
      identifier: params.identifier,
      lifetime: ServiceLifetime.SCOPED,
      ...(params.name !== undefined && { name: params.name }),
    });
  }

  public singleton<T>(params: SingletonParams<T>): void {
    this.register({
      factory: params.factory,
      identifier: params.identifier,
      lifetime: ServiceLifetime.SINGLETON,
      ...(params.name !== undefined && { name: params.name }),
    });
  }

  public transient<T>(params: TransientParams<T>): void {
    this.register({
      factory: params.factory,
      identifier: params.identifier,
      lifetime: ServiceLifetime.TRANSIENT,
      ...(params.name !== undefined && { name: params.name }),
    });
  }

  /**
   * Get list of registered service names for error messages
   */
  private getRegisteredServiceNames(): string {
    // InversifyJS doesn't expose a list of bound service IDs easily
    // For now, return a helpful message
    return '(use container.has() to check registration)';
  }
}
