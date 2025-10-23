/**
 * CLI Service Implementation
 *
 * Interactive command-line interface for chatting with the agent.
 * Provides commands for session management and history viewing.
 *
 * Integrates Clack for beautiful prompts and animations,
 * Markdown rendering for rich content display.
 *
 * Single Responsibility: Manage CLI user interactions
 * Open/Closed: Extendable through configuration
 * Dependency Inversion: Depends on abstractions (ChatService, ClackTheme, MarkdownRenderer)
 */

import type { ChatMessage, ChatService } from '../ChatService';
import type { ClackTheme } from './_lib/ClackTheme';
import type { ConversationBuffer } from './_lib/ConversationBuffer';
import type { MarkdownRenderer } from './_lib/MarkdownRenderer';
import type { AnimationStyle, NonBlockingSpinner } from './_lib/NonBlockingSpinner';
import type { CLIService } from './interfaces';
import type { CLICommandResult, CLIConfig } from './types';
import type { Interface as ReadlineInterface } from 'node:readline';

import * as readline from 'node:readline';

import figlet from 'figlet';
import gradient from 'gradient-string';
import pc from 'picocolors';
import wrapAnsi from 'wrap-ansi';

import { Logger } from '../../_shared/_infrastructure';
import { ClackThemeImplementation } from './_lib/ClackTheme';
import { ConversationBufferImplementation } from './_lib/ConversationBuffer';
import { detectTerminal, formatHistoryTable } from './_lib/Formatters';
import { MarkdownRendererImplementation } from './_lib/MarkdownRenderer';
import { NonBlockingSpinnerImplementation } from './_lib/NonBlockingSpinner';

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
// eslint-disable-next-line local-rules/max-class-properties -- Need conversation buffer and resize state for dynamic text reflow
export class CLIServiceImplementation implements CLIService {
  private readonly chatService: ChatService;
  private readonly conversationBuffer: ConversationBuffer;
  private debugMode: boolean;
  private isRedrawing: boolean = false;
  private isRunning: boolean = false;
  private readonly logger: Logger;
  private readonly markdownRenderer: MarkdownRenderer;
  private messageCount: number = 0;
  private rl: ReadlineInterface | null = null;
  private readonly sessionId: string;
  private showStats: boolean;
  private readonly spinner: NonBlockingSpinner;
  private readonly theme: ClackTheme;
  private totalResponseTime: number = 0;
  private readonly userId: string;
  private readonly welcomeMessage: string;
  private readonly welcomeTitle: string;

