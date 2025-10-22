/**
 * NonBlockingSpinner interfaces and types
 */

/**
 * Animation style for the spinner
 */
export type AnimationStyle = 'spinner' | 'hourglass' | 'dots' | 'bounce' | 'none';

/**
 * Configuration for NonBlockingSpinner
 */
export interface NonBlockingSpinnerConfig {
  /**
   * Animation style to use
   * @default 'spinner'
   */
  animationStyle?: AnimationStyle;

  /**
   * Color to use for the spinner (using picocolors)
   * @default 'cyan'
   */
  color?: 'cyan' | 'green' | 'yellow' | 'blue' | 'magenta' | 'white' | 'gray';

  /**
   * Frame update interval in milliseconds
   * @default 80
   */
  frameInterval?: number;

  /**
   * Message to display alongside animation
   * @default 'Thinking...'
   */
  message?: string;
}

/**
 * NonBlockingSpinner interface
 *
 * Provides animated terminal spinner that doesn't block readline input.
 * Uses process.stdout.write with carriage return to update in place.
 */
export interface NonBlockingSpinner {
  /**
   * Check if spinner is currently running
   */
  isRunning(): boolean;

  /**
   * Start the spinner animation
   */
  start(): void;

  /**
   * Stop the spinner animation and clear the line
   */
  stop(): void;

  /**
   * Update the message while spinner is running
   */
  updateMessage(params: { message: string }): void;
}
