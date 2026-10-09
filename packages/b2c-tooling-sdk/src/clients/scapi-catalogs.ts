/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './scapi-catalogs.generated.js';
import {buildScapiClient, type ScapiClientConfig} from './scapi-client-factory.js';
import type {ScopeCascade} from './middleware.js';

export type {paths, components};
export type ScapiCatalogsClient = Client<paths>;
export type ScapiCatalogsClientConfig = ScapiClientConfig;
export type Catalog = components['schemas']['Catalog'];
export type Catalogs = components['schemas']['Catalogs'];

export const SCAPI_CATALOGS_CASCADE: ScopeCascade = {
  read: [['sfcc.catalogs.rw'], ['sfcc.catalogs']],
  write: [['sfcc.catalogs.rw']],
};

export function createScapiCatalogsClient(config: ScapiCatalogsClientConfig, auth: AuthStrategy): ScapiCatalogsClient {
  return buildScapiClient<paths>(
    {
      pathSegment: 'product/catalogs/v1',
      domainKey: 'scapi-catalogs',
      scopeCascade: SCAPI_CATALOGS_CASCADE,
      logPrefix: 'SCAPI-CATALOGS',
    },
    config,
    auth,
  );
}
