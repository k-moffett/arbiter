/**
 * QdrantClient Adapter
 *
 * Adapter for @qdrant/js-client-rest SDK implementing VectorRepository interface.
 *
 * @example
 * ```typescript
 * import { QdrantClientAdapter } from '@data/_repositories/_implementations/QdrantClientAdapter';
 *
 * const client = new QdrantClientAdapter({
 *   url: process.env.QDRANT_URL || 'http://qdrant:6333',
 *   collection: 'conversation-history',
 *   apiKey: process.env.QDRANT_API_KEY
 * });
 * ```
 */

export type * from './interfaces';

export { QdrantClientAdapter } from './QdrantClientAdapterImplementation';
