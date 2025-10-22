/**
 * CLI Service
 *
 * Interactive command-line interface for chatting with the agent.
 *
 * @example
 * ```typescript
 * import { CLIService } from '@clients/cli';
 *
 * const cli = new CLIService({
 *   chatService,
 *   sessionId: 'cli-session-1'
 * });
 *
 * await cli.start();
 * ```
 */

// Barrel exports
export { CLIServiceImplementation as CLIService } from './CLIServiceImplementation';
export * from './interfaces';
export * from './types';
