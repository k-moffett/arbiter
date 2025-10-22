/**
 * Agent Orchestrator Implementation
 *
 * MVP implementation of agent orchestration service.
 * Processes queries with full context awareness using dual context system.
 * Future versions will support query decomposition and Docker agent spawning.
 */

import type {
  ContextPayload,
  ContextSearchResult,
} from '../../../_services/_mcpServer/ContextToolRegistry';
import type { MCPClient } from '../../_shared/_lib/MCPClient';
import type { CompletionParams, EmbedParams, LLMResponse } from '../../_shared/types';
import type { AgentOrchestrator } from './interfaces';
import type { QueryResult } from './types';

import { randomUUID } from 'node:crypto';

/**
 * Agent Orchestrator Configuration
 */
export interface AgentOrchestratorConfig {
  /** Agent orchestrator URL (for future use) */
  agentOrchestratorURL?: string;
  /** Embedding model name */
  embeddingModel?: string;
  /** LLM model name */
  llmModel: string;
  /** MCP client for context operations */
  mcpClient: MCPClient;
  /** Ollama provider for embeddings and completions */
  ollamaProvider: {
    complete(params: CompletionParams): Promise<LLMResponse>;
    embed(params: EmbedParams): Promise<number[]>;
    health(): Promise<boolean>;
  };
}

/**
 * Agent Orchestrator Implementation
 *
 * @example
 * ```typescript
 * const orchestrator = new AgentOrchestratorImplementation({
 *   mcpClient,
 *   ollamaProvider,
 *   llmModel: 'llama3.1:8b',
 *   embeddingModel: 'nomic-embed-text'
 * });
 *
 * const result = await orchestrator.processQuery({
 *   sessionId: 'cli-session-123',
 *   query: 'What did we discuss earlier?'
 * });
 * ```
 */
export class AgentOrchestratorImplementation implements AgentOrchestrator {
  private readonly embeddingModel: string;
  private readonly isRunning: boolean = true;
  private readonly llmModel: string;
  private readonly mcpClient: MCPClient;
  private readonly ollamaProvider: AgentOrchestratorConfig['ollamaProvider'];
  private requestCounter: number = 0;
  private readonly startTime: number;

  constructor(config: AgentOrchestratorConfig) {
    this.mcpClient = config.mcpClient;
    this.ollamaProvider = config.ollamaProvider;
    this.llmModel = config.llmModel;
    this.embeddingModel = config.embeddingModel ?? 'nomic-embed-text';
    this.startTime = Date.now();
  }

