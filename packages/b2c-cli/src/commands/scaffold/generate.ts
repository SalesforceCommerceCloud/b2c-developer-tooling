/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {executeScaffoldGenerate, type GenerateResponse} from '../../lib/scaffold/generate-helper.js';
import {t, withDocs} from '../../i18n/index.js';

export type {GenerateResponse} from '../../lib/scaffold/generate-helper.js';

/**
 * Command to generate a project from a scaffold.
 */
export default class ScaffoldGenerate extends BaseCommand<typeof ScaffoldGenerate> {
  static args = {
    scaffoldId: Args.string({
      description: 'Scaffold ID to generate',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.scaffold.generate.description', 'Generate files from a scaffold template'),
    '/cli/scaffold.html#b2c-scaffold-generate',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> cartridge',
    '<%= config.bin %> <%= command.id %> cartridge --name app_custom',
    '<%= config.bin %> <%= command.id %> custom-api --option apiName=my-api --option cartridgeName=app_custom',
    '<%= config.bin %> <%= command.id %> cartridge --dry-run',
    '<%= config.bin %> <%= command.id %> cartridge --force',
    '<%= config.bin %> <%= command.id %> cartridge --output ./src',
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
    const projectRoot = this.flags['working-directory'] || process.cwd();
    const response = await executeScaffoldGenerate(
      {
        scaffoldId: this.args.scaffoldId,
        name: this.flags.name,
        output: this.flags.output,
        options: this.flags.option,
        dryRun: this.flags['dry-run'],
        force: this.flags.force,
        projectRoot,
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
