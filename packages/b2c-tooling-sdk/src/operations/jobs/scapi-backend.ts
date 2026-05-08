/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '../../instance/index.js';
import type {AuthStrategy} from '../../auth/types.js';
import type {JobsBackend, JobExecutionResult, JobStepExecutionResult, JobExecutionSearchResults} from './types.js';
import type {ExecuteJobOptions, SearchJobExecutionsOptions} from './run.js';
import {
  createScapiJobsClient,
  SCAPI_JOBS_RW_SCOPES,
  SCAPI_JOBS_READ_SCOPES,
  type ScapiJobsClient,
  type ScapiJobsClientConfig,
  type JobExecution as ScapiJobExecution,
  type JobStepExecution as ScapiJobStepExecution,
} from '../../clients/scapi-jobs.js';
import {buildTenantScope, toOrganizationId} from '../../clients/custom-apis.js';
import {ScopeTierManager} from '../../clients/scapi-scope-tier.js';
import {getLogger} from '../../logging/logger.js';

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

function mapScapiExecution(scapi: ScapiJobExecution): JobExecutionResult {
  return {
    id: scapi.id,
    jobId: scapi.jobId,
    executionStatus: (scapi.executionStatus ?? 'unknown') as JobExecutionResult['executionStatus'],
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

export interface ScapiJobsBackendConfig {
  shortCode: string;
  tenantId: string;
  auth: AuthStrategy;
  instance: B2CInstance;
}

export class ScapiJobsBackend implements JobsBackend {
  readonly name = 'scapi' as const;

  private organizationId: string;
  private scopeTier: ScopeTierManager<ScapiJobsClient>;

  constructor(private config: ScapiJobsBackendConfig) {
    this.organizationId = toOrganizationId(config.tenantId);
    this.scopeTier = new ScopeTierManager<ScapiJobsClient>({
      buildClient: (scopes) => this.buildClient(scopes),
      rwScopes: SCAPI_JOBS_RW_SCOPES,
      readScopes: SCAPI_JOBS_READ_SCOPES,
      domainName: 'Jobs',
    });
  }

  async executeJob(jobId: string, options?: ExecuteJobOptions): Promise<JobExecutionResult> {
    const client = this.scopeTier.getClientForWrite();
    const {parameters = [], body: rawBody} = options ?? {};

    let requestBody: Record<string, unknown> | undefined;
    if (rawBody) {
      requestBody = rawBody;
    } else if (parameters.length > 0) {
      requestBody = {parameters};
    }

    const {data, error, response} = await client.POST('/organizations/{organizationId}/jobs/{jobId}/executions', {
      params: {path: {organizationId: this.organizationId, jobId}},
      body: requestBody as unknown as {parameters?: Array<{name: string; value: string}>},
    });

    if (response.status === 400) {
      const errorBody = error as unknown as {title?: string; type?: string; detail?: string; jobId?: string};
      if (errorBody?.type?.includes('job-already-running') || errorBody?.title === 'Job Already Running') {
        if (options?.waitForRunning !== false) {
          const logger = getLogger();
          logger.warn({jobId}, `Job ${jobId} already running, waiting for it to finish...`);
          const running = await this.findRunningExecution(jobId);
          if (running) {
            await this.waitForTerminal(jobId, running.id);
          }
          return this.executeJob(jobId, {...options, waitForRunning: false});
        }
        throw new Error(`Job ${jobId} is already running`);
      }
    }

    if (error || !data) {
      const errorBody = error as unknown as {detail?: string; title?: string};
      const message = errorBody?.detail ?? errorBody?.title ?? `Failed to execute job ${jobId}`;
      throw new Error(message);
    }

    return mapScapiExecution(data);
  }

  async getJobExecution(jobId: string, executionId: string): Promise<JobExecutionResult> {
    const client = this.scopeTier.getClientForRead();

    const {data, error} = await client.GET('/organizations/{organizationId}/jobs/{jobId}/executions/{executionId}', {
      params: {path: {organizationId: this.organizationId, jobId, executionId}},
    });

    if (error || !data) {
      const errorBody = error as unknown as {detail?: string; title?: string};
      const message = errorBody?.detail ?? `Failed to get job execution ${executionId}`;
      throw new Error(message);
    }

    return mapScapiExecution(data);
  }

  async searchJobExecutions(options?: SearchJobExecutionsOptions): Promise<JobExecutionSearchResults> {
    const client = this.scopeTier.getClientForRead();
    const {jobId, status, count = 25, start = 0, sortBy = 'start_time', sortOrder = 'desc'} = options ?? {};

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
      params: {path: {organizationId: this.organizationId}},
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

  async deleteJobExecution(jobId: string, executionId: string): Promise<void> {
    const client = this.scopeTier.getClientForWrite();

    const {error} = await client.DELETE('/organizations/{organizationId}/jobs/{jobId}/executions/{executionId}', {
      params: {path: {organizationId: this.organizationId, jobId, executionId}},
    });

    if (error) {
      const errorBody = error as unknown as {detail?: string; title?: string};
      const message = errorBody?.detail ?? `Failed to delete job execution ${executionId}`;
      throw new Error(message);
    }
  }

  async getJobLog(execution: JobExecutionResult): Promise<string> {
    if (!execution.logFilePath) {
      throw new Error('No log file path available');
    }
    if (!execution.isLogFileExisting) {
      throw new Error('Log file does not exist');
    }
    const logPath = execution.logFilePath.replace(/^\/Sites\//, '');
    const content = await this.config.instance.webdav.get(logPath);
    return new TextDecoder().decode(content);
  }

  private buildClient(scopes: string[]): ScapiJobsClient {
    const clientConfig: ScapiJobsClientConfig = {
      shortCode: this.config.shortCode,
      tenantId: this.config.tenantId,
      scopes: [...scopes, buildTenantScope(this.config.tenantId)],
    };
    return createScapiJobsClient(clientConfig, this.config.auth);
  }

  private async findRunningExecution(jobId: string): Promise<JobExecutionResult | undefined> {
    const results = await this.searchJobExecutions({
      jobId,
      status: ['RUNNING', 'PENDING'],
      sortBy: 'start_time',
      sortOrder: 'asc',
      count: 1,
    });
    return results.hits[0];
  }

  private async waitForTerminal(jobId: string, executionId: string): Promise<void> {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    while (true) {
      await sleep(3000);
      const execution = await this.getJobExecution(jobId, executionId);
      if (execution.executionStatus === 'finished' || execution.executionStatus === 'aborted') {
        return;
      }
    }
  }
}
