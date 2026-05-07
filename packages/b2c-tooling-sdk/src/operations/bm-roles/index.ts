/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Business Manager role operations for B2C Commerce instances.
 *
 * This module provides functions for managing instance-level access roles
 * on B2C Commerce instances via the OCAPI Data API. These are distinct from
 * Account Manager roles managed via {@link @salesforce/b2c-tooling-sdk/operations/roles | operations/roles}.
 *
 * ## Core Role Functions
 *
 * - {@link listBmRoles} - List all access roles on an instance
 * - {@link getBmRole} - Get role details with optional expansion
 * - {@link createBmRole} - Create a new access role
 * - {@link deleteBmRole} - Delete an access role
 *
 * ## User Assignment
 *
 * - {@link grantBmRole} - Assign a user to a role
 * - {@link revokeBmRole} - Unassign a user from a role
 *
 * ## Permissions
 *
 * - {@link getBmRolePermissions} - Get permissions for a role
 * - {@link setBmRolePermissions} - Replace all permissions for a role
 *
 * ## Usage
 *
 * ```typescript
 * import {listBmRoles, grantBmRole, getBmRolePermissions} from '@salesforce/b2c-tooling-sdk/operations/bm-roles';
 * import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
 *
 * const config = resolveConfig();
 * const instance = config.createB2CInstance();
 *
 * // List all roles
 * const roles = await listBmRoles(instance);
 *
 * // Grant a role to a user
 * await grantBmRole(instance, 'Administrator', 'user@example.com');
 *
 * // Get permissions for a role
 * const permissions = await getBmRolePermissions(instance, 'Administrator');
 * ```
 *
 * ## Authentication
 *
 * BM role operations require OAuth authentication with appropriate OCAPI permissions
 * for the `/roles` resource.
 *
 * @module operations/bm-roles
 */
export {
  listBmRoles,
  getBmRole,
  createBmRole,
  deleteBmRole,
  grantBmRole,
  revokeBmRole,
  getBmRolePermissions,
  setBmRolePermissions,
} from './roles.js';

export type {BmRole, BmRoles, BmRolePermissions, ListBmRolesOptions, GetBmRoleOptions} from './roles.js';
