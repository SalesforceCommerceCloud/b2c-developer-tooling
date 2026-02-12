/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {withDocs} from '../../../i18n/index.js';

/**
 * Default instance command - shows topic help for instance subcommands.
 */
export default class SetupInstanceIndex extends BaseCommand<typeof SetupInstanceIndex> {
  static description = withDocs(
    'Create, list, and manage B2C Commerce instance configurations',
    '/cli/setup.html#b2c-setup-instance',
  );

  static examples = [
    '<%= config.bin %> setup instance create',
    '<%= config.bin %> setup instance list',
    '<%= config.bin %> setup instance set-active',
  ];

  async run(): Promise<void> {
    await this.config.runCommand('help', ['setup', 'instance']);
  }
}
