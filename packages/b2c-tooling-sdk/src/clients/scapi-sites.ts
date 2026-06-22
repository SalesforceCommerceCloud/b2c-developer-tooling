/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './scapi-sites.generated.js';
import {buildScapiClient, type ScapiClientConfig} from './scapi-client-factory.js';
import {buildTenantScope, toOrganizationId, normalizeTenantId} from './custom-apis.js';
import type {ScopeCascade} from './middleware.js';

export {toOrganizationId, normalizeTenantId, buildTenantScope};

export type {paths, components};
export type ScapiSitesClient = Client<paths>;
export type ScapiSitesError = components['schemas']['ErrorResponse'];

export type Site = components['schemas']['Site'];
export type Sites = components['schemas']['Sites'];
export type SiteSearchResult = components['schemas']['SiteSearchResult'];

/**
 * Per-operation scope cascade for SCAPI Sites.
 *
 * The Sites API is read-only (list, get, search), but exposes both a
 * read-only (`sfcc.sites`) and read-write (`sfcc.sites.rw`) scope. A given API
 * client may have been granted only one of them, so reads try `rw` first
 * (which also grants read) and fall back to the read-only scope. There are no
 * write operations, but the `write` tier is defined for completeness so the
 * cascade type is satisfied.
 */
export const SCAPI_SITES_CASCADE: ScopeCascade = {
  read: [['sfcc.sites.rw'], ['sfcc.sites']],
  write: [['sfcc.sites.rw']],
};

export type ScapiSitesClientConfig = ScapiClientConfig;

export function createScapiSitesClient(config: ScapiSitesClientConfig, auth: AuthStrategy): ScapiSitesClient {
  return buildScapiClient<paths>(
    {
      pathSegment: 'site/sites/v1',
      domainKey: 'scapi-sites',
      scopeCascade: SCAPI_SITES_CASCADE,
      logPrefix: 'SCAPI-SITES',
    },
    config,
    auth,
  );
}
