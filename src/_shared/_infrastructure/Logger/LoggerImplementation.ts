/**
 * Logger
 *
 * Main logger wrapper that provides structured logging with metadata.
 * Wraps BaseLogger implementations (ConsoleLogger by default).
 *
 * Features:
 * - Automatic metadata inclusion (className, serviceName, method)
 * - Log prefix for easy filtering (configurable via LOG_PREFIX, default: [ARBITER])
 * - Environment variable configuration (LOG_LEVEL, LOG_USE_COLORS, LOG_TO_CONSOLE, LOG_PREFIX)
 * - Proper error serialization (stack, message, name)
 * - DI-friendly for injecting logger instances per class
 *
 * @example
 * ```typescript
 * const logger = new Logger({
 *   metadata: {
 *     className: 'MCPServerImplementation',
 *     serviceName: 'MCP Server'
 *   }
 * });
 *
 * logger.info({ message: 'Server started', context: { port: 3100 } });
 * logger.error({ message: 'Failed to connect', error: new Error('Connection refused') });
 * ```
 */

import type {
  ChildLoggerParams,
  LogParams,
  SetLevelParams,
} from '../../_base/BaseLogger/index.js';
import type { LoggerParams } from './interfaces.js';
import type { ErrorLogData, LogMetadata, StandardLogData } from './types.js';

import { BaseLogger, LogLevel } from '../../_base/BaseLogger/index.js';
import { ConsoleLogger } from '../ConsoleLogger/index.js';
import { JSONLogger } from '../JSONLogger/index.js';

export class Logger extends BaseLogger {
  private readonly implementation: BaseLogger;
  private readonly metadata: LogMetadata;
  private readonly prefix: string;

  /**
   * Create a new Logger instance
   *
   * @param params - Configuration parameters
   * @param params.implementation - Optional logger implementation to wrap
   * @param params.metadata - Default metadata for all logs
   * @param params.overrideLevel - Optional log level override
   */
  constructor(params: LoggerParams = {}) {
    super();

    this.metadata = params.metadata ?? {};

    // Read log prefix from environment or use default
    // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
    this.prefix = process.env['LOG_PREFIX'] ?? '[ARBITER]';

    // Determine implementation based on environment
    if (params.implementation !== undefined) {
      this.implementation = params.implementation;
    } else {
      this.implementation = this.createDefaultImplementation({
        overrideLevel: params.overrideLevel,
      });
    }
  }

  public child(params: ChildLoggerParams): BaseLogger {
    // Merge parent metadata with child context as metadata
    const childMetadata: LogMetadata = {
      ...this.metadata,
      ...params.context,
    };

    return new Logger({
      implementation: this.implementation.child({ context: {} }),
      metadata: childMetadata,
    });
  }

  public debug(params: LogParams & StandardLogData): void {
    this.implementation.debug({
      context: this.mergeStandardContext({ logData: params }),
      message: this.addPrefix({ message: params.message }),
    });
  }

  public error(params: LogParams & Partial<ErrorLogData>): void {
    this.implementation.error({
      context: this.mergeErrorContext({ logData: params }),
      message: this.addPrefix({ message: params.message }),
    });
  }

  public fatal(params: LogParams & Partial<ErrorLogData>): void {
    this.implementation.fatal({
      context: this.mergeErrorContext({ logData: params }),
      message: this.addPrefix({ message: params.message }),
    });
  }

  public flush(): Promise<void> {
    return this.implementation.flush();
  }

  public getLevel(): LogLevel {
    return this.implementation.getLevel();
  }

  public info(params: LogParams & StandardLogData): void {
    this.implementation.info({
      context: this.mergeStandardContext({ logData: params }),
      message: this.addPrefix({ message: params.message }),
    });
  }

  public setLevel(params: SetLevelParams): void {
    this.implementation.setLevel(params);
  }

  public warn(params: LogParams & StandardLogData): void {
    this.implementation.warn({
      context: this.mergeStandardContext({ logData: params }),
      message: this.addPrefix({ message: params.message }),
    });
  }

  /**
   * Add prefix to log message
   */
  private addPrefix(params: { message: string }): string {
    return `${this.prefix} ${params.message}`;
  }

