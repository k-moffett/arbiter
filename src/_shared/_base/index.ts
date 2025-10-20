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
export { BaseCache } from './BaseCache';
export type {
  CacheEntry,
  CacheOptions,
  DeleteCacheParams,
  GetCacheParams,
  HasCacheParams,
  SetCacheParams,
} from './BaseCache';

// BaseErrorHandler + DomainError
export { BaseErrorHandler, DomainError } from './BaseErrorHandler';
export type {
  CreateErrorParams,
  CreateValidationErrorParams,
  DomainErrorParams,
  HandleErrorParams,
  IsOperationalParams,
} from './BaseErrorHandler';

// BaseLogger
export { BaseLogger, LogLevel } from './BaseLogger';
export type {
  ChildLoggerParams,
  LogContext,
  LogParams,
  SetLevelParams,
} from './BaseLogger';

// BaseMetrics
export { BaseMetrics } from './BaseMetrics';
export type {
  EndTimerParams,
  GetMetricParams,
  IncrementParams,
  RecordHistogramParams,
  ResetParams,
  SetGaugeParams,
  StartTimerParams,
  TimerFunction,
} from './BaseMetrics';

// BaseValidator
export { BaseValidator } from './BaseValidator';
export type {
  ValidateFieldParams,
  ValidateParams,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from './BaseValidator';

// BaseServiceContainer
export { BaseServiceContainer, ServiceLifetime } from './ServiceContainer';
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
} from './ServiceContainer';
