/**
 * Formatters Interfaces
 *
 * Type definitions for formatting utilities.
 */

import type { ChatMessage } from '../../../ChatService';

/**
 * Terminal capabilities
 */
export interface TerminalCapabilities {
  /** ASCII-only mode (no Unicode) */
  asciiOnly: boolean;
  /** Force color output */
  forceColor: boolean;
  /** Is a TTY terminal */
  isTTY: boolean;
  /** Supports ANSI colors */
  supportsColor: boolean;
  /** Terminal width in columns */
  terminalWidth: number;
}

/**
 * Add bullet parameters
 */
export interface AddBulletParams {
  /** Content to format */
  content: string;
  /** Optional terminal width override */
  terminalWidth?: number;
}

/**
 * Format history table parameters
 */
export interface FormatHistoryTableParams {
  /** Conversation history */
  history: ChatMessage[];
  /** Optional terminal width override */
  terminalWidth?: number;
}

/**
 * Divider parameters
 */
export interface DividerParams {
  /** Character to use (default: '─') */
  char?: string;
  /** Width override */
  width?: number;
}
