/**
 * Agent Orchestrator Implementation
 *
 * Advanced RAG-powered agent orchestration service.
 * Features dual-path architecture, hybrid search, and quality feedback loop.
 */

import type { ContextPayload } from '../../../_services/_mcpServer/ContextToolRegistry';
import type { MCPClient } from '../../_shared/_lib/MCPClient';
import type { CompletionParams, EmbedParams, LLMResponse } from '../../_shared/types';
import type { AgentOrchestrator } from './interfaces';
import type { RAGSystemConfig } from './RAGComponentConfigs';
import type { QueryResult } from './types';

import { randomUUID } from 'node:crypto';

import { Logger } from '../../../_shared/_infrastructure';
import { ConfidenceCalculator } from './ConfidenceCalculator';
import { DEFAULT_RAG_CONFIG } from './RAGComponentConfigs';
import { RAGComponentFactory } from './RAGComponentFactory';
import { RAGOrchestrationService } from './RAGOrchestrationService';

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
  /** RAG system configuration (optional, uses defaults if not provided) */
  ragConfig?: RAGSystemConfig;
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
  private readonly logger: Logger;
  private readonly mcpClient: MCPClient;
  private readonly ollamaProvider: AgentOrchestratorConfig['ollamaProvider'];
  private readonly ragService: RAGOrchestrationService;
  private requestCounter: number = 0;
  private readonly startTime: number;

  constructor(config: AgentOrchestratorConfig) {
    this.mcpClient = config.mcpClient;
    this.ollamaProvider = config.ollamaProvider;
    this.llmModel = config.llmModel;
    this.embeddingModel = config.embeddingModel ?? 'nomic-embed-text';
    this.startTime = Date.now();
    this.logger = new Logger({
      metadata: {
        className: 'AgentOrchestratorImplementation',
        serviceName: 'Agent Orchestrator',
      },
    });

    // Initialize RAG system with all components
    const ragConfig = config.ragConfig ?? DEFAULT_RAG_CONFIG;
    this.ragService = RAGComponentFactory.create({
      config: ragConfig,
      logger: this.logger,
      mcpClient: this.mcpClient,
      ollamaProvider: this.ollamaProvider,
      userId: 'system', // Default, will be overridden per request
    });

    this.logger.info({
      message: 'Agent Orchestrator initialized with advanced RAG system',
      metadata: {
        llmModel: this.llmModel,
        embeddingModel: this.embeddingModel,
      },
    });
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
   * Process query with advanced RAG pipeline
   */
  // eslint-disable-next-line max-lines-per-function -- RAG orchestration requires multiple sequential steps
  public async processQuery(params: {
    context?: Record<string, unknown>;
    query: string;
    sessionId: string;
    userId: string;
  }): Promise<QueryResult> {
    const startTime = Date.now();

    // Generate request ID and message ID
    const requestId = this.generateRequestId();
    const rootRequestId = requestId;
    const messageId = randomUUID();

    // Step 1: RAG Orchestration (all advanced RAG components)
    const ragResult = await this.ragService.orchestrate({
      messageId,
      query: params.query,
      sessionId: params.sessionId,
      userId: params.userId,
    });

    this.logger.info({
      message: 'RAG orchestration complete',
      metadata: {
        contextFitted: ragResult.metadata.contextStats.fitted,
        contextRetrieved: ragResult.metadata.contextStats.retrieved,
        contextValidated: ragResult.metadata.contextStats.validated,
        decomposed: ragResult.metadata.decomposed,
        enhanced: ragResult.metadata.enhanced,
        pathTaken: ragResult.pathTaken,
        query: params.query,
        stepsExecuted: ragResult.metadata.stepsExecuted.join(' → '),
      },
    });

    // Step 2: LLM Completion using advanced RAG prompt
    const llmResponse = await this.ollamaProvider.complete({
      maxTokens: 2048,
      model: this.llmModel,
      prompt: ragResult.builtPrompt.prompt,
      temperature: 0.7,
    });

    // Step 3: Store user message
    await this.storeMessage({
      agentType: 'orchestrator',
      content: params.query,
      requestId,
      role: 'user',
      rootRequestId,
      sessionId: params.sessionId,
      userId: params.userId,
    });

    // Step 4: Store bot response
    await this.storeMessage({
      agentType: 'orchestrator',
      content: llmResponse.text,
      requestId,
      role: 'bot',
      rootRequestId,
      sessionId: params.sessionId,
      userId: params.userId,
    });

    // Step 5: Background quality grading (non-blocking feedback loop)
    this.ragService
      .gradeResponse({
        messageId,
        query: params.query,
        response: llmResponse.text,
        retrievedContext: ragResult.builtPrompt.citations.map((c) => c.content),
      })
      .catch((err: unknown) => {
        this.logger.error({
          message: 'Background quality grading failed',
          metadata: { error: err, messageId },
        });
      });

    // Step 6: Calculate dynamic confidence
    const confidence = ConfidenceCalculator.calculate({
      citations: ragResult.builtPrompt.citations,
      metadata: ragResult.metadata,
    });

    const duration = Date.now() - startTime;

    // Step 7: Build result with citations
    return {
      agentsUsed: 1,
      answer: llmResponse.text,
      confidence,
      sources: ragResult.builtPrompt.citations.map((citation) => ({
        content: citation.content,
        id: citation.messageId,
        metadata: {
          citationId: citation.citationId,
          relevanceScore: citation.relevanceScore,
          timestamp: citation.timestamp,
        },
        score: citation.relevanceScore,
      })),
      totalCost: 0,
      totalDuration: duration,
    };
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
   * Store message in Qdrant via MCP
   */
  private async storeMessage(params: {
    agentType: string;
    content: string;
    requestId: string;
    role: 'bot' | 'user';
    rootRequestId: string;
    sessionId: string;
    userId: string;
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
      userId: params.userId,
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
