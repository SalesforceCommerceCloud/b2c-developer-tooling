/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Explicit compatibility backend for consumers that need SCAPI-first job
 * operations while they still consume the legacy OCAPI response shapes.
 *
 * This wrapper is transitional. New SDK integrations should select and call
 * the SCAPI or OCAPI operations directly. Product surfaces can use this class
 * to keep one fallback decision pinned for an entire execute/poll sequence.
 *
 * @module compat/jobs-backend
 */
import type {B2CInstance} from '../instance/index.js';
import {createScapiJobsClient, type ScapiJobsClient} from '../clients/scapi-jobs.js';
import {
  executeJob as ocapiExecuteJob,
  getJobExecution as ocapiGetJobExecution,
  searchJobExecutions as ocapiSearchJobExecutions,
  type ExecuteJobOptions,
  type JobExecution,
  type JobExecutionSearchResult,
  JobExecutionError,
  type SearchJobExecutionsOptions,
  type WaitForJobOptions,
} from '../operations/jobs/run.js';
import {
  executeJob as scapiExecuteJob,
  getJobExecution as scapiGetJobExecution,
  searchJobExecutions as scapiSearchJobExecutions,
} from '../operations/jobs/scapi-ops.js';
import {mapCanonicalToOcapiExecution, mapOcapiExecution} from '../operations/jobs/ocapi-mapping.js';
import {CanonicalJobExecutionError, waitForJobExecution} from '../operations/jobs/wait-canonical.js';
import {BackendDispatcher, type ApiBackendPreference, type ResolvedBackend} from './dispatcher.js';

/**
 * Stateful, explicit compatibility surface for a single logical job operation.
 */
export class JobsCompatibilityBackend {
  private readonly dispatcher: BackendDispatcher<ScapiJobsClient>;

  constructor(
    private readonly instance: B2CInstance,
    preference: ApiBackendPreference = instance.apiBackend,
  ) {
    this.dispatcher = new BackendDispatcher(preference, () => this.createScapiClient(), 'jobs');
  }

  /** Backend selected after the first request. */
  get active(): ResolvedBackend | undefined {
    return this.dispatcher.active;
  }

  async executeJob(jobId: string, options: ExecuteJobOptions = {}): Promise<JobExecution> {
    return this.dispatcher.run({
      scapi: async (client) =>
        mapCanonicalToOcapiExecution(
          await scapiExecuteJob(client, jobId, {...options, tenantId: this.requireTenantId()}),
        ),
      ocapi: () => ocapiExecuteJob(this.instance, jobId, options),
    });
  }

  async getJobExecution(jobId: string, executionId: string): Promise<JobExecution> {
    return this.dispatcher.run({
      scapi: async (client) =>
        mapCanonicalToOcapiExecution(await scapiGetJobExecution(client, jobId, executionId, this.requireTenantId())),
      ocapi: () => ocapiGetJobExecution(this.instance, jobId, executionId),
    });
  }

  async searchJobExecutions(options: SearchJobExecutionsOptions = {}): Promise<JobExecutionSearchResult> {
    return this.dispatcher.run({
      scapi: async (client) => {
        const result = await scapiSearchJobExecutions(client, {...options, tenantId: this.requireTenantId()});
        return {
          total: result.total,
          count: result.limit,
          start: result.offset,
          hits: result.hits.map(mapCanonicalToOcapiExecution),
        };
      },
      ocapi: () => ocapiSearchJobExecutions(this.instance, options),
    });
  }

  async waitForJob(jobId: string, executionId: string, options: WaitForJobOptions = {}): Promise<JobExecution> {
    try {
      const result = await waitForJobExecution(
        async (currentJobId, currentExecutionId) =>
          mapOcapiExecution(await this.getJobExecution(currentJobId, currentExecutionId)),
        jobId,
        executionId,
        options,
      );
      return mapCanonicalToOcapiExecution(result);
    } catch (error) {
      if (error instanceof CanonicalJobExecutionError) {
        throw new JobExecutionError(error.message, mapCanonicalToOcapiExecution(error.execution));
      }
      throw error;
    }
  }

  private createScapiClient(): ScapiJobsClient | undefined {
    const config = this.instance.scapiClientConfig;
    if (!config) return undefined;
    return createScapiJobsClient({shortCode: config.shortCode, tenantId: config.tenantId}, config.auth);
  }

  private requireTenantId(): string {
    const tenantId = this.instance.scapiClientConfig?.tenantId;
    if (!tenantId) throw new Error('Jobs SCAPI backend requires a tenantId');
    return tenantId;
  }
}

/** Create an explicit SCAPI-first/OCAPI-compatible jobs backend. */
export function createJobsCompatibilityBackend(
  instance: B2CInstance,
  preference: ApiBackendPreference = instance.apiBackend,
): JobsCompatibilityBackend {
  return new JobsCompatibilityBackend(instance, preference);
}
