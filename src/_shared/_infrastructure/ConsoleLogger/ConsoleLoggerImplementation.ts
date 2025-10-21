/* eslint-disable no-console -- Console output is the purpose of this logger */
/**
 * ConsoleLogger
 *
 * Simple console-based logger implementation.
 * Logs to stdout/stderr with optional colors and structured data.
 *
 * Features:
 * - Color-coded output by log level
 * - JSON stringification of context objects
 * - ISO 8601 timestamps
 * - Child logger support with context inheritance
 *
 * @example
 * ```typescript
 * const logger = new ConsoleLogger({ level: LogLevel.INFO });
 * logger.info({ message: 'Server started', context: { port: 3000 } });
 * logger.error({ message: 'Connection failed', context: { error: err.message } });
 * ```
 */

import type {
  ChildLoggerParams,
  LogParams,
  SetLevelParams,
} from '../../_base/BaseLogger';
import type { LogContext } from '../../_base/BaseLogger';
import type { ConsoleLoggerParams } from './interfaces';

import { BaseLogger, LogLevel } from '../../_base/BaseLogger';
import { ANSI_COLORS, ANSI_RESET, STDERR_LOG_LEVELS } from './consts';

 
export class ConsoleLogger extends BaseLogger {
  private readonly context: LogContext;
  private level: LogLevel;
  private readonly useColors: boolean;

  /**
   * Create a new ConsoleLogger
   *
   * @param params - Configuration parameters
   * @param params.level - Minimum log level to output (default: INFO)
   * @param params.context - Base context included in all messages (default: {})
   * @param params.useColors - Whether to use ANSI colors (default: true)
   */
  constructor(params: ConsoleLoggerParams = {}) {
    super();
    this.level = params.level ?? LogLevel.INFO;
    this.context = params.context ?? {};
    this.useColors = params.useColors ?? true;
  }

  public child(params: ChildLoggerParams): BaseLogger {
    return new ConsoleLogger({
      context: { ...this.context, ...params.context },
      level: this.level,
      useColors: this.useColors,
    });
  }

  public debug(params: LogParams): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log({
        level: LogLevel.DEBUG,
        message: params.message,
        ...(params.context !== undefined && { context: params.context }),
      });
    }
  }

  public error(params: LogParams): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log({
        level: LogLevel.ERROR,
        message: params.message,
        ...(params.context !== undefined && { context: params.context }),
      });
    }
  }

  public fatal(params: LogParams): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      this.log({
        level: LogLevel.FATAL,
        message: params.message,
        ...(params.context !== undefined && { context: params.context }),
      });
    }
  }

  public flush(): Promise<void> {
    // Console output is synchronous, nothing to flush
    // eslint-disable-next-line local-rules/no-promise-constructor -- Synchronous implementation of async interface
    return Promise.resolve();
  }

  public getLevel(): LogLevel {
    return this.level;
  }

  public info(params: LogParams): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log({
        level: LogLevel.INFO,
        message: params.message,
        ...(params.context !== undefined && { context: params.context }),
      });
    }
  }

  public setLevel(params: SetLevelParams): void {
    this.level = params.level;
  }

  public warn(params: LogParams): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log({
        level: LogLevel.WARN,
        message: params.message,
        ...(params.context !== undefined && { context: params.context }),
      });
    }
  }

  /**
   * Apply ANSI color codes to log level
   */
  private colorize(params: { level: LogLevel; text: string }): string {
    if (!this.useColors) {
      return params.text;
    }

    const color = ANSI_COLORS[params.level];
    return `${color}${params.text}${ANSI_RESET}`;
  }

  /**
   * Format and output log message
   */
  private log(params: { context?: LogContext; level: LogLevel; message: string }): void {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.context, ...params.context };
    const contextString =
      Object.keys(mergedContext).length > 0
        ? ` ${JSON.stringify(mergedContext)}`
        : '';

    const levelString = params.level.toUpperCase().padEnd(5);
    const coloredLevel = this.useColors
      ? this.colorize({ level: params.level, text: levelString })
      : levelString;

    const logMessage = `${timestamp} [${coloredLevel}] ${params.message}${contextString}`;

    // Use stderr for warnings, errors, and fatal
    if (STDERR_LOG_LEVELS.has(params.level)) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(messageLevel: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.ERROR,
      LogLevel.FATAL,
      LogLevel.INFO,
      LogLevel.WARN,
    ];

    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(messageLevel);

    return messageLevelIndex >= currentLevelIndex;
  }
}
