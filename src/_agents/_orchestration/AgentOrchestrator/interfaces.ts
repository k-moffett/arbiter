/**
 * Agent Orchestrator Interfaces
 *
 * Core interfaces for agent orchestration.
 */

import type {
  AgentTask as _AgentTask,
  AgentResult,
  AgentSpawnPlan,
  AgentSpec,
  DecomposedQuery,
  QueryResult,
} from './types';
import type { Container } from 'dockerode';

/**
 * Agent spawning strategy interface
 */
export interface AgentSpawningStrategy {
  /**
   * Create spawn plan based on query analysis
   */
  plan(query: string, decomposition: DecomposedQuery): AgentSpawnPlan;
}

/**
 * Docker agent spawner interface
 */
export interface DockerAgentSpawner {
  /**
   * Kill agent container
   */
  killAgent(container: Container): Promise<void>;

  /**
   * Spawn agent container
   */
  spawnAgent(spec: AgentSpec): Promise<Container>;

  /**
   * Wait for agent result
   */
  waitForResult(container: Container, timeout?: number): Promise<AgentResult>;
}

/**
 * Agent pool manager interface
 */
export interface AgentPoolManager {
  /**
   * Cleanup session agents
   */
  cleanupSession(sessionId: string): Promise<void>;

  /**
   * Get agents for session
   */
  getBySession(sessionId: string): Container[];

  /**
   * Get total active agents
   */
  getTotalActive(): number;

  /**
   * Register active agent
   */
  register(sessionId: string, container: Container): void;
}

/**
 * Query decomposer interface
 */
export interface QueryDecomposer {
  /**
   * Decompose query into sub-queries
   */
  decompose(query: string): Promise<DecomposedQuery>;
}

/**
 * Agent orchestrator interface
 */
export interface AgentOrchestrator {
  /**
   * Health check
   */
  health(): Promise<{ activeAgents: number; status: 'ok'; uptime: number }>;

  /**
   * Process query with dynamic agent spawning
   */
  processQuery(params: {
    context?: Record<string, unknown>;
    query: string;
    sessionId: string;
    userId: string;
  }): Promise<QueryResult>;
}
