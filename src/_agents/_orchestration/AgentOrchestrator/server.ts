/**
 * Agent Orchestrator HTTP Server
 *
 * Provides HTTP API for agent orchestration.
 * Handles query processing, context retrieval, and LLM interactions.
 */

import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';
import type { Server } from 'node:http';

import { MCPClient } from '../../_shared/_lib/MCPClient/index.js';
import { OllamaProvider } from '../../_shared/_lib/OllamaProvider/index.js';
import { Logger } from '../../../_shared/_infrastructure/index.js';
import { AgentOrchestrator } from './index.js';

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
  port: number;
} {
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const port = Number(process.env['ORCHESTRATOR_PORT'] ?? '3200');
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const ollamaBaseUrl = process.env['OLLAMA_BASE_URL'] ?? 'http://ollama:11434';
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const mcpServerUrl = process.env['MCP_SERVER_URL'] ?? 'http://mcp-server:3100';
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const llmModel = process.env['LLM_MODEL'] ?? 'llama3.1:8b';
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const embeddingModel = process.env['EMBEDDING_MODEL'] ?? 'nomic-embed-text';

  return {
    embeddingModel,
    llmModel,
    mcpServerUrl,
    ollamaBaseUrl,
    port,
  };
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
      port: config.port,
    },
  });

  // Initialize Ollama provider
  const ollamaProvider = new OllamaProvider({
    baseUrl: config.ollamaBaseUrl,
    embeddingModel: config.embeddingModel,
    model: config.llmModel,
  });

  // Initialize MCP client
  const mcpClient = new MCPClient({ baseUrl: config.mcpServerUrl });

  // Initialize orchestrator
  const orchestrator = new AgentOrchestrator({
    embeddingModel: config.embeddingModel,
    llmModel: config.llmModel,
    mcpClient,
    ollamaProvider,
  });

  // Create Express app
  const app: Express = express();

  // Middleware - Large limit for self-hosted service (handles multiple embeddings + large payloads)
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
    // Declare outside try block for error logging
    let query: string | undefined;
    let sessionId: string | undefined;

    try {
      const body = req.body as {
        context?: Record<string, unknown>;
        query: string;
        sessionId: string;
      };

      query = body.query;
      sessionId = body.sessionId;
      const context = body.context;

      if (typeof query !== 'string' || typeof sessionId !== 'string') {
        res.status(400).json({
          error: 'Invalid request: query and sessionId are required',
        });
        return;
      }

      const result = await orchestrator.processQuery({
        context,
        query,
        sessionId,
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
          stack: errorObj.stack,
        },
      });

      res.status(500).json({
        error: errorObj.message,
        stack: errorObj.stack,
      });
    }
  });

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

  // Graceful shutdown
  const shutdown = async (): Promise<void> => {
    logger.info({ message: 'Shutting down' });

    if (server !== null) {
      // Wrapping Node.js callback-based API requires Promise constructor
      // eslint-disable-next-line local-rules/no-promise-constructor, local-rules/require-typed-params, @typescript-eslint/max-params
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => {
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

// Run server
void main();
