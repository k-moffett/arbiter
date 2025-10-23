/**
 * Formatter Utilities
 *
 * Pure utility functions for formatting CLI output including
 * text wrapping, table formatting, and terminal detection.
 *
 * Single Responsibility: Format and style CLI output
 */

import type {
  AddBulletParams,
  DividerParams,
  FormatHistoryTableParams,
  TerminalCapabilities,
} from './interfaces';

import Table from 'cli-table3';
import pc from 'picocolors';
import wrapAnsi from 'wrap-ansi';

/**
 * Detect terminal capabilities
 */
export function detectTerminal(): TerminalCapabilities {
  const forceColor = process.env['CLI_FORCE_COLOR'] === 'true';
  const asciiOnly = process.env['CLI_ASCII_ONLY'] === 'true';
  const widthOverride = process.env['CLI_TERMINAL_WIDTH'];

  const isTTY = process.stdout.isTTY;
  const supportsColor = pc.isColorSupported || forceColor;

  const terminalWidth =
    widthOverride !== undefined
      ? Number(widthOverride)
      : (process.stdout.columns ?? 100); // eslint-disable-line @typescript-eslint/no-unnecessary-condition -- process.stdout.columns can be undefined in Docker/WSL

  return { asciiOnly, forceColor, isTTY, supportsColor, terminalWidth };
}

/**
 * Wrap text to terminal width
 */
export function wrapText(params: { text: string; width?: number }): string {
  const terminal = detectTerminal();
  const wrapWidth = params.width ?? terminal.terminalWidth - 4;
  return wrapAnsi(params.text, wrapWidth);
}

/**
 * Add bullet point and indentation to text
 */
export function addBullet(params: AddBulletParams): string {
  const bullet = '● '; // Filled circle bullet
  const indent = '  '; // Indent for continuation lines
  const terminal = detectTerminal();
  const wrapWidth = (params.terminalWidth ?? terminal.terminalWidth) - bullet.length - 4;
  const wrappedContent = wrapAnsi(params.content, wrapWidth);

  // Add bullet to first line, indent continuation lines
  const lines = wrappedContent.split('\n');
  const indentedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined) {
      indentedLines.push(i === 0 ? bullet + line : indent + line);
    }
  }

  return indentedLines.join('\n');
}

/**
 * Format conversation history as table
 */
export function formatHistoryTable(params: FormatHistoryTableParams): string {
  if (params.history.length === 0) {
    return pc.yellow('\nNo conversation history yet.\n');
  }

  const terminal = detectTerminal();
  const width = params.terminalWidth ?? terminal.terminalWidth;

  // Calculate dynamic column widths
  const timeColWidth = 12;
  const roleColWidth = 8;
  const messageColWidth = Math.max(40, width - timeColWidth - roleColWidth - 10); // -10 for borders/padding

  // Create table with modern styling
  const table = new Table({
    chars: {
      bottom: '─',
      'bottom-left': '└',
      'bottom-mid': '┴',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      middle: '│',
      right: '│',
      'right-mid': '┤',
      top: '─',
      'top-left': '┌',
      'top-mid': '┬',
      'top-right': '┐',
    },
    colWidths: [timeColWidth, roleColWidth, messageColWidth],
    head: [pc.cyan('Time'), pc.cyan('Role'), pc.cyan('Message')],
    style: {
      border: [],
      head: [],
    },
    wordWrap: true,
  });

  // Add rows with colored output
  for (const msg of params.history) {
    const role = msg.role === 'user' ? pc.green('You') : pc.white('Agent');
    const timestamp = pc.dim(new Date(msg.timestamp).toLocaleTimeString());
    const content = wrapAnsi(msg.content, messageColWidth - 2);

    table.push([timestamp, role, content]);
  }

  return '\n' + pc.bold('Conversation History:') + '\n' + table.toString() + '\n';
}

/**
 * Format error message
 */
export function formatError(params: { error: Error | string }): string {
  const message = params.error instanceof Error ? params.error.message : params.error;
  return pc.red('✗ Error: ' + message);
}

/**
 * Format success message
 */
export function formatSuccess(params: { message: string }): string {
  return pc.green('✓ ' + params.message);
}

/**
 * Format warning message
 */
export function formatWarning(params: { message: string }): string {
  return pc.yellow('⚠ ' + params.message);
}

/**
 * Format info message
 */
export function formatInfo(params: { message: string }): string {
  return pc.cyan('ℹ ' + params.message);
}

/**
 * Truncate text to max length with ellipsis
 */
export function truncate(params: { maxLength: number; text: string }): string {
  if (params.text.length <= params.maxLength) {
    return params.text;
  }

  return params.text.slice(0, params.maxLength - 3) + '...';
}

/**
 * Center text in terminal
 */
export function centerText(params: { text: string; width?: number }): string {
  const terminal = detectTerminal();
  const terminalWidth = params.width ?? terminal.terminalWidth;
  const padding = Math.max(0, Math.floor((terminalWidth - params.text.length) / 2));

  return ' '.repeat(padding) + params.text;
}

/**
 * Create horizontal divider
 */
export function divider(params?: DividerParams): string {
  const terminal = detectTerminal();
  const char = params?.char ?? '─';
  const width = params?.width ?? terminal.terminalWidth - 4;

  return pc.dim(char.repeat(width));
}
