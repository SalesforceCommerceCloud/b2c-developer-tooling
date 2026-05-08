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

export const SCAPI_JOBS_READ_SCOPES = ['sfcc.jobs'];
export const SCAPI_JOBS_RW_SCOPES = ['sfcc.jobs.rw'];

export type ScapiJobsClientConfig = ScapiClientConfig;

export function createScapiJobsClient(config: ScapiJobsClientConfig, auth: AuthStrategy): ScapiJobsClient {
  return buildScapiClient<paths>(
    {
      pathSegment: 'operation/jobs/v1',
      domainKey: 'scapi-jobs',
      defaultScopes: SCAPI_JOBS_RW_SCOPES,
      logPrefix: 'SCAPI-JOBS',
    },
    config,
    auth,
  );
}
