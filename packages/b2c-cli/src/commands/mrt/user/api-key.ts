/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import * as readline from 'node:readline';
import {MrtCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {resetApiKey, type ApiKeyResult} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

/**
 * Reset the current user's API key.
 */
export default class MrtUserApiKey extends MrtCommand<typeof MrtUserApiKey> {
  static description = withDocs(
    t('commands.mrt.user.api-key.description', 'Reset the API key for the current user (invalidates current key)'),
    '/cli/mrt.html#b2c-mrt-user-api-key',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --yes',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...MrtCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<ApiKeyResult> {
    this.requireMrtCredentials();

    const {yes} = this.flags;

    if (!yes && !this.jsonEnabled()) {
      const confirmed = await this.confirm(
        t(
          'commands.mrt.user.api-key.confirm',
          'Warning: This will invalidate your current API key.\nAre you sure you want to reset your API key? (yes/no): ',
        ),
      );
      if (!confirmed) {
        this.error('API key reset cancelled.');
      }
    }

    this.log(t('commands.mrt.user.api-key.resetting', 'Resetting API key...'));

    const result = await resetApiKey(
      {
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      this.log(t('commands.mrt.user.api-key.success', 'API key has been reset successfully.'));
      this.log(t('commands.mrt.user.api-key.new-key', '\nNew API key: {{apiKey}}', {apiKey: result.api_key}));
      this.log(
        t(
          'commands.mrt.user.api-key.warning',
          '\nIMPORTANT: Please update your stored API key immediately. The old key is now invalid.',
        ),
      );
    }

    return result;
  }

  private async confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(message, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
  }
}
