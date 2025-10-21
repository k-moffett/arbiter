/**
 * ConsoleLogger Interfaces
 *
 * Interface definitions for ConsoleLogger configuration.
 */

import type { LogContext, LogLevel } from '../../_base/BaseLogger/index.js';

/**
 * Constructor parameters for ConsoleLogger
 */
export interface ConsoleLoggerParams {
  context?: LogContext;
  level?: LogLevel;
  useColors?: boolean;
}
