/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '../../instance/index.js';
import type {JobsBackend, JobExecutionInfo, JobStepExecutionResult, JobExecutionSearchResults} from './types.js';
import type {ExecuteJobOptions, SearchJobExecutionsOptions, JobExecution, JobStepExecution} from './run.js';
import {
  executeJob as ocapiExecuteJob,
  getJobExecution as ocapiGetJobExecution,
  searchJobExecutions as ocapiSearchJobExecutions,
  getJobLog as ocapiGetJobLog,
} from './run.js';

function mapStepExecution(step: JobStepExecution): JobStepExecutionResult {
  return {
    id: step.id,
    stepId: step.step_id,
    executionStatus: step.execution_status,
    exitStatus: step.exit_status
      ? {
          code: step.exit_status.code ?? '',
          message: step.exit_status.message,
          status: step.exit_status.status as 'ok' | 'error' | undefined,
        }
      : undefined,
    duration: step.duration,
  };
}

function mapOcapiExecution(ocapi: JobExecution): JobExecutionInfo {
  return {
    id: ocapi.id ?? '',
    jobId: ocapi.job_id ?? '',
    executionStatus: (ocapi.execution_status ?? 'unknown') as JobExecutionInfo['executionStatus'],
    exitStatus: ocapi.exit_status
      ? {
          code: ocapi.exit_status.code ?? '',
          message: ocapi.exit_status.message,
          status: ocapi.exit_status.status as 'ok' | 'error' | undefined,
        }
      : undefined,
    startTime: ocapi.start_time,
    endTime: ocapi.end_time,
    duration: ocapi.duration,
    stepExecutions: ocapi.step_executions?.map(mapStepExecution),
    logFilePath: ocapi.log_file_path,
    isLogFileExisting: ocapi.is_log_file_existing,
    parameters: ocapi.parameters,
    _raw: ocapi,
  };
}

export class OcapiJobsBackend implements JobsBackend {
  readonly name = 'ocapi' as const;

  constructor(private instance: B2CInstance) {}

  async executeJob(jobId: string, options?: ExecuteJobOptions): Promise<JobExecutionInfo> {
    const result = await ocapiExecuteJob(this.instance, jobId, options);
    return mapOcapiExecution(result);
  }

  async getJobExecution(jobId: string, executionId: string): Promise<JobExecutionInfo> {
    const result = await ocapiGetJobExecution(this.instance, jobId, executionId);
    return mapOcapiExecution(result);
  }

  async searchJobExecutions(options?: SearchJobExecutionsOptions): Promise<JobExecutionSearchResults> {
    const result = await ocapiSearchJobExecutions(this.instance, options);
    return {
      total: result.total,
      limit: result.count,
      offset: result.start,
      hits: result.hits.map(mapOcapiExecution),
    };
  }

  async deleteJobExecution(_jobId: string, _executionId: string): Promise<void> {
    throw new Error('Delete job execution is not supported via OCAPI. Use --api-backend scapi.');
  }

  async getJobLog(execution: JobExecutionInfo): Promise<string> {
    const ocapiExecution = execution._raw as JobExecution;
    if (ocapiExecution) {
      return ocapiGetJobLog(this.instance, ocapiExecution);
    }
    if (!execution.logFilePath) {
      throw new Error('No log file path available');
    }
    if (!execution.isLogFileExisting) {
      throw new Error('Log file does not exist');
    }
    const logPath = execution.logFilePath.replace(/^\/Sites\//, '');
    const content = await this.instance.webdav.get(logPath);
    return new TextDecoder().decode(content);
  }
}
