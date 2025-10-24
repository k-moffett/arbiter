/**
 * Agent Orchestrator HTTP Server
 *
 * Provides HTTP API for agent orchestration.
 * Handles query processing, context retrieval, and LLM interactions.
 */

import type { PersonalityType } from './PersonalityProvider/index.js';
import type { Express, NextFunction, Request, Response } from 'express';
import type { Server } from 'node:http';

import express from 'express';

import { Logger } from '../../../_shared/_infrastructure/index.js';
import { MCPClient } from '../../_shared/_lib/MCPClient/index.js';
import { OllamaProvider } from '../../_shared/_lib/OllamaProvider/index.js';
import { AgentOrchestrator } from './index.js';
import { PersonalityProviderImplementation } from './PersonalityProvider/index.js';
import { createRAGConfigFromEnv } from './RAGComponentConfigs/index.js';

const logger = new Logger({
  metadata: {
    serviceName: 'Agent Orchestrator Server',
  },
});

/**
 * Read configuration from environment
 */
function readConfig(): {
  embeddingModel: string;
  llmModel: string;
  mcpServerUrl: string;
  ollamaBaseUrl: string;
  ollamaTimeout: number;
  persistentPersonality: boolean;
  personalityType: PersonalityType;
  port: number;
} {
  const port = Number(process.env['ORCHESTRATOR_PORT'] ?? '3200');
  const ollamaBaseUrl = process.env['OLLAMA_BASE_URL'] ?? 'http://ollama:11434';
  const ollamaTimeout = Number(process.env['OLLAMA_TIMEOUT'] ?? '90000');
  const mcpServerUrl = process.env['MCP_SERVER_URL'] ?? 'http://mcp-server:3100';
  const llmModel = process.env['LLM_MODEL'] ?? 'llama3.1:8b';
  const embeddingModel = process.env['EMBEDDING_MODEL'] ?? 'nomic-embed-text';
  const personalityType = (process.env['AGENT_PERSONALITY'] ?? 'none') as PersonalityType;
  const persistentPersonality =
    process.env['PERSISTENT_AGENT_PERSONALITY'] === 'true' ? true : false;

  return {
    embeddingModel,
    llmModel,
    mcpServerUrl,
    ollamaBaseUrl,
    ollamaTimeout,
    personalityType,
    persistentPersonality,
    port,
  };
}

/**
 * Initialize all services (Ollama, MCP, Orchestrator)
 */
function setupServices(config: ReturnType<typeof readConfig>): {
  mcpClient: MCPClient;
  ollamaProvider: OllamaProvider;
  orchestrator: AgentOrchestrator;
} {
  const ollamaProvider = new OllamaProvider({
    baseUrl: config.ollamaBaseUrl,
    embeddingModel: config.embeddingModel,
    model: config.llmModel,
    timeout: config.ollamaTimeout,
  });

  const mcpClient = new MCPClient({ baseUrl: config.mcpServerUrl });

  // Initialize PersonalityProvider
  const personalityProvider = new PersonalityProviderImplementation({
    config: {
      persistentPersonality: config.persistentPersonality,
      personalityType: config.personalityType,
    },
  });

  const orchestrator = new AgentOrchestrator({
    embeddingModel: config.embeddingModel,
    llmModel: config.llmModel,
    mcpClient,
    ollamaProvider,
    personalityProvider,
    ragConfig: createRAGConfigFromEnv(),
  });

  return { mcpClient, ollamaProvider, orchestrator };
}

/**
 * Create Express app with middleware
 */
function createExpressApp(): Express {
  const app: Express = express();

  // Middleware - Large limit for self-hosted service
  app.use(express.json({ limit: '50mb' }));

  // CORS
  // eslint-disable-next-line local-rules/require-typed-params, @typescript-eslint/max-params
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    next();
  });

  return app;
}

/**
 * Validate process query request
 */
function validateProcessQueryRequest(body: unknown): {
  context?: Record<string, unknown>;
  query: string;
  sessionId: string;
  userId: string;
} | { error: string } {
  const reqBody = body as {
    context?: Record<string, unknown>;
    query: string;
    sessionId: string;
    userId: string;
  };

  if (typeof reqBody.query !== 'string') {
    return { error: 'Invalid request: query is required' };
  }
  if (typeof reqBody.sessionId !== 'string') {
    return { error: 'Invalid request: sessionId is required' };
  }
  if (typeof reqBody.userId !== 'string') {
    return { error: 'Invalid request: userId is required' };
  }

  return reqBody;
}

