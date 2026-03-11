/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {OdsClient} from '../../clients/ods.js';
import {getLogger} from '../../logging/logger.js';

export type CloneState = 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'PENDING' | (string & {});

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

export interface WaitForClonePollInfo {
  sandboxId: string;
  cloneId: string;
  elapsedSeconds: number;
  status: CloneState;
  progressPercentage?: number;
}

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
 * Waits for a sandbox clone to reach COMPLETED or FAILED state by polling its status.
 *
 * @param client - ODS client for API calls
 * @param options - Polling configuration options
 *
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
