/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './scapi-jobs.generated.js';
import {createAuthMiddleware, createLoggingMiddleware, createRateLimitMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import {OAuthStrategy} from '../auth/oauth.js';
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

export interface ScapiJobsClientConfig {
  shortCode: string;
  tenantId: string;
  scopes?: string[];
  middlewareRegistry?: MiddlewareRegistry;
}

export function createScapiJobsClient(config: ScapiJobsClientConfig, auth: AuthStrategy): ScapiJobsClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/operation/jobs/v1`,
  });

  const requiredScopes = config.scopes ?? [...SCAPI_JOBS_RW_SCOPES, buildTenantScope(config.tenantId)];
  const scopedAuth = auth instanceof OAuthStrategy ? auth.withAdditionalScopes(requiredScopes) : auth;

  client.use(createAuthMiddleware(scopedAuth));

  for (const middleware of registry.getMiddleware('scapi-jobs')) {
    client.use(middleware);
  }

  client.use(createRateLimitMiddleware({prefix: 'SCAPI-JOBS'}));
  client.use(createLoggingMiddleware('SCAPI-JOBS'));

  return client;
}
