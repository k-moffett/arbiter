/**
 * CLI Service Implementation
 *
 * Interactive command-line interface for chatting with the agent.
 * Provides commands for session management and history viewing.
 */

import type { ChatMessage, ChatService } from '../ChatService';
import type { CLIService } from './interfaces';
import type { CLICommandResult, CLIConfig } from './types';
import type { Interface as ReadlineInterface } from 'node:readline';

import * as readline from 'node:readline';

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
  private isRunning: boolean = false;
  private readonly logger: Logger;
  private rl: ReadlineInterface | null = null;
  private readonly sessionId: string;

  constructor(params: { chatService: ChatService } & CLIConfig) {
    this.chatService = params.chatService;
    this.sessionId = params.sessionId;
    this.debugMode = params.debug ?? false;
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
    console.log('\nGoodbye! 👋\n');
    process.exit(0);
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
  /debug    - Toggle debug mode
  /exit     - Exit the chat
`;
    console.log(helpText);
  }

  /**
   * Display conversation history
   */
  private displayHistory(): void {
    const history = this.chatService.getHistory({ sessionId: this.sessionId });

    if (history.length === 0) {
      console.log('No conversation history yet.');
      return;
    }

    const lines: string[] = ['Conversation History:', '─'.repeat(50)];

    for (const msg of history) {
      const role = msg.role === 'user' ? 'You' : 'Agent';
      const timestamp = new Date(msg.timestamp).toLocaleTimeString();
      lines.push(`[${timestamp}] ${role}: ${msg.content}`);
    }

    lines.push('─'.repeat(50), '');

    console.log(lines.join('\n'));
  }

  /**
   * Display welcome message
   */
  private displayWelcome(): void {
    const message = [
      '',
      '╔═══════════════════════════════════════════════════════╗',
      '║   Arbiter CLI - Context-Aware AI Agent               ║',
      '╚═══════════════════════════════════════════════════════╝',
      '',
      'Type /help for available commands',
      'Type /exit to quit',
      '',
    ].join('\n');

    console.log(message);
  }

  /**
   * Format chat response
   */
  private formatResponse(params: { duration: number; message: ChatMessage }): string {
    let output = `\nAgent: ${params.message.content}\n`;

    if (this.debugMode) {
      output += `\n[Debug] Duration: ${String(params.duration)}ms`;
      output += `\n[Debug] Message ID: ${params.message.id}\n`;
    }

    return output;
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
          console.log('Conversation history cleared.');
          return { continue: true };
        },
      ],
      [
        '/debug',
        () => {
          this.debugMode = !this.debugMode;
          const status = this.debugMode ? 'enabled' : 'disabled';
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
    ]);

    const handler = commandHandlers.get(command);

    if (handler === undefined) {
      console.log('Unknown command. Type /help for available commands.');
      return { continue: true };
    }

    return handler();
  }

  /**
   * Handle user input
   */
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
      const result = await this.chatService.sendMessage({
        message: trimmedInput,
        sessionId: this.sessionId,
      });

      // Output agent response to user
      console.log(
        this.formatResponse({
          duration: result.duration,
          message: result.botMessage,
        })
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\nError: ${errorMessage}\n`);

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
