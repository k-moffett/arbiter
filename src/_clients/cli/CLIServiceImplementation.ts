/**
 * CLI Service Implementation
 *
 * Interactive command-line interface for chatting with the agent.
 * Provides commands for session management and history viewing.
 */

import type { ChatMessage, ChatService } from '../ChatService';
import type { CLIService } from './interfaces';
import type { CLICommandResult, CLIConfig, GradientTheme } from './types';
import type { Spinner } from 'nanospinner';
import type { Interface as ReadlineInterface } from 'node:readline';

import * as readline from 'node:readline';

import boxen from 'boxen';
import Table from 'cli-table3';
import { createSpinner } from 'nanospinner';
import pc from 'picocolors';
import wrapAnsi from 'wrap-ansi';

import { Logger } from '../../_shared/_infrastructure';

/**
 * CLI Service Implementation
 *
 * @example
 * ```typescript
 * const cli = new CLIServiceImplementation({
 *   chatService,
 *   sessionId: 'cli-session-1'
 * });
 *
 * await cli.start();
 * ```
 */
export class CLIServiceImplementation implements CLIService {
  private readonly chatService: ChatService;
  private debugMode: boolean;
  private readonly gradientTheme: GradientTheme;
  private isRunning: boolean = false;
  private readonly logger: Logger;
  private messageCount: number = 0;
  private rl: ReadlineInterface | null = null;
  private readonly sessionId: string;
  private showStats: boolean;
  private spinner: Spinner | null = null;
  private totalResponseTime: number = 0;
  private readonly welcomeMessage: string;
  private readonly welcomeTitle: string;

  constructor(params: { chatService: ChatService } & CLIConfig) {
    this.chatService = params.chatService;
    this.sessionId = params.sessionId;
    this.debugMode = params.debug ?? false;
    this.welcomeTitle = params.welcomeTitle ?? 'Arbiter CLI';
    this.welcomeMessage = params.welcomeMessage ?? 'Context-Aware AI Agent';
    this.gradientTheme = params.gradientTheme ?? 'pastel';
    this.showStats = params.showStats ?? false;
    this.logger = new Logger({
      metadata: {
        className: 'CLIServiceImplementation',
        serviceName: 'CLI Service',
      },
    });
  }