  /**
   * Create default logger implementation based on environment variables
   */
  private createDefaultImplementation(params: {
    overrideLevel?: LogLevel | undefined;
  }): BaseLogger {
    // Read environment variables
    // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
    const nodeEnv = process.env['NODE_ENV'] ?? 'development';
    // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
    const logToConsole = process.env['LOG_TO_CONSOLE'] === 'true';
    // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
    const logLevelEnv = process.env['LOG_LEVEL'];
    // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
    const useColorsEnv = process.env['LOG_USE_COLORS'];
    // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
    const logFormat = process.env['LOG_FORMAT'] ?? 'text';

    // Parse log level - handle both override and env var
    let levelString: string | undefined;
    if (params.overrideLevel !== undefined) {
      levelString = params.overrideLevel;
    } else if (logLevelEnv !== undefined) {
      levelString = logLevelEnv;
    }

    const level = this.parseLogLevel({
      levelString,
    });

    // Determine logger implementation based on LOG_FORMAT
    if (logFormat === 'json') {
      // Use JSON structured logging
      return new JSONLogger({ level });
    }

    // Default to console logger (text format)
    // Determine if we should use ConsoleLogger
    const shouldUseConsole =
      logToConsole || nodeEnv === 'development' || nodeEnv === 'local';

    // For now, we only have ConsoleLogger for text format
    // In the future, this could switch based on environment
    if (!shouldUseConsole) {
      // TODO: In production, might use Pino, Datadog, etc.
      // For now, fall back to ConsoleLogger
    }

    // Parse colors setting
    const useColors = useColorsEnv === 'false' ? false : true; // Default true

    return new ConsoleLogger({
      level,
      useColors,
    });
  }

  /**
   * Merge logger metadata with log-specific context for error logs
   */
  private mergeErrorContext(params: {
    logData: Partial<ErrorLogData>;
  }): Record<string, unknown> {
    const merged: Record<string, unknown> = {
      // Start with default metadata from logger instance
      ...this.metadata,
      // Add any metadata passed with this specific log
      ...(params.logData.metadata ?? {}),
      // Add any context passed with this specific log
      ...(params.logData.context ?? {}),
    };

    // Serialize the error if present
    if (params.logData.error !== undefined) {
      // eslint-disable-next-line local-rules/no-bracket-notation -- Dynamically building context object
      merged['error'] = this.serializeError({ error: params.logData.error });
    }

    return merged;
  }

  /**
   * Merge logger metadata with log-specific context for standard logs
   */
  private mergeStandardContext(params: {
    logData: StandardLogData;
  }): Record<string, unknown> {
    return {
      // Start with default metadata from logger instance
      ...this.metadata,
      // Add any metadata passed with this specific log
      ...(params.logData.metadata ?? {}),
      // Add any context passed with this specific log
      ...(params.logData.context ?? {}),
    };
  }

  /**
   * Parse log level from string
   */
  private parseLogLevel(params: {
    levelString?: string | undefined;
  }): LogLevel {
    if (params.levelString === undefined) {
      return LogLevel.INFO; // Default
    }

    const levelUpper = params.levelString.toUpperCase();

    const levelMap: Record<string, LogLevel> = {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Mapping uppercase env var values
      DEBUG: LogLevel.DEBUG,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Mapping uppercase env var values
      ERROR: LogLevel.ERROR,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Mapping uppercase env var values
      FATAL: LogLevel.FATAL,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Mapping uppercase env var values
      INFO: LogLevel.INFO,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Mapping uppercase env var values
      WARN: LogLevel.WARN,
    };

    return levelMap[levelUpper] ?? LogLevel.INFO;
  }

  /**
   * Serialize Error object to loggable format
   */
  private serializeError(params: { error: Error }): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      message: params.error.message,
      name: params.error.name,
      stack: params.error.stack,
    };

    // Include any additional enumerable properties from the error
    // eslint-disable-next-line @typescript-eslint/no-misused-spread -- Intentionally extracting custom error properties
    const customProps: Record<string, unknown> = { ...params.error };
    Object.keys(customProps).forEach((key) => {
      if (key === 'message') {
        return;
      }
      if (key === 'name') {
        return;
      }
      if (key === 'stack') {
        return;
      }

      serialized[key] = customProps[key];
    });

    return serialized;
  }
}
