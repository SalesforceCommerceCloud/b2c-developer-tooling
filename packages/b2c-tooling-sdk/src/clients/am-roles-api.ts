/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Account Manager Roles API client for B2C Commerce.
 *
 * Provides a fully typed client for the Account Manager Roles REST API using
 * openapi-fetch with OAuth authentication middleware. Used for retrieving
 * role information and permissions in Account Manager.
 *
 * @module clients/am-roles-api
 */
import createClient, {type Client, type Middleware} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './am-roles-api.generated.js';
import {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';
import {getLogger} from '../logging/logger.js';

/**
 * Re-export generated types for external use.
 */
export type {paths, components};

/**
 * The typed Account Manager Roles client - this is the openapi-fetch Client with full type safety.
 *
 * @see {@link createAccountManagerRolesClient} for instantiation
 */
export type AccountManagerRolesClient = Client<paths>;

/**
 * Helper type to extract response data from an operation.
 */
export type AccountManagerRolesResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * Account Manager Roles error response type from the generated schema.
 */
export type AccountManagerRolesError = components['schemas']['ErrorResponse'];

/**
 * Middleware to transform pageable query parameters from bracket notation
 * (pageable[size]=X&pageable[page]=Y) to flattened format (size=X&page=Y)
 * that the Account Manager API expects.
 */
function createPageableTransformMiddleware(): Middleware {
  const logger = getLogger();
  return {
    async onRequest({request}) {
      const url = new URL(request.url);

      // Check if URL has pageable[size] or pageable[page] parameters
      const pageableSize = url.searchParams.get('pageable[size]');
      const pageablePage = url.searchParams.get('pageable[page]');

      if (pageableSize !== null || pageablePage !== null) {
        // Remove the bracket notation parameters
        url.searchParams.delete('pageable[size]');
        url.searchParams.delete('pageable[page]');

        // Add flattened parameters
        if (pageableSize !== null) {
          url.searchParams.set('size', pageableSize);
        }
        if (pageablePage !== null) {
          url.searchParams.set('page', pageablePage);
        }

        logger.trace(
          {
            originalUrl: request.url,
            transformedUrl: url.toString(),
            size: pageableSize,
            page: pageablePage,
          },
          '[AM-ROLES] Transformed pageable query parameters from bracket to flattened notation',
        );

        return new Request(url.toString(), {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
      }

      return request;
    },
  };
}

/**
 * Configuration for creating an Account Manager Roles client.
 */
export interface AccountManagerRolesClientConfig {
  /**
   * Account Manager hostname.
   * Defaults to: account.demandware.com
   *
   * @example "account.demandware.com"
   */
  hostname?: string;

  /**
   * Middleware registry to use for this client.
   * If not specified, uses the global middleware registry.
   */
  middlewareRegistry?: MiddlewareRegistry;
}

/**
 * Creates a typed Account Manager Roles API client.
 *
 * Returns the openapi-fetch client directly, with authentication
 * handled via middleware. This gives full access to all openapi-fetch
 * features with type-safe paths, parameters, and responses.
 *
 * @param config - Account Manager Roles client configuration
 * @param auth - Authentication strategy (typically OAuth)
 * @returns Typed openapi-fetch client
 *
 * @example
 * // Create Account Manager Roles client with OAuth auth
 * const oauthStrategy = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createAccountManagerRolesClient({}, oauthStrategy);
 *
 * // List roles
 * const { data, error } = await client.GET('/dw/rest/v1/roles', {
 *   params: { query: { pageable: { size: 25, page: 0 } } }
 * });
 *
 * // Get role by ID
 * const { data, error } = await client.GET('/dw/rest/v1/roles/{roleId}', {
 *   params: { path: { roleId: 'bm-admin' } }
 * });
 */
export function createAccountManagerRolesClient(
  config: AccountManagerRolesClientConfig,
  auth: AuthStrategy,
): AccountManagerRolesClient {
  const hostname = config.hostname ?? DEFAULT_ACCOUNT_MANAGER_HOST;
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<paths>({
    baseUrl: `https://${hostname}`,
  });

  // Core middleware: auth first
  client.use(createAuthMiddleware(auth));

  // Transform pageable query parameters from bracket notation to flattened format
  // This is needed because the API expects size=X&page=Y, not pageable[size]=X&pageable[page]=Y
  client.use(createPageableTransformMiddleware());

  // Plugin middleware from registry
  for (const middleware of registry.getMiddleware('am-roles-api')) {
    client.use(middleware);
  }

  // Logging middleware last (sees complete request with all modifications)
  client.use(createLoggingMiddleware('AM-ROLES'));

  return client;
}

/**
 * Role type from the generated schema.
 */
export type AccountManagerRole = components['schemas']['Role'];
export type RoleCollection = components['schemas']['RoleCollection'];

/**
 * Options for listing roles.
 */
export interface ListRolesOptions {
  /** Page size (default: 20, min: 1, max: 4000) */
  size?: number;
  /** Page number (default: 0) */
  page?: number;
  /** Filter by target type (User or ApiClient) */
  roleTargetType?: 'ApiClient' | 'User';
}

/**
 * Retrieves details of a role by ID.
 *
 * @param client - Account Manager Roles client
 * @param roleId - Role ID
 * @returns Role details
 * @throws Error if role is not found or request fails
 */
export async function getRole(client: AccountManagerRolesClient, roleId: string): Promise<AccountManagerRole> {
  const result = await client.GET('/dw/rest/v1/roles/{roleId}', {
    params: {path: {roleId}},
  });

  if (result.error) {
    const error = result.error as {error?: {message?: string}};
    if (result.response?.status === 404) {
      throw new Error(`Role ${roleId} not found`);
    }
    throw new Error(error.error?.message || `Failed to get role: ${JSON.stringify(result.error)}`);
  }

  if (!result.data) {
    throw new Error('No data returned from API');
  }

  return result.data;
}

/**
 * Lists roles with pagination.
 *
 * @param client - Account Manager Roles client
 * @param options - List options (size, page, roleTargetType)
 * @returns Paginated role collection
 * @throws Error if request fails
 */
export async function listRoles(
  client: AccountManagerRolesClient,
  options: ListRolesOptions = {},
): Promise<RoleCollection> {
  const {size = 20, page = 0, roleTargetType} = options;

  const result = await client.GET('/dw/rest/v1/roles', {
    params: {
      query: {
        pageable: {
          size,
          page,
        },
        ...(roleTargetType && {roleTargetType}),
      },
    },
  });

  if (result.error) {
    const error = result.error as {
      error?: {message?: string};
      errors?: Array<{message?: string; code?: string}>;
    };

    // Check for pagination out-of-bounds error
    const errorMessage = error.errors?.[0]?.message || error.error?.message;
    if (errorMessage?.includes('fromIndex') && errorMessage?.includes('toIndex')) {
      throw new Error(
        `Page ${page} is out of bounds. The requested page exceeds the available data. Try a lower page number.`,
      );
    }

    throw new Error(errorMessage || `Failed to list roles: ${JSON.stringify(result.error)}`);
  }

  return result.data || {content: []};
}