  /**
   * Start CLI interactive session
   */
  // eslint-disable-next-line @typescript-eslint/require-await -- Interface requires Promise return type
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('CLI is already running');
    }

    this.isRunning = true;

    // Create readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
    });

    // Initialize session
    this.chatService.createSession({ sessionId: this.sessionId });

    // Display welcome message
    this.displayWelcome();

    // Start reading input
    this.rl.prompt();

    // Handle input
    // eslint-disable-next-line @typescript-eslint/no-misused-promises, local-rules/require-typed-params -- Event handler needs to be async, readline API uses primitive string parameter
    this.rl.on('line', async (input: string) => {
      await this.handleInput({ input });
    });

    // Handle close
    this.rl.on('close', () => {
      this.stop();
    });
  }

  /**
   * Stop CLI session
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.rl !== null) {
      this.rl.close();
      this.rl = null;
    }

    this.isRunning = false;
    // eslint-disable-next-line no-console -- CLI tool needs console output
    console.log('\nGoodbye! 👋\n');
    process.exit(0);
  }

  /**
   * Add bullet and indentation to response text
   */
  private addBulletToResponse(params: { content: string; terminalWidth: number }): string {
    const bullet = '● '; // Filled circle bullet for visual separation
    const indent = '  '; // Indent for continuation lines
    const wrapWidth = params.terminalWidth - bullet.length - 4;
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
   * Detect terminal capabilities
   */
  private detectTerminal(): {
    asciiOnly: boolean;
    forceColor: boolean;
    isTTY: boolean;
    supportsColor: boolean;
    terminalWidth: number;
  } {
    // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
    const forceColor = process.env['CLI_FORCE_COLOR'] === 'true';
    // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
    const asciiOnly = process.env['CLI_ASCII_ONLY'] === 'true';
    // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
    const widthOverride = process.env['CLI_TERMINAL_WIDTH'];

    const isTTY = process.stdout.isTTY;
    const supportsColor = pc.isColorSupported || forceColor;

    const terminalWidth = widthOverride !== undefined
      ? Number(widthOverride)
      : (process.stdout.columns ?? 100); // eslint-disable-line @typescript-eslint/no-unnecessary-condition -- process.stdout.columns can be undefined in Docker/WSL

    return { asciiOnly, forceColor, isTTY, supportsColor, terminalWidth };
  }

  /**
   * Display help message
   */
  private displayHelp(): void {
    const helpText = `
Available commands:
  /help     - Show this help message
  /history  - Show conversation history
  /clear    - Clear conversation history
  /stats    - Toggle session statistics display
  /debug    - Toggle debug mode
  /exit     - Exit the chat
`;
    // eslint-disable-next-line no-console -- CLI tool needs console output
    console.log(helpText);
  }

  /**
   * Display conversation history
   */
  private displayHistory(): void {
    const history = this.chatService.getHistory({ sessionId: this.sessionId });

    if (history.length === 0) {
      // eslint-disable-next-line no-console -- CLI tool needs console output
      console.log(pc.yellow('\nNo conversation history yet.\n'));
      return;
    }

    const terminal = this.detectTerminal();

    // Calculate dynamic column widths based on terminal size
    const timeColWidth = 12;
    const roleColWidth = 8;
    const messageColWidth = Math.max(40, terminal.terminalWidth - timeColWidth - roleColWidth - 10); // -10 for borders/padding

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
      head: [pc.cyan('Time'), pc.cyan('Role'), pc.cyan('Message')],
      style: {
        head: [],
        border: [],
      },
      wordWrap: true,
      colWidths: [timeColWidth, roleColWidth, messageColWidth],
    });

    // Add rows with colored output
    for (const msg of history) {
      const role = msg.role === 'user' ? pc.green('You') : pc.white('Agent');
      const timestamp = pc.dim(new Date(msg.timestamp).toLocaleTimeString());
      const content = wrapAnsi(msg.content, messageColWidth - 2);

      table.push([timestamp, role, content]);
    }

    // eslint-disable-next-line no-console -- CLI tool needs console output
    console.log('\n' + pc.bold('Conversation History:'));
    // eslint-disable-next-line no-console -- CLI tool needs console output
    console.log(table.toString() + '\n');
  }

  /**
   * Display welcome message
   */
  private displayWelcome(): void {
    const terminal = this.detectTerminal();

    if (this.debugMode) {
      this.logger.info({
        message: 'Terminal detection',
        context: terminal,
      });
    }

    const messageColor = this.gradientTheme === 'pastel' ? pc.cyan : pc.yellow;
    const accentColor = this.getAccentColor();

    // Simple, clean title without ASCII art to prevent cutoff
    const title = terminal.supportsColor
      ? pc.bold(pc.white(this.welcomeTitle))
      : this.welcomeTitle;

    const styledMessage = terminal.supportsColor
      ? messageColor(this.welcomeMessage)
      : this.welcomeMessage;
    const helpText = terminal.supportsColor ? pc.dim('Type /help for available commands') : 'Type /help for available commands';
    const exitText = terminal.supportsColor ? pc.dim('Type /exit to quit') : 'Type /exit to quit';

    const welcomeBox = boxen(
      `${title}\n\n${styledMessage}\n\n${helpText}\n${exitText}`,
      {
        borderColor: terminal.supportsColor ? accentColor : 'white',
        borderStyle: 'round',
        padding: 1,
      }
    );

    // eslint-disable-next-line no-console -- CLI tool needs console output
    console.log('\n' + welcomeBox + '\n');
  }

  /**
   * Format chat response
   */
  private formatResponse(params: { duration: number; message: ChatMessage }): string {
    const terminal = this.detectTerminal();

    // Format response with bullet and indentation
    const indentedContent = this.addBulletToResponse({
      content: params.message.content,
      terminalWidth: terminal.terminalWidth,
    });

    // Build output with colors - use bright white for agent response (no "Agent:" prefix)
    let output = '\n' + pc.white(indentedContent) + '\n';

    if (this.debugMode) {
      output += '\n' + pc.dim(`[Debug] Duration: ${String(params.duration)}ms`);
      output += '\n' + pc.dim(`[Debug] Message ID: ${params.message.id}`) + '\n';
    }

    // Show stats if enabled
    if (this.showStats) {
      this.messageCount++;
      this.totalResponseTime += params.duration;
      const avgTime = Math.round(this.totalResponseTime / this.messageCount);

      output +=
        '\n' +
        pc.dim(
          `📊 Messages: ${String(this.messageCount)} | Avg response: ${String(avgTime)}ms`
        ) +
        '\n';
    }

    return output;
  }

  /**
   * Get theme-specific accent color
   */
  private getAccentColor(): string {

    const accentColors: Record<GradientTheme, string> = {
      'gold-black': 'yellow',
      gold: 'yellow',
      pastel: 'cyan',
    };

    return accentColors[this.gradientTheme];
  }

  /**
   * Handle command
   */
  private handleCommand(params: { input: string }): CLICommandResult {
    const command = params.input.toLowerCase().trim();

    const commandHandlers = new Map<string, () => CLICommandResult>([
      [
        '/clear',
        () => {
          this.chatService.clearHistory({ sessionId: this.sessionId });
          // eslint-disable-next-line no-console -- CLI tool needs console output
          console.log('Conversation history cleared.');
          return { continue: true };
        },
      ],
      [
        '/debug',
        () => {
          this.debugMode = !this.debugMode;
          const status = this.debugMode ? 'enabled' : 'disabled';
          // eslint-disable-next-line no-console -- CLI tool needs console output
          console.log(`Debug mode ${status}.`);
          return { continue: true };
        },
      ],
      ['/exit', () => ({ continue: false })],
      [
        '/help',
        () => {
          this.displayHelp();
          return { continue: true };
        },
      ],
      [
        '/history',
        () => {
          this.displayHistory();
          return { continue: true };
        },
      ],
      [
        '/stats',
        () => {
          this.showStats = !this.showStats;
          const status = this.showStats ? 'enabled' : 'disabled';
          // eslint-disable-next-line no-console -- CLI tool needs console output
          console.log(`Statistics ${status}.`);
          return { continue: true };
        },
      ],
    ]);

    const handler = commandHandlers.get(command);

    if (handler === undefined) {
      // eslint-disable-next-line no-console -- CLI tool needs console output
      console.log('Unknown command. Type /help for available commands.');
      return { continue: true };
    }

    return handler();
  }

  /**
   * Handle user input
   */
  // eslint-disable-next-line complexity, max-statements -- CLI input handling requires branching and state management
  private async handleInput(params: { input: string }): Promise<void> {
    const trimmedInput = params.input.trim();

    // Skip empty input
    if (trimmedInput === '') {
      if (this.rl !== null) {
        this.rl.prompt();
      }
      return;
    }

    // Handle commands
    if (trimmedInput.startsWith('/')) {
      const result = this.handleCommand({ input: trimmedInput });

      if (!result.continue) {
        this.stop();
        return;
      }

      if (this.rl !== null) {
        this.rl.prompt();
      }
      return;
    }

    // Handle regular message
    try {
      // Show spinner while processing
      this.spinner = createSpinner('Thinking...', { color: 'cyan' }).start();

      const result = await this.chatService.sendMessage({
        message: trimmedInput,
        sessionId: this.sessionId,
      });

      // Stop spinner without success message
      this.spinner.stop();
      this.spinner = null;

      // Output agent response to user
      // eslint-disable-next-line no-console -- CLI tool needs console output
      console.log(
        this.formatResponse({
          duration: result.duration,
          message: result.botMessage,
        })
      );
    } catch (error) {
      // Stop spinner on error
      if (this.spinner !== null) {
        this.spinner.error({ text: pc.red('Error processing message') });
        this.spinner = null;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
       
      console.error(pc.red(`\nError: ${errorMessage}\n`));

      // Still log to logger for debugging
      this.logger.error({
        error: error instanceof Error ? error : new Error(errorMessage),
        message: 'Error processing message',
      });
    }

    if (this.rl !== null) {
      this.rl.prompt();
    }
  }
}
