/**
 * ChatService Interfaces
 *
 * Interface definitions for chat service.
 */

import type { ChatMessage, ChatSession, SendMessageParams, SendMessageResult } from './types';

/**
 * Chat service interface
 */
export interface ChatService {
  /**
   * Clear message history for a session
   */
  clearHistory(params: { sessionId: string }): void;

  /**
   * Create new chat session
   */
  createSession(params: { metadata?: Record<string, unknown>; sessionId?: string }): ChatSession;

  /**
   * Get message history for session
   */
  getHistory(params: { sessionId: string }): ChatMessage[];

  /**
   * Get session by ID
   */
  getSession(params: { sessionId: string }): ChatSession | null;

  /**
   * Send message and get response
   */
  sendMessage(params: SendMessageParams): Promise<SendMessageResult>;
}
