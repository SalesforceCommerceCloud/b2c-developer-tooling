/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './scapi-merchant-users.generated.js';
import {createAuthMiddleware, createLoggingMiddleware, createRateLimitMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import {OAuthStrategy} from '../auth/oauth.js';
import {buildTenantScope} from './custom-apis.js';

export type {paths, components};
export type ScapiMerchantUsersClient = Client<paths>;
export type ScapiMerchantUsersResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;
export type ScapiMerchantUsersError = components['schemas']['ErrorResponse'];

export type User = components['schemas']['User'];
export type UserUpdateRequest = components['schemas']['UserUpdateRequest'];
export type UserSearch = components['schemas']['UserSearch'];

export const SCAPI_MERCHANT_USERS_READ_SCOPES = ['sfcc.users'];
export const SCAPI_MERCHANT_USERS_RW_SCOPES = ['sfcc.users.rw'];

export interface ScapiMerchantUsersClientConfig {
  shortCode: string;
  tenantId: string;
  /** Override scopes (default: sfcc.users.rw + tenant scope). */
  scopes?: string[];
  middlewareRegistry?: MiddlewareRegistry;
}

export function createScapiMerchantUsersClient(
  config: ScapiMerchantUsersClientConfig,
  auth: AuthStrategy,
): ScapiMerchantUsersClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/merchant/users/v1`,
  });

  const requiredScopes = config.scopes ?? [...SCAPI_MERCHANT_USERS_RW_SCOPES, buildTenantScope(config.tenantId)];
  const scopedAuth = auth instanceof OAuthStrategy ? auth.withAdditionalScopes(requiredScopes) : auth;

  client.use(createAuthMiddleware(scopedAuth));

  for (const middleware of registry.getMiddleware('scapi-merchant-users')) {
    client.use(middleware);
  }

  client.use(createRateLimitMiddleware({prefix: 'SCAPI-USERS'}));
  client.use(createLoggingMiddleware('SCAPI-USERS'));

  return client;
}
