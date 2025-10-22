/**
 * Base Command Implementation
 *
 * Base class for all oclif commands providing shared functionality.
 *
 * Single Responsibility: Provide common CLI command infrastructure
 * Open/Closed: Commands extend this to add specific functionality
 * Liskov Substitution: All commands can be used interchangeably via Command interface
 * Dependency Inversion: Depends on abstractions (interfaces), not concrete implementations
 */

import type { ChatService } from '../../../ChatService';
import type { ClackTheme } from '../../_lib/ClackTheme';
import type { MarkdownRenderer } from '../../_lib/MarkdownRenderer';
import type { GradientTheme } from '../../types';

import { Command } from '@oclif/core';

import { Logger } from '../../../../_shared/_infrastructure';
import { ClackThemeImplementation } from '../../_lib/ClackTheme';
import { detectTerminal } from '../../_lib/Formatters';
import { MarkdownRendererImplementation } from '../../_lib/MarkdownRenderer';

/**
 * Base Command Configuration
 */
export interface BaseCommandConfig {
  /** Chat service instance */
  chatService?: ChatService;
  /** Enable debug mode */
  debug?: boolean;
  /** Gradient theme */
  gradientTheme?: GradientTheme;
  /** Session ID */
  sessionId?: string;
  /** Show statistics */
  showStats?: boolean;
  /** User ID */
  userId?: string;
}

/**
 * Base Command Implementation
 *
 * Provides shared functionality for all CLI commands including:
 * - Terminal detection
 * - Theme management
 * - Markdown rendering
 * - Service access
 * - Error handling
 *
 * @example
 * ```typescript
 * export class MyCommand extends BaseCommandImplementation {
 *   async run() {
 *     const terminal = detectTerminal();
 *     this.theme.intro({ title: 'My Command' });
 *     // command logic
 *   }
 * }
 * ```
 */
export abstract class BaseCommandImplementation extends Command {
  protected commandConfig: BaseCommandConfig = {};
  protected logger!: Logger;
  protected markdownRenderer!: MarkdownRenderer;
  protected theme!: ClackTheme;

  /**
   * Initialize command
   *
   * Called by oclif before run()
   */
  public override async init(): Promise<void> {
    await super.init();

    // Initialize logger
    this.logger = new Logger({
      metadata: {
        className: this.constructor.name,
        serviceName: 'CLI Command',
      },
    });

    // Detect terminal capabilities
    const terminal = detectTerminal();

    // Initialize theme
    this.theme = new ClackThemeImplementation({
      config: {
        gradientTheme: this.commandConfig.gradientTheme ?? 'pastel',
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
  }

  /**
   * Catch errors and display them nicely
   */
  // eslint-disable-next-line @typescript-eslint/require-await -- Override of oclif's async catch method
  protected override async catch(error: Error): Promise<void> {
    this.handleError({ error });
    throw error;
  }

  /**
   * Get chat service
   *
   * @throws Error if chat service not initialized
   */
  protected getChatService(): ChatService {
    if (this.commandConfig.chatService === undefined) {
      throw new Error('Chat service not initialized');
    }

    return this.commandConfig.chatService;
  }

  /**
   * Get session ID
   */
  protected getSessionId(): string {
    return this.commandConfig.sessionId ?? 'cli-session-default';
  }

  /**
   * Get user ID
   */
  protected getUserId(): string {
    return this.commandConfig.userId ?? 'cli-user-default';
  }

  /**
   * Handle error with consistent formatting
   */
  protected handleError(params: { error: Error | string }): void {
    const message = params.error instanceof Error ? params.error.message : params.error;
    this.theme.error({ message });

    if (this.isDebugMode()) {
      if (params.error instanceof Error) {
        if (params.error.stack !== undefined) {
           
          console.error(params.error.stack);
        }
      }
    }
  }

  /**
   * Check if debug mode is enabled
   */
  protected isDebugMode(): boolean {
    return this.commandConfig.debug ?? false;
  }

  /**
   * Render content (handles both markdown and plain text)
   */
  protected renderContent(params: { content: string }): string {
    // Check if content looks like markdown
    const isMarkdown = this.markdownRenderer.isMarkdown({ text: params.content });

    if (isMarkdown) {
      return this.markdownRenderer.render({ markdown: params.content });
    }

    // Return plain text formatted for agent response
    return this.theme.formatAgentResponse({ content: params.content });
  }

  /**
   * Check if stats should be shown
   */
  protected shouldShowStats(): boolean {
    return this.commandConfig.showStats ?? false;
  }
}
