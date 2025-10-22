/**
 * NonBlockingSpinner Implementation
 *
 * Terminal spinner that doesn't block readline input.
 * Uses setInterval and process.stdout.write to update in place.
 *
 * Single Responsibility: Provide non-blocking terminal animation
 * Open/Closed: Extendable through AnimationStyle configuration
 * Dependency Inversion: No external dependencies except Node.js built-ins
 */

import type { AnimationStyle, NonBlockingSpinner, NonBlockingSpinnerConfig } from './interfaces';

import pc from 'picocolors';

/**
 * Animation frames for different styles
 */
const ANIMATION_FRAMES: Record<AnimationStyle, string[]> = {
  bounce: ['◐', '◓', '◑', '◒'],
  dots: ['', '.', '..', '...'],
  hourglass: ['⏳', '⌛'],
  none: [''],
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
};

/**
 * NonBlockingSpinner Implementation
 *
 * @example
 * ```typescript
 * const spinner = new NonBlockingSpinnerImplementation({
 *   animationStyle: 'spinner',
 *   message: 'Loading...'
 * });
 *
 * spinner.start();
 * // ... do work ...
 * spinner.stop();
 * ```
 */
export class NonBlockingSpinnerImplementation implements NonBlockingSpinner {
  private readonly animationStyle: AnimationStyle;
  private readonly color: NonBlockingSpinnerConfig['color'];
  private frameIndex: number = 0;
  private readonly frameInterval: number;
  private readonly frames: string[];
  private intervalId: NodeJS.Timeout | null = null;
  private message: string;
  private running: boolean = false;

  constructor(config: NonBlockingSpinnerConfig = {}) {
    this.animationStyle = config.animationStyle ?? 'spinner';
    this.message = config.message ?? 'Thinking...';
    this.frameInterval = config.frameInterval ?? 80;
    this.color = config.color ?? 'cyan';
    this.frames = ANIMATION_FRAMES[this.animationStyle];
  }

  /**
   * Check if spinner is currently running
   */
  public isRunning(): boolean {
    return this.running;
  }

  /**
   * Start the spinner animation
   */
  public start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.frameIndex = 0;

    // If animation is 'none', just display static message
    if (this.animationStyle === 'none') {
      this.writeFrame();
      return;
    }

    // Start animation interval
    this.intervalId = setInterval(() => {
      this.writeFrame();
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
    }, this.frameInterval);
  }

  /**
   * Stop the spinner animation and clear the line
   */
  public stop(): void {
    if (!this.running) {
      return;
    }

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.running = false;

    // Clear the line
    process.stdout.write('\r\x1b[K');
  }

  /**
   * Update the message while spinner is running
   */
  public updateMessage(params: { message: string }): void {
    this.message = params.message;
    if (this.running) {
      this.writeFrame();
    }
  }

  /**
   * Apply color to text based on configuration
   */
  private colorize(params: { text: string }): string {
    const colorMap: Record<string, (text: string) => string> = {
      blue: pc.blue,
      cyan: pc.cyan,
      gray: pc.gray,
      green: pc.green,
      magenta: pc.magenta,
      white: pc.white,
      yellow: pc.yellow,
    };

    const colorFn = this.color !== undefined ? colorMap[this.color] : undefined;
    return colorFn !== undefined ? colorFn(params.text) : params.text;
  }

  /**
   * Write current frame to stdout
   */
  private writeFrame(): void {
    const frame = this.frames[this.frameIndex] ?? '';
    const coloredFrame = this.colorize({ text: frame });

    // Always show spinner + progressive dots (combined animation)
    const dots = '.'.repeat(this.frameIndex % 4); // Cycles: '', '.', '..', '...'
    const output = `\r${coloredFrame} ${this.message}${dots}`;
    process.stdout.write(output);
  }
}
