/**
 * Job execution operations for B2C Commerce.
 *
 * Provides functions for executing and monitoring jobs on B2C Commerce instances.
 */
import {B2CInstance} from '../../instance/index.js';
import type {components} from '../../clients/ocapi.generated.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Job execution from OCAPI.
 * Type alias to the generated schema.
 */
export type JobExecution = components['schemas']['job_execution'];

/**
 * Job step execution from OCAPI.
 * Type alias to the generated schema.
 */
export type JobStepExecution = components['schemas']['job_step_execution'];

/**
 * Job execution status from OCAPI.
 * Type alias to the generated schema's execution_status field.
 */
export type JobExecutionStatus = NonNullable<JobExecution['execution_status']>;

/**
 * Job execution parameter for starting jobs.
 * Type alias to the generated schema.
 */
export type JobExecutionParameter = components['schemas']['job_execution_parameter'];

/**
 * Options for executing a job.
 */
export interface ExecuteJobOptions {
  /** Job parameters to pass */
  parameters?: JobExecutionParameter[];
  /** Wait for running jobs to finish before starting (default: true) */
  waitForRunning?: boolean;
}

/**
 * Options for waiting on a job.
 */
export interface WaitForJobOptions {
  /** Polling interval in milliseconds (default: 3000) */
  pollInterval?: number;
  /** Maximum time to wait in milliseconds (default: no limit) */
  timeout?: number;
  /** Callback for progress updates */
  onProgress?: (execution: JobExecution, elapsedMs: number) => void;
}

/**
 * Executes a job on a B2C Commerce instance.
 *
 * Starts a job execution and returns immediately with the execution details.
 * Use {@link waitForJob} to wait for completion.
 *
 * @param instance - B2C instance to execute on
 * @param jobId - Job ID to execute
 * @param options - Execution options
 * @returns Job execution details
 * @throws Error if job is already running (when waitForRunning is false)
 * @throws Error if job not found or cannot be executed
 *
 * @example
 * ```typescript
 * // Execute a simple job
 * const execution = await executeJob(instance, 'my-job-id');
 *
 * // Execute with parameters
 * const execution = await executeJob(instance, 'CustomerImportJob', {
 *   parameters: [
 *     { name: 'SiteScope', value: '{"all_storefront_sites":true}' }
 *   ]
 * });
 * ```
 */
export async function executeJob(
  instance: B2CInstance,
  jobId: string,
  options: ExecuteJobOptions = {},
): Promise<JobExecution> {
  const logger = getLogger();
  const {parameters = [], waitForRunning = true} = options;

  logger.debug({jobId, parameters}, `Executing job ${jobId}`);

  // Build request body - OCAPI accepts either parameters array or job-specific fields
  const body = parameters.length > 0 ? {parameters} : undefined;

  const {data, error, response} = await instance.ocapi.POST('/jobs/{job_id}/executions', {
    params: {path: {job_id: jobId}},
    body: body as unknown as string,
  });

  // Handle JobAlreadyRunningException
  if (response.status === 400) {
    // Need to check fault type - read raw response
    const errorBody = await response.text().catch(() => '');
    if (errorBody.includes('JobAlreadyRunningException')) {
      if (waitForRunning) {
        logger.warn(`Job ${jobId} already running, waiting for it to finish...`);

        // Search for the running execution
        const runningExecution = await findRunningJobExecution(instance, jobId);
        if (runningExecution) {
          logger.debug({executionId: runningExecution.id}, `Found running execution ${runningExecution.id}`);
          await waitForJob(instance, jobId, runningExecution.id!);
          // Retry execution after the running job finishes
          return executeJob(instance, jobId, {...options, waitForRunning: false});
        }
        // Couldn't find running job, try again
        return executeJob(instance, jobId, {...options, waitForRunning: false});
      }
      throw new Error(`Job ${jobId} is already running`);
    }
  }

  if (error || !data) {
    const message = error?.fault?.message ?? `Failed to execute job ${jobId}`;
    throw new Error(message);
  }

  logger.debug({executionId: data.id, status: data.execution_status}, `Job ${jobId} started: ${data.id}`);

  return data;
}

