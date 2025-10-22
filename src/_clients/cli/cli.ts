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
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const orchestratorTimeout = Number(process.env['AGENT_ORCHESTRATOR_TIMEOUT'] ?? '120000');

  const sessionId = `cli-session-${String(Date.now())}`;

  // Read CLI customization from environment
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const welcomeTitle = process.env['CLI_WELCOME_TITLE'] ?? 'Arbiter CLI';
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const welcomeMessage =
    process.env['CLI_WELCOME_MESSAGE'] ?? 'Context-Aware AI Agent';
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const useGradient = (process.env['CLI_USE_GRADIENT'] ?? 'true') === 'true';
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const showStats = (process.env['CLI_SHOW_STATS'] ?? 'false') === 'true';
  // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
  const gradientTheme = (process.env['CLI_GRADIENT_THEME'] ?? 'pastel') as 'pastel' | 'gold-black' | 'gold';

  logger.info({
    message: 'Initializing CLI',
    context: {
      orchestratorTimeout,
      orchestratorUrl,
      sessionId,
    },
  });

  // Initialize Orchestrator Client
  const orchestrator = new AgentOrchestratorClient({
    baseUrl: orchestratorUrl,
    timeout: orchestratorTimeout,
  });

  // Initialize Chat Service
  const chatService = new ChatService({ orchestrator });

  // Initialize CLI Service
  const cli = new CLIService({
    chatService,
    gradientTheme,
    sessionId,
    showStats,
    useGradient,
    welcomeMessage,
    welcomeTitle,
  });

  // Start CLI
  await cli.start();
}

// Run CLI
void main();
