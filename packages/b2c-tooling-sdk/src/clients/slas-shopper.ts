/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import createClient, {type Client} from 'openapi-fetch';
import {wrapNetworkError} from '../errors/network-error.js';
import {createLoggingMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import type {paths, components} from './slas-shopper.generated.js';

export type {paths, components};
export type SlasShopperClient = Client<paths>;

export interface SlasShopperClientConfig {
  shortCode: string;
  organizationId: string;
  /** Defaults to the global middleware registry. */
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * Creates a client for the shopper authorization, login, and token endpoints.
 * Authentication is supplied per request: shopper credentials for login,
 * client credentials for private token exchanges, and PKCE for public clients.
 */
export function createSlasShopperClient(config: SlasShopperClientConfig): SlasShopperClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;
  const client = createClient<paths>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${config.organizationId}`,
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    bodySerializer: (body: unknown) => new URLSearchParams(body as Record<string, string>).toString(),
    redirect: 'manual',
  });

  client.use({
    onError({error, request}) {
      throw wrapNetworkError(error, {operation: 'SLAS token request', host: new URL(request.url).host});
    },
  });
  for (const middleware of registry.getMiddleware('slas')) {
    client.use(middleware);
  }
  client.use(createLoggingMiddleware('SLAS'));
  return client;
}
