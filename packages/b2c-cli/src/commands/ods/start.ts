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
 * Command to start an on-demand sandbox.
 */
export default class OdsStart extends OdsCommand<typeof OdsStart> {
  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., abcd-123)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.ods.start.description', 'Start an on-demand sandbox'),
    '/cli/ods.html#b2c-ods-start',
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
      description: 'Wait for the sandbox to reach started or failed state before returning',
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

  async run(): Promise<SandboxOperationModel> {
    const sandboxId = await this.resolveSandboxId(this.args.sandboxId);
    const wait = this.flags.wait;
    const pollInterval = this.flags['poll-interval'];
    const timeout = this.flags.timeout;

    this.log(t('commands.ods.start.starting', 'Starting sandbox {{sandboxId}}...', {sandboxId}));

    const result = await this.odsClient.POST('/sandboxes/{sandboxId}/operations', {
      params: {
        path: {sandboxId},
      },
      body: {
        operation: 'start',
      },
    });

    if (!result.data?.data) {
      this.error(
        t('commands.ods.start.error', 'Failed to start sandbox: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    const operation = result.data.data;

    this.log(
      t('commands.ods.start.success', 'Start operation {{operationState}}. Sandbox state: {{sandboxState}}', {
        operationState: operation.operationState,
        sandboxState: operation.sandboxState || 'unknown',
      }),
    );
    if (wait) {
      this.log(t('commands.ods.start.waiting', 'Waiting for sandbox to reach state {{state}}...', {state: 'started'}));

      try {
        await waitForSandbox({
          sandboxId,
          targetState: 'started',
          pollIntervalSeconds: pollInterval,
          timeoutSeconds: timeout,
          odsClient: this.odsClient,
          onPoll: ({elapsedSeconds, state}) => {
            this.logger.info({sandboxId, elapsed: elapsedSeconds, state}, `[${elapsedSeconds}s] State: ${state}`);
          },
        });
      } catch (error) {
        if (error instanceof SandboxPollingTimeoutError) {
          this.error(
            t('commands.ods.start.timeout', 'Timeout waiting for sandbox after {{seconds}} seconds', {
              seconds: String(error.timeoutSeconds),
            }),
          );
        }

        if (error instanceof SandboxTerminalStateError) {
          this.error(
            t('commands.ods.start.failed', 'Sandbox did not reach the expected state. Current state: {{state}}', {
              state: error.state || 'unknown',
            }),
          );
        }

        if (error instanceof SandboxPollingError) {
          this.error(
            t('commands.ods.start.pollError', 'Failed to fetch sandbox status: {{message}}', {
              message: error.message,
            }),
          );
        }

        throw error;
      }

      this.log('');
      this.logger.info({sandboxId}, t('commands.ods.start.ready', 'Sandbox is now ready'));
    }

    return operation;
  }
}
