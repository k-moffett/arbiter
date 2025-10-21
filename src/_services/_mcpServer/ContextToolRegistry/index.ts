/**
 * Context Tool Registry
 *
 * Barrel export for ContextToolRegistry module.
 */

// Constants (if consumers need tool definitions)
export { CONTEXT_TOOLS } from './consts';

// Main implementation
export { ContextToolRegistryImplementation as ContextToolRegistry } from './ContextToolRegistryImplementation';

// Public interfaces
export type {
  ContextToolDefinition,
  ContextToolHandlerDependencies,
  ContextToolHandlers,
  ContextToolRegistry as IContextToolRegistry,
} from './interfaces';

// Public types
export type {
  ContextPayload,
  ContextSearchFilters,
  ContextSearchResult,
  GetRequestContextParams,
  GetRequestContextResult,
  VectorSearchContextParams,
  VectorSearchContextResult,
  VectorUpsertContextParams,
  VectorUpsertContextResult,
} from './types';
