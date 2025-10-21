/**
 * MCP Server Entry Point
 *
 * Initializes and starts the MCP server based on environment configuration.
 */

import { MCPServer } from './MCPServer';

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
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const transport = (process.env['TRANSPORT'] ?? 'http') as 'stdio' | 'streamable-http';
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const httpPort = Number(process.env['MCP_HTTP_PORT'] ?? '3100');
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const qdrantUrl = process.env['QDRANT_URL'] ?? 'http://qdrant:6333';
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const qdrantApiKey = process.env['QDRANT_API_KEY'];
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
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

  console.error('[MCP Server] Starting with configuration:');
  console.error(`- Transport: ${config.transport}`);
  if (config.transport === 'streamable-http') {
    console.error(`- HTTP Port: ${String(config.httpPort)}`);
  }
  console.error(`- Qdrant URL: ${config.qdrantUrl}`);
  console.error(`- Agent Orchestrator URL: ${config.agentOrchestratorURL}`);

  // Create server instance
  const server = new MCPServer();

  // Setup graceful shutdown
  const shutdown = async (): Promise<void> => {
    console.error('[MCP Server] Shutting down...');
    try {
      await server.stop();
      console.error('[MCP Server] Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('[MCP Server] Error during shutdown:', error);
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

    console.error('[MCP Server] Server started successfully');
  } catch (error) {
    console.error('[MCP Server] Failed to start:', error);
    process.exit(1);
  }
}

// Run server
void main();
