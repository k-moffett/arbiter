/**
 * Logger Types
 *
 * Type definitions for structured logging with metadata.
 */

import type { LogContext } from '../../_base/BaseLogger/index.js';

/**
 * Metadata included in all log messages
 * Provides context about the source of the log
 */
export interface LogMetadata {
  /**
   * Additional custom metadata fields
   */
  [key: string]: unknown;

  /**
   * Name of the class that generated the log
   * @example 'MCPServerImplementation'
   */
  className?: string;

  /**
   * Optional method name where the log originated
   * @example 'start'
   */
  method?: string;

  /**
   * Name of the service or module
   * @example 'MCP Server'
   */
  serviceName?: string;
}

/**
 * Data structure for error logs
 * Ensures consistent error logging with proper serialization
 */
export interface ErrorLogData {
  /**
   * Additional structured context data
   */
  context?: LogContext;

  /**
   * The error object to log
   * Will be serialized with stack trace, message, and name
   */
  error: Error;

  /**
   * Metadata about the source of the error
   */
  metadata?: LogMetadata;
}

/**
 * Data structure for standard (non-error) logs
 */
export interface StandardLogData {
  /**
   * Additional structured context data
   */
  context?: LogContext;

  /**
   * Metadata about the source of the log
   */
  metadata?: LogMetadata;
}
