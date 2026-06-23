/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Dual-backend runner for B2C Commerce **system jobs** (site-archive
 * import/export, CAP install/uninstall).
 *
 * These operations all follow the same shape: trigger a named system job,
 * wait for it to finish, and surface the job log on failure. This module
 * centralizes that flow over either backend so each operation declares only
 * its job ID and request body — not the OCAPI-vs-SCAPI plumbing.
 *
 * ## Contract
 *
 * The public result/error types of every caller expose the **raw OCAPI**
 * {@link JobExecution} (snake_case). To keep that contract identical across
 * backends, the SCAPI path maps its canonical result back to the OCAPI shape
 * via {@link mapCanonicalToOcapiExecution}, and a SCAPI job failure is
 * re-thrown as the raw {@link JobExecutionError} — so a caller's existing
 * `catch (JobExecutionError) → getJobLog(instance, err.execution)` works
 * unchanged regardless of which backend served the job.
 *
 * ## Backend selection & fallback
 *
 * Honors {@link B2CInstance.apiBackend}:
 *   - `'ocapi'`: always OCAPI.
 *   - `'scapi'`: always SCAPI (throws if the instance can't reach SCAPI).
 *   - `'auto'` (default): SCAPI when {@link B2CInstance.scapiClientConfig} is
 *     available, else OCAPI. **Fallback to OCAPI happens only if the SCAPI
 *     *start* fails** (missing scope, body rejected, system job not
 *     triggerable over SCAPI). Once a job has started, the wait/log path never
 *     falls back — re-running a started write would be unsafe.
 *
 * ## Lifecycle
 *
 * Lives alongside the other transitional jobs plumbing. When OCAPI is removed,
 * delete the OCAPI branch and inline the SCAPI calls.
 *
 * @module operations/jobs/run-system-job
 */
import type {B2CInstance, ScapiClientConfig} from '../../instance/index.js';
import {isOcapiDeprecatedFault, OcapiDeprecatedError} from '../../clients/error-utils.js';
import {createScapiJobsClient} from '../../clients/scapi-jobs.js';
import {getLogger} from '../../logging/logger.js';
import {mapCanonicalToOcapiExecution} from './ocapi-mapping.js';
import {executeJob as scapiExecuteJob, getJobExecution as scapiGetJobExecution} from './scapi-ops.js';
import {waitForJob, JobExecutionError, type JobExecution, type WaitForJobOptions} from './run.js';
import {waitForJobExecution, CanonicalJobExecutionError} from './wait-canonical.js';

/**
 * Declarative description of a system job to run. The operation supplies its
 * job ID and the two request-body forms; this module drives the rest.
 */
export interface SystemJobSpec {
  /** System job ID, e.g. `sfcc-site-archive-import`. */
  jobId: string;
  /**
   * OCAPI "shorthand" request body tried first on the OCAPI path (e.g.
   * `{file_name}`, `{export_file, data_units}`, or the CAP `{app_name, ...}`
   * shape). When the instance rejects it with `UnknownPropertyException`, the
   * OCAPI path retries with {@link parameters}.
   */
  ocapiBody: Record<string, unknown>;
  /**
   * Job parameters (`[{name, value}]`). Used as the OCAPI internal-user retry
   * body **and** as the SCAPI request body (SCAPI's `JobExecutionRequest`
   * accepts exactly this shape).
   */
  parameters: Array<{name: string; value: string}>;
  /** Scopes named in the OCAPI-deprecation error (the rw jobs scope). */
  deprecatedScopes?: string[];
  /** Whether to wait for completion (default `true`). */
  wait?: boolean;
  /** Wait options forwarded to the poll loop. */
  waitOptions?: WaitForJobOptions;
  /** Human-readable verb for error messages, e.g. `'execute import job'`. */
  failVerb: string;
}

/**
 * Starts a system job (waiting for completion unless `spec.wait === false`)
 * and returns the raw OCAPI {@link JobExecution}. Throws {@link JobExecutionError}
 * (raw) when the job fails, or {@link OcapiDeprecatedError} when the only
 * reachable backend is a deprecated OCAPI.
 */
export async function runSystemJob(instance: B2CInstance, spec: SystemJobSpec): Promise<JobExecution> {
  const preference = instance.apiBackend;
  const scapiConfig = instance.scapiClientConfig;

  if (preference === 'ocapi') {
    return runOcapiSystemJob(instance, spec);
  }

  if (preference === 'scapi') {
    if (!scapiConfig) {
      throw new Error(
        `${spec.jobId} SCAPI backend requires shortCode, tenantId, and OAuth credentials. ` +
          `Configure them in dw.json or set apiBackend to ocapi.`,
      );
    }
    return runScapiSystemJob(instance, scapiConfig, spec);
  }

  // auto
  if (!scapiConfig) {
    return runOcapiSystemJob(instance, spec);
  }

  // Try SCAPI start; fall back to OCAPI only if the start fails (nothing has
  // run yet). Once started, finishScapiJob handles wait/failure without
  // falling back.
  const client = createScapiJobsClient(
    {shortCode: scapiConfig.shortCode, tenantId: scapiConfig.tenantId},
    scapiConfig.auth,
  );
  let started;
  try {
    started = await startScapiJob(client, scapiConfig.tenantId, spec);
  } catch (error) {
    getLogger().info(
      {jobId: spec.jobId, reason: error instanceof Error ? error.message : String(error)},
      `SCAPI ${spec.jobId} unavailable, falling back to OCAPI`,
    );
    return runOcapiSystemJob(instance, spec);
  }
  return finishScapiJob(client, scapiConfig.tenantId, spec, started);
}

/**
 * SCAPI path: trigger the job (start phase, fallback-eligible in auto) then
 * wait/map (finish phase, never falls back).
 */
async function runScapiSystemJob(
  instance: B2CInstance,
  scapiConfig: ScapiClientConfig,
  spec: SystemJobSpec,
): Promise<JobExecution> {
  const client = createScapiJobsClient(
    {shortCode: scapiConfig.shortCode, tenantId: scapiConfig.tenantId},
    scapiConfig.auth,
  );
  const started = await startScapiJob(client, scapiConfig.tenantId, spec);
  return finishScapiJob(client, scapiConfig.tenantId, spec, started);
}

async function startScapiJob(client: ReturnType<typeof createScapiJobsClient>, tenantId: string, spec: SystemJobSpec) {
  getLogger().debug({jobId: spec.jobId}, `Executing ${spec.jobId} job via SCAPI`);
  return scapiExecuteJob(client, spec.jobId, {parameters: spec.parameters, tenantId});
}

async function finishScapiJob(
  client: ReturnType<typeof createScapiJobsClient>,
  tenantId: string,
  spec: SystemJobSpec,
  started: Awaited<ReturnType<typeof scapiExecuteJob>>,
): Promise<JobExecution> {
  getLogger().debug({jobId: spec.jobId, executionId: started.id}, `${spec.jobId} job started: ${started.id}`);

  if (spec.wait === false) {
    return mapCanonicalToOcapiExecution(started);
  }

  try {
    const final = await waitForJobExecution(
      (jobId, executionId) => scapiGetJobExecution(client, jobId, executionId, tenantId),
      spec.jobId,
      started.id,
      spec.waitOptions,
    );
    return mapCanonicalToOcapiExecution(final);
  } catch (error) {
    // Re-throw a job FAILURE as the raw JobExecutionError so callers' existing
    // log-fetch handling works identically across backends. Other errors
    // (timeout, network) propagate as-is — never fall back post-start.
    if (error instanceof CanonicalJobExecutionError) {
      throw new JobExecutionError(error.message, mapCanonicalToOcapiExecution(error.execution));
    }
    throw error;
  }
}

/**
 * OCAPI path: preserves the legacy behavior exactly — POST the shorthand body,
 * retry with the parameters body on `UnknownPropertyException`, then wait.
 */
async function runOcapiSystemJob(instance: B2CInstance, spec: SystemJobSpec): Promise<JobExecution> {
  const logger = getLogger();
  logger.debug({jobId: spec.jobId}, `Executing ${spec.jobId} job via OCAPI`);

  let execution: JobExecution;

  const {data, error} = await instance.ocapi.POST('/jobs/{job_id}/executions', {
    params: {path: {job_id: spec.jobId}},
    body: spec.ocapiBody as unknown as string,
  });

  if (
    error?.fault?.type === 'UnknownPropertyException' &&
    (error.fault.arguments as Record<string, unknown>)?.document === 'job_execution_request'
  ) {
    // Retry with parameters format (internal/support users)
    logger.warn('Retrying with parameters format for internal users');

    const {data: retryData, error: retryError} = await instance.ocapi.POST('/jobs/{job_id}/executions', {
      params: {path: {job_id: spec.jobId}},
      body: {parameters: spec.parameters} as unknown as string,
    });

    if (retryError || !retryData) {
      if (isOcapiDeprecatedFault(retryError))
        throw new OcapiDeprecatedError({cause: retryError, requiredScopes: spec.deprecatedScopes});
      throw new Error(retryError?.fault?.message ?? `Failed to ${spec.failVerb}`, {cause: retryError});
    }

    execution = retryData;
  } else if (error || !data) {
    if (isOcapiDeprecatedFault(error))
      throw new OcapiDeprecatedError({cause: error, requiredScopes: spec.deprecatedScopes});
    throw new Error(error?.fault?.message ?? `Failed to ${spec.failVerb}`, {cause: error});
  } else {
    execution = data;
  }

  logger.debug({jobId: spec.jobId, executionId: execution.id}, `${spec.jobId} job started: ${execution.id}`);

  if (spec.wait === false) {
    return execution;
  }

  return waitForJob(instance, spec.jobId, execution.id!, spec.waitOptions);
}
