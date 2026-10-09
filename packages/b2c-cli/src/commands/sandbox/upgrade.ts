/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getApiErrorMessage,
  SandboxPollingError,
  SandboxPollingTimeoutError,
  SandboxTerminalStateError,
  waitForSandbox,
  type OdsComponents,
} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

type SandboxOperationModel = OdsComponents['schemas']['SandboxOperationModel'];

/**
 * Command to upgrade an on-demand sandbox to the latest supported platform version.
 */
export default class SandboxUpgrade extends OdsCommand<typeof SandboxUpgrade> {
  static aliases = ['ods:upgrade'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., abcd-123)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.sandbox.upgrade.description', 'Upgrade an on-demand sandbox to the latest supported platform version'),
    '/cli/sandbox.html#b2c-sandbox-upgrade',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> abc12345-1234-1234-1234-abc123456789',
    '<%= config.bin %> <%= command.id %> zzzv-123',
    '<%= config.bin %> <%= command.id %> zzzv-123 --wait',
    '<%= config.bin %> <%= command.id %> zzzv-123 --wait --poll-interval 15',
    '<%= config.bin %> <%= command.id %> zzzv_123 --json',
  ];

  static flags = {
    wait: Flags.boolean({
      char: 'w',
      description: 'Wait for the sandbox to reach started state after upgrade',
      default: false,
    }),
    'poll-interval': Flags.integer({
      description: 'Polling interval in seconds when using --wait',
      default: 10,
      dependsOn: ['wait'],
    }),
    timeout: Flags.integer({
      description: 'Maximum time to wait in seconds when using --wait (0 for no timeout)',
      default: 1800,
      dependsOn: ['wait'],
    }),
  };

  async run(): Promise<SandboxOperationModel> {
    const sandboxId = await this.resolveSandboxId(this.args.sandboxId);
    const {wait, 'poll-interval': pollInterval, timeout} = this.flags;

    this.log(t('commands.sandbox.upgrade.upgrading', 'Upgrading sandbox {{sandboxId}}...', {sandboxId}));

    const result = await this.odsClient.POST('/sandboxes/{sandboxId}/operations', {
      params: {
        path: {sandboxId},
      },
      body: {
        operation: 'upgrade',
      },
    });

    if (!result.data?.data) {
      this.error(
        t('commands.sandbox.upgrade.error', 'Failed to upgrade sandbox: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    const operation = result.data.data;

    this.log(
      t('commands.sandbox.upgrade.success', 'Upgrade operation {{operationState}}. Sandbox state: {{sandboxState}}', {
        operationState: operation.operationState,
        sandboxState: operation.sandboxState || 'unknown',
      }),
    );

    if (wait) {
      try {
        await waitForSandbox(this.odsClient, {
          sandboxId,
          targetState: 'started',
          pollIntervalSeconds: pollInterval,
          timeoutSeconds: timeout,
          onPoll: ({elapsedSeconds, state}) => {
            this.logger.info({sandboxId, elapsed: elapsedSeconds, state}, `[${elapsedSeconds}s] State: ${state}`);
          },
        });
      } catch (error) {
        if (error instanceof SandboxPollingTimeoutError) {
          this.error(
            t('commands.sandbox.upgrade.timeout', 'Timeout waiting for sandbox after {{seconds}} seconds', {
              seconds: String(error.timeoutSeconds),
            }),
          );
        }

        if (error instanceof SandboxTerminalStateError) {
          this.error(
            t('commands.sandbox.upgrade.failed', 'Sandbox did not reach the expected state. Current state: {{state}}', {
              state: error.state || 'unknown',
            }),
          );
        }

        if (error instanceof SandboxPollingError) {
          this.error(
            t('commands.sandbox.upgrade.pollError', 'Failed to fetch sandbox status: {{message}}', {
              message: error.message,
            }),
          );
        }

        throw error;
      }

      this.log('');
      this.logger.info({sandboxId}, t('commands.sandbox.upgrade.ready', 'Sandbox is now ready'));
    }

    return operation;
  }
}
