/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {JobsBackend, JobExecutionInfo} from './types.js';
import type {WaitForJobOptions, WaitForJobPollInfo} from './run.js';
import {OcapiJobsBackend} from './ocapi-backend.js';
import {ScapiJobsBackend} from './scapi-backend.js';
import {createDualBackend, type DualBackendConfig} from '../../clients/dual-backend-factory.js';
import type {ApiBackendPreference} from '../../clients/scapi-backend-utils.js';

export type {ApiBackendPreference};
export type JobsBackendConfig = DualBackendConfig;

export function createJobsBackend(config: JobsBackendConfig): JobsBackend {
  return createDualBackend<JobsBackend>(config, {
    domainName: 'Jobs',
    Scapi: ScapiJobsBackend,
    Ocapi: OcapiJobsBackend,
  });
}

export async function waitForJobExecution(
  backend: JobsBackend,
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

    const execution = await backend.getJobExecution(jobId, executionId);
    const currentStatus = execution.executionStatus;

    const pollInfo: WaitForJobPollInfo = {jobId, executionId, elapsedSeconds, status: currentStatus};
    onPoll?.(pollInfo);

    if (execution.executionStatus === 'aborted' || execution.exitStatus?.status === 'error') {
      const {JobExecutionError} = await import('./run.js');
      throw new JobExecutionError(`Job ${jobId} failed`, execution._raw as never);
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
