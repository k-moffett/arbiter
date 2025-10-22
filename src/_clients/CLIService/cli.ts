/**
 * CLI Entry Point
 *
 * Initializes and starts the CLI chat interface.
 * Connects AgentOrchestrator, ChatService, and CLIService.
 */

import { AgentOrchestratorClient } from '../../_agents/_orchestration/AgentOrchestratorClient';
import { Logger } from '../../_shared/_infrastructure';
import { getEnv, getUserId } from '../../_shared/utils';
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
  const orchestratorUrl = getEnv({
    defaultValue: 'http://agent-orchestrator:3200',
    key: 'AGENT_ORCHESTRATOR_URL',
  });
  const orchestratorTimeout = Number(
    getEnv({ defaultValue: '120000', key: 'AGENT_ORCHESTRATOR_TIMEOUT' })
  );

  const sessionId = `cli-session-${String(Date.now())}`;
  const userId = getUserId();

  // Read CLI customization from environment
  const welcomeTitle = getEnv({ defaultValue: 'Arbiter CLI', key: 'CLI_WELCOME_TITLE' });
  const welcomeMessage = getEnv({
    defaultValue: 'Context-Aware AI Agent',
    key: 'CLI_WELCOME_MESSAGE',
  });
  const useGradient = getEnv({ defaultValue: 'true', key: 'CLI_USE_GRADIENT' }) === 'true';
  const showStats = getEnv({ defaultValue: 'false', key: 'CLI_SHOW_STATS' }) === 'true';
  const gradientTheme = getEnv({ defaultValue: 'pastel', key: 'CLI_GRADIENT_THEME' }) as
    | 'gold'
    | 'gold-black'
    | 'pastel';

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
    userId,
    welcomeMessage,
    welcomeTitle,
  });

  // Start CLI
  await cli.start();
}

// Run CLI
void main();
