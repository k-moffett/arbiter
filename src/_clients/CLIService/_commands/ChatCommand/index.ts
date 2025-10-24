/**
 * Chat Command
 *
 * Default command that starts an interactive chat session with the agent.
 * Provides real-time conversation with markdown rendering and Clack animations.
 *
 * Single Responsibility: Manage interactive chat sessions
 * Open/Closed: Extendable through flags and configuration
 */

import type { ChatService } from '../../../ChatService';

import { Flags } from '@oclif/core';

import { AgentOrchestratorClient } from '../../../../_agents/_orchestration/AgentOrchestratorClient';
import { getEnv, getUserId } from '../../../../_shared/utils';
import { ChatService as ChatServiceImpl } from '../../../ChatService';
import { CLIServiceImplementation } from '../../CLIServiceImplementation';
import { BaseCommandImplementation } from '../BaseCommand';

/**
 * Chat Command
 *
 * Starts an interactive chat session with the AI agent.
 *
 * @example
 * ```bash
 * # Start default chat
 * arbiter-cli
 *
 * # Start with custom session ID
 * arbiter-cli --session my-session
 *
 * # Enable debug mode
 * arbiter-cli --debug
 *
 * # Show statistics
 * arbiter-cli --stats
 * ```
 */
export default class ChatCommand extends BaseCommandImplementation {
  public static override description = 'Start an interactive chat session with the AI agent';

  public static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --session my-session',
    '<%= config.bin %> <%= command.id %> --debug --stats',
  ];

  public static override flags = {
    debug: Flags.boolean({
      char: 'd',
      default: false,
      description: 'Enable debug mode',
    }),
    session: Flags.string({
      char: 's',
      description: 'Custom session ID',
    }),
    stats: Flags.boolean({
      default: false,
      description: 'Show session statistics',
    }),
    theme: Flags.string({
      default: 'pastel',
      description: 'Color theme (pastel, gold, gold-orange, ocean, cyan-purple, fire)',
      options: ['pastel', 'gold', 'gold-orange', 'ocean', 'cyan-purple', 'fire'],
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(ChatCommand);

    // Read configuration from environment
    const orchestratorUrl = getEnv({
      defaultValue: 'http://agent-orchestrator:3200',
      key: 'AGENT_ORCHESTRATOR_URL',
    });
    const orchestratorTimeout = Number(
      getEnv({ defaultValue: '120000', key: 'AGENT_ORCHESTRATOR_TIMEOUT' })
    );

    const sessionId = flags.session ?? `cli-session-${String(Date.now())}`;
    const userId = getUserId();

    // Read CLI customization from environment
    const welcomeTitle = getEnv({ defaultValue: 'Arbiter CLI', key: 'CLI_WELCOME_TITLE' });
    const welcomeMessage = getEnv({
      defaultValue: 'Context-Aware AI Agent',
      key: 'CLI_WELCOME_MESSAGE',
    });

    this.logger.info({
      context: {
        orchestratorTimeout,
        orchestratorUrl,
        sessionId,
      },
      message: 'Initializing CLI',
    });

    // Initialize Orchestrator Client
    const orchestrator = new AgentOrchestratorClient({
      baseUrl: orchestratorUrl,
      timeout: orchestratorTimeout,
    });

    // Initialize Chat Service
    const chatService: ChatService = new ChatServiceImpl({ orchestrator });

    // Initialize CLI Service
    const cli = new CLIServiceImplementation({
      chatService,
      debug: flags.debug,
      gradientTheme: flags.theme as import('../../types').GradientTheme,
      sessionId,
      showStats: flags.stats,
      userId,
      welcomeMessage,
      welcomeTitle,
    });

    // Start CLI
    await cli.start();
  }
}