  /**
   * Health check
   */
  // eslint-disable-next-line @typescript-eslint/require-await -- Interface requires Promise return type
  public async health(): Promise<{ activeAgents: number; status: 'ok'; uptime: number }> {
    if (!this.isRunning) {
      throw new Error('Orchestrator is not running');
    }

    return {
      activeAgents: 0, // MVP: no Docker agents yet
      status: 'ok',
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Process query with context awareness
   */
  public async processQuery(params: {
    context?: Record<string, unknown>;
    query: string;
    sessionId: string;
  }): Promise<QueryResult> {
    const startTime = Date.now();

    // Generate request ID
    const requestId = this.generateRequestId();
    const rootRequestId = requestId; // MVP: no parent requests yet

    // Step 1: Generate embedding for query
    const queryEmbedding = await this.ollamaProvider.embed({
      model: this.embeddingModel,
      text: params.query,
    });

    // Step 2: Search for relevant context
    const contextResults = await this.searchRelevantContext({
      queryEmbedding,
      sessionId: params.sessionId,
    });

    // Step 3: Build prompt with context
    const prompt = this.buildPromptWithContext({
      context: contextResults,
      query: params.query,
    });

    // Step 4: Generate response
    const llmResponse = await this.ollamaProvider.complete({
      maxTokens: 2048,
      model: this.llmModel,
      prompt,
      temperature: 0.7,
    });

    // Step 5: Store user message
    await this.storeMessage({
      agentType: 'orchestrator',
      content: params.query,
      requestId,
      rootRequestId,
      role: 'user',
      sessionId: params.sessionId,
    });

    // Step 6: Store agent response
    await this.storeMessage({
      agentType: 'orchestrator',
      content: llmResponse.text,
      requestId,
      rootRequestId,
      role: 'bot',
      sessionId: params.sessionId,
    });

    const duration = Date.now() - startTime;

    // Build result
    return {
      agentsUsed: 1, // MVP: just orchestrator
      answer: llmResponse.text,
      confidence: 0.8, // MVP: static confidence
      // eslint-disable-next-line local-rules/require-typed-params, @typescript-eslint/max-params -- map callback with standard (element, index) signature
      sources: contextResults.map((result, index) => ({
        content: result.payload.content,
        id: `context-${String(index)}`,
        metadata: {
          agentType: result.payload.agentType,
          role: result.payload.role,
          timestamp: result.payload.timestamp,
        },
        score: result.score,
      })),
      totalCost: 0, // MVP: no cost tracking
      totalDuration: duration,
    };
  }

  /**
   * Build prompt with context
   */
  private buildPromptWithContext(params: {
    context: ContextSearchResult[];
    query: string;
  }): string {
    let prompt = '';

    // Add context if available
    if (params.context.length > 0) {
      prompt += 'Relevant conversation history:\n\n';
      for (const ctx of params.context) {
        const role = ctx.payload.role === 'user' ? 'User' : 'Assistant';
        prompt += `${role}: ${ctx.payload.content}\n`;
      }
      prompt += '\n---\n\n';
    }

    // Add current query
    prompt += `User: ${params.query}\n`;
    prompt += 'Assistant:';

    return prompt;
  }

  /**
   * Generate hierarchical request ID
   */
  private generateRequestId(): string {
    this.requestCounter++;
    const timestamp = Date.now();
    return `req_${String(timestamp)}.${String(this.requestCounter)}`;
  }

  /**
   * Search for relevant context using dual strategy
   */
  private async searchRelevantContext(params: {
    queryEmbedding: number[];
    sessionId: string;
  }): Promise<ContextSearchResult[]> {
    // Dual context strategy:
    // 1. Recent messages (last 10)
    // 2. Semantic search (top 5 relevant)

    try {
      // For MVP, just do semantic search
      // Future: combine with recent messages query and use queryEmbedding
      const searchResult = await this.mcpClient.searchContext({
        limit: 10,
        query: '', // Placeholder - MCPClient should use embedding
        sessionId: params.sessionId,
      });

      // Ensure results is always an array
      return Array.isArray(searchResult.results) ? searchResult.results : [];
    } catch {
      // If context search fails (e.g., empty database), return empty array
      // This allows the query to proceed without historical context
      return [];
    }
  }

  /**
   * Store message in Qdrant via MCP
   */
  private async storeMessage(params: {
    agentType: string;
    content: string;
    requestId: string;
    role: 'bot' | 'user';
    rootRequestId: string;
    sessionId: string;
  }): Promise<void> {
    // Generate embedding for message
    const embedding = await this.ollamaProvider.embed({
      model: this.embeddingModel,
      text: params.content,
    });

    // Generate UUID for message ID (recommended by Qdrant for efficient storage)
    const messageId = randomUUID();

    // Build payload
    const payload: ContextPayload = {
      agentType: params.agentType,
      channelId: 'cli', // MVP: CLI only
      containerInstanceId: 'orchestrator-1', // MVP: static instance
      content: params.content,
      embeddedText: params.content, // MVP: no enrichment yet
      role: params.role,
      sessionId: params.sessionId,
      tags: ['conversation'],
      timestamp: Date.now(),
      userId: 'default-user', // MVP: no user tracking yet
    };

    // Store via MCP client
    await this.mcpClient.upsertContext({
      agentType: params.agentType,
      containerInstanceId: 'orchestrator-1',
      messageId,
      payload,
      requestId: params.requestId,
      rootRequestId: params.rootRequestId,
      vector: embedding,
    });
  }
}
