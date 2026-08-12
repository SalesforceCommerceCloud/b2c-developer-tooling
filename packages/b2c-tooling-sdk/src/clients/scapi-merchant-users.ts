/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './scapi-merchant-users.generated.js';
import {buildScapiClient, type ScapiClientConfig} from './scapi-client-factory.js';

export type {paths, components};
export type ScapiMerchantUsersClient = Client<paths>;
export type ScapiMerchantUsersResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;
export type ScapiMerchantUsersError = components['schemas']['ErrorResponse'];

export type User = components['schemas']['User'];
export type UserUpdateRequest = components['schemas']['UserUpdateRequest'];
export type UserSearch = components['schemas']['UserSearch'];

export const SCAPI_MERCHANT_USERS_READ_SCOPES = ['sfcc.users'];
export const SCAPI_MERCHANT_USERS_RW_SCOPES = ['sfcc.users.rw'];

export type ScapiMerchantUsersClientConfig = ScapiClientConfig;

export function createScapiMerchantUsersClient(
  config: ScapiMerchantUsersClientConfig,
  auth: AuthStrategy,
): ScapiMerchantUsersClient {
  return buildScapiClient<paths>(
    {
      pathSegment: 'merchant/users/v1',
      domainKey: 'scapi-merchant-users',
      defaultScopes: SCAPI_MERCHANT_USERS_RW_SCOPES,
      logPrefix: 'SCAPI-USERS',
    },
    config,
    auth,
  );
}
