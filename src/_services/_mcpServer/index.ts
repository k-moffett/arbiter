/**
 * MCP Server Service
 *
 * Model Context Protocol server implementation.
 * Acts as API gateway between clients and agent orchestrator.
 *
 * @example
 * ```typescript
 * import { MCPServer } from '@services/_mcpServer';
 *
 * const server = new MCPServer();
 * await server.start({
 *   transports: ['stdio', 'streamable-http'],
 *   httpPort: 3100,
 *   agentOrchestratorURL: 'http://agentOrchestrator:3200'
 * });
 * ```
 */

// Barrel exports
export * from './interfaces';
export * from './types';

// TODO: Export implementations when ready
// export { MCPServerImplementation as MCPServer } from './MCPServer';
// export { StdioTransport } from './transports/StdioTransport';
// export { StreamableHTTPTransport } from './transports/StreamableHTTPTransport';
// export { SessionManagerImplementation as SessionManager } from './SessionManager';
// export { RequestRouterImplementation as RequestRouter } from './RequestRouter';
