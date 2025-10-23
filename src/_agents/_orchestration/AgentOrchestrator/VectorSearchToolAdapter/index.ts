/**
 * Vector Search Tool Adapter
 *
 * Adapts MCP client's searchContext() to VectorSearchTool interface.
 */

export type { VectorSearchTool } from './types';
export { VectorSearchToolAdapterImplementation as VectorSearchToolAdapter } from './VectorSearchToolAdapterImplementation';
