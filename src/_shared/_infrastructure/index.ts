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
export * from '../_base';

// Implementations
export { ConsoleLogger } from './ConsoleLogger';
export type { ConsoleLoggerParams } from './ConsoleLogger';
export { InversifyServiceContainer } from './InversifyServiceContainer';
export { MemoryCache } from './MemoryCache';
export type { MemoryCacheParams } from './MemoryCache';
export { RuleValidator } from './RuleValidator';
export type { RuleValidatorParams, ValidationRule } from './RuleValidator';
export { SimpleMetrics } from './SimpleMetrics';
export { StandardErrorHandler } from './StandardErrorHandler';
export type { StandardErrorHandlerParams } from './StandardErrorHandler';

export { ZodValidator } from './ZodValidator';
export type { ZodSchema, ZodValidatorParams } from './ZodValidator';

// Re-export Zod for convenience
export { z } from 'zod';
