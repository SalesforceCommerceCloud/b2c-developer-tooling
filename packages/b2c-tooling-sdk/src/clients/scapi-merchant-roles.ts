/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './scapi-merchant-roles.generated.js';
import {createAuthMiddleware, createLoggingMiddleware, createRateLimitMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import {OAuthStrategy} from '../auth/oauth.js';
import {buildTenantScope} from './custom-apis.js';

export type {paths, components};
export type ScapiMerchantRolesClient = Client<paths>;
export type ScapiMerchantRolesResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;
export type ScapiMerchantRolesError = components['schemas']['ErrorResponse'];

export type Role = components['schemas']['Role'];
export type RolePermissions = components['schemas']['RolePermissions'];
export type RoleSearch = components['schemas']['RoleSearch'];

export const SCAPI_MERCHANT_ROLES_READ_SCOPES = ['sfcc.roles'];
export const SCAPI_MERCHANT_ROLES_RW_SCOPES = ['sfcc.roles.rw'];

export interface ScapiMerchantRolesClientConfig {
  shortCode: string;
  tenantId: string;
  /** Override scopes (default: sfcc.roles.rw + tenant scope). */
  scopes?: string[];
  middlewareRegistry?: MiddlewareRegistry;
}

export function createScapiMerchantRolesClient(
  config: ScapiMerchantRolesClientConfig,
  auth: AuthStrategy,
): ScapiMerchantRolesClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/merchant/roles/v1`,
  });

  const requiredScopes = config.scopes ?? [...SCAPI_MERCHANT_ROLES_RW_SCOPES, buildTenantScope(config.tenantId)];
  const scopedAuth = auth instanceof OAuthStrategy ? auth.withAdditionalScopes(requiredScopes) : auth;

  client.use(createAuthMiddleware(scopedAuth));

  for (const middleware of registry.getMiddleware('scapi-merchant-roles')) {
    client.use(middleware);
  }

  client.use(createRateLimitMiddleware({prefix: 'SCAPI-ROLES'}));
  client.use(createLoggingMiddleware('SCAPI-ROLES'));

  return client;
}
