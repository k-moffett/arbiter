/**
 * QdrantClient Adapter Interfaces
 *
 * Adapter for @qdrant/js-client-rest SDK.
 * Implements VectorRepository interface for Qdrant operations.
 */

/**
 * Qdrant client configuration
 */
export interface QdrantClientConfig {
  /** API key for authentication (optional) */
  apiKey?: string;
  /** Collection name */
  collection: string;
  /** Qdrant server URL */
  url: string;
}

/**
 * Qdrant filter condition
 * Supports nested filtering for context queries
 */
export interface QdrantFilter {
  /** Must conditions (AND logic) */
  must?: QdrantCondition[];
  /** Must not conditions (NOT logic) */
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  must_not?: QdrantCondition[];
  /** Should conditions (OR logic) */
  should?: QdrantCondition[];
}

/**
 * Qdrant filter condition
 */
export interface QdrantCondition {
  /** Field key */
  key: string;
  /** Match condition */
  match?:
    | { any: (boolean | number | string)[] }
    | { except: (boolean | number | string)[] }
    | { value: boolean | number | string };
}

/**
 * Qdrant point (vector with payload)
 */
export interface QdrantPoint {
  /** Point ID */
  id: string;
  /** Point metadata/payload */
  payload: Record<string, unknown>;
  /** Embedding vector */
  vector: number[];
}

/**
 * Qdrant search parameters
 */
export interface QdrantSearchParams {
  /** Collection name */
  collection: string;
  /** Filter conditions */
  filter?: QdrantFilter;
  /** Maximum results */
  limit?: number;
  /** Search vector */
  vector: number[];
}

/**
 * Qdrant search result
 */
export interface QdrantSearchResult {
  /** Point ID */
  id: string;
  /** Point payload */
  payload: Record<string, unknown>;
  /** Similarity score */
  score: number;
}
