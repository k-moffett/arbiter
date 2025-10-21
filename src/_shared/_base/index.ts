/**
 * Base Classes Barrel Export
 *
 * Public API for all base classes and their types.
 * Import base classes and interfaces from here.
 *
 * @example
 * ```typescript
 * import { BaseLogger, BaseCache, DomainError } from '@shared/_base';
 * import type { LogParams, SetCacheParams } from '@shared/_base';
 * ```
 */

// BaseCache
export { BaseCache } from './BaseCache/index.js';
export type {
  CacheEntry,
  CacheOptions,
  DeleteCacheParams,
  GetCacheParams,
  HasCacheParams,
  SetCacheParams,
} from './BaseCache/index.js';

// BaseErrorHandler + DomainError
export { BaseErrorHandler, DomainError } from './BaseErrorHandler/index.js';
export type {
  CreateErrorParams,
  CreateValidationErrorParams,
  DomainErrorParams,
  HandleErrorParams,
  IsOperationalParams,
} from './BaseErrorHandler/index.js';

// BaseLogger
export { BaseLogger, LogLevel } from './BaseLogger/index.js';
export type {
  ChildLoggerParams,
  LogContext,
  LogParams,
  SetLevelParams,
} from './BaseLogger/index.js';

// BaseMetrics
export { BaseMetrics } from './BaseMetrics/index.js';
export type {
  EndTimerParams,
  GetMetricParams,
  IncrementParams,
  RecordHistogramParams,
  ResetParams,
  SetGaugeParams,
  StartTimerParams,
  TimerFunction,
} from './BaseMetrics/index.js';

// BaseValidator
export { BaseValidator } from './BaseValidator/index.js';
export type {
  ValidateFieldParams,
  ValidateParams,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from './BaseValidator/index.js';

// BaseServiceContainer
export { BaseServiceContainer, ServiceLifetime } from './ServiceContainer/index.js';
export type {
  ClearParams,
  HasParams,
  RegisterParams,
  ResolveParams,
  ScopedParams,
  ServiceFactory,
  ServiceIdentifier,
  ServiceName,
  SingletonParams,
  TransientParams,
} from './ServiceContainer/index.js';
