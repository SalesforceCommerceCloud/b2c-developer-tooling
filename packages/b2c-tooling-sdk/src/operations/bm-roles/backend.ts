/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '../../instance/index.js';
import type {AuthStrategy} from '../../auth/types.js';
import type {
  RolesBackend,
  RoleInfo,
  ListRolesResult,
  ListRolesOptions,
  RolePermissionsInfo,
  CreateRoleInput,
} from './types.js';
import {OcapiRolesBackend} from './ocapi-backend.js';
import {ScapiRolesBackend} from './scapi-backend.js';
import {ScapiFallbackBackend} from '../../clients/scapi-fallback-backend.js';
import {resolveScapiOrOcapi, type ApiBackendPreference} from '../../clients/scapi-backend-utils.js';

export interface RolesBackendConfig {
  preference: ApiBackendPreference;
  instance: B2CInstance;
  shortCode?: string;
  tenantId?: string;
  auth?: AuthStrategy;
}

export function createRolesBackend(config: RolesBackendConfig): RolesBackend {
  const hasScapiConfig = Boolean(config.shortCode && config.tenantId && config.auth);
  const resolved = resolveScapiOrOcapi({
    preference: config.preference,
    hasScapiConfig,
    domainName: 'Roles',
  });

  if (resolved === 'ocapi') {
    return new OcapiRolesBackend(config.instance);
  }

  const scapiBackend = new ScapiRolesBackend({
    shortCode: config.shortCode!,
    tenantId: config.tenantId!,
    auth: config.auth!,
  });

  if (config.preference === 'scapi') {
    return scapiBackend;
  }

  const ocapiBackend = new OcapiRolesBackend(config.instance);
  return new FallbackRolesBackend(scapiBackend, ocapiBackend);
}

export class FallbackRolesBackend extends ScapiFallbackBackend<RolesBackend> implements RolesBackend {
  constructor(scapiBackend: ScapiRolesBackend, ocapiBackend: OcapiRolesBackend) {
    super(scapiBackend, ocapiBackend, 'roles');
  }

  async listRoles(options?: ListRolesOptions): Promise<ListRolesResult> {
    return this.withFallback((b) => b.listRoles(options));
  }

  async getRole(roleId: string, options?: {expand?: ('users' | 'permissions')[]}): Promise<RoleInfo> {
    return this.withFallback((b) => b.getRole(roleId, options));
  }

  async createRole(roleId: string, input?: CreateRoleInput): Promise<RoleInfo> {
    return this.withFallback((b) => b.createRole(roleId, input));
  }

  async deleteRole(roleId: string): Promise<void> {
    return this.withFallback((b) => b.deleteRole(roleId));
  }

  async getPermissions(roleId: string): Promise<RolePermissionsInfo> {
    return this.withFallback((b) => b.getPermissions(roleId));
  }

  async setPermissions(roleId: string, permissions: RolePermissionsInfo): Promise<RolePermissionsInfo> {
    return this.withFallback((b) => b.setPermissions(roleId, permissions));
  }

  async grantRole(roleId: string, login: string): Promise<void> {
    return this.withFallback((b) => b.grantRole(roleId, login));
  }

  async revokeRole(roleId: string, login: string): Promise<void> {
    return this.withFallback((b) => b.revokeRole(roleId, login));
  }
}
