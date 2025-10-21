/**
 * ChatService
 *
 * Manages chat sessions and message history.
 * Coordinates with AgentOrchestrator for query processing.
 *
 * @example
 * ```typescript
 * import { ChatService } from '@clients/ChatService';
 *
 * const chatService = new ChatService({ orchestrator });
 * const session = chatService.createSession({ sessionId: 'cli-session-1' });
 * const result = await chatService.sendMessage({
 *   sessionId: session.id,
 *   message: 'Hello!'
 * });
 * ```
 */

// Barrel exports
export { ChatServiceImplementation as ChatService } from './ChatServiceImplementation';
export * from './interfaces';
export * from './types';
