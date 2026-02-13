/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Account Manager user management operations.
 *
 * This module provides high-level functions for managing users in Account Manager,
 * including CRUD operations, role management, and user lifecycle operations.
 *
 * ## Core User Functions
 *
 * - {@link getUser} - Get user details by ID
 * - {@link getUserByLogin} - Get user details by login (email)
 * - {@link listUsers} - List users with pagination
 * - {@link createUser} - Create a new user
 * - {@link updateUser} - Update an existing user
 * - {@link deleteUser} - Disable a user (soft delete)
 * - {@link purgeUser} - Purge a disabled user (hard delete)
 * - {@link resetUser} - Reset a user to INITIAL state
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   getUserByLogin,
 *   listUsers,
 *   createUser,
 *   grantRole,
 * } from '@salesforce/b2c-tooling-sdk/operations/users';
 * import { createAccountManagerUsersClient } from '@salesforce/b2c-tooling-sdk/clients';
 * import { OAuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const auth = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createAccountManagerUsersClient({}, auth);
 *
 * // Get a user by login
 * const user = await getUserByLogin(client, 'user@example.com');
 *
 * // List users
 * const users = await listUsers(client, { size: 25, page: 0 });
 *
 * // Create a new user
 * const newUser = await createUser(client, {
 *   mail: 'newuser@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   organizations: ['org-id'],
 *   primaryOrganization: 'org-id',
 * });
 * ```
 *
 * ## Authentication
 *
 * User operations require OAuth authentication with appropriate Account Manager permissions.
 *
 * @module operations/users
 */
import type {AccountManagerUsersClient, AccountManagerUser, UserCreate, UserUpdate} from '../../clients/am-api.js';
import {
  getUser,
  listUsers,
  createUser as createUserApi,
  updateUser as updateUserApi,
  deleteUser,
  purgeUser,
  resetUser,
  findUserByLogin,
} from '../../clients/am-api.js';

/**
 * Options for creating a user.
 */
export interface CreateUserOptions {
  /** User details */
  user: UserCreate;
}

/**
 * Options for updating a user.
 */
export interface UpdateUserOptions {
  /** User ID */
  userId: string;
  /** Changes to apply */
  changes: UserUpdate;
}

/**
 * Options for granting a role.
 *
 * The AM API uses mixed formats: role IDs (e.g. 'bm-admin') in the `roles` array,
 * and roleEnumNames (e.g. 'ECOM_ADMIN') in the `roleTenantFilter` string.
 * Both must be provided. Use `resolveToInternalRole` / `resolveFromInternalRole` to convert.
 */
export interface GrantRoleOptions {
  /** User ID */
  userId: string;
  /** Role ID as used in the roles array (e.g. 'bm-admin'). */
  role: string;
  /** Role enum name as used in roleTenantFilter (e.g. 'ECOM_ADMIN'). */
  roleEnumName: string;
  /** Optional scope for the role (tenant IDs, comma-separated) */
  scope?: string;
}

/**
 * Options for revoking a role.
 *
 * See {@link GrantRoleOptions} for details on the mixed role ID formats.
 */
export interface RevokeRoleOptions {
  /** User ID */
  userId: string;
  /** Role ID as used in the roles array (e.g. 'bm-admin'). */
  role: string;
  /** Role enum name as used in roleTenantFilter (e.g. 'ECOM_ADMIN'). */
  roleEnumName: string;
  /** Optional scope to remove (if not provided, removes entire role) */
  scope?: string;
}

// Re-export primary API operations from client
export {getUser, listUsers, deleteUser, purgeUser, resetUser};

/**
 * Retrieves details of a user by login (email).
 * This searches through paginated results to find the user.
 *
 * @param client - Account Manager client
 * @param login - User login (email)
 * @returns User details
 * @throws Error if user is not found
 */
export async function getUserByLogin(client: AccountManagerUsersClient, login: string): Promise<AccountManagerUser> {
  const user = await findUserByLogin(client, login);
  if (!user) {
    throw new Error(`User ${login} not found`);
  }
  return user;
}

/**
 * Creates a new user.
 *
 * @param client - Account Manager client
 * @param options - Create options (user details)
 * @returns Created user
 */
export async function createUser(
  client: AccountManagerUsersClient,
  options: CreateUserOptions,
): Promise<AccountManagerUser> {
  return createUserApi(client, options.user);
}

/**
 * Updates an existing user.
 *
 * @param client - Account Manager client
 * @param options - Update options (userId, changes)
 * @returns Updated user
 */
export async function updateUser(
  client: AccountManagerUsersClient,
  options: UpdateUserOptions,
): Promise<AccountManagerUser> {
  return updateUserApi(client, options.userId, options.changes);
}

/**
 * Grants a role to a user, optionally with scope.
 * This updates the user's roles and roleTenantFilter.
 *
 * @param client - Account Manager client
 * @param options - Grant options (userId, role, optional scope)
 * @returns Updated user
 */
export async function grantRole(
  client: AccountManagerUsersClient,
  options: GrantRoleOptions,
): Promise<AccountManagerUser> {
  const {role, roleEnumName} = options;

  // First get the current user
  const user = await getUser(client, options.userId);

  // Build updated roles (uses role ID format, e.g. 'bm-admin')
  const currentRoles = Array.isArray(user.roles) ? user.roles.map((r) => (typeof r === 'string' ? r : r.id || '')) : [];
  const updatedRoles = currentRoles.includes(role) ? currentRoles : [...currentRoles, role];

  // Build updated roleTenantFilter (uses roleEnumName format, e.g. 'ECOM_ADMIN')
  let roleTenantFilter = user.roleTenantFilter || '';
  if (options.scope) {
    const scopes = options.scope.split(',');
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
    const existingScopes = filterMap.get(roleEnumName) || [];
    const allScopes = [...new Set([...existingScopes, ...scopes])];
    filterMap.set(roleEnumName, allScopes);
    // Rebuild filter string
    roleTenantFilter = Array.from(filterMap.entries())
      .map(([r, tenants]) => `${r}:${tenants.join(',')}`)
      .join(';');
  }

  return updateUser(client, {
    userId: options.userId,
    changes: {
      roles: updatedRoles,
      roleTenantFilter: roleTenantFilter || undefined,
    },
  });
}

/**
 * Revokes a role from a user, optionally removing specific scope.
 *
 * @param client - Account Manager client
 * @param options - Revoke options (userId, role, optional scope)
 * @returns Updated user
 */
export async function revokeRole(
  client: AccountManagerUsersClient,
  options: RevokeRoleOptions,
): Promise<AccountManagerUser> {
  const {role, roleEnumName} = options;

  // First get the current user
  const user = await getUser(client, options.userId);

  // Build updated roles (uses role ID format, e.g. 'bm-admin')
  const currentRoles = Array.isArray(user.roles) ? user.roles.map((r) => (typeof r === 'string' ? r : r.id || '')) : [];
  let updatedRoles = currentRoles;

  // Build updated roleTenantFilter (uses roleEnumName format, e.g. 'ECOM_ADMIN')
  let roleTenantFilter = user.roleTenantFilter || '';

  if (!options.scope) {
    // Remove entire role
    updatedRoles = currentRoles.filter((r) => r !== role);
    // Remove all scopes for this role
    const filters = roleTenantFilter.split(';').filter(Boolean);
    roleTenantFilter = filters.filter((f) => !f.startsWith(`${roleEnumName}:`)).join(';');
  } else {
    // Remove specific scope
    const scopes = options.scope.split(',');
    const filters = roleTenantFilter.split(';').filter(Boolean);
    const filterMap = new Map<string, string[]>();
    for (const filter of filters) {
      const [r, tenants] = filter.split(':');
      if (tenants) {
        filterMap.set(r, tenants.split(','));
      }
    }
    const existingScopes = filterMap.get(roleEnumName) || [];
    const updatedScopes = existingScopes.filter((s) => !scopes.includes(s));
    if (updatedScopes.length > 0) {
      filterMap.set(roleEnumName, updatedScopes);
    } else {
      filterMap.delete(roleEnumName);
    }
    roleTenantFilter = Array.from(filterMap.entries())
      .map(([r, tenants]) => `${r}:${tenants.join(',')}`)
      .join(';');
  }

  return updateUser(client, {
    userId: options.userId,
    changes: {
      roles: updatedRoles.length > 0 ? updatedRoles : undefined,
      roleTenantFilter: roleTenantFilter || undefined,
    },
  });
}

// Re-export types for convenience
export type {AccountManagerUser, UserCreate, UserUpdate, UserCollection} from '../../clients/am-api.js';
