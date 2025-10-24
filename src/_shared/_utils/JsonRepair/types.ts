/**
 * JSON Repair - Type Definitions
 *
 * Types for JSON parsing and repair operations.
 */

import type { BaseLogger } from '@shared/_base/BaseLogger/index.js';

/**
 * Context for JSON repair operations
 */
export interface JsonRepairContext {
  logger: BaseLogger;
  operation: string;
}

/**
 * Result of a JSON repair attempt
 */
export interface JsonRepairResult<T> {
  data: T;
  originalLength: number;
  repairedLength?: number;
  wasRepaired: boolean;
}
