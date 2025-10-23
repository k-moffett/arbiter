/**
 * Embedding Provider Adapter Types
 */

/**
 * Batch embedding provider interface (what RAG components expect)
 */
export interface EmbeddingProvider {
  embed(params: { texts: string[] }): Promise<{ embeddings: number[][] }>;
}
