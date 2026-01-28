/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Account Manager API client for B2C Commerce.
 *
 * Provides clients for the Account Manager REST APIs including users, roles, and organizations.
 * Uses openapi-fetch with OAuth authentication middleware for users and roles,
 * and fetch with OAuth for organizations.
 *
 * @module clients/am-api
 */
import createClient, {type Client, type Middleware} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {
  paths as UsersPaths,
  components as UsersComponents,
  operations as UsersOperations,
} from './am-users-api.generated.js';
import type {paths as RolesPaths, components as RolesComponents} from './am-roles-api.generated.js';
import {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';
import {globalMiddlewareRegistry, type MiddlewareRegistry} from './middleware-registry.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';
import {getLogger} from '../logging/logger.js';

// ============================================================================
// Users API
// ============================================================================

/**
 * The typed Account Manager Users client - this is the openapi-fetch Client with full type safety.
 *
 * @see {@link createAccountManagerUsersClient} for instantiation
 */
export type AccountManagerUsersClient = Client<UsersPaths>;

/**
 * Helper type to extract response data from an operation.
 */
export type AccountManagerResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * Account Manager error response type from the generated schema.
 */
export type AccountManagerError = UsersComponents['schemas']['ErrorResponse'];

/**
 * User type from the generated schema.
 */
export type AccountManagerUser = UsersComponents['schemas']['UserRead'];
export type UserCreate = UsersComponents['schemas']['UserCreate'];
export type UserUpdate = UsersComponents['schemas']['UserUpdate'];

/**
 * Expand parameter type for user operations.
 * Extracted from the generated API types to ensure consistency.
 */
export type UserExpandOption = NonNullable<
  NonNullable<UsersOperations['getUser']['parameters']['query']>['expand']
>[number];
export type UserCollection = UsersComponents['schemas']['UserCollection'];
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
 * Configuration for creating Account Manager clients.
 * Used for all Account Manager API clients (users, roles, orgs).
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
 * @param config - Account Manager Users client configuration
 * @param auth - Authentication strategy (typically OAuth)
 * @returns Typed openapi-fetch client
 *
 * @example
 * // Create Account Manager Users client with OAuth auth
 * const oauthStrategy = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createAccountManagerUsersClient({}, oauthStrategy);
 *
 * // List users
 * const { data, error } = await client.GET('/dw/rest/v1/users', {
 *   params: { query: { pageable: { size: 25, page: 0 } } }
 * });
 */
export function createAccountManagerUsersClient(
  config: AccountManagerClientConfig,
  auth: AuthStrategy,
): AccountManagerUsersClient {
  const hostname = config.hostname ?? DEFAULT_ACCOUNT_MANAGER_HOST;
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<UsersPaths>({
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
 * Retrieves details of a user by ID.
 *
 * @param client - Account Manager Users client
 * @param userId - User ID (UUID)
 * @param expand - Optional array of fields to expand (organizations, roles)
 * @returns User details
 * @throws Error if user is not found or request fails
 */
export async function getUser(
  client: AccountManagerUsersClient,
  userId: string,
  expand?: UserExpandOption[],
): Promise<AccountManagerUser> {
  const result = await client.GET('/dw/rest/v1/users/{userId}', {
    params: {
      path: {userId},
      query: expand && expand.length > 0 ? {expand} : undefined,
    },
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
 * @param client - Account Manager Users client
 * @param options - List options (size, page)
 * @returns Paginated user collection
 * @throws Error if request fails
 */
export async function listUsers(
  client: AccountManagerUsersClient,
  options: ListUsersOptions = {},
): Promise<UserCollection> {
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
 * @param client - Account Manager Users client
 * @param user - User details
 * @returns Created user
 * @throws Error if request fails
 */
export async function createUser(client: AccountManagerUsersClient, user: UserCreate): Promise<AccountManagerUser> {
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
 * @param client - Account Manager Users client
 * @param userId - User ID
 * @param changes - Changes to apply
 * @returns Updated user
 * @throws Error if request fails
 */
export async function updateUser(
  client: AccountManagerUsersClient,
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
 * @param client - Account Manager Users client
 * @param userId - User ID
 * @throws Error if request fails
 */
export async function deleteUser(client: AccountManagerUsersClient, userId: string): Promise<void> {
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
 * @param client - Account Manager Users client
 * @param userId - User ID
 * @throws Error if request fails
 */
export async function purgeUser(client: AccountManagerUsersClient, userId: string): Promise<void> {
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
 * @param client - Account Manager Users client
 * @param userId - User ID
 * @throws Error if request fails
 */
export async function resetUser(client: AccountManagerUsersClient, userId: string): Promise<void> {
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
 * @param client - Account Manager Users client
 * @param login - User login (email)
 * @returns User if found, undefined otherwise
 * @throws Error if request fails
 */
export async function findUserByLogin(
  client: AccountManagerUsersClient,
  login: string,
  expand?: UserExpandOption[],
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
      // If expand is requested, fetch the full user with expanded fields
      if (expand && expand.length > 0 && found.id) {
        return getUser(client, found.id, expand);
      }
      return found;
    }

    // If we got fewer results than page size, we've reached the end
    if (users.length < pageSize) {
      return undefined;
    }

    page++;
  }
}

// ============================================================================
// Roles API
// ============================================================================

/**
 * The typed Account Manager Roles client - this is the openapi-fetch Client with full type safety.
 *
 * @see {@link createAccountManagerRolesClient} for instantiation
 */
export type AccountManagerRolesClient = Client<RolesPaths>;

/**
 * Helper type to extract response data from an operation.
 */
export type AccountManagerRolesResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * Account Manager Roles error response type from the generated schema.
 */
export type AccountManagerRolesError = RolesComponents['schemas']['ErrorResponse'];

/**
 * Role type from the generated schema.
 */
export type AccountManagerRole = RolesComponents['schemas']['Role'];
export type RoleCollection = RolesComponents['schemas']['RoleCollection'];

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
 */
export function createAccountManagerRolesClient(
  config: AccountManagerClientConfig,
  auth: AuthStrategy,
): AccountManagerRolesClient {
  const hostname = config.hostname ?? DEFAULT_ACCOUNT_MANAGER_HOST;
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  const client = createClient<RolesPaths>({
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

// ============================================================================
// Organizations API
// ============================================================================

/**
 * Account Manager Organization type.
 */
export interface AccountManagerOrganization {
  id: string;
  name: string;
  realms: string[];
  twoFARoles: string[];
  twoFAEnabled: boolean;
  allowedVerifierTypes: string[];
  vaasEnabled: boolean;
  sfIdentityFederation: boolean;
  [key: string]: unknown;
}

/**
 * Account Manager Organization collection response.
 */
export interface OrganizationCollection {
  content: AccountManagerOrganization[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  [key: string]: unknown;
}

/**
 * Account Manager audit log record.
 */
export interface AuditLogRecord {
  timestamp: string;
  authorDisplayName: string;
  authorEmail?: string;
  eventType: string;
  eventMessage: string;
  [key: string]: unknown;
}

/**
 * Audit log collection response.
 */
export interface AuditLogCollection {
  content: AuditLogRecord[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  [key: string]: unknown;
}

/**
 * Options for listing organizations.
 */
export interface ListOrgsOptions {
  /** Page size (default: 25, max: 5000) */
  size?: number;
  /** Page number (0-based, default: 0) */
  page?: number;
  /** Return all orgs (uses max page size of 5000) */
  all?: boolean;
}

/**
 * Account Manager Organizations API client.
 */
export interface AccountManagerOrgsClient {
  /**
   * Get organization by ID.
   */
  getOrg(orgId: string): Promise<AccountManagerOrganization>;

  /**
   * Get organization by name (searches for exact or partial match).
   */
  getOrgByName(name: string): Promise<AccountManagerOrganization>;

  /**
   * List organizations with pagination.
   */
  listOrgs(options?: ListOrgsOptions): Promise<OrganizationCollection>;

  /**
   * Get audit logs for an organization.
   */
  getOrgAuditLogs(orgId: string): Promise<AuditLogCollection>;
}

/**
 * Transforms the API organization representation to an external format.
 * Removes internal properties like 'links' that should not be exposed.
 *
 * @param org - The original organization object
 * @returns The transformed organization object
 */
function toExternalOrg(org: AccountManagerOrganization): AccountManagerOrganization {
  // Create a copy to avoid mutating the original
  const transformed = {...org};
  // Always delete the links property
  delete transformed.links;
  return transformed;
}

/**
 * Creates an Account Manager Organizations API client.
 *
 * @param config - Account Manager Organizations client configuration
 * @param auth - Authentication strategy (typically OAuth)
 * @returns Organizations API client
 *
 * @example
 * const oauthStrategy = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createAccountManagerOrgsClient({}, oauthStrategy);
 *
 * // List organizations
 * const orgs = await client.listOrgs({ size: 25, page: 0 });
 *
 * // Get organization by ID
 * const org = await client.getOrg('org-id');
 */
export function createAccountManagerOrgsClient(
  config: AccountManagerClientConfig,
  auth: AuthStrategy,
): AccountManagerOrgsClient {
  const hostname = config.hostname ?? DEFAULT_ACCOUNT_MANAGER_HOST;
  const baseUrl = `https://${hostname}/dw/rest/v1`;
  const logger = getLogger();
  const registry = config.middlewareRegistry ?? globalMiddlewareRegistry;

  // Get middleware from registry for am-orgs-api
  const pluginMiddleware = registry.getMiddleware('am-orgs-api');

  /**
   * Applies middleware chain to a request.
   * Adapts openapi-fetch middleware to work with fetch requests.
   */
  async function applyMiddleware(request: Request): Promise<Request> {
    let processedRequest = request;

    // Apply auth middleware (core)
    if (auth.getAuthorizationHeader) {
      const authHeader = await auth.getAuthorizationHeader();
      processedRequest.headers.set('Authorization', authHeader);
    }

    // Apply plugin middleware from registry
    for (const middleware of pluginMiddleware) {
      if (middleware.onRequest) {
        // Create minimal openapi-fetch context
        const result = await middleware.onRequest({
          request: processedRequest,
          schemaPath: '',
          params: {},
          id: '',
          options: {
            baseUrl: baseUrl,
            parseAs: 'json',
            querySerializer: (params) => new URLSearchParams(params as Record<string, string>).toString(),
            bodySerializer: JSON.stringify,
            fetch: fetch,
          },
        });
        // Middleware can return Request or Response, but we only want Request here
        if (result && result instanceof Request) {
          processedRequest = result;
        }
      }
    }

    // Apply logging middleware (last, so it sees all modifications)
    logger.debug({method: processedRequest.method, url: processedRequest.url}, '[AM-ORGS] Making request');
    logger.trace(
      {
        method: processedRequest.method,
        url: processedRequest.url,
        headers: Object.fromEntries(processedRequest.headers.entries()),
      },
      '[AM-ORGS] Request details',
    );

    return processedRequest;
  }

  /**
   * Applies middleware chain to a response.
   */
  async function processResponse(request: Request, response: Response): Promise<Response> {
    let processedResponse = response;

    // Apply plugin middleware from registry
    for (const middleware of pluginMiddleware) {
      if (middleware.onResponse) {
        const result = await middleware.onResponse({
          request,
          response: processedResponse,
          schemaPath: '',
          params: {},
          id: '',
          options: {
            baseUrl: baseUrl,
            parseAs: 'json',
            querySerializer: (params) => new URLSearchParams(params as Record<string, string>).toString(),
            bodySerializer: JSON.stringify,
            fetch: fetch,
          },
        });
        if (result) {
          processedResponse = result;
        }
      }
    }

    // Apply logging middleware (last)
    logger.debug(
      {method: request.method, url: request.url, status: processedResponse.status},
      '[AM-ORGS] Received response',
    );

    return processedResponse;
  }

  /**
   * Makes an authenticated request to the Account Manager API with middleware support.
   */
  async function makeRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${baseUrl}${path}`;
    let request = new Request(url, {
      ...options,
      headers: new Headers(options.headers),
    });

    // Apply middleware chain to request
    request = await applyMiddleware(request);

    const response = await fetch(request);

    // Apply middleware chain to response
    const processedResponse = await processResponse(request, response);

    // Handle errors
    if (processedResponse.status === 401) {
      throw new Error('Authentication invalid. Please (re-)authenticate.');
    }
    if (processedResponse.status === 403) {
      throw new Error('Operation forbidden. Please make sure you have the permission to perform this operation.');
    }
    if (processedResponse.status >= 400) {
      throw new Error(`Operation failed. Error code ${processedResponse.status}`);
    }

    if (!processedResponse.ok) {
      throw new Error(`Request failed: ${processedResponse.statusText}`);
    }

    return processedResponse.json() as Promise<T>;
  }

  return {
    async getOrg(orgId: string): Promise<AccountManagerOrganization> {
      logger.debug({orgId}, '[AM-ORGS] Getting organization by ID');
      try {
        const org = await makeRequest<AccountManagerOrganization>(`/organizations/${orgId}`);
        return toExternalOrg(org);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Error code 404')) {
          throw new Error(`Organization ${orgId} not found`);
        }
        throw error;
      }
    },

    async getOrgByName(name: string): Promise<AccountManagerOrganization> {
      logger.debug({name}, '[AM-ORGS] Getting organization by name');
      const encodedName = encodeURIComponent(name);
      let result: OrganizationCollection;
      try {
        result = await makeRequest<OrganizationCollection>(
          `/organizations/search/findByName?startsWith=${encodedName}&ignoreCase=false`,
        );
      } catch (error) {
        if (error instanceof Error && error.message.includes('Error code 404')) {
          throw new Error(`Organization ${name} not found`);
        }
        throw error;
      }

      if (result.content.length === 0) {
        throw new Error(`Organization ${name} not found`);
      }

      if (result.content.length > 1) {
        // Attempt to find exact match
        const exactMatch = result.content.find((org) => org.name === name);
        if (exactMatch) {
          return toExternalOrg(exactMatch);
        }
        throw new Error(`Organization name "${name}" is ambiguous. Multiple organizations found.`);
      }

      return toExternalOrg(result.content[0]);
    },

    async listOrgs(options: ListOrgsOptions = {}): Promise<OrganizationCollection> {
      const {size = 25, page = 0, all = false} = options;
      const pageSize = all ? 5000 : size;

      logger.debug({size: pageSize, page}, '[AM-ORGS] Listing organizations');

      const result = await makeRequest<OrganizationCollection>(`/organizations?page=${page}&size=${pageSize}`);

      // Remove links from all organizations in the collection
      return {
        ...result,
        content: result.content.map((org) => toExternalOrg(org)),
      };
    },

    async getOrgAuditLogs(orgId: string): Promise<AuditLogCollection> {
      logger.debug({orgId}, '[AM-ORGS] Getting audit logs for organization');
      const logs = await makeRequest<AuditLogCollection>(`/organizations/${orgId}/audit-log-records`);
      return logs;
    },
  };
}

// ============================================================================
// Shared Utilities
// ============================================================================

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
          '[AM] Transformed pageable query parameters from bracket to flattened notation',
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

// ============================================================================
// Unified Account Manager Client
// ============================================================================
/**
 * Unified Account Manager API client that combines users, roles, and organizations.
 *
 * This client provides direct access to all Account Manager API methods through
 * a single interface, while internally using separate typed clients for type safety.
 */
export interface AccountManagerClient {
  // Users API methods
  /** Get user by ID */
  getUser(userId: string, expand?: UserExpandOption[]): Promise<AccountManagerUser>;
  /** List users with pagination */
  listUsers(options?: ListUsersOptions): Promise<UserCollection>;
  /** Create a new user */
  createUser(user: UserCreate): Promise<AccountManagerUser>;
  /** Update an existing user */
  updateUser(userId: string, changes: UserUpdate): Promise<AccountManagerUser>;
  /** Disable a user (soft delete) */
  deleteUser(userId: string): Promise<void>;
  /** Purge a user (hard delete) */
  purgeUser(userId: string): Promise<void>;
  /** Reset a user to INITIAL state */
  resetUser(userId: string): Promise<void>;
  /** Find a user by login (email) */
  findUserByLogin(login: string, expand?: UserExpandOption[]): Promise<AccountManagerUser | undefined>;
  /** Grant a role to a user, optionally with scope */
  grantRole(userId: string, role: string, scope?: string): Promise<AccountManagerUser>;
  /** Revoke a role from a user, optionally removing specific scope */
  revokeRole(userId: string, role: string, scope?: string): Promise<AccountManagerUser>;

  // Roles API methods
  /** Get role by ID */
  getRole(roleId: string): Promise<AccountManagerRole>;
  /** List roles with pagination */
  listRoles(options?: ListRolesOptions): Promise<RoleCollection>;

  // Organizations API methods
  /** Get organization by ID */
  getOrg(orgId: string): Promise<AccountManagerOrganization>;
  /** Get organization by name */
  getOrgByName(name: string): Promise<AccountManagerOrganization>;
  /** List organizations with pagination */
  listOrgs(options?: ListOrgsOptions): Promise<OrganizationCollection>;
  /** Get audit logs for an organization */
  getOrgAuditLogs(orgId: string): Promise<AuditLogCollection>;
}

/**
 * Creates a unified Account Manager API client.
 *
 * This client provides direct access to all Account Manager API methods (users, roles, orgs)
 * through a single interface, while internally using separate typed clients for type safety.
 *
 * @param config - Account Manager client configuration
 * @param auth - Authentication strategy (typically OAuth)
 * @returns Unified Account Manager client
 *
 * @example
 * const oauthStrategy = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createAccountManagerClient({}, oauthStrategy);
 *
 * // Users API
 * const users = await client.listUsers({ size: 25, page: 0 });
 * const user = await client.getUser('user-id');
 * await client.createUser({ mail: 'user@example.com', ... });
 *
 * // Roles API
 * const roles = await client.listRoles({ size: 20, page: 0 });
 * const role = await client.getRole('bm-admin');
 *
 * // Organizations API
 * const orgs = await client.listOrgs({ size: 25, page: 0 });
 * const org = await client.getOrg('org-id');
 * const auditLogs = await client.getOrgAuditLogs('org-id');
 */
export function createAccountManagerClient(
  config: AccountManagerClientConfig,
  auth: AuthStrategy,
): AccountManagerClient {
  // All three clients use the same config

  // Create internal clients (all use the same config, however, specifications are different)
  const usersClient = createAccountManagerUsersClient(config, auth);
  const rolesClient = createAccountManagerRolesClient(config, auth);
  const orgsClient = createAccountManagerOrgsClient(config, auth);

  // Return unified client with all methods
  return {
    // Users API methods
    getUser: (userId: string, expand?: UserExpandOption[]) => getUser(usersClient, userId, expand),
    listUsers: (options?: ListUsersOptions) => listUsers(usersClient, options),
    createUser: (user: UserCreate) => createUser(usersClient, user),
    updateUser: (userId: string, changes: UserUpdate) => updateUser(usersClient, userId, changes),
    deleteUser: (userId: string) => deleteUser(usersClient, userId),
    purgeUser: (userId: string) => purgeUser(usersClient, userId),
    resetUser: (userId: string) => resetUser(usersClient, userId),
    findUserByLogin: (login: string, expand?: UserExpandOption[]) => findUserByLogin(usersClient, login, expand),
    grantRole: (userId: string, role: string, scope?: string) => {
      // Import grantRole from operations - it uses getUser internally which needs the client
      return getUser(usersClient, userId).then((user) => {
        // Build updated roles
        const currentRoles = Array.isArray(user.roles)
          ? user.roles.map((r) => (typeof r === 'string' ? r : r.roleEnumName || ''))
          : [];
        const updatedRoles = currentRoles.includes(role) ? currentRoles : [...currentRoles, role];

        // Build updated roleTenantFilter
        let roleTenantFilter = user.roleTenantFilter || '';
        if (scope) {
          const scopes = scope.split(',');
          // Parse existing filter
          const filters = roleTenantFilter.split(';').filter(Boolean);
          const filterMap = new Map<string, string[]>();
          for (const filter of filters) {
            const [r, tenants] = filter.split(':');
            if (tenants) {
              filterMap.set(r, tenants.split(','));
            }
          }
          // Add new scopes
          const existingScopes = filterMap.get(role) || [];
          const allScopes = [...new Set([...existingScopes, ...scopes])];
          filterMap.set(role, allScopes);
          // Rebuild filter string
          roleTenantFilter = Array.from(filterMap.entries())
            .map(([r, tenants]) => `${r}:${tenants.join(',')}`)
            .join(';');
        }

        return updateUser(usersClient, userId, {
          roles: updatedRoles,
          roleTenantFilter: roleTenantFilter || undefined,
        });
      });
    },
    revokeRole: (userId: string, role: string, scope?: string) => {
      // Import revokeRole logic - it uses getUser internally which needs the client
      return getUser(usersClient, userId).then((user) => {
        // Build updated roles
        const currentRoles = Array.isArray(user.roles)
          ? user.roles.map((r) => (typeof r === 'string' ? r : r.roleEnumName || ''))
          : [];
        let updatedRoles = currentRoles;

        // Build updated roleTenantFilter
        let roleTenantFilter = user.roleTenantFilter || '';

        if (!scope) {
          // Remove entire role
          updatedRoles = currentRoles.filter((r) => r !== role);
          // Remove role from filter
          const filters = roleTenantFilter.split(';').filter(Boolean);
          roleTenantFilter = filters.filter((filter) => !filter.startsWith(`${role}:`)).join(';');
        } else {
          // Remove specific scope
          const scopes = scope.split(',');
          const filters = roleTenantFilter.split(';').filter(Boolean);
          const filterMap = new Map<string, string[]>();
          for (const filter of filters) {
            const [r, tenants] = filter.split(':');
            if (tenants) {
              filterMap.set(r, tenants.split(','));
            }
          }
          const existingScopes = filterMap.get(role) || [];
          const remainingScopes = existingScopes.filter((s) => !scopes.includes(s));
          if (remainingScopes.length === 0) {
            // No scopes left, remove role entirely
            updatedRoles = currentRoles.filter((r) => r !== role);
            filterMap.delete(role);
          } else {
            filterMap.set(role, remainingScopes);
          }
          // Rebuild filter string
          roleTenantFilter = Array.from(filterMap.entries())
            .map(([r, tenants]) => `${r}:${tenants.join(',')}`)
            .join(';');
        }

        return updateUser(usersClient, userId, {
          roles: updatedRoles,
          roleTenantFilter: roleTenantFilter || undefined,
        });
      });
    },

    // Roles API methods
    getRole: (roleId: string) => getRole(rolesClient, roleId),
    listRoles: (options?: ListRolesOptions) => listRoles(rolesClient, options),

    // Organizations API methods
    getOrg: (orgId: string) => orgsClient.getOrg(orgId),
    getOrgByName: (name: string) => orgsClient.getOrgByName(name),
    listOrgs: (options?: ListOrgsOptions) => orgsClient.listOrgs(options),
    getOrgAuditLogs: (orgId: string) => orgsClient.getOrgAuditLogs(orgId),
  };
}
