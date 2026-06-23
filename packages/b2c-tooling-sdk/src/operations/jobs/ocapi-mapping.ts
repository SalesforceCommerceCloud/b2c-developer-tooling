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

function mapCanonicalStepExecution(step: JobStepExecutionResult): JobStepExecution {
  return {
    id: step.id,
    step_id: step.stepId,
    execution_status: step.executionStatus as JobStepExecution['execution_status'],
    exit_status: step.exitStatus
      ? {
          code: step.exitStatus.code,
          message: step.exitStatus.message,
          status: step.exitStatus.status,
        }
      : undefined,
    duration: step.duration,
  } as JobStepExecution;
}

/**
 * Map a canonical {@link JobExecutionInfo} back into the raw OCAPI
 * {@link JobExecution} (snake_case) shape.
 *
 * The reverse of {@link mapOcapiExecution}. System-job operations
 * (site-archive import/export, CAP install/uninstall) expose the raw OCAPI
 * `JobExecution` in their public result/error types; when those operations are
 * served over SCAPI, the canonical result is mapped back through this so the
 * public contract stays identical across backends.
 *
 * Prefers the original OCAPI payload when present in `_raw` (lossless
 * round-trip for the OCAPI path); otherwise projects the canonical fields.
 */
export function mapCanonicalToOcapiExecution(canonical: JobExecutionInfo): JobExecution {
  if (canonical._raw && typeof canonical._raw === 'object' && 'execution_status' in canonical._raw) {
    return canonical._raw as JobExecution;
  }

  return {
    id: canonical.id,
    job_id: canonical.jobId,
    execution_status: canonical.executionStatus as JobExecution['execution_status'],
    exit_status: canonical.exitStatus
      ? {
          code: canonical.exitStatus.code,
          message: canonical.exitStatus.message,
          status: canonical.exitStatus.status,
        }
      : undefined,
    start_time: canonical.startTime,
    end_time: canonical.endTime,
    duration: canonical.duration,
    step_executions: canonical.stepExecutions?.map(mapCanonicalStepExecution),
    log_file_path: canonical.logFilePath,
    is_log_file_existing: canonical.isLogFileExisting,
    parameters: canonical.parameters,
  } as JobExecution;
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
