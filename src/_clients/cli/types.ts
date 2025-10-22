/**
 * CLI Service Type Definitions
 *
 * Types for command-line interface service.
 */

/**
 * Available gradient themes for CLI banner
 */
export type GradientTheme = 'pastel' | 'gold-black' | 'gold';

/**
 * CLI configuration
 */
export interface CLIConfig {
  /** Enable debug mode */
  debug?: boolean;
  /** Gradient theme for welcome banner (default: "pastel") */
  gradientTheme?: GradientTheme;
  /** Session ID for this CLI session */
  sessionId: string;
  /** Show session statistics (default: false) */
  showStats?: boolean;
  /** Enable gradient colors for welcome banner (default: true) */
  useGradient?: boolean;
  /** User ID (device-based identifier) */
  userId: string;
  /** Welcome message (default: "Context-Aware AI Agent") */
  welcomeMessage?: string;
  /** Welcome title (default: "Arbiter CLI") */
  welcomeTitle?: string;
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
  STATS = '/stats',
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
