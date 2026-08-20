/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, Errors} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getApiErrorMessage,
  waitForClone,
  ClonePollingTimeoutError,
  ClonePollingError,
  CloneFailedError,
  waitForClones,
  CloneBatchPollingTimeoutError,
  CloneBatchPollingError,
  CloneBatchFailedError,
} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../../i18n/index.js';

const MIN_TARGET_COUNT = 1;
const MAX_TARGET_COUNT = 5;

/**
 * Command to create a sandbox clone.
 */
export default class CloneCreate extends OdsCommand<typeof CloneCreate> {
  static aliases = ['ods:clone:create'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or friendly format like realm-instance) to clone from',
      required: true,
    }),
  };

  static description = t('commands.clone.create.description', 'Create a new sandbox clone from an existing sandbox');

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> <sandboxId>',
    '<%= config.bin %> <%= command.id %> <sandboxId> --target-profile large',
    '<%= config.bin %> <%= command.id %> <sandboxId> --ttl 48',
    '<%= config.bin %> <%= command.id %> <sandboxId> --target-profile large --ttl 48 --emails dev@example.com,qa@example.com',
    '<%= config.bin %> <%= command.id %> <sandboxId> --wait',
    '<%= config.bin %> <%= command.id %> <sandboxId> --wait --poll-interval 15',
    '<%= config.bin %> <%= command.id %> <sandboxId> --target-count 3',
    '<%= config.bin %> <%= command.id %> <sandboxId> --target-count 3 --wait',
  ];

  static flags = {
    'target-profile': Flags.string({
      description: 'Resource profile for the cloned sandbox (defaults to source sandbox profile)',
      required: false,
      options: ['medium', 'large', 'xlarge', 'xxlarge'],
    }),
    emails: Flags.string({
      description: 'Comma-separated list of notification email addresses',
      required: false,
      multiple: true,
    }),
    ttl: Flags.integer({
      description:
        'Time to live in hours (0 or negative = infinite, minimum 24 hours). Values between 1-23 are not allowed.',
      required: false,
      default: 24,
    }),
    'target-count': Flags.integer({
      description: 'Number of clones to create from this source (1 to many cloning). Valid values are 1 to 5.',
      required: false,
      default: 1,
    }),
    wait: Flags.boolean({
      char: 'w',
      description: 'Wait for the clone to complete before returning',
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

  async run(): Promise<{cloneId?: string; batchId?: string; siblingCloneIds?: string[]}> {
    const {sandboxId: rawSandboxId} = this.args;
    const {
      'target-profile': targetProfile,
      emails,
      ttl,
      'target-count': targetCount,
      wait,
      'poll-interval': pollInterval,
      timeout,
    } = this.flags;

    this.validateTTL(ttl);
    this.validateTargetCount(targetCount);

    // Resolve sandbox ID (handles both UUID and friendly format)
    const sandboxId = await this.resolveSandboxId(rawSandboxId);

    this.log(t('commands.clone.create.creating', 'Creating sandbox clone...'));

    const requestBody = this.buildRequestBody({targetProfile, emails, ttl, targetCount});

    const result = await this.odsClient.POST('/sandboxes/{sandboxId}/clones', {
      params: {
        path: {sandboxId},
      },
      body: requestBody,
    });

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(t('commands.clone.create.error', 'Failed to create sandbox clone: {{message}}', {message}));
    }

    const cloneId = result.data.data?.cloneId;
    const batchId = result.data.data?.batchId ?? undefined;
    const siblingCloneIds = result.data.data?.siblingCloneIds ?? undefined;
    const cloneIds = siblingCloneIds && siblingCloneIds.length > 0 ? siblingCloneIds : cloneId ? [cloneId] : [];

    this.logCreationResult({cloneId, batchId, cloneIds});

    if (wait && cloneIds.length > 1) {
      await this.waitForBatch({sandboxId, cloneIds, pollInterval, timeout});
    } else if (wait && cloneId) {
      await this.waitForSingle({sandboxId, cloneId, pollInterval, timeout});
    } else if (!this.jsonEnabled()) {
      const bin = this.config.bin;
      this.log(
        t(
          'commands.clone.create.checkStatus',
          '\nTo check the clone status, run:\n  {{bin}} sandbox clone get {{sandboxId}} {{cloneId}}',
          {bin, sandboxId, cloneId},
        ),
      );
    }

    return {cloneId, batchId, siblingCloneIds};
  }

  private buildRequestBody({
    targetProfile,
    emails,
    ttl,
    targetCount,
  }: {
    targetProfile?: string;
    emails?: string[];
    ttl: number;
    targetCount: number;
  }): {
    targetProfile?: 'large' | 'medium' | 'xlarge' | 'xxlarge';
    emails?: string[];
    ttl: number;
    targetCount: number;
  } {
    const requestBody: {
      targetProfile?: 'large' | 'medium' | 'xlarge' | 'xxlarge';
      emails?: string[];
      ttl: number;
      targetCount: number;
    } = {
      ttl,
      targetCount,
    };

    // Only include targetProfile if explicitly provided
    if (targetProfile) {
      requestBody.targetProfile = targetProfile as 'large' | 'medium' | 'xlarge' | 'xxlarge';
    }

    if (emails && emails.length > 0) {
      requestBody.emails = emails.flatMap((email) => email.split(',').map((e) => e.trim()));
    }

    return requestBody;
  }

  private logCreationResult({
    cloneId,
    batchId,
    cloneIds,
  }: {
    cloneId?: string;
    batchId?: string;
    cloneIds: string[];
  }): void {
    if (this.jsonEnabled()) return;

    if (batchId && cloneIds.length > 1) {
      this.log(
        t(
          'commands.clone.create.batchSuccess',
          '✓ Sandbox clone batch creation started successfully ({{count}} clones)',
          {count: cloneIds.length},
        ),
      );
      this.log(t('commands.clone.create.batchId', 'Batch ID: {{batchId}}', {batchId}));
      this.log(t('commands.clone.create.cloneIds', 'Clone IDs: {{cloneIds}}', {cloneIds: cloneIds.join(', ')}));
    } else {
      this.log(t('commands.clone.create.success', '✓ Sandbox clone creation started successfully'));
      this.log(t('commands.clone.create.cloneId', 'Clone ID: {{cloneId}}', {cloneId}));
    }
  }

  private validateTargetCount(targetCount: number): void {
    if (targetCount < MIN_TARGET_COUNT || targetCount > MAX_TARGET_COUNT) {
      throw new Errors.CLIError(
        t(
          'commands.clone.create.invalidTargetCount',
          'target-count must be between {{min}} and {{max}}. Received: {{targetCount}}',
          {min: MIN_TARGET_COUNT, max: MAX_TARGET_COUNT, targetCount},
        ),
      );
    }
  }

  private validateTTL(ttl: number): void {
    if (ttl > 0 && ttl < 24) {
      throw new Errors.CLIError(
        t(
          'commands.clone.create.invalidTTL',
          'TTL must be 0 or negative (infinite), or 24 hours or greater. Values between 1-23 are not allowed. Received: {{ttl}}',
          {ttl},
        ),
      );
    }
  }

  private async waitForBatch({
    sandboxId,
    cloneIds,
    pollInterval,
    timeout,
  }: {
    sandboxId: string;
    cloneIds: string[];
    pollInterval: number;
    timeout: number;
  }): Promise<void> {
    this.log(
      t('commands.clone.create.waitingBatch', 'Waiting for {{count}} clones to complete...', {
        count: cloneIds.length,
      }),
    );

    try {
      await waitForClones(this.odsClient, {
        sandboxId,
        cloneIds,
        pollIntervalSeconds: pollInterval,
        timeoutSeconds: timeout,
        onPoll: ({elapsedSeconds, completed, total}) => {
          this.logger.info(
            {sandboxId, cloneIds, elapsed: elapsedSeconds, completed, total},
            `[${elapsedSeconds}s] ${completed}/${total} clones complete`,
          );
        },
      });
    } catch (error) {
      if (error instanceof CloneBatchPollingTimeoutError) {
        this.error(
          t('commands.clone.create.timeout', 'Timeout waiting for clone after {{seconds}} seconds', {
            seconds: String(error.timeoutSeconds),
          }),
        );
      }

      if (error instanceof CloneBatchFailedError) {
        this.error(
          t('commands.clone.create.batchFailed', '{{failedCount}} of {{total}} clones failed', {
            failedCount: error.failedCloneIds.length,
            total: error.statuses.length,
          }),
        );
      }

      if (error instanceof CloneBatchPollingError) {
        this.error(
          t('commands.clone.create.pollError', 'Failed to fetch clone status: {{message}}', {
            message: error.message,
          }),
        );
      }

      throw error;
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.clone.create.completedBatch', '✓ All clones completed successfully'));
    }
  }

  private async waitForSingle({
    sandboxId,
    cloneId,
    pollInterval,
    timeout,
  }: {
    sandboxId: string;
    cloneId: string;
    pollInterval: number;
    timeout: number;
  }): Promise<void> {
    this.log(t('commands.clone.create.waiting', 'Waiting for clone to complete...'));

    try {
      await waitForClone(this.odsClient, {
        sandboxId,
        cloneId,
        pollIntervalSeconds: pollInterval,
        timeoutSeconds: timeout,
        onPoll: ({elapsedSeconds, status, progressPercentage}) => {
          const progress = progressPercentage === undefined ? '' : ` (${progressPercentage}%)`;
          this.logger.info(
            {sandboxId, cloneId, elapsed: elapsedSeconds, status},
            `[${elapsedSeconds}s] Status: ${status}${progress}`,
          );
        },
      });
    } catch (error) {
      if (error instanceof ClonePollingTimeoutError) {
        this.error(
          t('commands.clone.create.timeout', 'Timeout waiting for clone after {{seconds}} seconds', {
            seconds: String(error.timeoutSeconds),
          }),
        );
      }

      if (error instanceof CloneFailedError) {
        this.error(t('commands.clone.create.failed', 'Clone operation failed'));
      }

      if (error instanceof ClonePollingError) {
        this.error(
          t('commands.clone.create.pollError', 'Failed to fetch clone status: {{message}}', {
            message: error.message,
          }),
        );
      }

      throw error;
    }

    if (!this.jsonEnabled()) {
      this.log(t('commands.clone.create.completed', '✓ Clone completed successfully'));
    }
  }
}
