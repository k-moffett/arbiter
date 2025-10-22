/**
 * History Command
 *
 * View, search, and export conversation history.
 *
 * Single Responsibility: Manage conversation history display and export
 * Open/Closed: Extendable through flags for filtering and export formats
 */

import * as fs from 'node:fs/promises';

import { Flags } from '@oclif/core';

import { AgentOrchestratorClient } from '../../../../_agents/_orchestration/AgentOrchestratorClient';
import { getEnv } from '../../../../_shared/utils';
import { ChatService } from '../../../ChatService';
import { formatHistoryTable } from '../../_lib/Formatters';
import { BaseCommandImplementation } from '../BaseCommand';

/**
 * History Command
 *
 * Display and manage conversation history.
 *
 * @example
 * ```bash
 * # View history
 * arbiter-cli history
 *
 * # Export to markdown
 * arbiter-cli history --export history.md
 *
 * # Search history
 * arbiter-cli history --search "keyword"
 * ```
 */
export default class HistoryCommand extends BaseCommandImplementation {
  public static override description = 'View and manage conversation history';

  public static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --export history.md',
    '<%= config.bin %> <%= command.id %> --search "keyword"',
    '<%= config.bin %> <%= command.id %> --session my-session',
  ];

  public static override flags = {
    export: Flags.string({
      char: 'e',
      description: 'Export history to file (markdown format)',
    }),
    search: Flags.string({
      char: 's',
      description: 'Search history for keyword',
    }),
    session: Flags.string({
      description: 'Session ID to view history for',
    }),
  };

  // eslint-disable-next-line max-statements -- Command requires multiple steps for initialization and filtering
  public override async run(): Promise<void> {
    const { flags } = await this.parse(HistoryCommand);

    // Read configuration from environment
    const orchestratorUrl = getEnv({
      defaultValue: 'http://agent-orchestrator:3200',
      key: 'AGENT_ORCHESTRATOR_URL',
    });
    const orchestratorTimeout = Number(
      getEnv({ defaultValue: '120000', key: 'AGENT_ORCHESTRATOR_TIMEOUT' })
    );

    const sessionId = flags.session ?? 'cli-session-default';

    // Initialize services
    const orchestrator = new AgentOrchestratorClient({
      baseUrl: orchestratorUrl,
      timeout: orchestratorTimeout,
    });

    const chatService = new ChatService({ orchestrator });

    // Get history
    const history = chatService.getHistory({ sessionId });

    if (history.length === 0) {
      this.theme.warning({ message: 'No conversation history found.' });
      return;
    }

    // Filter by search term if provided
    let filteredHistory = history;
    if (flags.search !== undefined) {
      const searchTerm = flags.search.toLowerCase();
      filteredHistory = history.filter((msg) => msg.content.toLowerCase().includes(searchTerm));

      if (filteredHistory.length === 0) {
        this.theme.warning({ message: `No messages found matching "${flags.search}".` });
        return;
      }
    }

    // Export if requested
    if (flags.export !== undefined) {
      await this.exportHistory({ filePath: flags.export, history: filteredHistory });
      return;
    }

    // Display history
    const formatted = formatHistoryTable({ history: filteredHistory });
    // eslint-disable-next-line no-console -- CLI output
    console.log(formatted);
  }

  /**
   * Convert history to markdown format
   */
  private convertToMarkdown(params: {
    history: Array<{ content: string; id: string; role: string; timestamp: number }>;
  }): string {
    const lines: string[] = ['# Conversation History', ''];

    for (const msg of params.history) {
      const timestamp = new Date(msg.timestamp).toLocaleString();
      const role = msg.role === 'user' ? '**You**' : '*Agent*';
      lines.push(`## ${role} - ${timestamp}`, '', msg.content, '');
    }

    return lines.join('\n');
  }

  /**
   * Export history to markdown file
   */
  private async exportHistory(params: {
    filePath: string;
    history: Array<{ content: string; id: string; role: string; timestamp: number }>;
  }): Promise<void> {
    const markdown = this.convertToMarkdown({ history: params.history });

    try {
      await fs.writeFile(params.filePath, markdown, 'utf-8');
      this.theme.success({ message: `History exported to ${params.filePath}` });
    } catch (error) {
      this.handleError({
        error: error instanceof Error ? error : new Error('Failed to export history'),
      });
    }
  }
}
