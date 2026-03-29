/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Business Manager role operations for B2C Commerce instances.
 *
 * Provides functions for managing instance-level access roles via OCAPI Data API.
 */
import type {B2CInstance} from '../../instance/index.js';
import type {components} from '../../clients/ocapi.generated.js';
import {getApiErrorMessage} from '../../clients/error-utils.js';

/**
 * BM access role from OCAPI.
 */
export type BmRole = components['schemas']['role'];

/**
 * BM access roles collection from OCAPI.
 */
export type BmRoles = components['schemas']['roles'];

/**
 * BM role permissions from OCAPI.
 */
export type BmRolePermissions = components['schemas']['role_permissions'];

/**
 * Options for listing BM roles.
 */
export interface ListBmRolesOptions {
  /** Start index (default 0) */
  start?: number;
  /** Number of items to return (default 25) */
  count?: number;
}

/**
 * Options for getting a BM role.
 */
export interface GetBmRoleOptions {
  /** Expansions to apply (e.g. 'users', 'permissions') */
  expand?: string[];
}

/**
 * Lists all access roles on a B2C Commerce instance.
 *
 * @param instance - B2C instance to query
 * @param options - Pagination options
 * @returns Roles collection with pagination info
 *
 * @example
 * ```typescript
 * const roles = await listBmRoles(instance);
 * for (const role of roles.data ?? []) {
 *   console.log(role.id, role.description);
 * }
 * ```
 */
export async function listBmRoles(instance: B2CInstance, options: ListBmRolesOptions = {}): Promise<BmRoles> {
  const {start, count} = options;

  const {data, error, response} = await instance.ocapi.GET('/roles', {
    params: {query: {start, count, select: '(**)'}},
  });

  if (error) {
    throw new Error(`Failed to list roles: ${getApiErrorMessage(error, response)}`, {cause: error});
  }

  return data as BmRoles;
}

/**
 * Gets details of a specific access role.
 *
 * @param instance - B2C instance to query
 * @param roleId - Role ID (e.g. "Administrator")
 * @param options - Expand options
 * @returns Role details
 *
 * @example
 * ```typescript
 * const role = await getBmRole(instance, 'Administrator', { expand: ['users'] });
 * console.log(role.id, role.user_count);
 * ```
 */
export async function getBmRole(
  instance: B2CInstance,
  roleId: string,
  options: GetBmRoleOptions = {},
): Promise<BmRole> {
  const {expand} = options;

  const {data, error, response} = await instance.ocapi.GET('/roles/{id}', {
    params: {path: {id: roleId}, query: {expand}},
  });

  if (error) {
    throw new Error(`Failed to get role ${roleId}: ${getApiErrorMessage(error, response)}`, {cause: error});
  }

  return data as BmRole;
}

/**
 * Creates a new access role on an instance.
 *
 * @param instance - B2C instance
 * @param roleId - Role ID to create
 * @param role - Role properties (description, etc.)
 * @returns Created role
 *
 * @example
 * ```typescript
 * const role = await createBmRole(instance, 'MyCustomRole', { description: 'A custom role' });
 * ```
 */
export async function createBmRole(
  instance: B2CInstance,
  roleId: string,
  role: {description?: string} = {},
): Promise<BmRole> {
  const {data, error, response} = await instance.ocapi.PUT('/roles/{id}', {
    params: {path: {id: roleId}},
    body: {id: roleId, ...role} as components['schemas']['role'],
  });

  if (error) {
    throw new Error(`Failed to create role ${roleId}: ${getApiErrorMessage(error, response)}`, {cause: error});
  }

  return data as BmRole;
}

/**
 * Deletes an access role from an instance.
 *
 * System roles (e.g. "Administrator", "Support") cannot be deleted.
 *
 * @param instance - B2C instance
 * @param roleId - Role ID to delete
 *
 * @example
 * ```typescript
 * await deleteBmRole(instance, 'MyCustomRole');
 * ```
 */
export async function deleteBmRole(instance: B2CInstance, roleId: string): Promise<void> {
  const {error, response} = await instance.ocapi.DELETE('/roles/{id}', {
    params: {path: {id: roleId}},
  });

  if (error) {
    throw new Error(`Failed to delete role ${roleId}: ${getApiErrorMessage(error, response)}`, {cause: error});
  }
}

/**
 * Assigns a user to an access role on an instance.
 *
 * @param instance - B2C instance
 * @param roleId - Role ID to grant
 * @param login - User login (email)
 * @returns The user object after assignment
 *
 * @example
 * ```typescript
 * const user = await grantBmRole(instance, 'Administrator', 'user@example.com');
 * ```
 */
export async function grantBmRole(
  instance: B2CInstance,
  roleId: string,
  login: string,
): Promise<components['schemas']['user']> {
  const {data, error, response} = await instance.ocapi.PUT('/roles/{id}/users/{login}', {
    params: {path: {id: roleId, login}},
  });

  if (error) {
    throw new Error(`Failed to grant role ${roleId} to ${login}: ${getApiErrorMessage(error, response)}`, {
      cause: error,
    });
  }

  return data as components['schemas']['user'];
}

/**
 * Unassigns a user from an access role on an instance.
 *
 * @param instance - B2C instance
 * @param roleId - Role ID to revoke
 * @param login - User login (email)
 *
 * @example
 * ```typescript
 * await revokeBmRole(instance, 'Administrator', 'user@example.com');
 * ```
 */
export async function revokeBmRole(instance: B2CInstance, roleId: string, login: string): Promise<void> {
  const {error, response} = await instance.ocapi.DELETE('/roles/{id}/users/{login}', {
    params: {path: {id: roleId, login}},
  });

  if (error) {
    throw new Error(`Failed to revoke role ${roleId} from ${login}: ${getApiErrorMessage(error, response)}`, {
      cause: error,
    });
  }
}

/**
 * Gets permissions assigned to an access role.
 *
 * @param instance - B2C instance
 * @param roleId - Role ID
 * @returns Role permissions object
 *
 * @example
 * ```typescript
 * const permissions = await getBmRolePermissions(instance, 'Administrator');
 * console.log(permissions.functional?.organization?.length);
 * ```
 */
export async function getBmRolePermissions(instance: B2CInstance, roleId: string): Promise<BmRolePermissions> {
  const {data, error, response} = await instance.ocapi.GET('/roles/{id}/permissions', {
    params: {path: {id: roleId}},
  });

  if (error) {
    throw new Error(`Failed to get permissions for role ${roleId}: ${getApiErrorMessage(error, response)}`, {
      cause: error,
    });
  }

  return data as BmRolePermissions;
}

/**
 * Sets (replaces) all permissions for an access role.
 *
 * This is a full replacement — all existing permissions are replaced with the provided set.
 *
 * @param instance - B2C instance
 * @param roleId - Role ID
 * @param permissions - Complete permissions object
 * @returns Updated permissions
 *
 * @example
 * ```typescript
 * const perms = await getBmRolePermissions(instance, 'MyRole');
 * // ... modify perms ...
 * await setBmRolePermissions(instance, 'MyRole', perms);
 * ```
 */
export async function setBmRolePermissions(
  instance: B2CInstance,
  roleId: string,
  permissions: BmRolePermissions,
): Promise<BmRolePermissions> {
  const {data, error, response} = await instance.ocapi.PUT('/roles/{id}/permissions', {
    params: {path: {id: roleId}},
    body: permissions as components['schemas']['role_permissions'],
  });

  if (error) {
    throw new Error(`Failed to set permissions for role ${roleId}: ${getApiErrorMessage(error, response)}`, {
      cause: error,
    });
  }

  return data as BmRolePermissions;
}
