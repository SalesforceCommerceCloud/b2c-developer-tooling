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
import {waitForSandboxStateCommon, type SandboxState} from './polling.js';

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
      description: 'Sandbox ID (UUID or realm-instance, e.g., abcd-123)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.ods.delete.description', 'Delete an on-demand sandbox'),
    '/cli/ods.html#b2c-ods-delete',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789',
    '<%= config.bin %> <%= command.id %> zzzv-123',
    '<%= config.bin %> <%= command.id %> zzzv_123 --force',
  ];

  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
    wait: Flags.boolean({
      char: 'w',
      description: 'Wait for the sandbox to be fully deleted before returning',
      default: false,
    }),
    'poll-interval': Flags.integer({
      description: 'Polling interval in seconds when using --wait',
      default: 10,
      dependsOn: ['wait'],
    }),
    timeout: Flags.integer({
      description: 'Maximum time to wait in seconds when using --wait (0 for no timeout)',
      default: 600,
      dependsOn: ['wait'],
    }),
  };

  async run(): Promise<void> {
    const sandboxId = await this.resolveSandboxId(this.args.sandboxId);
    const wait = this.flags.wait as boolean;
    const pollInterval = this.flags['poll-interval'] as number;
    const timeout = this.flags.timeout as number;

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

    if (wait) {
      this.log(
        t('commands.ods.delete.waiting', 'Waiting for sandbox to reach state {{state}}...', {
          state: 'deleted' satisfies SandboxState,
        }),
      );

      await waitForSandboxStateCommon({
        sandboxId,
        targetState: 'deleted',
        pollIntervalSeconds: pollInterval,
        timeoutSeconds: timeout,
        odsClient: this.odsClient,
        logger: this.logger,
        onPollError: (message) =>
          this.error(
            t('commands.ods.delete.pollError', 'Failed to fetch sandbox status: {{message}}', {
              message,
            }),
          ),
        onTimeout: (seconds) =>
          this.error(
            t('commands.ods.delete.timeout', 'Timeout waiting for sandbox after {{seconds}} seconds', {
              seconds: String(seconds),
            }),
          ),
        onFailure: (state) =>
          this.error(
            t('commands.ods.delete.failed', 'Sandbox did not reach the expected state. Current state: {{state}}', {
              state: state || 'unknown',
            }),
          ),
      });

      this.log('');
      this.logger.info({sandboxId}, t('commands.ods.delete.ready', 'Sandbox is now deleted'));
    }
  }
}
