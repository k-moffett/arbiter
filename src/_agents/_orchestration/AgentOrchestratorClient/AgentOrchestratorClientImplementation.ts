/**
 * Agent Orchestrator HTTP Client
 *
 * Client for calling the Agent Orchestrator HTTP service.
 * Provides typed interface for query processing.
 */

import type { QueryResult } from '../AgentOrchestrator/types';

/**
 * Orchestrator Client Configuration
 */
export interface OrchestratorClientConfig {
  /** Base URL of orchestrator service */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Orchestrator Client Interface
 */
export interface OrchestratorClient {
  /**
   * Check orchestrator health
   */
  health(): Promise<{ activeAgents: number; status: 'ok'; uptime: number }>;

  /**
   * Process a query
   */
  processQuery(params: {
    context?: Record<string, unknown>;
    query: string;
    sessionId: string;
  }): Promise<QueryResult>;
}

/**
 * Agent Orchestrator HTTP Client Implementation
 *
 * @example
 * ```typescript
 * const client = new AgentOrchestratorClientImplementation({
 *   baseUrl: 'http://agent-orchestrator:3200'
 * });
 *
 * const result = await client.processQuery({
 *   query: 'Hello!',
 *   sessionId: 'cli-session-123'
 * });
 * ```
 */
export class AgentOrchestratorClientImplementation implements OrchestratorClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: OrchestratorClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout ?? 60000; // 60 second default for LLM calls
  }

  /**
   * Check orchestrator health
   */
  public async health(): Promise<{ activeAgents: number; status: 'ok'; uptime: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 5000); // Short timeout for health checks

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${String(response.status)}: ${await response.text()}`);
      }

      const data = (await response.json()) as {
        activeAgents: number;
        status: 'ok';
        uptime: number;
      };
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Process a query through the orchestrator
   */
  public async processQuery(params: {
    context?: Record<string, unknown>;
    query: string;
    sessionId: string;
  }): Promise<QueryResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/process-query`, {
        body: JSON.stringify({
          context: params.context,
          query: params.query,
          sessionId: params.sessionId,
        }),
        headers: {
          /* eslint-disable @typescript-eslint/naming-convention */
          'Content-Type': 'application/json',
          /* eslint-enable @typescript-eslint/naming-convention */
        },
        method: 'POST',
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${String(response.status)}: ${errorText}`);
      }

      const result = (await response.json()) as QueryResult;
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Query processing timed out after ${String(this.timeout)}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
