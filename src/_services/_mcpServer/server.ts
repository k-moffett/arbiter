/**
 * MCP Server Entry Point
 *
 * Initializes and starts the MCP server based on environment configuration.
 */

import { Logger } from '../../_shared/_infrastructure/index.js';
import { MCPServer } from './MCPServer/index.js';

// Initialize logger for server module
const logger = new Logger({
  metadata: {
    serviceName: 'MCP Server',
  },
});

/**
 * Read configuration from environment variables
 */
function readConfig(): {
  agentOrchestratorURL: string;
  httpPort: number;
  qdrantApiKey?: string;
  qdrantUrl: string;
  transport: 'stdio' | 'streamable-http';
} {
  const transport = (process.env['TRANSPORT'] ?? 'http') as 'stdio' | 'streamable-http';
  const httpPort = Number(process.env['MCP_HTTP_PORT'] ?? '3100');
  const qdrantUrl = process.env['QDRANT_URL'] ?? 'http://qdrant:6333';
  const qdrantApiKey = process.env['QDRANT_API_KEY'];
  const agentOrchestratorURL = process.env['AGENT_ORCHESTRATOR_URL'] ?? 'http://agent-orchestrator:3200';

  const config: {
    agentOrchestratorURL: string;
    httpPort: number;
    qdrantApiKey?: string;
    qdrantUrl: string;
    transport: 'stdio' | 'streamable-http';
  } = {
    agentOrchestratorURL,
    httpPort,
    qdrantUrl,
    transport,
  };

  if (qdrantApiKey !== undefined) {
    config.qdrantApiKey = qdrantApiKey;
  }

  return config;
}

/**
 * Main server entry point
 */
async function main(): Promise<void> {
  const config = readConfig();

  logger.info({
    message: 'Starting with configuration',
    context: {
      agentOrchestratorURL: config.agentOrchestratorURL,
      httpPort: config.transport === 'streamable-http' ? config.httpPort : undefined,
      qdrantUrl: config.qdrantUrl,
      transport: config.transport,
    },
  });

  // Create server instance
  const server = new MCPServer();

  // Setup graceful shutdown
  const shutdown = async (): Promise<void> => {
    logger.info({ message: 'Shutting down' });
    try {
      await server.stop();
      logger.info({ message: 'Shutdown complete' });
      process.exit(0);
    } catch (error) {
      logger.error({
        message: 'Error during shutdown',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      process.exit(1);
    }
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });

  // Start server
  try {
    const serverConfig = {
      agentOrchestratorURL: config.agentOrchestratorURL,
      httpPort: config.httpPort,
      qdrantUrl: config.qdrantUrl,
      transports: [config.transport],
      ...(config.qdrantApiKey !== undefined && { qdrantApiKey: config.qdrantApiKey }),
    };

    await server.start(serverConfig);

    logger.info({ message: 'Server started successfully' });
  } catch (error) {
    logger.error({
      message: 'Failed to start',
      error: error instanceof Error ? error : new Error(String(error)),
    });
    process.exit(1);
  }
}

// Run server
void main();