  constructor(params: { chatService: ChatService } & CLIConfig) {
    this.chatService = params.chatService;
    this.sessionId = params.sessionId;
    this.userId = params.userId;
    this.debugMode = params.debug ?? false;
    this.welcomeTitle = params.welcomeTitle ?? 'Arbiter CLI';
    this.welcomeMessage = params.welcomeMessage ?? 'Context-Aware AI Agent';
    this.showStats = params.showStats ?? false;

    // Initialize terminal detection
    const terminal = detectTerminal();

    // Initialize theme with configuration
    this.theme = new ClackThemeImplementation({
      config: {
        gradientTheme: params.gradientTheme ?? 'pastel',
        useColors: terminal.supportsColor,
        useUnicode: !terminal.asciiOnly,
      },
    });

    // Initialize markdown renderer
    this.markdownRenderer = new MarkdownRendererImplementation({
      config: {
        enableSyntaxHighlighting: true,
        useColors: terminal.supportsColor,
        width: terminal.terminalWidth - 4,
      },
    });

    this.logger = new Logger({
      metadata: {
        className: 'CLIServiceImplementation',
        serviceName: 'CLI Service',
      },
    });

    // Initialize spinner with configuration from environment
    const animationStyle = (process.env['CLI_ANIMATION_STYLE'] ?? 'spinner') as AnimationStyle;
    this.spinner = new NonBlockingSpinnerImplementation({
      animationStyle,
      color: 'cyan',
      message: 'Thinking...',
    });

    // Initialize conversation buffer for resize reflowing
    this.conversationBuffer = new ConversationBufferImplementation({
      maxMessages: 1000,
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

    // Initialize session with userId in metadata
    this.chatService.createSession({
      metadata: { userId: this.userId },
      sessionId: this.sessionId,
    });

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

    // Handle terminal resize for text reflowing
    process.stdout.on('resize', () => {
      if (!this.isRedrawing) {
        this.handleResize();
      }
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
    this.theme.outro({ message: 'Goodbye! 👋' });
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
    const formatted = formatHistoryTable({ history });
    // eslint-disable-next-line no-console -- CLI tool needs console output
    console.log(formatted);
  }

  /**
   * Display welcome message
   */
  private displayWelcome(): void {
    const terminal = detectTerminal();

    // Generate ASCII art title
    const asciiTitle = this.generateAsciiTitle({
      terminalWidth: terminal.terminalWidth,
      title: this.welcomeTitle
    });

    // Display with gradient or plain
    if (terminal.supportsColor) {
      // eslint-disable-next-line no-console -- CLI tool needs console output
      console.log('\n' + asciiTitle + '\n');
    } else {
      // eslint-disable-next-line no-console -- CLI tool needs console output
      console.log('\n' + asciiTitle + '\n');
    }

    // Display message with Clack styling
    this.theme.info({ message: this.welcomeMessage });
    // eslint-disable-next-line no-console -- CLI tool needs console output
    console.log('');
    this.theme.step({ message: 'Type /help for available commands' });
    this.theme.step({ message: 'Type /exit to quit' });
    // eslint-disable-next-line no-console -- CLI tool needs console output
    console.log('');
  }

  /**
   * Format chat response
   */
  private formatResponse(params: { duration: number; message: ChatMessage }): string {
    const terminal = detectTerminal();

    // Check if response contains markdown and render accordingly
    const isMarkdown = this.markdownRenderer.isMarkdown({ text: params.message.content });

    let formattedContent: string;
    if (isMarkdown) {
      // Markdown renderer already handles wrapping via width parameter
      formattedContent = this.markdownRenderer.render({ markdown: params.message.content });
    } else {
      // For plain text, apply color and word wrapping
      const colored = this.theme.formatAgentResponse({ content: params.message.content });
      // Wrap at terminal width minus space for diamond marker and margins (◆ + space + margins)
      formattedContent = wrapAnsi(colored, terminal.terminalWidth - 6, { hard: true, trim: false });
    }

    // Buffer assistant message for resize reflowing
    this.conversationBuffer.addMessage({
      content: params.message.content,
      role: 'assistant',
    });

    // Add filled diamond marker for readability
    const diamond = pc.cyan('◆');
    let output = '\n' + diamond + ' ' + formattedContent + '\n';

    if (this.debugMode) {
      output += '\n' + this.theme.formatStats({ avgResponseTime: params.duration, messageCount: 1 });
      output += '\n[Debug] Message ID: ' + params.message.id + '\n';
    }

    // Show stats if enabled
    if (this.showStats) {
      this.messageCount++;
      this.totalResponseTime += params.duration;
      const avgTime = Math.round(this.totalResponseTime / this.messageCount);

      output += '\n' + this.theme.formatStats({ avgResponseTime: avgTime, messageCount: this.messageCount }) + '\n';
    }

    return output;
  }

  /**
   * Generate ASCII art title with gradient
   */
  private generateAsciiTitle(params: { terminalWidth: number; title: string }): string {
    // Read font preference from environment
    const fontPreference = process.env['CLI_BANNER_FONT'] ?? 'Small Slant';

    // If font disabled, return empty string
    if (fontPreference === 'none') {
      return '';
    }

    // For narrow terminals (< 60 chars), use simple banner
    if (params.terminalWidth < 60) {
      const simple = `═══ ${params.title.toUpperCase()} ═══`;
      const colors = this.getGradientColors();
      return gradient(colors)(simple);
    }

    // Use figlet for ASCII art
    try {
      const ascii = figlet.textSync(params.title, {
        font: fontPreference,
        horizontalLayout: 'fitted',
        width: params.terminalWidth - 4,
      });

      // Apply gradient
      const colors = this.getGradientColors();
      return gradient(colors)(ascii);
    } catch {
      // Fallback to simple banner
      const simple = `═══ ${params.title.toUpperCase()} ═══`;
      const colors = this.getGradientColors();
      return gradient(colors)(simple);
    }
  }

  /**
   * Get gradient colors based on theme or custom environment variables
   */
  private getGradientColors(): string[] {
    // Check for custom gradient colors from environment
    const customStart = process.env['CLI_BANNER_GRADIENT_START'];
    const customEnd = process.env['CLI_BANNER_GRADIENT_END'];

    // If both custom colors are set, use them
    if (customStart !== undefined && customEnd !== undefined) {
      return [customStart, customEnd];
    }

    // Otherwise use theme from environment or default
    const theme = process.env['CLI_BANNER_GRADIENT_THEME'] ?? 'pastel';

    const themeMap: Record<string, string[]> = {
      'cyan-purple': ['#06b6d4', '#a855f7'],
      'fire': ['#ff0000', '#ff9900'],
      'gold': ['#FFD700', '#FFA500'],
      'gold-black': ['#FFD700', '#000000'],
      'ocean': ['#0077be', '#00d4ff'],
      'pastel': ['#a8edea', '#fed6e3'],
    };

    // Return theme colors or default to pastel
    const pastelColors: [string, string] = ['#a8edea', '#fed6e3'];
    const pastelTheme = themeMap['pastel'] ?? pastelColors;
    return themeMap[theme] ?? pastelTheme;
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
          this.theme.success({ message: 'Conversation history cleared.' });
          return { continue: true };
        },
      ],
      [
        '/debug',
        () => {
          this.debugMode = !this.debugMode;
          const status = this.debugMode ? 'enabled' : 'disabled';
          this.theme.info({ message: `Debug mode ${status}.` });
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
          this.theme.info({ message: `Statistics ${status}.` });
          return { continue: true };
        },
      ],
    ]);

    const handler = commandHandlers.get(command);

    if (handler === undefined) {
      this.theme.warning({ message: 'Unknown command. Type /help for available commands.' });
      return { continue: true };
    }

    return handler();
  }

