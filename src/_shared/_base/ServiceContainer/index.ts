/**
 * ServiceContainer Barrel Export
 *
 * Public API for the dependency injection service container base class.
 *
 * @example
 * ```typescript
 * import { BaseServiceContainer, ServiceLifetime } from '@shared/_base';
 * import type { RegisterParams, SingletonParams, ServiceIdentifier } from '@shared/_base';
 * ```
 */

// Base class
export { BaseServiceContainer } from './BaseServiceContainerImplementation.js';

// Enums
export { ServiceLifetime } from './enums.js';

// Interfaces
export type {
  ClearParams,
  HasParams,
  RegisterParams,
  ResolveParams,
  ScopedParams,
  SingletonParams,
  TransientParams,
} from './interfaces.js';

// Types
export type {
  ServiceFactory,
  ServiceIdentifier,
  ServiceName,
} from './types.js';