/**
 * Gets the current status of a job execution.
 *
 * @param instance - B2C instance
 * @param jobId - Job ID
 * @param executionId - Execution ID
 * @returns Current execution status
 * @throws Error if execution not found
 *
 * @example
 * ```typescript
 * const status = await getJobExecution(instance, 'my-job', 'exec-123');
 * console.log(`Status: ${status.execution_status}`);
 * ```
 */
export async function getJobExecution(
  instance: B2CInstance,
  jobId: string,
  executionId: string,
): Promise<JobExecution> {
  const {data, error} = await instance.ocapi.GET('/jobs/{job_id}/executions/{id}', {
    params: {path: {job_id: jobId, id: executionId}},
  });

  if (error || !data) {
    const message = error?.fault?.message ?? `Failed to get job execution ${executionId}`;
    throw new Error(message);
  }

  return data;
}

/**
 * Waits for a job execution to complete.
 *
 * Polls the job status until it reaches a terminal state (finished or aborted).
 *
 * @param instance - B2C instance
 * @param jobId - Job ID
 * @param executionId - Execution ID to wait for
 * @param options - Wait options
 * @returns Final execution status
 * @throws Error if job fails (status ERROR or aborted)
 * @throws Error if timeout is exceeded
 *
 * @example
 * ```typescript
 * // Simple wait
 * const result = await waitForJob(instance, 'my-job', 'exec-123');
 *
 * // With progress callback
 * const result = await waitForJob(instance, 'my-job', 'exec-123', {
 *   onProgress: (exec, elapsed) => {
 *     console.log(`Status: ${exec.execution_status}, elapsed: ${elapsed}ms`);
 *   }
 * });
 * ```
 */
export async function waitForJob(
  instance: B2CInstance,
  jobId: string,
  executionId: string,
  options: WaitForJobOptions = {},
): Promise<JobExecution> {
  const logger = getLogger();
  const {pollInterval = 3000, timeout, onProgress} = options;

  const startTime = Date.now();
  let ticks = 0;

  while (true) {
    await sleep(pollInterval);

    const elapsed = Date.now() - startTime;
    if (timeout && elapsed > timeout) {
      throw new Error(`Timeout waiting for job ${jobId} execution ${executionId}`);
    }

    const execution = await getJobExecution(instance, jobId, executionId);

    // Call progress callback
    if (onProgress) {
      onProgress(execution, elapsed);
    }

    // Check for terminal states
    if (execution.execution_status === 'aborted' || execution.exit_status?.code === 'ERROR') {
      logger.debug({execution}, `Job ${jobId} failed`);
      throw new JobExecutionError(`Job ${jobId} failed`, execution);
    }

    if (execution.execution_status === 'finished') {
      const durationSec = (execution.duration ?? 0) / 1000;
      logger.debug(
        {executionId, status: execution.exit_status?.code, duration: durationSec},
        `Job ${jobId} finished. Status: ${execution.exit_status?.code} (duration: ${durationSec}s)`,
      );
      return execution;
    }

    // Log periodic updates
    if (ticks % 5 === 0) {
      logger.debug(
        {executionId, status: execution.execution_status, elapsed: elapsed / 1000},
        `Waiting for job ${jobId} to finish (${(elapsed / 1000).toFixed(0)}s elapsed)...`,
      );
    }

    ticks++;
  }
}

/**
 * Error thrown when a job execution fails.
 */
export class JobExecutionError extends Error {
  constructor(
    message: string,
    public readonly execution: JobExecution,
  ) {
    super(message);
    this.name = 'JobExecutionError';
  }
}

/**
 * Extracts the error message from a failed job execution.
 *
 * Looks for the last step execution with exit_status code 'ERROR' and returns its message.
 *
 * @param execution - The job execution to extract the error message from
 * @returns The error message if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const errorMsg = getJobErrorMessage(execution);
 * if (errorMsg) {
 *   console.error(`Job failed: ${errorMsg}`);
 * }
 * ```
 */
export function getJobErrorMessage(execution: JobExecution): string | undefined {
  if (!execution.step_executions || execution.step_executions.length === 0) {
    return undefined;
  }

  // Find the last step with ERROR status that has a message
  for (let i = execution.step_executions.length - 1; i >= 0; i--) {
    const step = execution.step_executions[i];
    if (step.exit_status?.code === 'ERROR' && step.exit_status?.message) {
      return step.exit_status.message;
    }
  }

  return undefined;
}

/**
 * Search options for job executions.
 */
