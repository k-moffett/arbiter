/**
 * ConsoleLogger Constants
 *
 * ANSI color codes and configuration constants for console output.
 */

import { LogLevel } from '../../_base/BaseLogger';

/**
 * ANSI color codes for log levels
 */
export const ANSI_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m', // Cyan
  [LogLevel.ERROR]: '\x1b[31m', // Red
  [LogLevel.FATAL]: '\x1b[35m', // Magenta
  [LogLevel.INFO]: '\x1b[32m', // Green
  [LogLevel.WARN]: '\x1b[33m', // Yellow
};

/**
 * ANSI reset code
 */
export const ANSI_RESET = '\x1b[0m';

/**
 * Log levels that should output to stderr instead of stdout
 */
export const STDERR_LOG_LEVELS = new Set([LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL]);
