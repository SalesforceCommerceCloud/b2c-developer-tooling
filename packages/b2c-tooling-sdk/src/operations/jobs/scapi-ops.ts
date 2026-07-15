/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * SCAPI Jobs operations.
 *
 * Free functions over a {@link ScapiJobsClient}. Each operation declares its
 * scope tier (`read` or `write`) via the `x-b2c-scope-mode` header; the
 * auth middleware on the client reads that header and resolves the
 * appropriate scope cascade against Account Manager.
 *
 * SDK consumers (or the CLI dispatcher in auto/scapi mode) call these
 * directly. This is the future primary surface for jobs once OCAPI is
 * deprecated.
 *
 * @module operations/jobs/scapi-ops
 */
import type {B2CInstance} from '../../instance/index.js';
import {SCOPE_MODE_HEADER} from '../../clients/middleware.js';
import {
  toOrganizationId,
  type ScapiJobsClient,
  type JobExecution as ScapiJobExecution,
  type JobStepExecution as ScapiJobStepExecution,
} from '../../clients/scapi-jobs.js';
import {getLogger} from '../../logging/logger.js';
import type {ExecuteJobOptions, SearchJobExecutionsOptions} from './run.js';
import type {JobExecutionInfo, JobExecutionSearchResults, JobStepExecutionResult} from './types.js';

const READ_HEADERS = {[SCOPE_MODE_HEADER]: 'read'};
const WRITE_HEADERS = {[SCOPE_MODE_HEADER]: 'write'};

/**
 * Thrown by {@link executeJob} when the SCAPI job-start POST is rejected with
 * a response (non-2xx). Carries the received HTTP status so callers can tell a
 * *request rejection* (server refused before starting the job — safe to treat
 * as "no job created") from an ambiguous failure.
 *
 * A network/timeout error during the POST does NOT produce this — it surfaces
 * as a raw thrown error with no status, because the request may have reached
 * the server and the job may already be running.
 */
export class ScapiJobStartError extends Error {
  constructor(
    message: string,
    /** HTTP status of the rejection response. */
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ScapiJobStartError';
  }
}

function mapStepExecution(step: ScapiJobStepExecution): JobStepExecutionResult {
  return {
    id: step.id,
    stepId: step.stepId,
    executionStatus: step.executionStatus,
    exitStatus: step.exitStatus
      ? {
          code: step.exitStatus.code ?? '',
          message: step.exitStatus.message,
          status: step.exitStatus.status,
        }
      : undefined,
    duration: step.duration,
  };
}

function mapScapiExecution(scapi: ScapiJobExecution): JobExecutionInfo {
  return {
    id: scapi.id,
    jobId: scapi.jobId,
    executionStatus: (scapi.executionStatus ?? 'unknown') as JobExecutionInfo['executionStatus'],
    exitStatus: scapi.exitStatus
      ? {
          code: scapi.exitStatus.code ?? '',
          message: scapi.exitStatus.message,
          status: scapi.exitStatus.status,
        }
      : undefined,
    startTime: scapi.startTime,
    endTime: scapi.endTime,
    duration: scapi.duration,
    stepExecutions: scapi.stepExecutions?.map(mapStepExecution),
    logFilePath: scapi.logFilePath,
    isLogFileExisting: scapi.isLogFileExisting,
    parameters: scapi.parameters,
    _raw: scapi,
  };
}

export interface ExecuteJobScapiOptions extends ExecuteJobOptions {
  /** Tenant ID for organization path param. Required. */
  tenantId: string;
}

/**
 * Execute a job. Requires the rw scope (no ro fallback for writes).
 *
 * If the job is already running and `waitForRunning` is not `false`, polls
 * until the prior run reaches a terminal state, then retries.
 */
export async function executeJob(
  client: ScapiJobsClient,
  jobId: string,
  options: ExecuteJobScapiOptions,
): Promise<JobExecutionInfo> {
  const organizationId = toOrganizationId(options.tenantId);
  const {parameters = [], body: rawBody} = options;

  let requestBody: Record<string, unknown> | undefined;
  if (rawBody) {
    requestBody = rawBody;
  } else if (parameters.length > 0) {
    requestBody = {parameters};
  }

  const {data, error, response} = await client.POST('/organizations/{organizationId}/jobs/{jobId}/executions', {
    params: {path: {organizationId, jobId}},
    headers: WRITE_HEADERS,
    body: requestBody as unknown as {parameters?: Array<{name: string; value: string}>},
  });

  if (response.status === 400) {
    const errorBody = error as unknown as {title?: string; type?: string; detail?: string};
    if (errorBody?.type?.includes('job-already-running') || errorBody?.title === 'Job Already Running') {
      if (options.waitForRunning !== false) {
        getLogger().warn({jobId}, `Job ${jobId} already running, waiting for it to finish...`);
        const running = await findRunningExecution(client, jobId, options.tenantId);
        if (running) {
          await waitForTerminal(client, jobId, running.id, options.tenantId);
        }
        return executeJob(client, jobId, {...options, waitForRunning: false});
      }
      throw new Error(`Job ${jobId} is already running`);
    }
  }

  if (error || !data) {
    const errorBody = error as unknown as {detail?: string; title?: string};
    const message = errorBody?.detail ?? errorBody?.title ?? `Failed to execute job ${jobId}`;
    // A received (non-2xx) response means the server refused the start — carry
    // the status so callers can classify request-rejection vs ambiguous.
    throw new ScapiJobStartError(message, response.status);
  }

  return mapScapiExecution(data);
}

