/**
 * QdrantClient Adapter Implementation
 *
 * Adapter for @qdrant/js-client-rest SDK implementing VectorRepository interface.
 * Provides type-safe wrapper around Qdrant operations for context storage.
 */

import type { VectorRepository } from '../interfaces';
import type { SearchQuery, SearchResult, VectorDocument } from '../types';
import type {
  QdrantClientConfig,
  QdrantCondition,
  QdrantFilter,
  QdrantPoint,
} from './interfaces';

import { QdrantClient } from '@qdrant/js-client-rest';

/**
 * Qdrant Client Adapter
 *
 * @example
 * ```typescript
 * const client = new QdrantClientAdapter({
 *   url: process.env.QDRANT_URL || 'http://qdrant:6333',
 *   collection: 'conversation-history',
 *   apiKey: process.env.QDRANT_API_KEY
 * });
 *
 * await client.upsert([{
 *   id: 'msg_123',
 *   vector: [...],
 *   content: 'Message content',
 *   metadata: { sessionId: 'sess_1', requestId: 'req_abc.1' }
 * }]);
 * ```
 */
export class QdrantClientAdapter implements VectorRepository {
  private readonly client: QdrantClient;
  private readonly collection: string;

  constructor(config: QdrantClientConfig) {
    const clientConfig: { apiKey?: string; checkCompatibility?: boolean; url: string } = {
      checkCompatibility: false, // Skip version check between client and server
      url: config.url,
    };

    if (config.apiKey !== undefined) {
      clientConfig.apiKey = config.apiKey;
    }

    this.client = new QdrantClient(clientConfig);
    this.collection = config.collection;
  }

  /**
   * Create collection with specified dimensions
   */
  public async createCollection(params: {
    dimensions: number;
    name: string;
  }): Promise<void> {
    await this.client.createCollection(params.name, {
      vectors: {
        distance: 'Cosine',
        size: params.dimensions,
      },
    });
  }

  /**
   * Create payload index for efficient filtering
   */
  public async createPayloadIndex(params: {
    collection?: string;
    fieldName: string;
    fieldSchema: 'bool' | 'float' | 'integer' | 'keyword';
  }): Promise<void> {
    const collection = params.collection ?? this.collection;

    /* eslint-disable @typescript-eslint/naming-convention */
    await this.client.createPayloadIndex(collection, {
      field_name: params.fieldName,
      field_schema: params.fieldSchema,
    });
    /* eslint-enable @typescript-eslint/naming-convention */
  }

  /**
   * Delete vectors by IDs
   */
  public async delete(ids: string[]): Promise<void> {
    await this.client.delete(this.collection, {
      points: ids,
      wait: true,
    });
  }

  /**
   * Delete collection
   */
  public async deleteCollection(params: { name: string }): Promise<void> {
    await this.client.deleteCollection(params.name);
  }

  /**
   * Search vectors
   */
  public async search(query: SearchQuery): Promise<SearchResult[]> {
    const { collection } = query;

    // Vector is required for semantic search in Qdrant
    if (query.vector === undefined) {
      throw new Error('Vector is required for semantic search');
    }

    const filter = this.buildFilterSafe(query.filters);
    const limit = query.limit ?? 10;

    /* eslint-disable @typescript-eslint/naming-convention */
    const searchRequest: {
      filter?: QdrantFilter;
      limit: number;
      vector: number[];
      with_payload: true;
    } = {
      limit,
      vector: query.vector,
      with_payload: true,
    };

    if (filter !== null) {
      searchRequest.filter = filter;
    }

    const results = await this.client.search(collection, searchRequest);
    /* eslint-enable @typescript-eslint/naming-convention */

    return results.map((result) => ({
      content: this.extractContent(result.payload),
      id: String(result.id),
      metadata: result.payload ?? {},
      score: result.score,
    }));
  }

  /**
   * Upsert vector documents
   *
   * Uses UUID strings as IDs (recommended by Qdrant).
   * Qdrant stores UUIDs as 128-bit integers internally for efficiency.
   */
  public async upsert(documents: VectorDocument[]): Promise<void> {
    const points = documents.map((doc) => {
      // Sanitize payload to ensure only primitive types
      const sanitizedPayload = this.sanitizePayload({
        content: doc.content,
        ...doc.metadata,
      });

      return {
        id: doc.id, // Pass UUID string directly - Qdrant handles conversion
        payload: sanitizedPayload,
        vector: doc.vector,
      };
    });

    // Debug logging
    console.log('[DEBUG] Qdrant upsert request:', {
      collection: this.collection,
      pointCount: points.length,
      firstPointId: points[0]?.id,
      firstVectorLength: points[0]?.vector?.length,
      payloadKeys: points[0] ? Object.keys(points[0].payload) : [],
    });

    try {
      await this.client.upsert(this.collection, {
        points,
        wait: true,
      });
    } catch (error) {
      console.error('[ERROR] Qdrant upsert failed:', {
        error: error instanceof Error ? error.message : String(error),
        errorObj: error,
        collection: this.collection,
        pointCount: points.length,
      });
      throw error;
    }
  }

  /**
   * Build Qdrant filter from simple key-value filters
   */
  private buildFilter(filters: Record<string, unknown>): QdrantFilter {
    const must = Object.entries(filters)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]): QdrantCondition => {
        // Handle array values (any match)
        if (Array.isArray(value)) {
          const arrayValues = value.filter(
            (v): v is boolean | number | string =>
              typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
          );
          return {
            key,
            match: { any: arrayValues },
          };
        }

        // Handle single primitive values
        if (typeof value === 'string') {
          return {
            key,
            match: { value },
          };
        }

        if (typeof value === 'number') {
          return {
            key,
            match: { value },
          };
        }

        if (typeof value === 'boolean') {
          return {
            key,
            match: { value },
          };
        }

        // Default to string conversion for other types
        return {
          key,
          match: { value: String(value) },
        };
      });

    return { must };
  }

  /**
   * Build filter with null safety
   */
  private buildFilterSafe(filters: Record<string, unknown> | undefined): QdrantFilter | null {
    if (filters === undefined) {
      return null;
    }

    return this.buildFilter(filters);
  }

  /**
   * Extract content from payload with type safety
   */
  private extractContent(payload: { content?: unknown } | null | undefined): string {
    if (payload === null || payload === undefined) {
      return '';
    }

    const content = payload.content;

    if (content === null || content === undefined) {
      return '';
    }

    // Ensure content is a primitive type before converting to string
    if (typeof content === 'string') {
      return content;
    }

    if (typeof content === 'number' || typeof content === 'boolean') {
      return String(content);
    }

    // For objects, return empty string (shouldn't happen with proper data)
    return '';
  }

  /**
   * Sanitize payload for Qdrant by ensuring only primitive values
   * Complex objects are converted to JSON strings
   */
  private sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (value === null || value === undefined) {
        continue; // Skip null/undefined
      }

      // Primitives are supported directly
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        sanitized[key] = value;
      }
      // Arrays of primitives
      else if (
        Array.isArray(value) &&
        value.every((v) => typeof v === 'string' || typeof v === 'number')
      ) {
        sanitized[key] = value;
      }
      // Dates to ISO strings
      else if (value instanceof Date) {
        sanitized[key] = value.toISOString();
      }
      // Complex objects to JSON strings
      else if (typeof value === 'object') {
        try {
          sanitized[key] = JSON.stringify(value);
        } catch {
          // Skip if can't serialize
          continue;
        }
      }
      // Fallback: convert to string
      else {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }
}
