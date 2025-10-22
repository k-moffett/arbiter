/**
 * CLI Entry Point
 *
 * Initializes and starts the CLI chat interface.
 * Connects AgentOrchestrator, ChatService, and CLIService.
 */

import { AgentOrchestratorClient } from '../../_agents/_orchestration/AgentOrchestratorClient';
import { Logger } from '../../_shared/_infrastructure';
import { ChatService } from '../ChatService';
import { CLIService } from './index';

const logger = new Logger({
  metadata: {
    serviceName: 'CLI',
  },
});

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  // Read configuration from environment
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const orchestratorUrl =
    process.env['AGENT_ORCHESTRATOR_URL'] ?? 'http://agent-orchestrator:3200';

  const sessionId = `cli-session-${String(Date.now())}`;

  logger.info({
    message: 'Initializing CLI',
    context: {
      orchestratorUrl,
      sessionId,
    },
  });

  // Initialize Orchestrator Client
  const orchestrator = new AgentOrchestratorClient({
    baseUrl: orchestratorUrl,
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
