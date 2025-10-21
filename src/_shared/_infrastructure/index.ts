/**
 * Infrastructure Exports
 *
 * Public API for infrastructure components.
 * Import base classes and implementations from here.
 *
 * @example
 * ```typescript
 * import { BaseLogger, ConsoleLogger, LogLevel } from '@shared/_infrastructure';
 *
 * const logger = new ConsoleLogger({ level: LogLevel.INFO });
 * logger.info({ message: 'Application started' });
 * ```
 *
 * @example Zod validation
 * ```typescript
 * import { z, ZodValidator } from '@shared/_infrastructure';
 *
 * const schema = z.object({ email: z.string().email(), age: z.number().min(18) });
 * const validator = new ZodValidator({ schema });
 * const result = validator.validate({ data: userData });
 * ```
 */

// Re-export all base classes from src/shared/base
export * from '../_base/index.js';

// Implementations
export { ConsoleLogger } from './ConsoleLogger/index.js';
export type { ConsoleLoggerParams } from './ConsoleLogger/index.js';
export { InversifyServiceContainer } from './InversifyServiceContainer/index.js';
export { JSONLogger } from './JSONLogger/index.js';
export type { JSONLogEntry, JSONLoggerParams } from './JSONLogger/index.js';
export { Logger } from './Logger/index.js';
export type { ErrorLogData, LoggerParams, LogMetadata, StandardLogData } from './Logger/index.js';
export { MemoryCache } from './MemoryCache/index.js';
export type { MemoryCacheParams } from './MemoryCache/index.js';
export { RuleValidator } from './RuleValidator/index.js';
export type { RuleValidatorParams, ValidationRule } from './RuleValidator/index.js';
export { SimpleMetrics } from './SimpleMetrics/index.js';
export { StandardErrorHandler } from './StandardErrorHandler/index.js';
export type { StandardErrorHandlerParams } from './StandardErrorHandler/index.js';

export { ZodValidator } from './ZodValidator/index.js';
export type { ZodSchema, ZodValidatorParams } from './ZodValidator/index.js';

// Re-export Zod for convenience
export { z } from 'zod';
