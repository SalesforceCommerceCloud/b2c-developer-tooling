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
import {getLogger} from '../../logging/logger.js';

export type ApiBackendPreference = 'ocapi' | 'scapi' | 'auto';

export interface JobsBackendConfig {
  preference: ApiBackendPreference;
  instance: B2CInstance;
  shortCode?: string;
  tenantId?: string;
  auth?: AuthStrategy;
}

export function createJobsBackend(config: JobsBackendConfig): JobsBackend {
  const resolved = resolveBackend(config);

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

function resolveBackend(config: JobsBackendConfig): 'ocapi' | 'scapi' {
  if (config.preference === 'ocapi') return 'ocapi';
  if (config.preference === 'scapi') {
    if (!config.shortCode || !config.tenantId) {
      throw new Error('SCAPI backend requires shortCode and tenantId configuration.');
    }
    if (!config.auth) {
      throw new Error('SCAPI backend requires OAuth credentials.');
    }
    return 'scapi';
  }

  // Auto: prefer SCAPI when config available
  if (config.shortCode && config.tenantId && config.auth) {
    return 'scapi';
  }
  return 'ocapi';
}

export class FallbackJobsBackend implements JobsBackend {
  private resolvedBackend?: JobsBackend;

  constructor(
    private scapiBackend: ScapiJobsBackend,
    private ocapiBackend: OcapiJobsBackend,
  ) {}

  get name(): 'ocapi' | 'scapi' {
    return (this.resolvedBackend?.name ?? 'scapi') as 'ocapi' | 'scapi';
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

  private async withFallback<T>(fn: (backend: JobsBackend) => Promise<T>): Promise<T> {
    if (this.resolvedBackend) {
      return fn(this.resolvedBackend);
    }

    try {
      const result = await fn(this.scapiBackend);
      this.resolvedBackend = this.scapiBackend;
      return result;
    } catch (error) {
      if (isInvalidScopeError(error)) {
        const logger = getLogger();
        logger.info('SCAPI jobs scope unavailable, falling back to OCAPI');
        this.resolvedBackend = this.ocapiBackend;
        return fn(this.ocapiBackend);
      }
      throw error;
    }
  }
}

function isInvalidScopeError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('invalid_scope');
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
