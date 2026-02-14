/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {confirm} from '@inquirer/prompts';
import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {withDocs} from '../../i18n/index.js';

/**
 * Default setup command - provides topic help and prompts to create an instance if none configured.
 *
 * - `b2c setup` with no instance configured (TTY): prompts to create one
 * - `b2c setup` with instance configured or non-TTY: shows topic help
 */
export default class SetupIndex extends BaseCommand<typeof SetupIndex> {
  static description = withDocs(
    'Manage instances, inspect configuration, install skills, and configure IDE integrations',
    '/cli/setup.html',
  );

  static examples = [
    '<%= config.bin %> setup --help',
    '<%= config.bin %> setup instance create',
    '<%= config.bin %> setup ide prophet',
  ];

  async run(): Promise<void> {
    const hasInstance = this.resolvedConfig.hasB2CInstanceConfig();
    const isTTY = Boolean(process.stdin.isTTY && process.stdout.isTTY);

    if (!hasInstance && isTTY) {
      const shouldCreate = await confirm({
        message: 'No instance configured. Would you like to set one up?',
        default: true,
      });

      if (shouldCreate) {
        await this.config.runCommand('setup:instance:create');
        return;
      }
    }

    await this.config.runCommand('help', ['setup']);
  }
}
