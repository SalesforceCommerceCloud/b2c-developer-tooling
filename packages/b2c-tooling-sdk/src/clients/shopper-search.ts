/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Shopper Search API client for B2C Commerce.
 *
 * Calls the SCAPI Shopper Search API (`search/shopper-search/v1`):
 * `productSearch` and `getSearchSuggestions`. Shopper APIs authenticate with a
 * SLAS shopper access token instead of an Account Manager API client, so this
 * client takes a token provider rather than an `AuthStrategy`. Get a guest
 * token with `getGuestToken()` from `@salesforce/b2c-tooling-sdk/slas`.
 *
 * @module clients/shopper-search
 */
import type {Client, Middleware} from 'openapi-fetch';
import {createHttpClient, type HttpTransportOptions} from './http-transport.js';
import {createLoggingMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import {getScapiOrigin} from './scapi-origin.js';
import type {paths, components} from './shopper-search.generated.js';

export type {paths, components};

/** The typed Shopper Search client returned by {@link createShopperSearchClient}. */
export type ShopperSearchClient = Client<paths>;

/** A product search result returned by `productSearch`. */
export type ProductSearchResult = components['schemas']['ProductSearchResult'];

/** One product in a {@link ProductSearchResult}. */
export type ProductSearchHit = components['schemas']['ProductSearchHit'];

/** One refinement (facet) in a {@link ProductSearchResult}. */
export type ProductSearchRefinement = components['schemas']['ProductSearchRefinement'];

/** The search matching approach: `semantic` or `lexical`. */
export type SearchMode = components['schemas']['SearchMode'];

/**
 * Configuration for {@link createShopperSearchClient}.
 */
export interface ShopperSearchClientConfig extends HttpTransportOptions {
  /** SCAPI short code of the instance. */
  shortCode: string;
  /**
   * Returns the SLAS shopper access token to send as the bearer token.
   * Called once per request, so the caller can refresh an expired token.
   */
  getAccessToken: () => Promise<string> | string;
  /** Abort signal applied to every request. */
  signal?: AbortSignal;
  /** Middleware registry to use. Defaults to the global registry. */
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * Creates a typed Shopper Search API client.
 *
 * @param config - Short code, shopper token provider and transport options
 * @returns A typed client for the Shopper Search API
 *
 * @example
 * ```typescript
 * import {createShopperSearchClient, toOrganizationId} from '@salesforce/b2c-tooling-sdk';
 * import {getGuestToken} from '@salesforce/b2c-tooling-sdk/slas';
 *
 * const token = await getGuestToken({shortCode, organizationId, slasClientId, siteId, redirectUri});
 * const client = createShopperSearchClient({shortCode, getAccessToken: () => token.access_token});
 * const {data} = await client.GET('/organizations/{organizationId}/product-search', {
 *   params: {path: {organizationId: toOrganizationId(tenantId)}, query: {siteId: 'RefArch', q: 'shirt'}},
 * });
 * ```
 */
export function createShopperSearchClient(config: ShopperSearchClientConfig): ShopperSearchClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createHttpClient<paths>(
    {
      baseUrl: `${getScapiOrigin(config.shortCode)}/search/shopper-search/v1`,
      signal: config.signal,
    },
    config,
    {operation: 'Shopper Search request'},
  );

  const bearerToken: Middleware = {
    async onRequest({request}) {
      request.headers.set('Authorization', `Bearer ${await config.getAccessToken()}`);
      return request;
    },
  };

  // Middleware order: auth first (runs last), logging last (sees the complete request)
  client.use(bearerToken);
  for (const middleware of registry.getMiddleware('shopper-search')) {
    client.use(middleware);
  }
  client.use(createLoggingMiddleware('SHOPPER-SEARCH'));

  return client;
}
