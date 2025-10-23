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
  queryType: 'simple' | 'complex' | 'comparative' | 'listBuilding';
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

/**
 * RAG Orchestration Types
 *
 * Types for the advanced RAG pipeline orchestration.
 */

import type { BuiltPrompt } from './AdvancedPromptBuilder/types';
import type { FittedContext } from './ContextWindowManager/types';
import type { RetrievedContext } from './HybridSearchRetriever/types';
import type { EnhancedQuery } from './QueryEnhancer/types';
import type { QueryRoute } from './QueryRouter/types';
import type { ValidatedContext } from './RAGValidator/types';
import type { ToolPlan } from './ToolPlanner/types';

/**
 * RAG orchestration request
 */
export interface RAGOrchestrationRequest {
  /**
   * Message ID for tracking
   */
  messageId: string;

  /**
   * User query
   */
  query: string;

  /**
   * Session ID
   */
  sessionId: string;

  /**
   * User ID
   */
  userId: string;
}

/**
 * RAG orchestration response
 */
export interface RAGOrchestrationResponse {
  /**
   * Built prompt ready for LLM execution
   */
  builtPrompt: BuiltPrompt;

  /**
   * Message ID
   */
  messageId: string;

  /**
   * Orchestration metadata for monitoring
   */
  metadata: RAGOrchestrationMetadata;

  /**
   * Path taken (fast or complex)
   */
  pathTaken: 'complex' | 'fast';
}

/**
 * RAG orchestration metadata
 */
export interface RAGOrchestrationMetadata {
  /**
   * Context statistics
   */
  contextStats: {
    fitted: number;
    retrieved: number;
    validated: number;
  };

  /**
   * Whether query was decomposed
   */
  decomposed: boolean;

  /**
   * Total orchestration duration
   */
  duration: number;

  /**
   * Whether query was enhanced
   */
  enhanced: boolean;

  /**
   * Processing steps executed
   */
  stepsExecuted: string[];
}

/**
 * RAG orchestration result (internal)
 *
 * Contains all intermediate results from the orchestration pipeline.
 */
export interface RAGOrchestrationResult {
  decomposition: DecomposedQuery | null;
  enhancement: EnhancedQuery | null;
  fittedContext: FittedContext;
  prompt: BuiltPrompt;
  retrieval: RetrievedContext;
  route: QueryRoute;
  toolPlan: ToolPlan | null;
  validation: ValidatedContext;
}
