/**
 * Vector Search Tool Adapter Types
 */

import type {
  VectorSearchContextParams,
  VectorSearchContextResult,
} from '../../../../_services/_mcpServer/ContextToolRegistry/types';

/**
 * Vector search tool interface (what RAG components expect)
 */
export interface VectorSearchTool {
  execute(params: VectorSearchContextParams): Promise<VectorSearchContextResult>;
}
