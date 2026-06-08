/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Mapping helpers from raw OCAPI shapes (snake_case) to canonical
 * {@link JobExecutionInfo} (camelCase).
 *
 * These exist as transitional utilities to bridge the two API shapes. They
 * will be deleted along with the OCAPI ops once OCAPI is removed.
 *
 * @module operations/jobs/ocapi-mapping
 */
import type {JobExecution, JobStepExecution} from './run.js';
import type {JobExecutionInfo, JobExecutionSearchResults, JobStepExecutionResult} from './types.js';

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

/** Map a raw OCAPI {@link JobExecution} into the canonical shape. */
export function mapOcapiExecution(ocapi: JobExecution): JobExecutionInfo {
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

/** Map a raw OCAPI search result into the canonical shape. */
export function mapOcapiSearchResult(result: {
  total: number;
  count: number;
  start: number;
  hits: JobExecution[];
}): JobExecutionSearchResults {
  return {
    total: result.total,
    limit: result.count,
    offset: result.start,
    hits: result.hits.map(mapOcapiExecution),
  };
}
