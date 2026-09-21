/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * SCAPI Storefront Deployments API client.
 *
 * The modern (OAuth / Account Manager) backend for Managed Runtime deployment
 * operations, replacing the legacy MRT Cloud API (`cloud.mobify.com`, per-user
 * API key). Authenticated with a stateless OAuth flow (client-credentials or
 * JWT Bearer) requesting the `sfcc.storefront.deployments[.rw]` scopes.
 *
 * This is one of the SCAPI `Storefront` API family (`storefront/<api>/v1`): a
 * dedicated client per API, each with its own path segment, spec, and scope
 * family. This client covers the Deployments API (bundles + deployments);
 * sibling clients (`storefront-environments`, `storefront-storefronts`) follow
 * the same pattern. The MRT-level composition of these clients lives in
 * `operations/mrt`.
 *
 * ID mapping for B2C Commerce MRT:
 *   - `organizationId` = `f_ecom_<tenant>`
 *   - `storefrontId`   = MRT project slug
 *   - `environmentId`  = MRT environment/target slug
 *
 * @module clients/storefront-deployments
 */
import type {Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './storefront-deployments.generated.js';
import {buildScapiClient, type ScapiClientConfig} from './scapi-client-factory.js';
import {buildTenantScope, toOrganizationId, normalizeTenantId} from './custom-apis.js';
import type {ScopeCascade} from './middleware.js';

export {toOrganizationId, normalizeTenantId, buildTenantScope};

export type {paths, components};
export type StorefrontDeploymentsClient = Client<paths>;
export type StorefrontDeploymentsResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;
export type StorefrontDeploymentsError = components['schemas']['ErrorResponse'];

export type Bundle = components['schemas']['Bundle'];
export type BundleResult = components['schemas']['BundleResult'];
export type BundleUploadResponse = components['schemas']['BundleUploadResponse'];
export type Deployment = components['schemas']['Deployment'];
export type DeploymentResult = components['schemas']['DeploymentResult'];
export type DeploymentCreateRequest = components['schemas']['DeploymentCreateRequest'];

/** Deployment lifecycle status. */
export type DeploymentStatus = NonNullable<Deployment['status']>;

/**
 * Per-operation scope cascade for the SCAPI Storefront Deployments API.
 *
 * Reads accept either rw or ro; writes require rw. The auth middleware tries
 * each candidate against AM in order, caches the first that survives, and lets
 * a broader cached token satisfy a later narrower request without an extra
 * round trip.
 */
export const STOREFRONT_DEPLOYMENTS_CASCADE: ScopeCascade = {
  read: [['sfcc.storefront.deployments.rw'], ['sfcc.storefront.deployments']],
  write: [['sfcc.storefront.deployments.rw']],
};

export type StorefrontDeploymentsClientConfig = ScapiClientConfig;

export function createStorefrontDeploymentsClient(
  config: StorefrontDeploymentsClientConfig,
  auth: AuthStrategy,
): StorefrontDeploymentsClient {
  return buildScapiClient<paths>(
    {
      pathSegment: 'storefront/deployments/v1',
      domainKey: 'storefront-deployments',
      scopeCascade: STOREFRONT_DEPLOYMENTS_CASCADE,
      logPrefix: 'STOREFRONT-DEPLOYMENTS',
    },
    config,
    auth,
  );
}
