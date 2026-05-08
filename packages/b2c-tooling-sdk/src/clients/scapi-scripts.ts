/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './scapi-scripts.generated.js';
import {createAuthMiddleware, createLoggingMiddleware, createRateLimitMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import {OAuthStrategy} from '../auth/oauth.js';
import {buildTenantScope} from './custom-apis.js';

export type {paths, components};
export type ScapiScriptsClient = Client<paths>;
export type ScapiScriptsResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;
export type ScapiScriptsError = components['schemas']['ErrorResponse'];

export type CodeVersion = components['schemas']['CodeVersion'];

export const SCAPI_SCRIPTS_READ_SCOPES = ['sfcc.scripts'];
export const SCAPI_SCRIPTS_RW_SCOPES = ['sfcc.scripts.rw'];

export interface ScapiScriptsClientConfig {
  shortCode: string;
  tenantId: string;
  /** Override scopes (default: sfcc.scripts.rw + tenant scope). */
  scopes?: string[];
  middlewareRegistry?: MiddlewareRegistry;
}

export function createScapiScriptsClient(config: ScapiScriptsClientConfig, auth: AuthStrategy): ScapiScriptsClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/dx/scripts/v1`,
  });

  const requiredScopes = config.scopes ?? [...SCAPI_SCRIPTS_RW_SCOPES, buildTenantScope(config.tenantId)];
  const scopedAuth = auth instanceof OAuthStrategy ? auth.withAdditionalScopes(requiredScopes) : auth;

  client.use(createAuthMiddleware(scopedAuth));

  for (const middleware of registry.getMiddleware('scapi-scripts')) {
    client.use(middleware);
  }

  client.use(createRateLimitMiddleware({prefix: 'SCAPI-SCRIPTS'}));
  client.use(createLoggingMiddleware('SCAPI-SCRIPTS'));

  return client;
}
