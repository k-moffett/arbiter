/**
 * CLI Service Type Definitions
 *
 * Types for command-line interface service.
 */

/**
 * CLI configuration
 */
export interface CLIConfig {
  /** Enable debug mode */
  debug?: boolean;
  /** Session ID for this CLI session */
  sessionId: string;
}

/**
 * CLI command
 */
export enum CLICommand {
  CLEAR = '/clear',
  DEBUG = '/debug',
  EXIT = '/exit',
  HELP = '/help',
  HISTORY = '/history',
}

/**
 * CLI command handler result
 */
export interface CLICommandResult {
  /** Whether to continue running */
  continue: boolean;
  /** Output message */
  message?: string;
}
