/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '../../instance/index.js';
import type {
  RolesBackend,
  RoleInfo,
  ListRolesResult,
  ListRolesOptions,
  RolePermissionsInfo,
  CreateRoleInput,
} from './types.js';
import type {BmRole, BmRolePermissions} from './roles.js';
import {
  listBmRoles as ocapiListBmRoles,
  getBmRole as ocapiGetBmRole,
  createBmRole as ocapiCreateBmRole,
  deleteBmRole as ocapiDeleteBmRole,
  getBmRolePermissions as ocapiGetBmRolePermissions,
  setBmRolePermissions as ocapiSetBmRolePermissions,
  grantBmRole as ocapiGrantBmRole,
  revokeBmRole as ocapiRevokeBmRole,
} from './roles.js';

function mapOcapiRole(ocapi: BmRole): RoleInfo {
  return {
    id: ocapi.id ?? '',
    description: ocapi.description,
    userCount: ocapi.user_count,
    userManager: ocapi.user_manager,
    // OCAPI permissions shape uses snake_case nested groups; the canonical
    // type uses SCAPI's camelCase shape. We avoid converting the deep
    // structure here (it's only exposed via the permissions endpoints).
    _raw: ocapi,
  };
}

type LocalePermissionOcapi = {locale_id?: string; type?: string; values?: string[]; display_name?: unknown};
type WebdavPermissionOcapi = {folder?: string; type?: string; values?: string[]};
type ModulePermissionOcapi = {application?: string; name?: string; values?: string[]};
type FunctionalPermissionOcapi = {name?: string; values?: string[]};

function mapOcapiPermissions(ocapi: BmRolePermissions): RolePermissionsInfo {
  // OCAPI uses snake_case for innermost permission fields (locale_id, etc.)
  // while SCAPI uses camelCase (localeId). Convert at this boundary.
  const result: Record<string, unknown> = {};
  if (ocapi.module) {
    result.module = {
      organization: ((ocapi.module.organization ?? []) as ModulePermissionOcapi[]).map((p) => ({
        application: p.application,
        name: p.name,
        values: p.values,
      })),
      site: ((ocapi.module.site ?? []) as ModulePermissionOcapi[]).map((p) => ({
        application: p.application,
        name: p.name,
        values: p.values,
      })),
    };
  }
  if (ocapi.functional) {
    result.functional = {
      organization: ((ocapi.functional.organization ?? []) as FunctionalPermissionOcapi[]).map((p) => ({
        name: p.name,
        values: p.values,
      })),
      site: ((ocapi.functional.site ?? []) as FunctionalPermissionOcapi[]).map((p) => ({
        name: p.name,
        values: p.values,
      })),
    };
  }
  if (ocapi.locale) {
    result.locale = {
      unscoped: ((ocapi.locale.unscoped ?? []) as LocalePermissionOcapi[]).map((p) => ({
        localeId: p.locale_id,
        type: p.type,
        values: p.values,
      })),
    };
  }
  if (ocapi.webdav) {
    result.webdav = {
      unscoped: ((ocapi.webdav.unscoped ?? []) as WebdavPermissionOcapi[]).map((p) => ({
        folder: p.folder,
        type: p.type,
        values: p.values,
      })),
    };
  }
  return result as RolePermissionsInfo;
}

function mapScapiPermissionsToOcapi(perms: RolePermissionsInfo): BmRolePermissions {
  // Reverse: camelCase → snake_case for the inner locale field.
  const result: Record<string, unknown> = {};
  if (perms.module) {
    result.module = perms.module;
  }
  if (perms.functional) {
    result.functional = perms.functional;
  }
  if (perms.locale) {
    type LocaleScapi = {localeId?: string; type?: string; values?: unknown};
    result.locale = {
      unscoped: ((perms.locale.unscoped ?? []) as LocaleScapi[]).map((p) => ({
        locale_id: p.localeId,
        type: p.type,
        values: p.values,
      })),
    };
  }
  if (perms.webdav) {
    result.webdav = perms.webdav;
  }
  return result as BmRolePermissions;
}

export class OcapiRolesBackend implements RolesBackend {
  readonly name = 'ocapi' as const;

  constructor(private instance: B2CInstance) {}

  async listRoles(options: ListRolesOptions = {}): Promise<ListRolesResult> {
    const result = await ocapiListBmRoles(this.instance, {start: options.start, count: options.count});
    const items = (result.data ?? []) as BmRole[];
    return {
      total: result.total ?? 0,
      start: result.start ?? 0,
      count: result.count ?? items.length,
      hits: items.map(mapOcapiRole),
    };
  }

  async getRole(roleId: string, options?: {expand?: ('users' | 'permissions')[]}): Promise<RoleInfo> {
    const role = await ocapiGetBmRole(this.instance, roleId, {expand: options?.expand});
    return mapOcapiRole(role);
  }

  async createRole(roleId: string, input?: CreateRoleInput): Promise<RoleInfo> {
    const role = await ocapiCreateBmRole(this.instance, roleId, {description: input?.description});
    return mapOcapiRole(role);
  }

  async deleteRole(roleId: string): Promise<void> {
    await ocapiDeleteBmRole(this.instance, roleId);
  }

  async getPermissions(roleId: string): Promise<RolePermissionsInfo> {
    const perms = await ocapiGetBmRolePermissions(this.instance, roleId);
    return mapOcapiPermissions(perms);
  }

  async setPermissions(roleId: string, permissions: RolePermissionsInfo): Promise<RolePermissionsInfo> {
    const updated = await ocapiSetBmRolePermissions(this.instance, roleId, mapScapiPermissionsToOcapi(permissions));
    return mapOcapiPermissions(updated);
  }

  async grantRole(roleId: string, login: string): Promise<void> {
    await ocapiGrantBmRole(this.instance, roleId, login);
  }

  async revokeRole(roleId: string, login: string): Promise<void> {
    await ocapiRevokeBmRole(this.instance, roleId, login);
  }
}
