/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Canonical types and backend interface for Business Manager role operations.
 *
 * The OCAPI Data API and the SCAPI Merchant Roles API both manage instance-
 * level access roles. Permission shapes are virtually identical across the
 * two APIs — module/functional/locale/webdav permission groups — so the
 * canonical type re-exports the SCAPI shape and the OCAPI backend converts.
 *
 * @module operations/bm-roles/types
 */
import type {BackendBase} from '../../clients/scapi-backend-utils.js';
import type {RolePermissions as ScapiRolePermissions} from '../../clients/scapi-merchant-roles.js';

export type RolePermissionsInfo = ScapiRolePermissions;

export interface RoleInfo {
  id: string;
  description?: string;
  userCount?: number;
  userManager?: boolean;
  permissions?: RolePermissionsInfo;
  /** Original backend response, for advanced consumers. */
  _raw?: unknown;
}

export interface ListRolesResult {
  total: number;
  start: number;
  count: number;
  hits: RoleInfo[];
}

export interface ListRolesOptions {
  start?: number;
  count?: number;
  expand?: ('users' | 'permissions')[];
}

export interface CreateRoleInput {
  description?: string;
}

export interface RolesBackend extends BackendBase {
  listRoles(options?: ListRolesOptions): Promise<ListRolesResult>;
  getRole(roleId: string, options?: {expand?: ('users' | 'permissions')[]}): Promise<RoleInfo>;
  createRole(roleId: string, input?: CreateRoleInput): Promise<RoleInfo>;
  deleteRole(roleId: string): Promise<void>;
  getPermissions(roleId: string): Promise<RolePermissionsInfo>;
  setPermissions(roleId: string, permissions: RolePermissionsInfo): Promise<RolePermissionsInfo>;
  /** Assigns a user to a role. Returns void; OCAPI returns the user but we don't surface that. */
  grantRole(roleId: string, login: string): Promise<void>;
  revokeRole(roleId: string, login: string): Promise<void>;
}
