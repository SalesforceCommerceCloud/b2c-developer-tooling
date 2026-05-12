/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './scapi-scripts.generated.js';
import {buildScapiClient, type ScapiClientConfig} from './scapi-client-factory.js';

export type {paths, components};
export type ScapiScriptsClient = Client<paths>;
export type ScapiScriptsResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;
export type ScapiScriptsError = components['schemas']['ErrorResponse'];

export type CodeVersion = components['schemas']['CodeVersion'];

export const SCAPI_SCRIPTS_READ_SCOPES = ['sfcc.scripts'];
export const SCAPI_SCRIPTS_RW_SCOPES = ['sfcc.scripts.rw'];

export type ScapiScriptsClientConfig = ScapiClientConfig;

export function createScapiScriptsClient(config: ScapiScriptsClientConfig, auth: AuthStrategy): ScapiScriptsClient {
  return buildScapiClient<paths>(
    {
      pathSegment: 'dx/scripts/v1',
      domainKey: 'scapi-scripts',
      defaultScopes: SCAPI_SCRIPTS_RW_SCOPES,
      logPrefix: 'SCAPI-SCRIPTS',
    },
    config,
    auth,
  );
}
