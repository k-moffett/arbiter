/**
 * ServiceContainer Interfaces
 *
 * Parameter interfaces for dependency injection container operations.
 */

import type { ServiceLifetime } from './enums.js';
import type { ServiceFactory, ServiceIdentifier, ServiceName } from './types.js';

/**
 * Register Service Parameters
 *
 * Parameters for registering a service with explicit lifetime.
 *
 * @template T - The service type
 */
export interface RegisterParams<T> {
  /** Factory function that creates the service instance */
  factory: ServiceFactory<T>;
  /** Unique service identifier (Symbol or string) */
  identifier: ServiceIdentifier;
  /** Service lifetime (SINGLETON, TRANSIENT, or SCOPED) */
  lifetime: ServiceLifetime;
  /** Optional human-readable name for debugging */
  name?: ServiceName;
}

/**
 * Resolve Service Parameters
 *
 * Parameters for resolving a service from the container.
 */
export interface ResolveParams {
  /** Unique service identifier (Symbol or string) */
  identifier: ServiceIdentifier;
}

/**
 * Singleton Service Parameters
 *
 * Parameters for registering a singleton service.
 * Singleton services return the same instance for the entire container lifetime.
 *
 * @template T - The service type
 */
export interface SingletonParams<T> {
  /** Factory function that creates the service instance */
  factory: ServiceFactory<T>;
  /** Unique service identifier (Symbol or string) */
  identifier: ServiceIdentifier;
  /** Optional human-readable name for debugging */
  name?: ServiceName;
}

/**
 * Transient Service Parameters
 *
 * Parameters for registering a transient service.
 * Transient services create a new instance on every resolution.
 *
 * @template T - The service type
 */
export interface TransientParams<T> {
  /** Factory function that creates the service instance */
  factory: ServiceFactory<T>;
  /** Unique service identifier (Symbol or string) */
  identifier: ServiceIdentifier;
  /** Optional human-readable name for debugging */
  name?: ServiceName;
}

/**
 * Scoped Service Parameters
 *
 * Parameters for registering a scoped service.
 * Scoped services create one instance per request scope (child container).
 *
 * @template T - The service type
 */
export interface ScopedParams<T> {
  /** Factory function that creates the service instance */
  factory: ServiceFactory<T>;
  /** Unique service identifier (Symbol or string) */
  identifier: ServiceIdentifier;
  /** Optional human-readable name for debugging */
  name?: ServiceName;
}

/**
 * Has Service Parameters
 *
 * Parameters for checking if a service is registered.
 */
export interface HasParams {
  /** Unique service identifier (Symbol or string) */
  identifier: ServiceIdentifier;
}

/**
 * Clear Parameters
 *
 * Parameters for clearing all or specific services.
 */
export interface ClearParams {
  /** Optional service identifier to clear. If not provided, clears all services. */
  identifier?: ServiceIdentifier;
}
