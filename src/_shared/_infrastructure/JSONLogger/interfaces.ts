/**
 * JSONLogger Interfaces
 *
 * Interface definitions for JSONLogger configuration.
 */

import type { LogContext, LogLevel } from '../../_base/BaseLogger/index.js';

/**
 * Constructor parameters for JSONLogger
 */
export interface JSONLoggerParams {
  /**
   * Initial context to include in all logs
   */
  context?: LogContext;

  /**
   * Minimum log level to output
   */
  level?: LogLevel;
}
