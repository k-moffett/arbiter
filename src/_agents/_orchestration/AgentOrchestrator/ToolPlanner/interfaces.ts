/**
 * Tool Planner Interfaces
 *
 * Interface definitions for LLM-guided tool planning.
 */

import type { ToolPlan, ToolPlanningParams } from './types';

/**
 * Tool planner interface
 *
 * Uses LLM to determine which tools to call and in what order.
 * NOT hardcoded rules - flexible and extensible.
 */
export interface ToolPlanner {
  /**
   * Plan tool execution for a query
   *
   * Analyzes the query and context to determine which tools to execute.
   * Returns an ordered plan of tool steps with parameters.
   *
   * The LLM considers:
   * - Query complexity and intent
   * - Available context (if any)
   * - Tool capabilities
   * - Execution dependencies
   *
   * @param params - Planning parameters
   * @param params.query - Original user query
   * @param params.complexity - Query complexity score (1-10)
   * @param params.intentType - Query intent type
   * @param params.availableContext - Available context from retrieval
   * @returns Tool execution plan
   */
  planTools(params: ToolPlanningParams): Promise<ToolPlan>;
}
