/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * SLAS Admin API client for B2C Commerce.
 *
 * Provides a fully typed client for SLAS Admin API operations using
 * openapi-fetch with OAuth authentication middleware. Used for
 * administration tasks like managing tenants and SLAS clients.
 *
 * @module clients/slas-admin
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './slas-admin.generated.js';
import {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';

/**
 * Re-export generated types for external use.
 */
export type {paths, components};

/**
 * The typed SLAS client - this is the openapi-fetch Client with full type safety.
 *
 * ## Common Endpoints
 *
 * | Method | Path | Description |
 * |--------|------|-------------|
 * | GET | `/tenants/{tenantId}` | Get tenant info |
 * | GET | `/tenants/{tenantId}/clients` | List SLAS clients |
 * | PUT | `/tenants/{tenantId}/clients/{clientId}` | Create/update a client |
 * | DELETE | `/tenants/{tenantId}/clients/{clientId}` | Delete a client |
 *
 * @example
 * ```typescript
 * import { createSlasClient } from '@salesforce/b2c-tooling-sdk/clients';
 * import { OAuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const auth = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createSlasClient({ shortCode: 'kv7kzm78' }, auth);
 *
 * // List all SLAS clients for a tenant
 * const { data, error } = await client.GET('/tenants/{tenantId}/clients', {
 *   params: { path: { tenantId: 'your-tenant' } }
 * });
 * ```
 *
 * @see {@link createSlasClient} for instantiation
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/slas-admin?meta=Summary | SLAS Admin API Reference}
 */
export type SlasClient = Client<paths>;

/**
 * Helper type to extract response data from an operation.
 */
export type SlasResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * Standard SLAS error response structure.
 */
export interface SlasError {
  status: number;
  title: string;
  type: string;
  detail?: string;
  instance?: string;
}

/**
 * Configuration for creating a SLAS client.
 */
export interface SlasClientConfig {
  /**
   * The short code for the SCAPI instance.
   * This is typically a 4-8 character alphanumeric code.
   * @example "kv7kzm78"
   */
  shortCode: string;

  /**
   * Middleware registry to use for this client.
   * If not specified, uses the global middleware registry.
   */
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * Creates a typed SLAS Admin API client.
 *
 * Returns the openapi-fetch client directly, with authentication
 * handled via middleware. This gives full access to all openapi-fetch
 * features with type-safe paths, parameters, and responses.
 *
 * @param config - SLAS client configuration
 * @param auth - Authentication strategy (typically OAuth)
 * @returns Typed openapi-fetch client
 *
 * @example
 * // Create SLAS client with OAuth auth
 * const oauthStrategy = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   scopes: ['SLAS_ORGANIZATION_ADMIN']
 * });
 *
 * const client = createSlasClient(
 *   { shortCode: 'kv7kzm78' },
 *   oauthStrategy
 * );
 *
 * // Create or update a SLAS client
 * const { data, error } = await client.PUT('/tenants/{tenantId}/clients/{clientId}', {
 *   params: {
 *     path: { tenantId: 'your-tenant', clientId: 'new-client-id' }
 *   },
 *   body: {
 *     clientId: 'new-client-id',
 *     name: 'My SLAS Client',
 *     channels: ['RefArch'],
 *     scopes: ['sfcc.products', 'sfcc.catalogs'],
 *     redirectUri: ['http://localhost:3000/callback'],
 *     secret: '',
 *     isPrivateClient: true
 *   }
 * });
 *
 * @example
 * // List all clients for a tenant
 * const { data, error } = await client.GET('/tenants/{tenantId}/clients', {
 *   params: { path: { tenantId: 'your-tenant' } }
 * });
 */
export function createSlasClient(config: SlasClientConfig, auth: AuthStrategy): SlasClient {
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${config.shortCode}.api.commercecloud.salesforce.com/shopper/auth-admin/v1`,
  });

  // Core middleware: auth first
  client.use(createAuthMiddleware(auth));

  // Plugin middleware from registry
  for (const middleware of registry.getMiddleware('slas')) {
    client.use(middleware);
  }

  // Logging middleware last (sees complete request with all modifications)
  client.use(createLoggingMiddleware('SLAS'));

  return client;
}
