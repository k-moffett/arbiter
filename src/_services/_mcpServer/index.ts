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

// Barrel exports (sorted alphabetically, underscore-prefixed paths first)
export type { StdioTransportConfig } from './_transports/StdioTransport';
export { StdioTransport } from './_transports/StdioTransport';
export type { HTTPTransportConfig } from './_transports/StreamableHTTPTransport';
export { StreamableHTTPTransport } from './_transports/StreamableHTTPTransport';
export * from './ContextToolRegistry';
export { MCPServer } from './MCPServer';
export { RequestRouter } from './RequestRouter';
