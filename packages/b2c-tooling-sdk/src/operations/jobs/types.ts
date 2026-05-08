/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ExecuteJobOptions, WaitForJobOptions, SearchJobExecutionsOptions} from './run.js';

export type {ExecuteJobOptions, WaitForJobOptions, SearchJobExecutionsOptions};

export interface JobExecutionInfo {
  id: string;
  jobId: string;
  executionStatus:
    | 'pending'
    | 'running'
    | 'pausing'
    | 'paused'
    | 'resuming'
    | 'resumed'
    | 'restarting'
    | 'restarted'
    | 'retrying'
    | 'retried'
    | 'aborting'
    | 'aborted'
    | 'finished'
    | 'unknown';
  exitStatus?: {code: string; message?: string; status?: 'ok' | 'error'};
  startTime?: string;
  endTime?: string;
  duration?: number;
  stepExecutions?: JobStepExecutionResult[];
  logFilePath?: string;
  isLogFileExisting?: boolean;
  parameters?: Array<{name: string; value: string}>;
  _raw?: unknown;
}

export interface JobStepExecutionResult {
  id?: string;
  stepId?: string;
  executionStatus?: string;
  exitStatus?: {code: string; message?: string; status?: 'ok' | 'error'};
  duration?: number;
}

export interface JobExecutionSearchResults {
  total: number;
  limit: number;
  offset: number;
  hits: JobExecutionInfo[];
}

export interface JobsBackend {
  readonly name: 'ocapi' | 'scapi';
  executeJob(jobId: string, options?: ExecuteJobOptions): Promise<JobExecutionInfo>;
  getJobExecution(jobId: string, executionId: string): Promise<JobExecutionInfo>;
  searchJobExecutions(options?: SearchJobExecutionsOptions): Promise<JobExecutionSearchResults>;
  getJobLog(execution: JobExecutionInfo): Promise<string>;
}

/**
 * Capability extension for backends that can delete job execution records.
 * Only SCAPI exposes this — OCAPI's Data API has no equivalent endpoint.
 *
 * Use {@link supportsDeleteJobExecution} to narrow at runtime.
 */
export interface DeletableJobsBackend extends JobsBackend {
  deleteJobExecution(jobId: string, executionId: string): Promise<void>;
}

/**
 * Type guard: returns true if the backend supports deleting job executions.
 */
export function supportsDeleteJobExecution(backend: JobsBackend): backend is DeletableJobsBackend {
  return typeof (backend as DeletableJobsBackend).deleteJobExecution === 'function';
}
