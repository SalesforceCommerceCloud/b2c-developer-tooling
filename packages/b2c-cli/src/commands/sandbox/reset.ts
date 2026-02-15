/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, waitForSandbox, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';
import {confirm} from '@inquirer/prompts';

type SandboxOperationModel = OdsComponents['schemas']['SandboxOperationModel'];

/**
 * Command to reset an on-demand sandbox to clean state.
 */
export default class SandboxReset extends OdsCommand<typeof SandboxReset> {
  static aliases = ['ods:reset'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., abcd-123)',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.sandbox.reset.description',
      'Reset a sandbox to clean state (clears all data and code but preserves configuration)',
    ),
    '/cli/sandbox.html#b2c-sandbox-reset',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789',
    '<%= config.bin %> <%= command.id %> zzzv-123',
    '<%= config.bin %> <%= command.id %> zzzv-123 --wait',
    '<%= config.bin %> <%= command.id %> zzzv-123 --force --json',
  ];

  static flags = {
    wait: Flags.boolean({
      char: 'w',
      description: 'Wait for the sandbox to reach started state after reset',
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
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<SandboxOperationModel> {
    const sandboxId = await this.resolveSandboxId(this.args.sandboxId);
    const {wait, 'poll-interval': pollInterval, timeout, force} = this.flags;

    // Confirmation prompt (skip if --force or --json)
    if (!force && !this.jsonEnabled()) {
      const confirmed = await confirm({
        message: `⚠️  Reset will permanently delete all data and code in sandbox ${this.args.sandboxId}. Continue?`,
        default: false,
      });

      if (!confirmed) {
        this.log(t('commands.sandbox.reset.cancelled', 'Reset cancelled'));
        this.exit(0);
      }
    }

    this.log(t('commands.sandbox.reset.resetting', 'Resetting sandbox {{sandboxId}}...', {sandboxId}));

    const result = await this.odsClient.POST('/sandboxes/{sandboxId}/operations', {
      params: {
        path: {sandboxId},
      },
      body: {
        operation: 'reset',
      },
    });

    if (!result.data?.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(`Failed to reset sandbox: ${message}`);
    }

    const operation = result.data.data;

    if (wait) {
      await waitForSandbox(this.odsClient, {
        sandboxId,
        targetState: 'started',
        pollIntervalSeconds: pollInterval,
        timeoutSeconds: timeout,
        onPoll: (info) => {
          this.log(
            t('commands.sandbox.reset.polling', '[{{elapsed}}s] State: {{state}}', {
              state: info.state,
              elapsed: info.elapsedSeconds,
            }),
          );
        },
      });
    }

    if (wait) {
      this.log(t('commands.sandbox.reset.completed', 'Sandbox reset completed and is now started'));
    } else {
      this.log(
        t('commands.sandbox.reset.triggered', 'Reset operation {{operationState}}. Sandbox state: {{sandboxState}}', {
          operationState: operation.operationState,
          sandboxState: operation.sandboxState || 'unknown',
        }),
      );
    }

    return operation;
  }
}
