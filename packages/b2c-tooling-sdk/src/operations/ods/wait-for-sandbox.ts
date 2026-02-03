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
  odsClient: OdsClient;
  onPoll?: (info: WaitForSandboxPollInfo) => void;
  sleep?: (ms: number) => Promise<void>;
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForSandbox(options: WaitForSandboxOptions): Promise<void> {
  const logger = getLogger();
  const {sandboxId, targetState, pollIntervalSeconds, timeoutSeconds, odsClient} = options;

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

    const result = await odsClient.GET('/sandboxes/{sandboxId}', {
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
