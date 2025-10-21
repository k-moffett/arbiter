/**
 * Data Repositories (DAO Pattern)
 *
 * Abstract repository interfaces for database operations.
 * Provides database-agnostic data access layer.
 *
 * @example
 * ```typescript
 * import { VectorRepository } from '@data/_repositories';
 * import { QdrantAdapter } from '@data/_implementations/_vector/QdrantAdapter';
 *
 * // Dependency injection
 * const vectorRepo: VectorRepository = new QdrantAdapter({ url: 'http://qdrant:6333' });
 *
 * // Use repository
 * const results = await vectorRepo.search({
 *   query: 'terminator weapons',
 *   collection: 'warhammer-40k_units',
 *   limit: 10
 * });
 * ```
 */

export * from './interfaces';
// Barrel exports
export * from './types';
