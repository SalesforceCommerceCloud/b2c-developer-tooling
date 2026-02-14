/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {withDocs} from '../../../i18n/index.js';

/**
 * Default setup ide command - shows topic help for IDE integration subcommands.
 */
export default class SetupIdeIndex extends BaseCommand<typeof SetupIdeIndex> {
  static description = withDocs(
    'Set up IDE integrations that consume B2C CLI configuration',
    '/cli/setup.html#b2c-setup-ide',
  );

  static examples = ['<%= config.bin %> setup ide prophet'];

  async run(): Promise<void> {
    await this.config.runCommand('help', ['setup', 'ide']);
  }
}
