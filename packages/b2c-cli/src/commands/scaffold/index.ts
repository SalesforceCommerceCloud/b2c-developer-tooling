/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {executeScaffoldGenerate, type GenerateResponse} from '../../lib/scaffold/generate-helper.js';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Default scaffold command - provides topic help and shorthand for `scaffold generate`.
 *
 * - `b2c scaffold` shows topic help with available subcommands
 * - `b2c scaffold cartridge` is shorthand for `b2c scaffold generate cartridge`
 */
export default class ScaffoldIndex extends BaseCommand<typeof ScaffoldIndex> {
  static args = {
    scaffoldId: Args.string({
      description: 'Scaffold ID to generate (optional - omit to see available commands)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.scaffold.index.description', 'Work with project scaffolds and templates'),
    '/cli/scaffold.html',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> scaffold --help',
    '<%= config.bin %> scaffold list',
    '<%= config.bin %> scaffold cartridge',
    '<%= config.bin %> scaffold cartridge --name app_custom',
  ];

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'Primary name parameter (shorthand for --option name=VALUE)',
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output directory (defaults to scaffold default or current directory)',
    }),
    option: Flags.string({
      description: 'Parameter value in key=value format (can be repeated)',
      multiple: true,
    }),
    'dry-run': Flags.boolean({
      description: 'Preview files without writing them',
      default: false,
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Skip prompts, use defaults, and overwrite existing files',
      default: false,
    }),
  };

  async run(): Promise<GenerateResponse | void> {
    const {scaffoldId} = this.args;

    if (!scaffoldId) {
      // No scaffold specified - show topic help
      await this.config.runCommand('help', ['scaffold']);
      return;
    }

    // Scaffold specified - run generation
    const response = await executeScaffoldGenerate(
      {
        scaffoldId,
        name: this.flags.name,
        output: this.flags.output,
        options: this.flags.option,
        dryRun: this.flags['dry-run'],
        force: this.flags.force,
      },
      {
        logger: this.logger,
        log: (msg) => this.log(msg),
        warn: (msg) => this.warn(msg),
        error: (msg) => this.error(msg),
      },
    );

    if (this.jsonEnabled()) {
      return response;
    }
  }
}
