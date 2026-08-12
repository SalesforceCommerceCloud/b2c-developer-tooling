/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {OdsClient} from '../../clients/ods.js';
import {getLogger} from '../../logging/logger.js';
import type {CloneState} from './wait-for-clone.js';

/**
 * Status of a single clone within a batch, as observed on one poll tick.
 */
export interface CloneBatchMemberStatus {
  cloneId: string;
  status: CloneState;
  progressPercentage?: number;
}

/**
 * Error thrown when a batch of sandbox clones does not all reach a terminal
 * state (`COMPLETED` or `FAILED`) within the configured timeout while polling.
 *
 * @param sandboxId - ID of the source sandbox
 * @param cloneIds - IDs of the clone operations being monitored
 * @param timeoutSeconds - Timeout duration in seconds
 * @param lastStatuses - Last observed status for each clone before the timeout occurred
 */
export class CloneBatchPollingTimeoutError extends Error {
  constructor(
    public readonly sandboxId: string,
    public readonly cloneIds: string[],
    public readonly timeoutSeconds: number,
    public readonly lastStatuses: CloneBatchMemberStatus[],
  ) {
    const pending = lastStatuses.filter((s) => s.status !== 'COMPLETED' && s.status !== 'FAILED');
    super(
      `Timeout waiting for ${cloneIds.length} clone(s) of sandbox ${sandboxId} after ${timeoutSeconds} seconds ` +
        `(${pending.length} of ${cloneIds.length} still pending)`,
    );
    this.name = 'CloneBatchPollingTimeoutError';
  }
}

/**
 * Error thrown when an API request to fetch the status of a clone in a batch fails.
 *
 * @param sandboxId - ID of the source sandbox
 * @param cloneId - ID of the clone operation whose status request failed
 * @param message - Underlying error message from the API call
 */
export class CloneBatchPollingError extends Error {
  constructor(
    public readonly sandboxId: string,
    public readonly cloneId: string,
    message: string,
  ) {
    super(`Failed to fetch clone status for ${cloneId} of sandbox ${sandboxId}: ${message}`);
    this.name = 'CloneBatchPollingError';
  }
}

/**
 * Error thrown when one or more clones in a batch enter the `FAILED` state.
 *
 * All clones in the batch reached a terminal state, but at least one of them failed.
 *
 * @param sandboxId - ID of the source sandbox
 * @param failedCloneIds - IDs of the clones that reached the `FAILED` state
 * @param statuses - Final status for every clone in the batch
 */
export class CloneBatchFailedError extends Error {
  constructor(
    public readonly sandboxId: string,
    public readonly failedCloneIds: string[],
    public readonly statuses: CloneBatchMemberStatus[],
  ) {
    super(`${failedCloneIds.length} of ${statuses.length} clone(s) failed for sandbox ${sandboxId}`);
    this.name = 'CloneBatchFailedError';
  }
}

/**
 * Information passed to the `onPoll` callback on each poll tick while waiting for a batch of clones.
 */
export interface WaitForClonesPollInfo {
  sandboxId: string;
  elapsedSeconds: number;
  completed: number;
  total: number;
  clones: CloneBatchMemberStatus[];
}

/**
 * Configuration options for {@link waitForClones} batch polling behavior.
 */
export interface WaitForClonesOptions {
  sandboxId: string;
  cloneIds: string[];
  pollIntervalSeconds: number;
  timeoutSeconds: number;
  onPoll?: (info: WaitForClonesPollInfo) => void;
  sleep?: (ms: number) => Promise<void>;
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTerminal(status: CloneState): boolean {
  return status === 'COMPLETED' || status === 'FAILED';
}

/**
 * Waits for a batch of sandbox clones (created via 1 to many cloning) to all reach a
 * terminal state by polling each clone's status against the ODS API.
 *
 * Polls at `pollIntervalSeconds` until every clone in `cloneIds` reaches
 * `COMPLETED` or `FAILED`, or the configured timeout is exceeded. An initial
 * poll delay equal to `pollIntervalSeconds` is applied before the first status
 * check.
 *
 * @param client - ODS client for API calls
 * @param options - Polling configuration options
 * @param options.sandboxId - ID of the source sandbox
 * @param options.cloneIds - IDs of the clone operations to monitor (e.g. `siblingCloneIds`)
 * @param options.pollIntervalSeconds - Seconds between status checks
 * @param options.timeoutSeconds - Maximum seconds to wait (`0` disables the timeout)
 * @param options.onPoll - Optional callback invoked after each status poll with aggregate progress
 * @param options.sleep - Optional custom sleep function (primarily for testing)
 * @returns Promise that resolves with the final status of every clone once all reach `COMPLETED`
 * @throws {CloneBatchPollingTimeoutError} If the timeout is exceeded before all clones complete
 * @throws {CloneBatchPollingError} If an API request fails
 * @throws {CloneBatchFailedError} If one or more clones enter the `FAILED` state
 */
export async function waitForClones(
  client: OdsClient,
  options: WaitForClonesOptions,
): Promise<CloneBatchMemberStatus[]> {
  const logger = getLogger();
  const {sandboxId, cloneIds, pollIntervalSeconds, timeoutSeconds} = options;

  const sleepFn = options.sleep ?? defaultSleep;
  const startTime = Date.now();
  const pollIntervalMs = pollIntervalSeconds * 1000;
  const timeoutMs = timeoutSeconds * 1000;

  await sleepFn(pollIntervalMs);

  const statusByCloneId = new Map<string, CloneBatchMemberStatus>(
    cloneIds.map((cloneId) => [cloneId, {cloneId, status: 'PENDING'}]),
  );

  while (true) {
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

    if (timeoutSeconds > 0 && Date.now() - startTime > timeoutMs) {
      throw new CloneBatchPollingTimeoutError(sandboxId, cloneIds, timeoutSeconds, [...statusByCloneId.values()]);
    }

    const pendingCloneIds = cloneIds.filter((cloneId) => !isTerminal(statusByCloneId.get(cloneId)!.status));

    await Promise.all(
      pendingCloneIds.map(async (cloneId) => {
        const result = await client.GET('/sandboxes/{sandboxId}/clones/{cloneId}', {
          params: {
            path: {sandboxId, cloneId},
          },
        });

        if (!result.data?.data) {
          throw new CloneBatchPollingError(sandboxId, cloneId, result.response?.statusText || 'Unknown error');
        }

        const clone = result.data.data;
        statusByCloneId.set(cloneId, {
          cloneId,
          status: (clone.status as CloneState) || 'PENDING',
          progressPercentage: clone.progressPercentage,
        });
      }),
    );

    const lastStatuses = cloneIds.map((cloneId) => statusByCloneId.get(cloneId)!);
    const completed = lastStatuses.filter((s) => isTerminal(s.status)).length;

    logger.trace({sandboxId, cloneIds, elapsedSeconds, statuses: lastStatuses}, '[ODS] Clone batch poll');
    options.onPoll?.({sandboxId, elapsedSeconds, completed, total: cloneIds.length, clones: lastStatuses});

    if (completed === cloneIds.length) {
      const failedCloneIds = lastStatuses.filter((s) => s.status === 'FAILED').map((s) => s.cloneId);
      if (failedCloneIds.length > 0) {
        throw new CloneBatchFailedError(sandboxId, failedCloneIds, lastStatuses);
      }
      return lastStatuses;
    }

    await sleepFn(pollIntervalMs);
  }
}
