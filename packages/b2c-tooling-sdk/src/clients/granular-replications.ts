/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './granular-replications.generated.js';
import {createAuthMiddleware, createLoggingMiddleware, createRateLimitMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import {OAuthStrategy} from '../auth/oauth.js';

export type {paths, components};
export type GranularReplicationsClient = Client<paths>;
export type GranularReplicationsResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;
export type GranularReplicationsError = components['schemas']['ErrorResponse'];

// Entity type exports for CLI
export type ProductItem = components['schemas']['ProductItem'];
export type PriceTableItem = components['schemas']['PriceTableItem'];
export type ContentAssetItemPrivate = components['schemas']['ContentAssetItemPrivate'];
export type ContentAssetItemShared = components['schemas']['ContentAssetItemShared'];
export type PublishProcessResponse = components['schemas']['PublishProcessResponse'];
export type PublishProcessListResponse = components['schemas']['PublishProcessListResponse'];
export type PublishIdResponse = components['schemas']['PublishIdResponse'];

export interface GranularReplicationsClientConfig {
  shortCode: string;
  organizationId: string;
  scopes?: string[];
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * Creates a Granular Replications API client for publishing individual items.
 *
 * The Granular Replications API enables programmatic publishing of individual items
 * (products, price tables, content assets) from staging to production environments.
 *
 * @param config - Client configuration with shortCode and organizationId
 * @param auth - OAuth authentication strategy
 * @returns Typed Granular Replications API client
 *
 * @example
 * ```typescript
 * import {createGranularReplicationsClient, OAuthStrategy} from '@salesforce/b2c-tooling-sdk';
 *
 * const auth = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   tokenEndpoint: 'https://account.demandware.com/dwsso/oauth2/access_token'
 * });
 *
 * const client = createGranularReplicationsClient({
 *   shortCode: 'kv7kzm78',
 *   organizationId: 'f_ecom_zzxy_prd'
 * }, auth);
 *
 * // Queue a product for publishing
 * const result = await client.POST('/organizations/{organizationId}/granular-processes', {
 *   params: {path: {organizationId: 'f_ecom_zzxy_prd'}},
 *   body: {product: {productId: 'PROD-123'}}
 * });
 *
 * // List all publish processes
 * const processes = await client.GET('/organizations/{organizationId}/granular-processes', {
 *   params: {
 *     path: {organizationId: 'f_ecom_zzxy_prd'},
 *     query: {limit: 20, offset: 0}
 *   }
 * });
 * ```
 *
 * @see https://developer.salesforce.com/docs/commerce/commerce-api/references/replications
 */
export function createGranularReplicationsClient(
  config: GranularReplicationsClientConfig,
  auth: AuthStrategy,
): GranularReplicationsClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/operation/replications/v1`,
  });

  // OAuth scope handling
  const requiredScopes = config.scopes ?? ['sfcc.granular-replications.rw'];
  const scopedAuth = auth instanceof OAuthStrategy ? auth.withAdditionalScopes(requiredScopes) : auth;

  client.use(createAuthMiddleware(scopedAuth));

  for (const middleware of registry.getMiddleware('granular-replications')) {
    client.use(middleware);
  }

  client.use(createRateLimitMiddleware({prefix: 'GRANULAR-REPLICATIONS'}));
  client.use(createLoggingMiddleware('GRANULAR-REPLICATIONS'));

  return client;
}
