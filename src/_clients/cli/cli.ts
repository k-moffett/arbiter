/**
 * CLI Entry Point
 *
 * Initializes and starts the CLI chat interface.
 * Connects AgentOrchestrator, ChatService, and CLIService.
 */

import { AgentOrchestrator } from '../../_agents/_orchestration/AgentOrchestrator';
import { MCPClient } from '../../_agents/_shared/_lib/MCPClient';
import { OllamaProvider } from '../../_agents/_shared/_lib/OllamaProvider';
import { ChatService } from '../ChatService';
import { CLIService } from './index';

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  // Read configuration from environment
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const ollamaBaseUrl = process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434';
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const mcpServerUrl = process.env['MCP_SERVER_URL'] ?? 'http://localhost:3100';
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const llmModel = process.env['LLM_MODEL'] ?? 'llama3.1:8b';
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const embeddingModel = process.env['EMBEDDING_MODEL'] ?? 'nomic-embed-text';

  const sessionId = `cli-session-${String(Date.now())}`;

  console.error('[CLI] Initializing...');
  console.error(`[CLI] Session ID: ${sessionId}`);
  console.error(`[CLI] Ollama: ${ollamaBaseUrl}`);
  console.error(`[CLI] MCP Server: ${mcpServerUrl}`);
  console.error(`[CLI] LLM Model: ${llmModel}`);
  console.error(`[CLI] Embedding Model: ${embeddingModel}`);

  // Initialize Ollama provider
  const ollamaProvider = new OllamaProvider({
    baseUrl: ollamaBaseUrl,
    embeddingModel,
    model: llmModel,
  });

  // Initialize MCP client
  const mcpClient = new MCPClient({ baseUrl: mcpServerUrl });

  // Initialize Agent Orchestrator
  const orchestrator = new AgentOrchestrator({
    embeddingModel,
    llmModel,
    mcpClient,
    ollamaProvider,
  });

  // Initialize Chat Service
  const chatService = new ChatService({ orchestrator });

  // Initialize CLI Service
  const cli = new CLIService({
    chatService,
    sessionId,
  });

  // Start CLI
  await cli.start();
}

// Run CLI
void main();
