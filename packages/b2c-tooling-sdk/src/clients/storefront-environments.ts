/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * SCAPI Storefront Environments API client.
 *
 * The modern (OAuth / Account Manager) backend for Managed Runtime environment
 * operations, replacing the legacy MRT Cloud API (`cloud.mobify.com`, per-user
 * API key). Authenticated with a stateless OAuth flow (client-credentials or
 * JWT Bearer) requesting the `sfcc.storefront.environments[.rw]` scopes.
 *
 * This is one of the SCAPI `Storefront` API family (`storefront/<api>/v1`): a
 * dedicated client per API, each with its own path segment, spec, and scope
 * family. This client covers the Environments API's lifecycle surface
 * (list/create/clone/get/update/delete, set-primary, and cache-invalidation),
 * the environment-variables sub-resource (read + merge-PATCH), the
 * access-control-headers sub-resource (list/create/get/delete), and the
 * redirects sub-resource (list/create/get/update/delete + clone action), which
 * is what the `mrt env` lifecycle commands plus `mrt env var`,
 * `mrt env access-control`, and `mrt env redirect` need. Sibling clients
 * (`storefront-deployments`, `storefront-storefronts`) follow the same pattern.
 * The MRT-level composition of these clients lives in `operations/mrt`.
 *
 * ID mapping for B2C Commerce MRT:
 *   - `organizationId` = `f_ecom_<tenant>`
 *   - `storefrontId`   = MRT project slug
 *   - `environmentId`  = MRT environment/target slug
 *
 * @module clients/storefront-environments
 */
import type {Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './storefront-environments.generated.js';
import {buildScapiClient, type ScapiClientConfig} from './scapi-client-factory.js';
import {buildTenantScope, toOrganizationId, normalizeTenantId} from './custom-apis.js';
import type {ScopeCascade} from './middleware.js';

export {toOrganizationId, normalizeTenantId, buildTenantScope};

export type {paths, components};
export type StorefrontEnvironmentsClient = Client<paths>;
export type StorefrontEnvironmentsResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;
export type StorefrontEnvironmentsError = components['schemas']['ErrorResponse'];

export type Environment = components['schemas']['Environment'];
export type EnvironmentResult = components['schemas']['EnvironmentResult'];
export type EnvironmentCreateRequest = components['schemas']['EnvironmentCreateRequest'];
export type EnvironmentUpdateRequest = components['schemas']['EnvironmentUpdateRequest'];
export type EnvironmentCloneRequest = components['schemas']['EnvironmentCloneRequest'];
export type CacheInvalidationRequest = components['schemas']['CacheInvalidationRequest'];
/** Environment lifecycle status (`building` | `ready` | `build_failed` | `deleting` | `deleted` | `delete_failed`). */
export type EnvironmentStatus = components['schemas']['EnvironmentStatus'];
/** AWS region (underscored form) for an environment's SSR function. */
export type SsrRegion = components['schemas']['SsrRegion'];
export type SsrProxyConfig = components['schemas']['SsrProxyConfig'];

export type EnvironmentVariables = components['schemas']['EnvironmentVariables'];
export type EnvironmentVariableEntry = components['schemas']['EnvironmentVariableEntry'];
export type EnvironmentVariablesUpdateRequest = components['schemas']['EnvironmentVariablesUpdateRequest'];
export type EnvironmentVariableUpdateEntry = components['schemas']['EnvironmentVariableUpdateEntry'];

export type AccessControlHeaderEntry = components['schemas']['AccessControlHeader'];
export type AccessControlHeaderResult = components['schemas']['AccessControlHeaderResult'];
export type AccessControlHeaderCreateRequest = components['schemas']['AccessControlHeaderCreateRequest'];

export type RedirectEntry = components['schemas']['Redirect'];
export type RedirectResult = components['schemas']['RedirectResult'];
export type RedirectCreateRequest = components['schemas']['RedirectCreateRequest'];
export type RedirectUpdateRequest = components['schemas']['RedirectUpdateRequest'];
export type RedirectCloneRequest = components['schemas']['RedirectCloneRequest'];

/** Publishing status of an environment variable (`pending` | `completed` | `failed`). */
export type PublishingStatus = components['schemas']['PublishingStatus'];

/**
 * Per-operation scope cascade for the SCAPI Storefront Environments API.
 *
 * Reads accept either rw or ro; writes require rw. The auth middleware tries
 * each candidate against AM in order, caches the first that survives, and lets
 * a broader cached token satisfy a later narrower request without an extra
 * round trip.
 */
export const STOREFRONT_ENVIRONMENTS_CASCADE: ScopeCascade = {
  read: [['sfcc.storefront.environments.rw'], ['sfcc.storefront.environments']],
  write: [['sfcc.storefront.environments.rw']],
};

export type StorefrontEnvironmentsClientConfig = ScapiClientConfig;

export function createStorefrontEnvironmentsClient(
  config: StorefrontEnvironmentsClientConfig,
  auth: AuthStrategy,
): StorefrontEnvironmentsClient {
  return buildScapiClient<paths>(
    {
      pathSegment: 'storefront/environments/v1',
      domainKey: 'storefront-environments',
      scopeCascade: STOREFRONT_ENVIRONMENTS_CASCADE,
      logPrefix: 'STOREFRONT-ENVIRONMENTS',
    },
    config,
    auth,
  );
}
