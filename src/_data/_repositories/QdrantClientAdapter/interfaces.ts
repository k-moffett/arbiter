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

/**
 * Collection metadata from Qdrant
 */
export interface CollectionMetadata {
  /** Manual description (from payload schema) */
  description?: string;
  /** Distance metric (Cosine, Euclid, Dot) */
  distance: string;
  /** Collection name */
  name: string;
  /** Number of points in collection */
  pointCount: number;
  /** Collection status */
  status: string;
  /** Manual tags (from payload schema) */
  tags?: string[];
  /** Vector dimensions */
  vectorDimensions: number;
}

/**
 * Parameters for listing collections
 */
export interface ListCollectionsParams {
  /** Include detailed metadata (default: false) */
  includeMetadata?: boolean;
}

/**
 * Parameters for getting collection info
 */
export interface GetCollectionInfoParams {
  /** Collection name */
  name: string;
}

/**
 * Parameters for searching in specific collection
 */
export interface SearchInCollectionParams {
  /** Target collection name */
  collectionName: string;
  /** Metadata filters */
  filters?: Record<string, unknown>;
  /** Maximum results (default: 10) */
  limit?: number;
  /** Minimum score threshold (0-1) */
  scoreThreshold?: number;
  /** Search vector */
  vector: number[];
}
