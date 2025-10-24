/**
 * Text Chunking Service Module
 *
 * Exports the Text Chunking Service and related types.
 */

export type { ChunkTextParams, ITextChunkingService } from './interfaces.js';
export {
  type IChunkingStrategy,
  TextChunkingService,
  type TextChunkingServiceParams,
} from './TextChunkingServiceImplementation.js';
export type { ChunkingStrategy, TextChunk } from './types.js';
