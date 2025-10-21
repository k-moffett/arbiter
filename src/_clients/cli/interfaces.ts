/**
 * CLI Service Interfaces
 *
 * Interface definitions for CLI service.
 */

/**
 * CLI service interface
 */
export interface CLIService {
  /**
   * Start CLI interactive session
   */
  start(): Promise<void>;

  /**
   * Stop CLI session
   */
  stop(): void;
}
