/**
 * JSONLogger Implementation
 *
 * Outputs structured JSON logs for easy parsing and filtering.
 * Each log is a single-line JSON object written to stderr.
 *
 * @example
 * ```typescript
 * const logger = new JSONLogger({ level: LogLevel.INFO });
 * logger.info({
 *   message: 'Server started',
 *   context: { port: 3100, host: 'localhost' }
 * });
 * // Output: {"timestamp":"2025-10-21T19:45:23.123Z","level":"INFO","service":"ARBITER","message":"Server started","context":{"port":3100,"host":"localhost"}}
 * ```
 */

import type {
  ChildLoggerParams,
  LogContext,
  LogParams,
  SetLevelParams,
} from '../../_base/BaseLogger/index.js';
import type { JSONLoggerParams } from './interfaces.js';
import type { JSONLogEntry } from './types.js';

import { BaseLogger, LogLevel } from '../../_base/BaseLogger/index.js';

export class JSONLoggerImplementation extends BaseLogger {
  private readonly context: LogContext;
  private level: LogLevel;

  constructor(params: JSONLoggerParams = {}) {
    super();
    this.level = params.level ?? LogLevel.INFO;
    this.context = params.context ?? {};
  }

  public child(params: ChildLoggerParams): BaseLogger {
    return new JSONLoggerImplementation({
      context: { ...this.context, ...params.context },
      level: this.level,
    });
  }

  public debug(params: LogParams): void {
    if (this.shouldLog({ level: LogLevel.DEBUG })) {
      this.writeLog({ level: LogLevel.DEBUG, params });
    }
  }

  public error(params: LogParams): void {
    if (this.shouldLog({ level: LogLevel.ERROR })) {
      this.writeLog({ level: LogLevel.ERROR, params });
    }
  }

  public fatal(params: LogParams): void {
    if (this.shouldLog({ level: LogLevel.FATAL })) {
      this.writeLog({ level: LogLevel.FATAL, params });
    }
  }

  public flush(): Promise<void> {
    // No buffering in JSON logger, nothing to flush
    return (async () => {})();
  }

  public getLevel(): LogLevel {
    return this.level;
  }

  public info(params: LogParams): void {
    if (this.shouldLog({ level: LogLevel.INFO })) {
      this.writeLog({ level: LogLevel.INFO, params });
    }
  }

  public setLevel(params: SetLevelParams): void {
    this.level = params.level;
  }

  public warn(params: LogParams): void {
    if (this.shouldLog({ level: LogLevel.WARN })) {
      this.writeLog({ level: LogLevel.WARN, params });
    }
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(params: { level: LogLevel }): boolean {
    const levels: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3,
      [LogLevel.FATAL]: 4,
    };

    return levels[params.level] >= levels[this.level];
  }

  /**
   * Write JSON log entry to stderr
   */
  private writeLog(params: { level: LogLevel; params: LogParams }): void {
    const entry: JSONLogEntry = {
      level: params.level,
      message: params.params.message,
      service: 'ARBITER',
      timestamp: new Date().toISOString(),
    };

    // Merge context if present
    const mergedContext = { ...this.context, ...params.params.context };
    if (Object.keys(mergedContext).length > 0) {
      entry.context = mergedContext;
    }

    // Write single-line JSON to stderr
    process.stderr.write(`${JSON.stringify(entry)}\n`);
  }
}
