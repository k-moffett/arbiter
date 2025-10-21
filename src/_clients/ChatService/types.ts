/**
 * ChatService Type Definitions
 *
 * Types for chat session management and message handling.
 */

/**
 * Chat message
 */
export interface ChatMessage {
  /** Message content */
  content: string;
  /** Message ID */
  id: string;
  /** Message role */
  role: 'bot' | 'user';
  /** Message timestamp */
  timestamp: number;
}

/**
 * Chat session
 */
export interface ChatSession {
  /** Session creation time */
  createdAt: number;
  /** Session ID */
  id: string;
  /** Last activity time */
  lastActivityAt: number;
  /** Recent messages (in-memory) */
  messages: ChatMessage[];
  /** Session metadata */
  metadata: Record<string, unknown>;
}

/**
 * Chat service configuration
 */
export interface ChatServiceConfig {
  /** Maximum messages to keep in memory */
  maxMessagesInMemory?: number;
}

/**
 * Send message parameters
 */
export interface SendMessageParams {
  /** Message content */
  message: string;
  /** Session ID */
  sessionId: string;
}

/**
 * Send message result
 */
export interface SendMessageResult {
  /** Bot response message */
  botMessage: ChatMessage;
  /** Processing duration in milliseconds */
  duration: number;
  /** User message that was sent */
  userMessage: ChatMessage;
}
