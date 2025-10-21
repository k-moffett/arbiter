/**
 * Agent Orchestrator Type Definitions
 *
 * Type definitions for the agent orchestration service.
 * This service spawns and manages agent containers dynamically.
 */

/**
 * Agent type enum
 */
export enum AgentType {
  QUERY = 'query',
  RESEARCH = 'research',
  SPECIALIST = 'specialist',
  SYNTHESIS = 'synthesis',
  VALIDATION = 'validation',
}

/**
 * Agent specification for spawning
 */
export interface AgentSpec {
  containerImage: string;
  dependencies: string[];
  llmModel: string;
  llmProvider: 'anthropic' | 'openai' | 'ollama';
  resources: {
    cpu: string;
    memory: string;
  };
  type: AgentType;
}

/**
 * Agent spawn plan
 */
export interface AgentSpawnPlan {
  agents: AgentSpec[];
  estimatedCost: number;
  estimatedDuration: number;
  executionMode: 'sequential' | 'parallel' | 'hybrid';
}

/**
 * Agent task parameters
 */
export interface AgentTask {
  context: Record<string, unknown>;
  domain?: string;
  query: string;
  sessionId: string;
  taskId: string;
}

/**
 * Agent result
 */
export interface AgentResult {
  data?: unknown;
  duration: number;
  error?: string;
  success: boolean;
  taskId: string;
  tokensUsed?: number;
  type: AgentType;
}

/**
 * Query result
 */
export interface QueryResult {
  agentsUsed: number;
  answer: string;
  confidence: number;
  sources: Source[];
  totalCost: number;
  totalDuration: number;
}

/**
 * Source reference
 */
export interface Source {
  content: string;
  id: string;
  metadata: Record<string, unknown>;
  score: number;
}

/**
 * Decomposed query
 */
export interface DecomposedQuery {
  complexity: number;
  originalQuery: string;
  queryType: 'simple' | 'complex' | 'comparative' | 'list-building';
  subQueries: SubQuery[];
}

/**
 * Sub-query
 */
export interface SubQuery {
  dependencies: string[];
  priority: number;
  query: string;
  suggestedTool: string;
}
