/**
 * Config Command
 *
 * Manage CLI configuration and settings.
 *
 * Single Responsibility: Manage CLI configuration
 * Open/Closed: Extendable through subcommands for different settings
 */

import { Flags } from '@oclif/core';

import { detectTerminal } from '../../_lib/Formatters';
import { BaseCommandImplementation } from '../BaseCommand';

/**
 * Config Command
 *
 * View and update CLI configuration.
 *
 * @example
 * ```bash
 * # View current configuration
 * arbiter-cli config
 *
 * # Set theme
 * arbiter-cli config --theme gold
 *
 * # Enable stats
 * arbiter-cli config --stats
 * ```
 */
export default class ConfigCommand extends BaseCommandImplementation {
  public static override description = 'View and manage CLI configuration';

  public static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --theme gold',
    '<%= config.bin %> <%= command.id %> --stats',
  ];

  public static override flags = {
    stats: Flags.boolean({
      description: 'Enable/disable session statistics',
    }),
    theme: Flags.string({
      description: 'Set color theme (pastel, gold, gold-black)',
      options: ['pastel', 'gold', 'gold-black'],
    }),
  };

  public override async run(): Promise<void> {
    const { flags } = await this.parse(ConfigCommand);

    const terminal = detectTerminal();

    // If no flags provided, display current configuration
    if (Object.keys(flags).length === 0) {
      this.displayCurrentConfig({ terminal });
      return;
    }

    // Update configuration based on flags
    if (flags.theme !== undefined) {
      this.theme.success({ message: `Theme set to: ${flags.theme}` });
      this.theme.info({
        message: 'Note: Update CLI_GRADIENT_THEME environment variable to persist this setting.',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- flags.stats can be undefined when not provided
    if (flags.stats !== undefined) {
      const status = flags.stats ? 'enabled' : 'disabled';
      this.theme.success({ message: `Statistics ${status}` });
      this.theme.info({
        message: 'Note: Update CLI_SHOW_STATS environment variable to persist this setting.',
      });
    }
  }

  /**
   * Display current configuration
   */
  private displayCurrentConfig(params: {
    terminal: { asciiOnly: boolean; supportsColor: boolean; terminalWidth: number };
  }): void {
    this.theme.intro({ title: 'CLI Configuration' });

    const config = [
      `Terminal Width: ${String(params.terminal.terminalWidth)} columns`,
      `Color Support: ${params.terminal.supportsColor ? 'Yes' : 'No'}`,
      `Unicode Support: ${params.terminal.asciiOnly ? 'No' : 'Yes'}`,
      '',
      'Environment Variables:',
      // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
      `  CLI_GRADIENT_THEME: ${process.env['CLI_GRADIENT_THEME'] ?? 'pastel'}`,
      // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
      `  CLI_SHOW_STATS: ${process.env['CLI_SHOW_STATS'] ?? 'false'}`,
      // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
      `  CLI_FORCE_COLOR: ${process.env['CLI_FORCE_COLOR'] ?? 'false'}`,
      // eslint-disable-next-line local-rules/no-bracket-notation -- process.env is an index signature
      `  CLI_ASCII_ONLY: ${process.env['CLI_ASCII_ONLY'] ?? 'false'}`,
    ];

    // eslint-disable-next-line no-console -- CLI output
    console.log('\n' + config.join('\n') + '\n');

    this.theme.info({
      message: 'Use environment variables in .env to persist settings across sessions.',
    });
  }
}