/**
 * Setup route handlers
 */
function setupRoutes(params: { app: Express; orchestrator: AgentOrchestrator }): void {
  const { app, orchestrator } = params;

  // Health check
  // eslint-disable-next-line local-rules/require-typed-params, @typescript-eslint/max-params
  app.get('/health', async (_req: Request, res: Response) => {
    try {
      const health = await orchestrator.health();
      res.json(health);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      });
    }
  });

  // Process query endpoint
  // eslint-disable-next-line local-rules/require-typed-params, @typescript-eslint/max-params
  app.post('/process-query', async (req: Request, res: Response) => {
    const validated = validateProcessQueryRequest(req.body);

    if ('error' in validated) {
      res.status(400).json({ error: validated.error });
      return;
    }

    const { query, sessionId, userId, context } = validated;

    try {
      const result = await orchestrator.processQuery({
        ...(context !== undefined ? { context } : {}),
        query,
        sessionId,
        userId,
      });

      res.json(result);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));

      logger.error({
        message: 'Error processing query',
        error: errorObj,
        context: {
          query,
          sessionId,
          userId,
          stack: errorObj.stack,
        },
      });

      res.status(500).json({
        error: errorObj.message,
        stack: errorObj.stack,
      });
    }
  });
}

/**
 * Verify LLM model is available
 */
async function verifyLLMModel(params: {
  llmModel: string;
  ollamaProvider: {
    complete(params: {
      maxTokens: number;
      model: string;
      prompt: string;
      temperature: number;
    }): Promise<unknown>;
  };
}): Promise<void> {
  try {
    logger.info({
      message: 'Verifying LLM model availability',
      context: { model: params.llmModel },
    });

    await params.ollamaProvider.complete({
      maxTokens: 5,
      model: params.llmModel,
      prompt: 'test',
      temperature: 0,
    });

    logger.info({
      message: 'LLM model verified and ready',
      context: { model: params.llmModel },
    });
  } catch (error) {
    logger.error({
      message: 'Failed to verify LLM model - may need to pull it',
      error: error instanceof Error ? error : new Error(String(error)),
      context: {
        model: params.llmModel,
        suggestion: `Run: docker exec arbiter-ollama ollama pull ${params.llmModel}`,
      },
    });
    throw new Error(`LLM model ${params.llmModel} not available. Please pull it first.`);
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(server: Server | null): void {
  const shutdown = async (): Promise<void> => {
    logger.info({ message: 'Shutting down' });

    if (server !== null) {
      const serverToClose = server;
      // Wrapping Node.js callback-based API requires Promise constructor
      // eslint-disable-next-line local-rules/no-promise-constructor, local-rules/require-typed-params, @typescript-eslint/max-params
      await new Promise<void>((resolve, reject) => {
        serverToClose.close((error) => {
          if (error !== undefined) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }

    logger.info({ message: 'Shutdown complete' });
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });
}

/**
 * Main server entry point
 */
async function main(): Promise<void> {
  const config = readConfig();

  logger.info({
    message: 'Starting Agent Orchestrator Server',
    context: {
      embeddingModel: config.embeddingModel,
      llmModel: config.llmModel,
      mcpServerUrl: config.mcpServerUrl,
      ollamaBaseUrl: config.ollamaBaseUrl,
      personalityType: config.personalityType,
      port: config.port,
    },
  });

  // Initialize services
  const { ollamaProvider, orchestrator } = setupServices(config);

  // Verify LLM model before starting server
  await verifyLLMModel({ llmModel: config.llmModel, ollamaProvider });

  // Create Express app with middleware
  const app = createExpressApp();

  // Setup routes
  setupRoutes({ app, orchestrator });

  // Start server
  let server: Server | null = null;

  try {
    // Wrapping Node.js callback-based API requires Promise constructor
    // eslint-disable-next-line local-rules/no-promise-constructor
    await new Promise<void>((resolve) => {
      server = app.listen(config.port, () => {
        logger.info({
          message: 'Server started successfully',
          context: { port: config.port },
        });
        resolve();
      });
    });
  } catch (error) {
    logger.error({
      message: 'Failed to start server',
      error: error instanceof Error ? error : new Error(String(error)),
    });
    process.exit(1);
  }

  // Setup graceful shutdown handlers
  setupGracefulShutdown(server);
}

// Run server
void main();
