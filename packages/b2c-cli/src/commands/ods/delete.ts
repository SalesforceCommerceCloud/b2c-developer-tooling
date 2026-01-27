/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as readline from 'node:readline';
import {Args, Flags} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Simple confirmation prompt.
 */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(`${message} `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Command to delete an on-demand sandbox.
 */
export default class OdsDelete extends OdsCommand<typeof OdsDelete> {
  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.ods.delete.description', 'Delete an on-demand sandbox'),
    '/cli/ods.html#b2c-ods-delete',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789',
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789 --force',
  ];

  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const sandboxId = this.args.sandboxId;

    // Get sandbox details first to show in confirmation
    const getResult = await this.odsClient.GET('/sandboxes/{sandboxId}', {
      params: {
        path: {sandboxId},
      },
    });

    if (!getResult.data?.data) {
      this.error(t('commands.ods.delete.notFound', 'Sandbox not found: {{sandboxId}}', {sandboxId}));
    }

    const sandbox = getResult.data.data;
    const sandboxInfo = `${sandbox.realm}/${sandbox.instance || sandboxId}`;

    // Confirm deletion unless --force is used
    if (!this.flags.force) {
      const confirmed = await confirm(
        t('commands.ods.delete.confirm', 'Are you sure you want to delete sandbox "{{sandboxInfo}}"? (y/n)', {
          sandboxInfo,
        }),
      );

      if (!confirmed) {
        this.log(t('commands.ods.delete.cancelled', 'Deletion cancelled'));
        return;
      }
    }

    this.log(t('commands.ods.delete.deleting', 'Deleting sandbox {{sandboxInfo}}...', {sandboxInfo}));

    const result = await this.odsClient.DELETE('/sandboxes/{sandboxId}', {
      params: {
        path: {sandboxId},
      },
    });

    if (result.response.status !== 202) {
      this.error(
        t('commands.ods.delete.error', 'Failed to delete sandbox: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    this.log(t('commands.ods.delete.success', 'Sandbox deletion initiated. The sandbox will be removed shortly.'));
  }
}
