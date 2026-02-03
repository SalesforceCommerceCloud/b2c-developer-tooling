/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {OdsClient} from '../../clients/ods.js';
import {getLogger} from '../../logging/logger.js';

export type SandboxState = 'deleted' | 'failed' | 'started' | 'stopped' | (string & {});

export class SandboxPollingTimeoutError extends Error {
  constructor(
    public readonly sandboxId: string,
    public readonly targetState: SandboxState,
    public readonly timeoutSeconds: number,
    public readonly lastState?: SandboxState,
  ) {
    super(
      `Timeout waiting for sandbox ${sandboxId} to reach state ${targetState} after ${timeoutSeconds} seconds${
        lastState ? ` (lastState=${lastState})` : ''
      }`,
    );
    this.name = 'SandboxPollingTimeoutError';
  }
}

export class SandboxPollingError extends Error {
  constructor(
    public readonly sandboxId: string,
    public readonly message: string,
  ) {
    super(`Failed to fetch sandbox status for ${sandboxId}: ${message}`);
    this.name = 'SandboxPollingError';
  }
}

export class SandboxTerminalStateError extends Error {
  constructor(
    public readonly sandboxId: string,
    public readonly targetState: SandboxState,
    public readonly state: SandboxState,
  ) {
    super(`Sandbox ${sandboxId} reached terminal state ${state} while waiting for ${targetState}`);
    this.name = 'SandboxTerminalStateError';
  }
}

export interface WaitForSandboxPollInfo {
  sandboxId: string;
  elapsedSeconds: number;
  state: SandboxState;
}

export interface WaitForSandboxOptions {
  sandboxId: string;
  targetState: SandboxState;
  pollIntervalSeconds: number;
  timeoutSeconds: number;
  onPoll?: (info: WaitForSandboxPollInfo) => void;
  sleep?: (ms: number) => Promise<void>;
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Waits for a sandbox to reach a target state by polling its status.
 *
 * This function polls the ODS API at regular intervals until the sandbox reaches the desired state,
 * times out, or enters a terminal error state (failed/deleted).
 *
 * @param client - ODS client for API calls
 * @param options - Polling configuration options
 * @param options.sandboxId - ID of the sandbox to monitor
 * @param options.targetState - Desired sandbox state (e.g., 'started', 'stopped', 'deleted')
 * @param options.pollIntervalSeconds - Seconds between status checks
 * @param options.timeoutSeconds - Maximum seconds to wait (0 = no timeout)
 * @param options.onPoll - Optional callback invoked on each poll with current state
 * @param options.sleep - Optional custom sleep function (primarily for testing)
 *
 * @throws {SandboxPollingTimeoutError} If the timeout is exceeded before reaching target state
 * @throws {SandboxPollingError} If the API request fails
 * @throws {SandboxTerminalStateError} If the sandbox enters a terminal error state
 *
 * @example
 * ```typescript
 * await waitForSandbox(odsClient, {
 *   sandboxId: 'abc-123',
 *   targetState: 'started',
 *   pollIntervalSeconds: 5,
 *   timeoutSeconds: 300,
 *   onPoll: (info) => console.log(`State: ${info.state} (${info.elapsedSeconds}s)`),
 * });
 * ```
 */
export async function waitForSandbox(client: OdsClient, options: WaitForSandboxOptions): Promise<void> {
  const logger = getLogger();
  const {sandboxId, targetState, pollIntervalSeconds, timeoutSeconds} = options;

  const sleepFn = options.sleep ?? defaultSleep;
  const startTime = Date.now();
  const pollIntervalMs = pollIntervalSeconds * 1000;
  const timeoutMs = timeoutSeconds * 1000;

  await sleepFn(pollIntervalMs);

  let lastState: SandboxState | undefined;

  while (true) {
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

    if (timeoutSeconds > 0 && Date.now() - startTime > timeoutMs) {
      throw new SandboxPollingTimeoutError(sandboxId, targetState, timeoutSeconds, lastState);
    }

    const result = await client.GET('/sandboxes/{sandboxId}', {
      params: {
        path: {sandboxId},
      },
    });

    if (!result.data?.data) {
      throw new SandboxPollingError(sandboxId, result.response?.statusText || 'Unknown error');
    }

    const sandbox = result.data.data;
    const currentState = (sandbox.state as SandboxState) || 'unknown';
    lastState = currentState;

    logger.trace({sandboxId, elapsedSeconds, state: currentState}, '[ODS] Sandbox poll');
    options.onPoll?.({sandboxId, elapsedSeconds, state: currentState});

    if (currentState === targetState) {
      return;
    }

    if (currentState === 'failed' || currentState === 'deleted') {
      throw new SandboxTerminalStateError(sandboxId, targetState, currentState);
    }

    await sleepFn(pollIntervalMs);
  }
}
