/**
 * ServiceContainer Enums
 *
 * Enumerations for dependency injection service container.
 */

/**
 * Service Lifetime
 *
 * Determines how service instances are created and managed.
 *
 * - SINGLETON: Single instance shared across entire container lifetime
 * - TRANSIENT: New instance created for each resolution
 * - SCOPED: Single instance within a request scope (child container)
 */
export enum ServiceLifetime {
  SCOPED = 'scoped',
  SINGLETON = 'singleton',
  TRANSIENT = 'transient',
}
