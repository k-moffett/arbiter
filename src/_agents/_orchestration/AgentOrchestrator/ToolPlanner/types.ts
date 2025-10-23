/**
 * Tool Planner Type Definitions
 *
 * Types for LLM-guided tool planning and selection.
 */

/**
 * Available tool types
 *
 * Current tools:
 * - vector_search_context: Semantic search in conversation history
 * - summarize_context: Summarize retrieved context
 * - analysis: Analyze and synthesize information
 *
 * Extensible for future tools (web search, calculator, code execution, etc.)
 */
export type ToolType = 'analysis' | 'summarize_context' | 'vector_search_context';

/**
 * Tool execution step
 *
 * Represents a single tool to execute with its parameters.
 */
export interface ToolStep {
  /**
   * Step description/rationale
   */
  description: string;

  /**
   * Tool parameters (flexible JSON object)
   */
  parameters: Record<string, unknown>;

  /**
   * Execution priority (1 = highest, execute first)
   */
  priority: number;

  /**
   * Tool to execute
   */
  tool: ToolType;
}

/**
 * Tool execution plan
 *
 * Ordered list of tools to execute to answer the query.
 */
export interface ToolPlan {
  /**
   * Plan rationale/explanation
   */
  rationale: string;

  /**
   * Execution steps (ordered by priority)
   */
  steps: ToolStep[];
}

/**
 * Tool planning parameters
 */
export interface ToolPlanningParams {
  /**
   * Available context from retrieval (optional)
   * Helps LLM decide if more retrieval is needed
   */
  availableContext?: string[];

  /**
   * Complexity score from QueryRouter (1-10)
   * Higher complexity may require more tools
   */
  complexity?: number;

  /**
   * Query intent type (from QueryDecomposer)
   * Helps guide tool selection
   */
  intentType?: 'comparative' | 'factual' | 'hybrid' | 'listBuilding' | 'semantic' | 'temporal';

  /**
   * Original user query
   */
  query: string;
}

/**
 * Tool planner configuration
 */
export interface ToolPlannerConfig {
  /**
   * LLM model to use for planning
   */
  llmModel: string;

  /**
   * Maximum number of tool steps in a plan
   */
  maxSteps: number;

  /**
   * Temperature for LLM planning
   */
  temperature: number;
}
