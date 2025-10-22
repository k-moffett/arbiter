/**
 * Clack Theme Implementation
 *
 * Provides themed CLI components using Clack prompts library.
 * Supports gradient banners, colored messages, and interactive spinners.
 *
 * Single Responsibility: Manage CLI theming and visual components
 * Open/Closed: Extendable through configuration
 * Dependency Inversion: Depends on ClackTheme interface, not concrete implementation
 */

import type { ClackTheme, Spinner, ThemeConfig } from './interfaces';

import * as clack from '@clack/prompts';
import gradient from 'gradient-string';
import pc from 'picocolors';

/**
 * Clack Theme Implementation
 *
 * @example
 * ```typescript
 * const theme = new ClackThemeImplementation({ config: { gradientTheme: 'pastel' } });
 * theme.intro({ title: 'Welcome', message: 'Getting started' });
 * const spinner = theme.spinner({ message: 'Loading...' });
 * spinner.start();
 * spinner.stop({ finalMessage: 'Done!' });
 * theme.outro({ message: 'Goodbye!' });
 * ```
 */
export class ClackThemeImplementation implements ClackTheme {
  private readonly config: ThemeConfig;

  constructor(params: { config: Partial<ThemeConfig> }) {
    this.config = {
      gradientTheme: params.config.gradientTheme ?? 'pastel',
      useColors: params.config.useColors ?? true,
      useUnicode: params.config.useUnicode ?? true,
    };
  }

  /**
   * Display error message
   */
  public error(params: { message: string }): void {
    clack.log.error(this.config.useColors ? pc.red(params.message) : params.message);
  }

  /**
   * Format agent response with visual styling
   */
  public formatAgentResponse(params: { content: string }): string {
    if (!this.config.useColors) {
      return params.content;
    }

    // Use white for agent responses
    return pc.white(params.content);
  }

  /**
   * Format statistics display
   */
  public formatStats(params: { avgResponseTime: number; messageCount: number }): string {
    const text = `📊 Messages: ${String(params.messageCount)} | Avg response: ${String(params.avgResponseTime)}ms`;

    return this.config.useColors ? pc.dim(text) : text;
  }

  /**
   * Format user input with visual styling
   */
  public formatUserInput(params: { content: string }): string {
    if (!this.config.useColors) {
      return params.content;
    }

    // Use green for user input
    return pc.green(params.content);
  }

  /**
   * Display info message
   */
  public info(params: { message: string }): void {
    clack.log.info(this.config.useColors ? pc.cyan(params.message) : params.message);
  }

  /**
   * Display intro banner
   */
  public intro(params: { message?: string; title: string }): void {
    if (!this.config.useColors) {
      clack.intro(params.title);
      if (params.message !== undefined) {
        process.stdout.write(`${params.message}\n`);
      }
      return;
    }

    // Create gradient title based on theme
    const gradientTitle = this.applyGradient({ text: params.title });
    clack.intro(gradientTitle);

    if (params.message !== undefined) {
      const styledMessage = this.getMessageColor()(params.message);
      process.stdout.write(`${styledMessage}\n`);
    }
  }

  /**
   * Display outro message
   */
  public outro(params: { message: string }): void {
    if (!this.config.useColors) {
      clack.outro(params.message);
      return;
    }

    const styledMessage = this.getAccentColor()(params.message);
    clack.outro(styledMessage);
  }

  /**
   * Create a spinner with themed colors
   */
  public spinner(params: { message: string }): Spinner {
    const s = clack.spinner();
    const initialMessage = this.config.useColors
      ? this.getAccentColor()(params.message)
      : params.message;

    s.start(initialMessage);

    return {
      message: (msgParams: { text: string }) => {
        const text = this.config.useColors
          ? this.getAccentColor()(msgParams.text)
          : msgParams.text;
        s.message(text);
      },
      start: () => {
        s.start(initialMessage);
      },
      stop: (stopParams?: { finalMessage?: string }) => {
        if (stopParams?.finalMessage !== undefined) {
          const finalText = this.config.useColors
            ? this.getAccentColor()(stopParams.finalMessage)
            : stopParams.finalMessage;
          s.stop(finalText);
        } else {
          s.stop('');
        }
      },
    };
  }

  /**
   * Display step message
   */
  public step(params: { message: string }): void {
    clack.log.step(this.config.useColors ? pc.dim(params.message) : params.message);
  }

  /**
   * Display success message
   */
  public success(params: { message: string }): void {
    clack.log.success(this.config.useColors ? pc.green(params.message) : params.message);
  }

  /**
   * Display warning message
   */
  public warning(params: { message: string }): void {
    clack.log.warn(this.config.useColors ? pc.yellow(params.message) : params.message);
  }

  /**
   * Apply gradient to text based on theme
   */
  private applyGradient(params: { text: string }): string {
    const gradients = {
      gold: ['#FFD700', '#FFA500'],
      'gold-black': ['#FFD700', '#000000'],
      pastel: ['#a8edea', '#fed6e3'],
    };

    const colors = gradients[this.config.gradientTheme];
    return gradient(colors)(params.text);
  }

  /**
   * Get theme-specific accent color function
   */
  private getAccentColor(): (text: string) => string {
    const colors = {
      gold: pc.yellow,
      'gold-black': pc.yellow,
      pastel: pc.cyan,
    };

    return colors[this.config.gradientTheme];
  }

  /**
   * Get theme-specific message color function
   */
  private getMessageColor(): (text: string) => string {
    const colors = {
      gold: pc.yellow,
      'gold-black': pc.yellow,
      pastel: pc.cyan,
    };

    return colors[this.config.gradientTheme];
  }
}
