/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './scapi-jobs.generated.js';
import {buildScapiClient, type ScapiClientConfig} from './scapi-client-factory.js';
import {buildTenantScope, toOrganizationId, normalizeTenantId} from './custom-apis.js';
import type {ScopeCascade} from './middleware.js';

export {toOrganizationId, normalizeTenantId, buildTenantScope};

export type {paths, components};
export type ScapiJobsClient = Client<paths>;
export type ScapiJobsResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;
export type ScapiJobsError = components['schemas']['ErrorResponse'];

export type JobExecution = components['schemas']['JobExecution'];
export type JobStepExecution = components['schemas']['JobStepExecution'];
export type JobParameter = components['schemas']['JobParameter'];
export type ExecutionStatus = components['schemas']['ExecutionStatus'];
export type ExitStatus = components['schemas']['ExitStatus'];
export type JobExecutionSearchResult = components['schemas']['JobExecutionSearchResult'];

/**
 * Per-operation scope cascade for SCAPI Jobs.
 *
 * Reads accept either rw or ro; writes require rw. The auth middleware tries
 * each candidate against AM in order, caches the first that survives, and
 * lets a broader cached token satisfy a later narrower request without an
 * extra round trip.
 */
export const SCAPI_JOBS_CASCADE: ScopeCascade = {
  read: [['sfcc.jobs.rw'], ['sfcc.jobs']],
  write: [['sfcc.jobs.rw']],
};

export type ScapiJobsClientConfig = ScapiClientConfig;

export function createScapiJobsClient(config: ScapiJobsClientConfig, auth: AuthStrategy): ScapiJobsClient {
  return buildScapiClient<paths>(
    {
      pathSegment: 'operation/jobs/v1',
      domainKey: 'scapi-jobs',
      scopeCascade: SCAPI_JOBS_CASCADE,
      logPrefix: 'SCAPI-JOBS',
    },
    config,
    auth,
  );
}
