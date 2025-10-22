/**
 * ConversationBuffer Implementation
 *
 * Stores conversation history and calculates line wrapping for dynamic terminal resize.
 *
 * Single Responsibility: Manage conversation message buffer
 * Open/Closed: Extendable through BufferConfig
 * Dependency Inversion: Depends on wrap-ansi and string-width abstractions
 */

import type { BufferConfig, ConversationBuffer, ConversationMessage } from './interfaces';

import wrapAnsi from 'wrap-ansi';

/**
 * ConversationBuffer Implementation
 *
 * @example
 * ```typescript
 * const buffer = new ConversationBufferImplementation({ maxMessages: 100 });
 * buffer.addMessage({ role: 'user', content: 'Hello!' });
 * buffer.addMessage({ role: 'assistant', content: 'Hi there!' });
 *
 * const visible = buffer.getVisibleMessages({ maxRows: 20, width: 80 });
 * ```
 */
export class ConversationBufferImplementation implements ConversationBuffer {
  private readonly maxMessages: number;
  private readonly messages: ConversationMessage[] = [];

  constructor(config: BufferConfig = {}) {
    this.maxMessages = config.maxMessages ?? 1000;
  }

  /**
   * Add a message to the buffer
   */
  public addMessage(params: { content: string; role: 'assistant' | 'user' }): void {
    const message: ConversationMessage = {
      content: params.content,
      lineCount: 0, // Will be calculated on first getVisibleMessages call
      role: params.role,
      timestamp: Date.now(),
    };

    this.messages.push(message);

    // Maintain max buffer size
    if (this.messages.length > this.maxMessages) {
      this.messages.shift(); // Remove oldest message
    }
  }

  /**
   * Calculate how many lines a message will take at given width
   */
  public calculateLines(params: { content: string; width: number }): number {
    if (params.content === '') {
      return 1;
    }

    // Account for diamond marker (◆ + space = 2 chars) + margins
    const effectiveWidth = params.width - 6;

    // Wrap the text to calculate actual line count
    const wrapped = wrapAnsi(params.content, effectiveWidth, { hard: true, trim: false });
    const lines = wrapped.split('\n');

    // Add extra lines for formatting (blank line before and after message)
    return lines.length + 2;
  }

  /**
   * Get all messages in the buffer
   */
  public getMessages(): ConversationMessage[] {
    return [...this.messages]; // Return copy to prevent external modification
  }

  /**
   * Get total line count for all messages at given width
   */
  public getTotalLines(params: { width: number }): number {
    // eslint-disable-next-line local-rules/require-typed-params, @typescript-eslint/max-params -- Array.reduce callback signature
    return this.messages.reduce((total, msg) => {
      return total + this.calculateLines({ content: msg.content, width: params.width });
    }, 0);
  }

  /**
   * Get messages that fit within screen height
   * Returns messages from bottom up (most recent first)
   */
  public getVisibleMessages(params: { maxRows: number; width: number }): ConversationMessage[] {
    const visible: ConversationMessage[] = [];
    let currentLines = 0;

    // Iterate from most recent to oldest
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];

      // TypeScript strict null check
      if (msg === undefined) {
        continue;
      }

      const lineCount = this.calculateLines({ content: msg.content, width: params.width });

      // Update message line count for future reference
      msg.lineCount = lineCount;

      // Check if message fits in remaining space
      if (currentLines + lineCount <= params.maxRows) {
        visible.unshift(msg); // Add to front (maintain chronological order)
        currentLines += lineCount;
      } else {
        break; // Screen is full
      }
    }

    return visible;
  }
}
