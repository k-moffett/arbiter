/**
 * ServiceContainer Types
 *
 * Type definitions for dependency injection service container.
 */

import type { BaseServiceContainer } from './BaseServiceContainerImplementation.js';

/**
 * Service Identifier
 *
 * Unique identifier for a service registration.
 * Can be a Symbol (recommended for type safety) or string.
 *
 * @example
 * ```typescript
 * // Using Symbol (recommended)
 * const TYPES = {
 *   Logger: Symbol.for('Logger')
 * }
 *
 * // Using string
 * const identifier = 'logger'
 * ```
 */
export type ServiceIdentifier = symbol | string;

/**
 * Service Factory Function
 *
 * Factory function that creates service instances.
 * Receives the container for resolving dependencies.
 *
 * @template T - The service type
 * @param container - The DI container for resolving dependencies
 * @returns Instance of the service
 */
export type ServiceFactory<T> = (container: BaseServiceContainer) => T;

/**
 * Service Name
 *
 * Optional human-readable name for error messages and debugging.
 * When using Symbol identifiers, provide a name for better error messages.
 */
export type ServiceName = string;
