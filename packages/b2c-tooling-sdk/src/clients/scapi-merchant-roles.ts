/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './scapi-merchant-roles.generated.js';
import {buildScapiClient, type ScapiClientConfig} from './scapi-client-factory.js';

export type {paths, components};
export type ScapiMerchantRolesClient = Client<paths>;
export type ScapiMerchantRolesResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;
export type ScapiMerchantRolesError = components['schemas']['ErrorResponse'];

export type Role = components['schemas']['Role'];
export type RolePermissions = components['schemas']['RolePermissions'];
export type RoleSearch = components['schemas']['RoleSearch'];

export const SCAPI_MERCHANT_ROLES_READ_SCOPES = ['sfcc.roles'];
export const SCAPI_MERCHANT_ROLES_RW_SCOPES = ['sfcc.roles.rw'];

export type ScapiMerchantRolesClientConfig = ScapiClientConfig;

export function createScapiMerchantRolesClient(
  config: ScapiMerchantRolesClientConfig,
  auth: AuthStrategy,
): ScapiMerchantRolesClient {
  return buildScapiClient<paths>(
    {
      pathSegment: 'merchant/roles/v1',
      domainKey: 'scapi-merchant-roles',
      defaultScopes: SCAPI_MERCHANT_ROLES_RW_SCOPES,
      logPrefix: 'SCAPI-ROLES',
    },
    config,
    auth,
  );
}
