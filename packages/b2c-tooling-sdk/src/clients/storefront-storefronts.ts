/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * SCAPI Storefront Storefronts API client.
 *
 * The modern (OAuth / Account Manager) backend for Managed Runtime project
 * operations, replacing the legacy MRT Cloud API (`cloud.mobify.com`, per-user
 * API key). Authenticated with a stateless OAuth flow (client-credentials or
 * JWT Bearer) requesting the `sfcc.storefront.storefronts[.rw]` scopes.
 *
 * This is one of the SCAPI `Storefront` API family (`storefront/<api>/v1`): a
 * dedicated client per API, each with its own path segment, spec, and scope
 * family. This client covers the storefront resource itself (list/create/get/
 * update/delete), which is what the `mrt project` commands need: an MRT project
 * is a SCAPI storefront. Sibling clients (`storefront-deployments`,
 * `storefront-environments`) follow the same pattern. The MRT-level composition
 * of these clients lives in `operations/mrt`.
 *
 * ID mapping for B2C Commerce MRT:
 *   - `organizationId` = `f_ecom_<tenant>`
 *   - `storefrontId`   = MRT project slug
 *
 * @module clients/storefront-storefronts
 */
import type {Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './storefront-storefronts.generated.js';
import {buildScapiClient, type ScapiClientConfig} from './scapi-client-factory.js';
import {buildTenantScope, toOrganizationId, normalizeTenantId} from './custom-apis.js';
import type {ScopeCascade} from './middleware.js';

export {toOrganizationId, normalizeTenantId, buildTenantScope};

export type {paths, components};
export type StorefrontStorefrontsClient = Client<paths>;
export type StorefrontStorefrontsResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;
export type StorefrontStorefrontsError = components['schemas']['ErrorResponse'];

export type Storefront = components['schemas']['Storefront'];
export type StorefrontResult = components['schemas']['StorefrontResult'];
export type StorefrontCreateRequest = components['schemas']['StorefrontCreateRequest'];
export type StorefrontUpdateRequest = components['schemas']['StorefrontUpdateRequest'];
export type StorefrontType = components['schemas']['StorefrontType'];
export type StorefrontCreateType = components['schemas']['StorefrontCreateType'];
export type StorefrontSetupStatus = components['schemas']['StorefrontSetupStatus'];
export type SsrRegion = components['schemas']['SsrRegion'];

/**
 * Per-operation scope cascade for the SCAPI Storefront Storefronts API.
 *
 * Reads accept either rw or ro; writes require rw. The auth middleware tries
 * each candidate against AM in order, caches the first that survives, and lets
 * a broader cached token satisfy a later narrower request without an extra
 * round trip.
 */
export const STOREFRONT_STOREFRONTS_CASCADE: ScopeCascade = {
  read: [['sfcc.storefront.storefronts.rw'], ['sfcc.storefront.storefronts']],
  write: [['sfcc.storefront.storefronts.rw']],
};

export type StorefrontStorefrontsClientConfig = ScapiClientConfig;

export function createStorefrontStorefrontsClient(
  config: StorefrontStorefrontsClientConfig,
  auth: AuthStrategy,
): StorefrontStorefrontsClient {
  return buildScapiClient<paths>(
    {
      pathSegment: 'storefront/storefronts/v1',
      domainKey: 'storefront-storefronts',
      scopeCascade: STOREFRONT_STOREFRONTS_CASCADE,
      logPrefix: 'STOREFRONT-STOREFRONTS',
    },
    config,
    auth,
  );
}
