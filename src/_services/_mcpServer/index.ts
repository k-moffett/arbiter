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
export * from './contextTools';
export * from './interfaces';
export { MCPServer } from './MCPServer';

// Export implementations
export { RequestRouter } from './RequestRouter';
export * from './types';

// TODO: Export transport implementations when ready
// export { StdioTransport } from './StdioTransport';
// export { StreamableHTTPTransport } from './StreamableHTTPTransport';
