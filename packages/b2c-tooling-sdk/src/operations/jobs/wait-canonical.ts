/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Backend-agnostic poll loop over canonical {@link JobExecutionInfo}.
 *
 * Takes a `getExecution` callback so callers can supply either the SCAPI
 * ops `getJobExecution` method or an OCAPI fetch wrapped in
 * {@link mapOcapiExecution}. Decouples polling logic from any specific
 * backend abstraction.
 *
 * @module operations/jobs/wait-canonical
 */
import type {WaitForJobOptions, WaitForJobPollInfo} from './run.js';
import type {JobExecutionInfo} from './types.js';

/**
 * Thrown by {@link waitForJobExecution} when a job reaches a failure state.
 * Carries the canonical {@link JobExecutionInfo} so callers can read fields
 * (`exitStatus.code`, `logFilePath`, etc.) without knowing which backend
 * served the response.
 */
export class CanonicalJobExecutionError extends Error {
  constructor(
    message: string,
    public readonly execution: JobExecutionInfo,
  ) {
    super(message);
    this.name = 'CanonicalJobExecutionError';
  }
}

/**
 * Polls `getExecution(jobId, executionId)` until the job reaches a terminal
 * state, returning the final {@link JobExecutionInfo}. Throws
 * {@link JobExecutionError} on failure or `Error` on timeout.
 */
export async function waitForJobExecution(
  getExecution: (jobId: string, executionId: string) => Promise<JobExecutionInfo>,
  jobId: string,
  executionId: string,
  options: WaitForJobOptions = {},
): Promise<JobExecutionInfo> {
  const {pollIntervalSeconds = 3, timeoutSeconds = 0, onPoll} = options;
  const sleepFn = options.sleep ?? defaultSleep;
  const startTime = Date.now();
  const pollIntervalMs = pollIntervalSeconds * 1000;
  const timeoutMs = timeoutSeconds * 1000;

  await sleepFn(pollIntervalMs);

  while (true) {
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

    if (timeoutSeconds > 0 && Date.now() - startTime > timeoutMs) {
      throw new Error(`Timeout waiting for job ${jobId} execution ${executionId}`);
    }

    const execution = await getExecution(jobId, executionId);
    const currentStatus = execution.executionStatus;
    const pollInfo: WaitForJobPollInfo = {jobId, executionId, elapsedSeconds, status: currentStatus};
    onPoll?.(pollInfo);

    if (execution.executionStatus === 'aborted' || execution.exitStatus?.status === 'error') {
      throw new CanonicalJobExecutionError(`Job ${jobId} failed`, execution);
    }

    if (execution.executionStatus === 'finished') {
      return execution;
    }

    await sleepFn(pollIntervalMs);
  }
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
