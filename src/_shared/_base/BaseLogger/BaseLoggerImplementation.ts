/**
 * BaseLogger
 *
 * Abstract base class for logging infrastructure.
 * All loggers in the project must extend this class.
 *
 * Features:
 * - Structured logging with context
 * - Multiple log levels (debug, info, warn, error, fatal)
 * - Child loggers with inherited context
 * - Async flush support
 *
 * @example
 * ```typescript
 * const logger = new ConsoleLogger({ level: LogLevel.INFO });
 * logger.info({ message: 'User logged in', context: { userId: '123' } });
 *
 * const childLogger = logger.child({ context: { component: 'AuthService' } });
 * childLogger.debug({ message: 'Validating credentials' });
 * ```
 */

import type { LogLevel } from './enums';
import type { ChildLoggerParams, LogParams, SetLevelParams } from './interfaces';

export abstract class BaseLogger {
  /**
   * Create a child logger with additional context
   * The child inherits all context from the parent and adds its own
   *
   * @param params - Parameters for child logger
   * @param params.context - Additional context to add to all child logger messages
   * @returns A new logger instance with inherited context
   *
   * @example
   * ```typescript
   * const parentLogger = new ConsoleLogger({ level: LogLevel.INFO });
   * const childLogger = parentLogger.child({ context: { component: 'UserService' } });
   * childLogger.info({ message: 'Action performed' }); // Includes component: 'UserService'
   * ```
   */
  public abstract child(params: ChildLoggerParams): BaseLogger;

  /**
   * Log a debug message
   * Use for detailed diagnostic information useful during development
   *
   * @param params - Log parameters
   * @param params.message - The log message
   * @param params.context - Additional structured data
   */
  public abstract debug(params: LogParams): void;

  /**
   * Log an error message
   * Use for error events that might still allow the application to continue
   *
   * @param params - Log parameters
   * @param params.message - The log message
   * @param params.context - Additional structured data (should include error stack)
   */
  public abstract error(params: LogParams): void;

  /**
   * Log a fatal message
   * Use for severe error events that will presumably lead the application to abort
   *
   * @param params - Log parameters
   * @param params.message - The log message
   * @param params.context - Additional structured data
   */
  public abstract fatal(params: LogParams): void;

  /**
   * Flush any buffered log messages
   * Important for async loggers that may buffer messages
   *
   * @returns Promise that resolves when all messages are flushed
   */
  public abstract flush(): Promise<void>;

  /**
   * Get the current log level
   * @returns The active log level
   */
  public abstract getLevel(): LogLevel;

  /**
   * Log an info message
   * Use for general informational messages about application state
   *
   * @param params - Log parameters
   * @param params.message - The log message
   * @param params.context - Additional structured data
   */
  public abstract info(params: LogParams): void;

  /**
   * Set the log level
   * Messages below this level will not be logged
   *
   * @param params - Parameters for setting log level
   * @param params.level - The new log level
   */
  public abstract setLevel(params: SetLevelParams): void;

  /**
   * Log a warning message
   * Use for potentially harmful situations that don't stop execution
   *
   * @param params - Log parameters
   * @param params.message - The log message
   * @param params.context - Additional structured data
   */
  public abstract warn(params: LogParams): void;
}
