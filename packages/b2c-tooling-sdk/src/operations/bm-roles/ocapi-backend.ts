/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '../../instance/index.js';
import type {components as OcapiComponents} from '../../clients/ocapi.generated.js';
import type {components as ScapiComponents} from '../../clients/scapi-merchant-roles.generated.js';
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
    // OCAPI returns permissions inline on the role when expanded, same as SCAPI.
    // Map snake_case → camelCase to match the canonical RoleInfo shape so that
    // callers see consistent data after a fallback from SCAPI to OCAPI.
    permissions: ocapi.permissions ? mapOcapiPermissions(ocapi.permissions) : undefined,
    _raw: ocapi,
  };
}

type OcapiModulePermission = OcapiComponents['schemas']['role_module_permission'];
type OcapiFunctionalPermission = OcapiComponents['schemas']['role_functional_permission'];
type OcapiLocalePermission = OcapiComponents['schemas']['role_locale_permission'];
type OcapiWebdavPermission = OcapiComponents['schemas']['role_webdav_permission'];
type ScapiModulePermission = ScapiComponents['schemas']['RoleModulePermission'];
type ScapiFunctionalPermission = ScapiComponents['schemas']['RoleFunctionalPermission'];
type ScapiLocalePermission = ScapiComponents['schemas']['RoleLocalePermission'];
type ScapiWebdavPermission = ScapiComponents['schemas']['RoleWebdavPermission'];

function mapOcapiModulePermission(permission: OcapiModulePermission): ScapiModulePermission {
  return {
    application: permission.application,
    name: permission.name,
    type: permission.type,
    system: permission.system,
    value: permission.value,
    values: permission.values,
  };
}

function mapOcapiFunctionalPermission(permission: OcapiFunctionalPermission): ScapiFunctionalPermission {
  return {
    name: permission.name,
    type: permission.type,
    value: permission.value,
    values: permission.values,
  };
}

function mapOcapiLocalePermission(permission: OcapiLocalePermission): ScapiLocalePermission {
  return {
    localeId: permission.locale_id,
    type: permission.type,
    value: permission.value,
    values: permission.values,
  };
}

function mapOcapiWebdavPermission(permission: OcapiWebdavPermission): ScapiWebdavPermission {
  return {
    folder: permission.folder,
    type: permission.type,
    value: permission.value,
    values: permission.values,
  };
}

function mapOcapiPermissions(ocapi: BmRolePermissions): RolePermissionsInfo {
  // OCAPI uses snake_case for innermost permission fields (locale_id, etc.)
  // while SCAPI uses camelCase (localeId). Convert at this boundary.
  const result: Record<string, unknown> = {};
  if (ocapi.module) {
    result.module = {
      organization: (ocapi.module.organization ?? []).map(mapOcapiModulePermission),
      site: (ocapi.module.site ?? []).map(mapOcapiModulePermission),
    };
  }
  if (ocapi.functional) {
    result.functional = {
      organization: (ocapi.functional.organization ?? []).map(mapOcapiFunctionalPermission),
      site: (ocapi.functional.site ?? []).map(mapOcapiFunctionalPermission),
    };
  }
  if (ocapi.locale) {
    result.locale = {
      unscoped: (ocapi.locale.unscoped ?? []).map(mapOcapiLocalePermission),
    };
  }
  if (ocapi.webdav) {
    result.webdav = {
      unscoped: (ocapi.webdav.unscoped ?? []).map(mapOcapiWebdavPermission),
    };
  }
  return result as RolePermissionsInfo;
}

function mapScapiPermissionsToOcapi(perms: RolePermissionsInfo): BmRolePermissions {
  // Reverse: camelCase → snake_case for the inner locale field.
  const result: Record<string, unknown> = {};
  if (perms.module) {
    result.module = {
      organization: (perms.module.organization ?? []).map((permission) => ({...permission})),
      site: (perms.module.site ?? []).map((permission) => ({...permission})),
    };
  }
  if (perms.functional) {
    result.functional = {
      organization: (perms.functional.organization ?? []).map((permission) => ({...permission})),
      site: (perms.functional.site ?? []).map((permission) => ({...permission})),
    };
  }
  if (perms.locale) {
    result.locale = {
      unscoped: (perms.locale.unscoped ?? []).map((permission) => ({
        locale_id: permission.localeId,
        type: permission.type,
        value: permission.value,
        values: permission.values,
      })),
    };
  }
  if (perms.webdav) {
    result.webdav = {
      unscoped: (perms.webdav.unscoped ?? []).map((permission) => ({...permission})),
    };
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
