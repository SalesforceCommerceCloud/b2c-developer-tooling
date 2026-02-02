/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Account Manager role management operations.
 *
 * This module provides high-level functions for retrieving role information
 * in Account Manager, including listing roles and getting role details.
 *
 * ## Core Role Functions
 *
 * - {@link getRole} - Get role details by ID
 * - {@link listRoles} - List roles with pagination
 *
 * ## Usage
 *
 * ```typescript
 * import {getRole, listRoles} from '@salesforce/b2c-tooling-sdk/operations/roles';
 * import {createAccountManagerRolesClient} from '@salesforce/b2c-tooling-sdk/clients';
 * import {OAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const auth = new OAuthStrategy({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 * });
 *
 * const client = createAccountManagerRolesClient({}, auth);
 *
 * // Get a role by ID
 * const role = await getRole(client, 'bm-admin');
 *
 * // List roles
 * const roles = await listRoles(client, {size: 25, page: 0});
 *
 * // List roles filtered by target type
 * const userRoles = await listRoles(client, {size: 25, page: 0, roleTargetType: 'User'});
 * ```
 *
 * ## Authentication
 *
 * Role operations require OAuth authentication with appropriate Account Manager permissions.
 *
 * @module operations/roles
 */
export {getRole, listRoles} from '../../clients/am-api.js';
export type {AccountManagerRole, RoleCollection, ListRolesOptions} from '../../clients/am-api.js';
