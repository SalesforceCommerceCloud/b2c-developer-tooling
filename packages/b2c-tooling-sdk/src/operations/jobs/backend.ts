/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '../../instance/index.js';
import type {AuthStrategy} from '../../auth/types.js';
import type {JobsBackend, JobExecutionResult, JobExecutionSearchResults} from './types.js';
import type {ExecuteJobOptions, SearchJobExecutionsOptions, WaitForJobOptions, WaitForJobPollInfo} from './run.js';
import {OcapiJobsBackend} from './ocapi-backend.js';
import {ScapiJobsBackend} from './scapi-backend.js';
import {ScapiFallbackBackend} from '../../clients/scapi-fallback-backend.js';
import {resolveScapiOrOcapi, type ApiBackendPreference} from '../../clients/scapi-backend-utils.js';

export type {ApiBackendPreference};

export interface JobsBackendConfig {
  preference: ApiBackendPreference;
  instance: B2CInstance;
  shortCode?: string;
  tenantId?: string;
  auth?: AuthStrategy;
}

export function createJobsBackend(config: JobsBackendConfig): JobsBackend {
  const hasScapiConfig = Boolean(config.shortCode && config.tenantId && config.auth);
  const resolved = resolveScapiOrOcapi({
    preference: config.preference,
    hasScapiConfig,
    domainName: 'Jobs',
  });

  if (resolved === 'ocapi') {
    return new OcapiJobsBackend(config.instance);
  }

  const scapiBackend = new ScapiJobsBackend({
    shortCode: config.shortCode!,
    tenantId: config.tenantId!,
    auth: config.auth!,
    instance: config.instance,
  });

  if (config.preference === 'scapi') {
    return scapiBackend;
  }

  // Auto mode: wrap with fallback
  const ocapiBackend = new OcapiJobsBackend(config.instance);
  return new FallbackJobsBackend(scapiBackend, ocapiBackend);
}

export class FallbackJobsBackend extends ScapiFallbackBackend<JobsBackend> implements JobsBackend {
  constructor(scapiBackend: ScapiJobsBackend, ocapiBackend: OcapiJobsBackend) {
    super(scapiBackend, ocapiBackend, 'jobs');
  }

  async executeJob(jobId: string, options?: ExecuteJobOptions): Promise<JobExecutionResult> {
    return this.withFallback((backend) => backend.executeJob(jobId, options));
  }

  async getJobExecution(jobId: string, executionId: string): Promise<JobExecutionResult> {
    return this.withFallback((backend) => backend.getJobExecution(jobId, executionId));
  }

  async searchJobExecutions(options?: SearchJobExecutionsOptions): Promise<JobExecutionSearchResults> {
    return this.withFallback((backend) => backend.searchJobExecutions(options));
  }

  async deleteJobExecution(jobId: string, executionId: string): Promise<void> {
    return this.withFallback((backend) => backend.deleteJobExecution(jobId, executionId));
  }

  async getJobLog(execution: JobExecutionResult): Promise<string> {
    return this.withFallback((backend) => backend.getJobLog(execution));
  }
}

export async function waitForJobExecution(
  backend: JobsBackend,
  jobId: string,
  executionId: string,
  options: WaitForJobOptions = {},
): Promise<JobExecutionResult> {
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
