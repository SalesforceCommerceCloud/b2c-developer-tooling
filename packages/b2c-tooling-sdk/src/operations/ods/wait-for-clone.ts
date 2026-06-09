/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {OdsClient} from '../../clients/ods.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Status of a sandbox clone operation in the ODS system.
 *
 * Standard values are `COMPLETED`, `FAILED`, `IN_PROGRESS`, and `PENDING`. Any
 * other string value is also accepted for forward compatibility with future
 * statuses returned by the API.
 */
export type CloneState = 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'PENDING' | (string & {});

/**
 * Error thrown when a sandbox clone operation does not complete within the
 * configured timeout while polling.
 *
 * @param sandboxId - ID of the source sandbox
 * @param cloneId - ID of the clone operation
 * @param timeoutSeconds - Timeout duration in seconds
 * @param lastStatus - Last observed clone status before the timeout occurred, if any
 */
export class ClonePollingTimeoutError extends Error {
  constructor(
    public readonly sandboxId: string,
    public readonly cloneId: string,
    public readonly timeoutSeconds: number,
    public readonly lastStatus?: CloneState,
  ) {
    super(
      `Timeout waiting for clone ${cloneId} of sandbox ${sandboxId} after ${timeoutSeconds} seconds${
        lastStatus ? ` (lastStatus=${lastStatus})` : ''
      }`,
    );
    this.name = 'ClonePollingTimeoutError';
  }
}

/**
 * Error thrown when an API request to fetch clone status fails.
 *
 * @param sandboxId - ID of the source sandbox
 * @param cloneId - ID of the clone operation
 * @param message - Underlying error message from the API call
 */
export class ClonePollingError extends Error {
  constructor(
    public readonly sandboxId: string,
    public readonly cloneId: string,
    message: string,
  ) {
    super(`Failed to fetch clone status for ${cloneId} of sandbox ${sandboxId}: ${message}`);
    this.name = 'ClonePollingError';
  }
}

/**
 * Error thrown when a sandbox clone operation enters the `FAILED` state.
 *
 * @param sandboxId - ID of the source sandbox
 * @param cloneId - ID of the clone operation
 * @param status - Clone status observed when the failure was detected
 */
export class CloneFailedError extends Error {
  constructor(
    public readonly sandboxId: string,
    public readonly cloneId: string,
    public readonly status: CloneState,
  ) {
    super(`Clone ${cloneId} of sandbox ${sandboxId} failed`);
    this.name = 'CloneFailedError';
  }
}

/**
 * Information passed to the `onPoll` callback on each clone status poll.
 */
export interface WaitForClonePollInfo {
  sandboxId: string;
  cloneId: string;
  elapsedSeconds: number;
  status: CloneState;
  progressPercentage?: number;
}

/**
 * Configuration options for {@link waitForClone} polling behavior.
 */
export interface WaitForCloneOptions {
  sandboxId: string;
  cloneId: string;
  pollIntervalSeconds: number;
  timeoutSeconds: number;
  onPoll?: (info: WaitForClonePollInfo) => void;
  sleep?: (ms: number) => Promise<void>;
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Waits for a sandbox clone to reach `COMPLETED` or `FAILED` state by polling
 * its status against the ODS API.
 *
 * Polls at `pollIntervalSeconds` until the clone completes, the configured
 * timeout is exceeded, or the clone enters a failed state. An initial poll
 * delay equal to `pollIntervalSeconds` is applied before the first status
 * check.
 *
 * @param client - ODS client for API calls
 * @param options - Polling configuration options
 * @param options.sandboxId - ID of the source sandbox
 * @param options.cloneId - ID of the clone operation to monitor
 * @param options.pollIntervalSeconds - Seconds between status checks
 * @param options.timeoutSeconds - Maximum seconds to wait (`0` disables the timeout)
 * @param options.onPoll - Optional callback invoked after each status poll
 * @param options.sleep - Optional custom sleep function (primarily for testing)
 * @returns Promise that resolves when the clone reaches `COMPLETED`
 * @throws {ClonePollingTimeoutError} If the timeout is exceeded before completion
 * @throws {ClonePollingError} If the API request fails
 * @throws {CloneFailedError} If the clone enters the FAILED state
 */
export async function waitForClone(client: OdsClient, options: WaitForCloneOptions): Promise<void> {
  const logger = getLogger();
  const {sandboxId, cloneId, pollIntervalSeconds, timeoutSeconds} = options;

  const sleepFn = options.sleep ?? defaultSleep;
  const startTime = Date.now();
  const pollIntervalMs = pollIntervalSeconds * 1000;
  const timeoutMs = timeoutSeconds * 1000;

  await sleepFn(pollIntervalMs);

  let lastStatus: CloneState | undefined;

  while (true) {
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

    if (timeoutSeconds > 0 && Date.now() - startTime > timeoutMs) {
      throw new ClonePollingTimeoutError(sandboxId, cloneId, timeoutSeconds, lastStatus);
    }

    const result = await client.GET('/sandboxes/{sandboxId}/clones/{cloneId}', {
      params: {
        path: {sandboxId, cloneId},
      },
    });

    if (!result.data?.data) {
      throw new ClonePollingError(sandboxId, cloneId, result.response?.statusText || 'Unknown error');
    }

    const clone = result.data.data;
    const currentStatus = (clone.status as CloneState) || 'unknown';
    lastStatus = currentStatus;

    logger.trace({sandboxId, cloneId, elapsedSeconds, status: currentStatus}, '[ODS] Clone poll');
    options.onPoll?.({
      sandboxId,
      cloneId,
      elapsedSeconds,
      status: currentStatus,
      progressPercentage: clone.progressPercentage,
    });

    if (currentStatus === 'COMPLETED') {
      return;
    }

    if (currentStatus === 'FAILED') {
      throw new CloneFailedError(sandboxId, cloneId, currentStatus);
    }

    await sleepFn(pollIntervalMs);
  }
}
