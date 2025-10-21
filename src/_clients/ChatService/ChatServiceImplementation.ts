/**
 * ChatService Implementation
 *
 * Manages chat sessions and coordinates with AgentOrchestrator.
 * Maintains in-memory message history for recent context.
 */

import type { AgentOrchestrator } from '../../_agents/_orchestration/AgentOrchestrator';
import type { ChatService } from './interfaces';
import type {
  ChatMessage,
  ChatServiceConfig,
  ChatSession,
  SendMessageParams,
  SendMessageResult,
} from './types';

/**
 * ChatService Implementation
 *
 * @example
 * ```typescript
 * const chatService = new ChatServiceImplementation({
 *   orchestrator,
 *   maxMessagesInMemory: 10
 * });
 *
 * const session = chatService.createSession({ sessionId: 'cli-123' });
 * const result = await chatService.sendMessage({
 *   sessionId: session.id,
 *   message: 'Hello!'
 * });
 * ```
 */
export class ChatServiceImplementation implements ChatService {
  private readonly maxMessagesInMemory: number;
  private readonly orchestrator: AgentOrchestrator;
  private readonly sessions: Map<string, ChatSession>;

  constructor(params: { orchestrator: AgentOrchestrator } & ChatServiceConfig) {
    this.orchestrator = params.orchestrator;
    this.maxMessagesInMemory = params.maxMessagesInMemory ?? 10;
    this.sessions = new Map();
  }

  /**
   * Clear message history for a session
   */
  public clearHistory(params: { sessionId: string }): void {
    const session = this.sessions.get(params.sessionId);

    if (session === undefined) {
      throw new Error(`Session not found: ${params.sessionId}`);
    }

    session.messages = [];
    session.lastActivityAt = Date.now();
  }

  /**
   * Create new chat session
   */
  public createSession(params: {
    metadata?: Record<string, unknown>;
    sessionId?: string;
  }): ChatSession {
    const sessionId = params.sessionId ?? `session_${String(Date.now())}`;

    const session: ChatSession = {
      createdAt: Date.now(),
      id: sessionId,
      lastActivityAt: Date.now(),
      messages: [],
      metadata: params.metadata ?? {},
    };

    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Get message history for session
   */
  public getHistory(params: { sessionId: string }): ChatMessage[] {
    const session = this.sessions.get(params.sessionId);

    if (session === undefined) {
      throw new Error(`Session not found: ${params.sessionId}`);
    }

    return [...session.messages];
  }

  /**
   * Get session by ID
   */
  public getSession(params: { sessionId: string }): ChatSession | null {
    const session = this.sessions.get(params.sessionId);
    return session ?? null;
  }

  /**
   * Send message and get response
   */
  public async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const session = this.sessions.get(params.sessionId);

    if (session === undefined) {
      throw new Error(`Session not found: ${params.sessionId}`);
    }

    const startTime = Date.now();

    // Create user message
    const userMessage: ChatMessage = {
      content: params.message,
      id: `msg_${String(Date.now())}_user`,
      role: 'user',
      timestamp: Date.now(),
    };

    // Add user message to session
    this.addMessageToSession({ message: userMessage, session });

    // Process query via orchestrator
    const result = await this.orchestrator.processQuery({
      query: params.message,
      sessionId: params.sessionId,
    });

    // Create bot message
    const botMessage: ChatMessage = {
      content: result.answer,
      id: `msg_${String(Date.now())}_bot`,
      role: 'bot',
      timestamp: Date.now(),
    };

    // Add bot message to session
    this.addMessageToSession({ message: botMessage, session });

    const duration = Date.now() - startTime;

    return {
      botMessage,
      duration,
      userMessage,
    };
  }

  /**
   * Add message to session and trim history if needed
   */
  private addMessageToSession(params: { message: ChatMessage; session: ChatSession }): void {
    params.session.messages.push(params.message);
    params.session.lastActivityAt = Date.now();

    // Trim history if exceeds max
    if (params.session.messages.length > this.maxMessagesInMemory) {
      const excessCount = params.session.messages.length - this.maxMessagesInMemory;
      params.session.messages = params.session.messages.slice(excessCount);
    }
  }
}
