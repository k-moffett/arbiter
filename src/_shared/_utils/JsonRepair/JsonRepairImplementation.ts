/**
 * JSON Repair Utility Implementation
 *
 * Provides robust JSON parsing with automatic repair fallback.
 * Uses jsonrepair library to fix malformed JSON from LLM responses.
 *
 * Pattern: Try parse → Try repair → Throw error
 */

import type { JsonRepairContext, JsonRepairResult } from './types.js';

import { jsonrepair } from 'jsonrepair';

/**
 * Parse JSON string with automatic repair fallback
 *
 * @param jsonString - JSON string to parse
 * @param context - Context with logger and operation name
 * @returns Parsed object
 * @throws Error if both parse and repair fail
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Generic provides type safety for callers
export function parseWithRepair<T = unknown>(params: {
  context: JsonRepairContext;
  jsonString: string;
}): T {
  const { context, jsonString } = params;

  // Try 1: Direct parse
  try {
    return JSON.parse(jsonString) as T;
  } catch (parseError) {
    context.logger.warn({
      context: { operation: context.operation },
      message: 'JSON parse failed, attempting repair',
    });

    // Try 2: Repair and parse
    try {
      const repaired = jsonrepair(jsonString);
      const result = JSON.parse(repaired) as T;

      context.logger.info({
        context: {
          operation: context.operation,
          originalLength: jsonString.length,
          repairedLength: repaired.length,
        },
        message: 'JSON repaired successfully',
      });

      return result;
    } catch (repairError) {
      context.logger.error({
        context: {
          operation: context.operation,
          original: jsonString.substring(0, 200),
          parseError: (parseError as Error).message,
          repairError: (repairError as Error).message,
        },
        message: 'JSON repair failed',
      });

      throw new Error(`JSON parse and repair both failed: ${(repairError as Error).message}`);
    }
  }
}

/**
 * Parse JSON string with automatic repair and detailed result
 *
 * Returns information about whether repair was needed
 *
 * @param jsonString - JSON string to parse
 * @param context - Context with logger and operation name
 * @returns Repair result with data and metadata
 * @throws Error if both parse and repair fail
 */
export function parseWithRepairDetailed<T = unknown>(params: {
  context: JsonRepairContext;
  jsonString: string;
}): JsonRepairResult<T> {
  const { context, jsonString } = params;

  // Try 1: Direct parse
  try {
    const data = JSON.parse(jsonString) as T;
    return {
      data,
      originalLength: jsonString.length,
      wasRepaired: false,
    };
  } catch (parseError) {
    context.logger.warn({
      context: { operation: context.operation },
      message: 'JSON parse failed, attempting repair',
    });

    // Try 2: Repair and parse
    try {
      const repaired = jsonrepair(jsonString);
      const data = JSON.parse(repaired) as T;

      context.logger.info({
        context: {
          operation: context.operation,
          originalLength: jsonString.length,
          repairedLength: repaired.length,
        },
        message: 'JSON repaired successfully',
      });

      return {
        data,
        originalLength: jsonString.length,
        repairedLength: repaired.length,
        wasRepaired: true,
      };
    } catch (repairError) {
      context.logger.error({
        context: {
          operation: context.operation,
          original: jsonString.substring(0, 200),
          parseError: (parseError as Error).message,
          repairError: (repairError as Error).message,
        },
        message: 'JSON repair failed',
      });

      throw new Error(`JSON parse and repair both failed: ${(repairError as Error).message}`);
    }
  }
}