  /**
   * Handle user input
   */
  // eslint-disable-next-line max-statements -- CLI input handling requires branching and state management
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
      // Buffer user message for resize reflowing
      this.conversationBuffer.addMessage({
        content: trimmedInput,
        role: 'user',
      });

      // Start non-blocking spinner animation
      // eslint-disable-next-line no-console -- CLI tool needs console output
      console.log('');
      this.spinner.start();

      const result = await this.chatService.sendMessage({
        message: trimmedInput,
        sessionId: this.sessionId,
      });

      // Stop spinner and output agent response
      this.spinner.stop();

      // eslint-disable-next-line no-console -- CLI tool needs console output
      console.log(
        this.formatResponse({
          duration: result.duration,
          message: result.botMessage,
        })
      );
    } catch (error) {
      // Stop spinner on error
      this.spinner.stop();

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.theme.error({ message: errorMessage });

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

  /**
   * Handle terminal resize event
   * Reflows all visible conversation text to new terminal width
   */
  private handleResize(): void {
    if (this.rl === null || this.isRedrawing) {
      return;
    }

    this.isRedrawing = true;

    // Stop spinner if running
    if (this.spinner.isRunning()) {
      this.spinner.stop();
    }

    // Save readline state
    const currentInput = this.rl.line;
    this.rl.pause();

    // Get new terminal dimensions
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Defensive fallback for non-TTY edge cases
    const newWidth = process.stdout.columns ?? 100;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Defensive fallback for non-TTY edge cases
    const newRows = process.stdout.rows ?? 30;

    // Get messages that fit in screen
    const visibleMessages = this.conversationBuffer.getVisibleMessages({
      maxRows: newRows - 5, // Leave room for prompt and margins
      width: newWidth,
    });

    // Redraw conversation
    this.redrawConversation({ messages: visibleMessages, width: newWidth });

    // Restore readline state
    this.rl.resume();
    this.rl.write(null, { ctrl: true, name: 'u' }); // Clear current line
    this.rl.write(currentInput);
    // Note: cursor position cannot be restored as it's read-only
    this.rl.prompt();

    this.isRedrawing = false;
  }

  /**
   * Redraw conversation with new terminal width
   */
  private redrawConversation(params: {
    messages: Array<{ content: string; role: 'assistant' | 'user' }>;
    width: number;
  }): void {
    // Clear screen and move cursor to top
    process.stdout.write('\x1b[2J\x1b[H');

    // Build output for all messages
    const outputs: string[] = [];

    for (const msg of params.messages) {
      // Check if message contains markdown
      const isMarkdown = this.markdownRenderer.isMarkdown({ text: msg.content });

      let formattedContent: string;
      if (isMarkdown) {
        // Markdown renderer handles wrapping
        formattedContent = this.markdownRenderer.render({ markdown: msg.content });
      } else {
        // Apply color and word wrapping for plain text
        const colored =
          msg.role === 'assistant'
            ? this.theme.formatAgentResponse({ content: msg.content })
            : pc.green(msg.content);

        formattedContent = wrapAnsi(colored, params.width - 6, { hard: true, trim: false });
      }

      // Add role marker
      const diamond = msg.role === 'assistant' ? pc.cyan('◆') : pc.green('▶');
      outputs.push(`\n${diamond} ${formattedContent}\n`);
    }

    // Log all messages at once
    // eslint-disable-next-line no-console -- CLI tool needs console output
    console.log(outputs.join(''));
  }
}
