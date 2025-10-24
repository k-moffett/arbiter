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
import type { PersonalityProvider } from './PersonalityProvider';
import type { RAGSystemConfig } from './RAGComponentConfigs';
import type { QueryResult } from './types';

import { randomUUID } from 'node:crypto';

import { Logger } from '../../../_shared/_infrastructure';
import { ConfidenceCalculator } from './ConfidenceCalculator';
import { PersonalityProviderImplementation } from './PersonalityProvider';
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
  /** Personality provider for dynamic personality system (optional, defaults to 'none') */
  personalityProvider?: PersonalityProvider;
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
  private readonly personalityProvider: PersonalityProvider;
  private readonly ragService: RAGOrchestrationService;
  private requestCounter: number = 0;
  private readonly sessionFirstMessages: Set<string> = new Set();
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

    // Initialize PersonalityProvider with default fallback
    this.personalityProvider =
      config.personalityProvider ??
      new PersonalityProviderImplementation({
        config: { personalityType: 'none' },
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

    // Handle personality and first message logic
    const { isFirstMessage, userName } = await this.handlePersonalityContext({
      sessionId: params.sessionId,
      userId: params.userId,
    });

    // Step 1: RAG Orchestration (all advanced RAG components)
    const ragResult = await this.ragService.orchestrate(
      this.buildRAGOrchestrationRequest({
        isFirstMessage,
        messageId,
        query: params.query,
        sessionId: params.sessionId,
        userId: params.userId,
        userName,
      })
    );

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
    // Note: LLM generates welcome message naturally based on prompt instructions
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
   * Build RAG orchestration request with personality
   */
  private buildRAGOrchestrationRequest(params: {
    isFirstMessage: boolean;
    messageId: string;
    query: string;
    sessionId: string;
    userId: string;
    userName: string | undefined;
  }): import('./types').RAGOrchestrationRequest {
    const request: import('./types').RAGOrchestrationRequest = {
      messageId: params.messageId,
      query: params.query,
      sessionId: params.sessionId,
      userId: params.userId,
    };

    // Add personality prompt only if should be applied for this interaction
    const shouldApply = this.personalityProvider.shouldApplyPersonality({
      isFirstMessage: params.isFirstMessage,
    });
    if (shouldApply) {
      const personalityPrompt =
        this.personalityProvider.getPersonalityPrompt().systemPromptAddition;
      if (personalityPrompt !== '') {
        request.personalityPrompt = personalityPrompt;
      }
    }

    // Add first message flag
    if (params.isFirstMessage) {
      request.isFirstMessage = params.isFirstMessage;
    }

    // Add user name if discovered
    if (params.userName !== undefined) {
      request.userName = params.userName;
    }

    return request;
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
   * Handle personality context and first message detection
   */
  private async handlePersonalityContext(params: {
    sessionId: string;
    userId: string;
  }): Promise<{ isFirstMessage: boolean; userName: string | undefined }> {
    // Detect first message for this session
    const isFirstMessage = !this.sessionFirstMessages.has(params.sessionId);
    if (isFirstMessage) {
      this.sessionFirstMessages.add(params.sessionId);
    }

    // Search for user preferences on first message (if personality is active)
    let userName: string | undefined;
    if (this.personalityProvider.shouldSearchForPreferences({ isFirstMessage })) {
      const preferences = await this.searchForUserPreferences({
        sessionId: params.sessionId,
        userId: params.userId,
      });
      userName = preferences.userName;
    }

    return { isFirstMessage, userName };
  }

  /**
   * Search for user preferences in conversation history
   *
   * Searches for user's name and preferences from previous conversations.
   * Called only on first message of a session when personality is active.
   */
  private async searchForUserPreferences(params: {
    sessionId: string;
    userId: string;
  }): Promise<{ userName?: string }> {
    try {
      // Search conversation history for user introductions
      // More specific query to find messages where user states their name
      const query = 'user introduction my name';

      // Generate embedding for search query
      const embedding = await this.ollamaProvider.embed({
        model: this.embeddingModel,
        text: query,
      });

      // Search via MCP client with increased limit to capture more history
      const searchResult = await this.mcpClient.searchContext({
        limit: 30,
        query,
        queryVector: embedding,
        userId: params.userId,
      });

      // Extract user name from results if available
      // Expanded patterns to capture more name variations
      // Captures single or multi-word names (e.g., "John" or "John Smith")
      const namePattern =
        /(?:my name is|my name's|I'm|I am|call me|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;

      for (const result of searchResult.results) {
        const match = result.payload.content.match(namePattern);
        const extractedName = match?.[1];

        if (extractedName !== undefined) {
          this.logger.debug({
            message: 'Found user name in conversation history',
            metadata: { userName: extractedName },
          });
          return { userName: extractedName };
        }
      }

      this.logger.debug({
        message: 'No user name found in conversation history',
        metadata: { resultsSearched: searchResult.results.length },
      });
      return {};
    } catch (error) {
      this.logger.error({
        message: 'Failed to search for user preferences',
        metadata: { error, sessionId: params.sessionId },
      });
      return {};
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
