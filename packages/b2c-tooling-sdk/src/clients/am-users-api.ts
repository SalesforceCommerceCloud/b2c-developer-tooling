/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Account Manager Users API client for B2C Commerce.
 *
 * Provides a fully typed client for the Account Manager Users REST API using
 * openapi-fetch with OAuth authentication middleware. Used for managing
 * user accounts, roles, and permissions in Account Manager.
 *
 * @module clients/am-users-api
 */
import createClient, {type Client, type Middleware} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './am-users-api.generated.js';
import {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';
import {getLogger} from '../logging/logger.js';

/**
 * Re-export generated types for external use.
 */
export type {paths, components};

/**
 * The typed Account Manager Users client - this is the openapi-fetch Client with full type safety.
 *
 * @see {@link createAccountManagerClient} for instantiation
 */
export type AccountManagerClient = Client<paths>;

/**
 * Helper type to extract response data from an operation.
 */
export type AccountManagerResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * Account Manager error response type from the generated schema.
 */
export type AccountManagerError = components['schemas']['ErrorResponse'];

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
          '[AM-USERS] Transformed pageable query parameters from bracket to flattened notation',
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
 * Configuration for creating an Account Manager client.
 */
export interface AccountManagerClientConfig {
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
 * Creates a typed Account Manager Users API client.
 *
 * Returns the openapi-fetch client directly, with authentication
 * handled via middleware. This gives full access to all openapi-fetch
 * features with type-safe paths, parameters, and responses.
 *
 * @param config - Account Manager client configuration
 * @param auth - Authentication strategy (typically OAuth)
 * @returns Typed openapi-fetch client
 *
 * @example
 * // Create Account Manager client with OAuth auth
 * const oauthStrategy = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createAccountManagerClient({}, oauthStrategy);
 *
 * // List users
 * const { data, error } = await client.GET('/dw/rest/v1/users', {
 *   params: { query: { pageable: { size: 25, page: 0 } } }
 * });
 *
 * // Get user by ID
 * const { data, error } = await client.GET('/dw/rest/v1/users/{userId}', {
 *   params: { path: { userId: 'user-uuid' } }
 * });
 *
 * // Create user
 * const { data, error } = await client.POST('/dw/rest/v1/users', {
 *   body: {
 *     mail: 'user@example.com',
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     organizations: ['org-id'],
 *     primaryOrganization: 'org-id',
 *   }
 * });
 */
export function createAccountManagerClient(
  config: AccountManagerClientConfig,
  auth: AuthStrategy,
): AccountManagerClient {
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
  for (const middleware of registry.getMiddleware('am-users-api')) {
    client.use(middleware);
  }

  // Logging middleware last (sees complete request with all modifications)
  client.use(createLoggingMiddleware('AM-USERS'));

  return client;
}

/**
 * Role name mappings between external and internal formats.
 */
export const ROLE_NAMES_MAP: Record<string, string> = {
  'bm-admin': 'ECOM_ADMIN',
  'bm-user': 'ECOM_USER',
};

export const ROLE_NAMES_MAP_REVERSE: Record<string, string> = {
  ECOM_ADMIN: 'bm-admin',
  ECOM_USER: 'bm-user',
};

/**
 * Maps the role name to an internal role ID accepted by the API.
 */
export function mapToInternalRole(role: string): string {
  if (ROLE_NAMES_MAP[role]) {
    return ROLE_NAMES_MAP[role];
  }
  return role.toUpperCase().replace(/-/g, '_');
}

/**
 * Maps the internal role ID to role name.
 */
export function mapFromInternalRole(roleID: string): string {
  if (ROLE_NAMES_MAP_REVERSE[roleID]) {
    return ROLE_NAMES_MAP_REVERSE[roleID];
  }
  return roleID.toLowerCase().replace(/_/g, '-');
}

/**
 * User type from the generated schema.
 */
export type AccountManagerUser = components['schemas']['UserRead'];
export type UserCreate = components['schemas']['UserCreate'];
export type UserUpdate = components['schemas']['UserUpdate'];
export type UserCollection = components['schemas']['UserCollection'];
export type UserState = 'INITIAL' | 'ENABLED' | 'DELETED';

/**
 * Options for listing users.
 */
export interface ListUsersOptions {
  /** Page size (default: 20, min: 1, max: 4000) */
  size?: number;
  /** Page number (default: 0) */
  page?: number;
}

/**
 * Retrieves details of a user by ID.
 *
 * @param client - Account Manager client
 * @param userId - User ID (UUID)
 * @returns User details
 * @throws Error if user is not found or request fails
 */
export async function getUser(client: AccountManagerClient, userId: string): Promise<AccountManagerUser> {
  const result = await client.GET('/dw/rest/v1/users/{userId}', {
    params: {path: {userId}},
  });

  if (result.error) {
    const error = result.error as {error?: {message?: string}};
    if (result.response?.status === 404) {
      throw new Error(`User ${userId} not found`);
    }
    throw new Error(error.error?.message || `Failed to get user: ${JSON.stringify(result.error)}`);
  }

  if (!result.data) {
    throw new Error('No data returned from API');
  }

  return result.data;
}

/**
 * Lists users with pagination.
 *
 * @param client - Account Manager client
 * @param options - List options (size, page)
 * @returns Paginated user collection
 * @throws Error if request fails
 */
export async function listUsers(client: AccountManagerClient, options: ListUsersOptions = {}): Promise<UserCollection> {
  const {size = 20, page = 0} = options;

  const result = await client.GET('/dw/rest/v1/users', {
    params: {
      query: {
        pageable: {
          size,
          page,
        },
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

    throw new Error(errorMessage || `Failed to list users: ${JSON.stringify(result.error)}`);
  }

  return result.data || {content: []};
}

/**
 * Creates a new user.
 *
 * @param client - Account Manager client
 * @param user - User details
 * @returns Created user
 * @throws Error if request fails
 */
export async function createUser(client: AccountManagerClient, user: UserCreate): Promise<AccountManagerUser> {
  const result = await client.POST('/dw/rest/v1/users', {
    body: user,
  });

  if (result.error) {
    const error = result.error as {error?: {message?: string}};
    throw new Error(error.error?.message || `Failed to create user: ${JSON.stringify(result.error)}`);
  }

  if (!result.data) {
    throw new Error('No data returned from API');
  }

  return result.data;
}

/**
 * Updates an existing user.
 *
 * @param client - Account Manager client
 * @param userId - User ID
 * @param changes - Changes to apply
 * @returns Updated user
 * @throws Error if request fails
 */
export async function updateUser(
  client: AccountManagerClient,
  userId: string,
  changes: UserUpdate,
): Promise<AccountManagerUser> {
  const result = await client.PUT('/dw/rest/v1/users/{userId}', {
    params: {path: {userId}},
    body: changes,
  });

  if (result.error) {
    const error = result.error as {error?: {message?: string}};
    throw new Error(error.error?.message || `Failed to update user: ${JSON.stringify(result.error)}`);
  }

  if (!result.data) {
    throw new Error('No data returned from API');
  }

  return result.data;
}

/**
 * Disables a user (soft delete - sets userState to DELETED).
 * Users must be disabled before they can be purged.
 *
 * @param client - Account Manager client
 * @param userId - User ID
 * @throws Error if request fails
 */
export async function deleteUser(client: AccountManagerClient, userId: string): Promise<void> {
  const result = await client.POST('/dw/rest/v1/users/{userId}/disable', {
    params: {path: {userId}},
    body: {},
  });

  if (result.error) {
    const error = result.error as {error?: {message?: string}};
    throw new Error(error.error?.message || `Failed to delete user: ${JSON.stringify(result.error)}`);
  }
}

/**
 * Purges a user (hard delete).
 * Users must be in DELETED state before they can be purged.
 *
 * @param client - Account Manager client
 * @param userId - User ID
 * @throws Error if request fails
 */
export async function purgeUser(client: AccountManagerClient, userId: string): Promise<void> {
  const result = await client.DELETE('/dw/rest/v1/users/{userId}', {
    params: {path: {userId}},
  });

  if (result.error) {
    const error = result.error as {error?: {message?: string}};
    throw new Error(error.error?.message || `Failed to purge user: ${JSON.stringify(result.error)}`);
  }
}

/**
 * Resets a user to INITIAL state and sends activation instructions.
 *
 * @param client - Account Manager client
 * @param userId - User ID
 * @throws Error if request fails
 */
export async function resetUser(client: AccountManagerClient, userId: string): Promise<void> {
  const result = await client.POST('/dw/rest/v1/users/{userId}/reset', {
    params: {path: {userId}},
    body: {},
  });

  if (result.error) {
    const error = result.error as {error?: {message?: string}};
    throw new Error(error.error?.message || `Failed to reset user: ${JSON.stringify(result.error)}`);
  }
}

/**
 * Helper to find a user by login (email) from a list of users.
 * This is a convenience function since the API doesn't have a direct search by login endpoint.
 *
 * @param client - Account Manager client
 * @param login - User login (email)
 * @returns User if found, undefined otherwise
 * @throws Error if request fails
 */
export async function findUserByLogin(
  client: AccountManagerClient,
  login: string,
): Promise<AccountManagerUser | undefined> {
  // Search through paginated results
  let page = 0;
  const pageSize = 100;

  while (true) {
    const result = await client.GET('/dw/rest/v1/users', {
      params: {
        query: {
          pageable: {
            page,
            size: pageSize,
          },
        },
      },
    });

    if (result.error) {
      throw new Error(`Failed to search for user: ${JSON.stringify(result.error)}`);
    }

    const users = result.data?.content || [];
    const found = users.find((u) => u.mail === login);

    if (found) {
      return found;
    }

    // If we got fewer results than page size, we've reached the end
    if (users.length < pageSize) {
      return undefined;
    }

    page++;
  }
}