export interface SearchJobExecutionsOptions {
  /** Filter by job ID */
  jobId?: string;
  /** Filter by status (RUNNING, PENDING, OK, ERROR, etc.) */
  status?: string | string[];
  /** Maximum results to return (default: 25) */
  count?: number;
  /** Starting index for pagination */
  start?: number;
  /** Sort by field (default: start_time desc) */
  sortBy?: string;
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search results for job executions.
 */
export interface JobExecutionSearchResult {
  /** Total matching executions */
  total: number;
  /** Number of results returned */
  count: number;
  /** Starting index */
  start: number;
  /** Job executions */
  hits: JobExecution[];
}

/**
 * Searches for job executions.
 *
 * @param instance - B2C instance
 * @param options - Search options
 * @returns Search results
 *
 * @example
 * ```typescript
 * // Search for all running jobs
 * const results = await searchJobExecutions(instance, {
 *   status: ['RUNNING', 'PENDING']
 * });
 *
 * // Search for a specific job's recent executions
 * const results = await searchJobExecutions(instance, {
 *   jobId: 'my-job',
 *   count: 10
 * });
 * ```
 */
export async function searchJobExecutions(
  instance: B2CInstance,
  options: SearchJobExecutionsOptions = {},
): Promise<JobExecutionSearchResult> {
  const {jobId, status, count = 25, start = 0, sortBy = 'start_time', sortOrder = 'desc'} = options;

  // Build query
  const queries: unknown[] = [];

  if (jobId) {
    queries.push({
      term_query: {fields: ['job_id'], operator: 'is', values: [jobId]},
    });
  }

  if (status) {
    const statusValues = Array.isArray(status) ? status : [status];
    queries.push({
      term_query: {fields: ['status'], operator: 'one_of', values: statusValues},
    });
  }

  // Build the query object
  let query: unknown;
  if (queries.length === 0) {
    query = {match_all_query: {}};
  } else if (queries.length === 1) {
    query = queries[0];
  } else {
    query = {bool_query: {must: queries}};
  }

  const {data, error} = await instance.ocapi.POST('/job_execution_search', {
    body: {
      query,
      count,
      start,
      sorts: [{field: sortBy, sort_order: sortOrder}],
    } as unknown as components['schemas']['search_request'],
  });

  if (error || !data) {
    const message = error?.fault?.message ?? 'Failed to search job executions';
    throw new Error(message);
  }

  return {
    total: data.total ?? 0,
    count: data.count ?? 0,
    start: data.start ?? 0,
    hits: (data.hits ?? []) as JobExecution[],
  };
}

/**
 * Finds a currently running job execution.
 *
 * @param instance - B2C instance
 * @param jobId - Job ID to search for
 * @returns Running execution or undefined if none found
 */
export async function findRunningJobExecution(instance: B2CInstance, jobId: string): Promise<JobExecution | undefined> {
  const results = await searchJobExecutions(instance, {
    jobId,
    status: ['RUNNING', 'PENDING'],
    sortBy: 'start_time',
    sortOrder: 'asc',
    count: 1,
  });

  return results.hits[0];
}

/**
 * Gets the log file content for a job execution.
 *
 * @param instance - B2C instance
 * @param execution - Job execution with log file path
 * @returns Log file content as string
 * @throws Error if log file doesn't exist or cannot be retrieved
 *
 * @example
 * ```typescript
 * try {
 *   const result = await waitForJob(instance, 'my-job', 'exec-123');
 * } catch (error) {
 *   if (error instanceof JobExecutionError && error.execution.is_log_file_existing) {
 *     const log = await getJobLog(instance, error.execution);
 *     console.error('Job log:', log);
 *   }
 * }
 * ```
 */
export async function getJobLog(instance: B2CInstance, execution: JobExecution): Promise<string> {
  if (!execution.log_file_path) {
    throw new Error('No log file path available');
  }

  if (!execution.is_log_file_existing) {
    throw new Error('Log file does not exist');
  }

  // log_file_path from OCAPI is "/Sites/LOGS/jobs/..."
  // WebDAV client base is /webdav/Sites, so strip the leading /Sites/
  const logPath = execution.log_file_path.replace(/^\/Sites\//, '');

  const content = await instance.webdav.get(logPath);
  return new TextDecoder().decode(content);
}

/**
 * Helper function for sleeping.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