export async function getJobExecution(
  client: ScapiJobsClient,
  jobId: string,
  executionId: string,
  tenantId: string,
): Promise<JobExecutionInfo> {
  const organizationId = toOrganizationId(tenantId);

  const {data, error} = await client.GET('/organizations/{organizationId}/jobs/{jobId}/executions/{executionId}', {
    params: {path: {organizationId, jobId, executionId}},
    headers: READ_HEADERS,
  });

  if (error || !data) {
    const errorBody = error as unknown as {detail?: string; title?: string};
    const message = errorBody?.detail ?? `Failed to get job execution ${executionId}`;
    throw new Error(message);
  }

  return mapScapiExecution(data);
}

export interface SearchJobExecutionsScapiOptions extends SearchJobExecutionsOptions {
  /** Tenant ID for organization path param. Required. */
  tenantId: string;
}

export async function searchJobExecutions(
  client: ScapiJobsClient,
  options: SearchJobExecutionsScapiOptions,
): Promise<JobExecutionSearchResults> {
  const organizationId = toOrganizationId(options.tenantId);
  const {jobId, status, count = 25, start = 0, sortBy = 'start_time', sortOrder = 'desc'} = options;

  // The SCAPI search DSL uses camelCase wrapper names (`termQuery`, `boolQuery`),
  // but the underlying searchable/sortable field names on this endpoint are
  // the legacy OCAPI snake_case identifiers (`job_id`, `status`, `start_time`).
  // Don't rename these to camelCase to "match the response schema" — the
  // request side wouldn't match anything. See scapi-ops.test.ts.
  const queries: unknown[] = [];
  if (jobId) {
    queries.push({termQuery: {fields: ['job_id'], operator: 'is', values: [jobId]}});
  }
  if (status) {
    const statusValues = Array.isArray(status) ? status : [status];
    queries.push({termQuery: {fields: ['status'], operator: 'one_of', values: statusValues}});
  }

  let query: unknown;
  if (queries.length === 0) {
    query = {matchAllQuery: {}};
  } else if (queries.length === 1) {
    query = queries[0];
  } else {
    query = {boolQuery: {must: queries}};
  }

  const {data, error} = await client.POST('/organizations/{organizationId}/job-execution-search', {
    params: {path: {organizationId}},
    headers: READ_HEADERS,
    body: {
      query,
      limit: count,
      offset: start,
      sorts: [{field: sortBy, sortOrder}],
    } as never,
  });

  if (error || !data) {
    const errorBody = error as unknown as {detail?: string; title?: string};
    const message = errorBody?.detail ?? 'Failed to search job executions';
    throw new Error(message);
  }

  const result = data as unknown as {total?: number; limit?: number; offset?: number; hits?: ScapiJobExecution[]};
  return {
    total: result.total ?? 0,
    limit: result.limit ?? count,
    offset: result.offset ?? start,
    hits: (result.hits ?? []).map(mapScapiExecution),
  };
}

export async function deleteJobExecution(
  client: ScapiJobsClient,
  jobId: string,
  executionId: string,
  tenantId: string,
): Promise<void> {
  const organizationId = toOrganizationId(tenantId);

  const {error} = await client.DELETE('/organizations/{organizationId}/jobs/{jobId}/executions/{executionId}', {
    params: {path: {organizationId, jobId, executionId}},
    headers: WRITE_HEADERS,
  });

  if (error) {
    const errorBody = error as unknown as {detail?: string; title?: string};
    const message = errorBody?.detail ?? `Failed to delete job execution ${executionId}`;
    throw new Error(message);
  }
}

/**
 * Retrieves a job's log file content over WebDAV. Both backends
 * (SCAPI and OCAPI) expose `logFilePath` under `/Sites/LOGS/...`; WebDAV is
 * shared, so this lives in jobs/scapi-ops.ts only as a convenience for SDK
 * consumers building purely against SCAPI ops.
 */
export async function getJobLog(instance: B2CInstance, execution: JobExecutionInfo): Promise<string> {
  if (!execution.logFilePath) {
    throw new Error('No log file path available');
  }
  if (!execution.isLogFileExisting) {
    throw new Error('Log file does not exist');
  }
  const logPath = execution.logFilePath.replace(/^\/Sites\//, '');
  const content = await instance.webdav.get(logPath);
  return new TextDecoder().decode(content);
}

async function findRunningExecution(
  client: ScapiJobsClient,
  jobId: string,
  tenantId: string,
): Promise<JobExecutionInfo | undefined> {
  const results = await searchJobExecutions(client, {
    jobId,
    status: ['RUNNING', 'PENDING'],
    sortBy: 'start_time',
    sortOrder: 'asc',
    count: 1,
    tenantId,
  });
  return results.hits[0];
}

async function waitForTerminal(
  client: ScapiJobsClient,
  jobId: string,
  executionId: string,
  tenantId: string,
): Promise<void> {
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  while (true) {
    await sleep(3000);
    const execution = await getJobExecution(client, jobId, executionId, tenantId);
    if (execution.executionStatus === 'finished' || execution.executionStatus === 'aborted') {
      return;
    }
  }
}
