/**
 * Logger Interfaces
 *
 * Interface definitions for Logger configuration.
 */

import type { BaseLogger, LogLevel } from '../../_base/BaseLogger';
import type { LogMetadata } from './types';

/**
 * Constructor parameters for Logger
 */
export interface LoggerParams {
  /**
   * Optional implementation to wrap
   * If not provided, will use environment-based default
   * (ConsoleLogger in development, or when LOG_TO_CONSOLE=true)
   */
  implementation?: BaseLogger;

  /**
   * Default metadata to include in all logs from this logger instance
   * Typically includes className and serviceName
   */
  metadata?: LogMetadata;

  /**
   * Optional override for log level
   * If not provided, reads from LOG_LEVEL environment variable
   */
  overrideLevel?: LogLevel;
}
