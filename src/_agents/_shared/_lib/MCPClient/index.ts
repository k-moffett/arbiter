/**
 * MCPClient
 *
 * Client for calling MCP server tools from agent containers.
 * Provides typed wrappers around context tools without direct Qdrant connections.
 *
 * @example
 * ```typescript
 * import { MCPClient } from '@agents/_shared/_lib/MCPClient';
 *
 * const client = new MCPClient({
 *   baseUrl: process.env.MCP_SERVER_URL || 'http://mcp-server:3100'
 * });
 *
 * // Search context
 * const results = await client.searchContext({
 *   query: 'How does Feel No Pain work?',
 *   sessionId: 'sess_1',
 *   filters: { userFeedback: 'success' }
 * });
 * ```
 */

export type * from './interfaces';

export { MCPClientImplementation as MCPClient } from './MCPClientImplementation';
