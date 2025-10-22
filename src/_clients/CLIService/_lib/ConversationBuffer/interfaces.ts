/**
 * ConversationBuffer interfaces and types
 *
 * Stores conversation history for dynamic text reflowing on terminal resize.
 */

/**
 * A single message in the conversation
 */
export interface ConversationMessage {
  /**
   * Message content (plain text or formatted)
   */
  content: string;

  /**
   * Number of lines this message occupies at given terminal width
   * Updated on resize
   */
  lineCount: number;

  /**
   * Message role (user or assistant)
   */
  role: 'assistant' | 'user';

  /**
   * When the message was created
   */
  timestamp: number;
}

/**
 * Configuration for ConversationBuffer
 */
export interface BufferConfig {
  /**
   * Maximum number of messages to store
   * @default 1000
   */
  maxMessages?: number;
}

/**
 * ConversationBuffer interface
 *
 * Manages conversation history for dynamic reflowing
 */
export interface ConversationBuffer {
  /**
   * Add a message to the buffer
   */
  addMessage(params: { content: string; role: 'assistant' | 'user' }): void;

  /**
   * Calculate how many lines a message will take at given width
   */
  calculateLines(params: { content: string; width: number }): number;

  /**
   * Get all messages in the buffer
   */
  getMessages(): ConversationMessage[];

  /**
   * Get total line count for all messages at given width
   */
  getTotalLines(params: { width: number }): number;

  /**
   * Get messages that fit within screen height
   * Returns messages from bottom up (most recent first)
   */
  getVisibleMessages(params: { maxRows: number; width: number }): ConversationMessage[];
}
