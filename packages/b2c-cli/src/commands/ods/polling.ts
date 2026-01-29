/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Command} from '@oclif/core';

/**
 * Sandbox lifecycle states used for polling.
 *
 * Kept as a simple string union here to avoid depending on internal SDK types.
 */
export type SandboxState = 'deleted' | 'failed' | 'started' | 'stopped' | (string & {});

interface LoggerLike {
  info(message: string, context?: unknown): void;
  info(context: unknown, message: string): void;
}

interface OdsPollResult {
  data?: {data?: {state?: string}};
  response?: {statusText?: string};
}

interface OdsPollingClient {
  GET: (path: '/sandboxes/{sandboxId}', options: {params: {path: {sandboxId: string}}}) => Promise<OdsPollResult>;
}

export interface WaitForSandboxStateOptions {
  sandboxId: string;
  targetState: SandboxState;
  pollIntervalSeconds: number;
  timeoutSeconds: number;
  odsClient: OdsPollingClient;
  logger: LoggerLike;
  onPollError: (message: string) => never;
  onTimeout: (seconds: number) => never;
  onFailure: (state: SandboxState | undefined) => never;
  sleep?: (ms: number) => Promise<void>;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Shared polling helper for ODS sandbox state transitions.
 *
 * Commands are responsible for user-facing messages and error translations.
 */
export async function waitForSandboxStateCommon(options: WaitForSandboxStateOptions): Promise<void> {
  const {sandboxId, targetState, pollIntervalSeconds, timeoutSeconds, odsClient, logger} = options;
  const sleepFn = options.sleep ?? sleep;

  const startTime = Date.now();
  const pollIntervalMs = pollIntervalSeconds * 1000;
  const timeoutMs = timeoutSeconds * 1000;

  // Initial delay before first poll to give the operation time to start
  await sleepFn(pollIntervalMs);

  while (true) {
    if (timeoutSeconds > 0 && Date.now() - startTime > timeoutMs) {
      options.onTimeout(timeoutSeconds);
    }

    // eslint-disable-next-line no-await-in-loop
    const result = await odsClient.GET('/sandboxes/{sandboxId}', {
      params: {
        path: {sandboxId},
      },
    });

    if (!result.data?.data) {
      options.onPollError(result.response?.statusText || 'Unknown error');
    }

    const sandbox = result.data.data;
    const currentState = sandbox.state as SandboxState;

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const state = currentState || 'unknown';
    logger.info({sandboxId, elapsed, state}, `[${elapsed}s] State: ${state}`);

    if (currentState === targetState) {
      return;
    }

    if (currentState === 'failed' || currentState === 'deleted') {
      options.onFailure(currentState);
    }

    // eslint-disable-next-line no-await-in-loop
    await sleepFn(pollIntervalMs);
  }
}

export default class OdsPolling extends Command {
  static hidden = true;

  async run(): Promise<void> {
    this.error('This is an internal module and not a public command.');
  }
}
