/**
 * JSONLogger Types
 *
 * Type definitions for JSON structured logging output.
 */

import type { LogLevel } from '../../_base/BaseLogger/index.js';

/**
 * JSON log entry structure
 * Designed for easy parsing with jq, log aggregators, etc.
 */
export interface JSONLogEntry {
  /**
   * Additional structured context data
   */
  context?: Record<string, unknown>;

  /**
   * Log level (DEBUG, INFO, WARN, ERROR, FATAL)
   */
  level: LogLevel;

  /**
   * Log message
   */
  message: string;

  /**
   * Service identifier - always "ARBITER" for app logs
   */
  service: string;

  /**
   * ISO 8601 timestamp
   */
  timestamp: string;
}
