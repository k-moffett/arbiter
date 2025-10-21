/**
 * BaseLogger Interfaces
 *
 * Interface definitions for BaseLogger method parameters.
 */

import type { LogLevel } from './enums.js';
import type { LogContext } from './types.js';

/**
 * Parameters for child logger creation
 */
export interface ChildLoggerParams {
  context: LogContext;
}

/**
 * Parameters for logging methods
 */
export interface LogParams {
  context?: LogContext;
  message: string;
}

/**
 * Parameters for setLevel
 */
export interface SetLevelParams {
  level: LogLevel;
}
