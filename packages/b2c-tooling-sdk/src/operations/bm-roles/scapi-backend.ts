/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthStrategy} from '../../auth/types.js';
import type {
  RolesBackend,
  RoleInfo,
  ListRolesResult,
  ListRolesOptions,
  RolePermissionsInfo,
  CreateRoleInput,
} from './types.js';
import {
  createScapiMerchantRolesClient,
  SCAPI_MERCHANT_ROLES_RW_SCOPES,
  SCAPI_MERCHANT_ROLES_READ_SCOPES,
  type ScapiMerchantRolesClient,
  type ScapiMerchantRolesClientConfig,
  type Role as ScapiRole,
  type RoleSearch,
} from '../../clients/scapi-merchant-roles.js';
import {buildTenantScope, toOrganizationId} from '../../clients/custom-apis.js';
import {ScopeTierManager} from '../../clients/scapi-scope-tier.js';

function mapScapiRole(scapi: ScapiRole): RoleInfo {
  return {
    id: scapi.id ?? '',
    description: scapi.description,
    userCount: scapi.userCount,
    userManager: scapi.userManager,
    permissions: scapi.permissions,
    _raw: scapi,
  };
}

export interface ScapiRolesBackendConfig {
  shortCode: string;
  tenantId: string;
  auth: AuthStrategy;
  /** Unused by Roles; accepted for compatibility with the dual-backend factory. */
  instance?: unknown;
}

export class ScapiRolesBackend implements RolesBackend {
  readonly name = 'scapi' as const;

  private organizationId: string;
  private scopeTier: ScopeTierManager<ScapiMerchantRolesClient>;

  constructor(private config: ScapiRolesBackendConfig) {
    this.organizationId = toOrganizationId(config.tenantId);
    this.scopeTier = new ScopeTierManager<ScapiMerchantRolesClient>({
      buildClient: (scopes) => this.buildClient(scopes),
      rwScopes: SCAPI_MERCHANT_ROLES_RW_SCOPES,
      readScopes: SCAPI_MERCHANT_ROLES_READ_SCOPES,
      domainName: 'Roles',
    });
  }

  async listRoles(options: ListRolesOptions = {}): Promise<ListRolesResult> {
    const {start = 0, count = 25, expand} = options;

    return this.scopeTier.tryRead(async (client) => {
      const {data, error} = await client.GET('/organizations/{organizationId}/roles', {
        params: {
          path: {organizationId: this.organizationId},
          query: {limit: count, offset: start, expand},
        },
      });
      if (error || !data) {
        throw new Error(toErrorMessage(error, 'Failed to list roles'));
      }
      const result = data as RoleSearch;
      return {
        total: result.total ?? 0,
        start: result.offset ?? start,
        count: result.limit ?? count,
        hits: (result.data ?? []).map(mapScapiRole),
      };
    });
  }

  async getRole(roleId: string, options?: {expand?: ('users' | 'permissions')[]}): Promise<RoleInfo> {
    return this.scopeTier.tryRead(async (client) => {
      const {data, error} = await client.GET('/organizations/{organizationId}/roles/{roleId}', {
        params: {
          path: {organizationId: this.organizationId, roleId},
          query: {expand: options?.expand},
        },
      });
      if (error || !data) {
        throw new Error(toErrorMessage(error, `Failed to get role ${roleId}`));
      }
      return mapScapiRole(data);
    });
  }

  async createRole(roleId: string, input?: CreateRoleInput): Promise<RoleInfo> {
    const client = this.scopeTier.getClientForWrite();
    const body: ScapiRole = {
      id: roleId,
      description: input?.description,
    };
    const {data, error} = await client.PUT('/organizations/{organizationId}/roles/{roleId}', {
      params: {path: {organizationId: this.organizationId, roleId}},
      body,
    });
    if (error || !data) {
      throw new Error(toErrorMessage(error, `Failed to create role ${roleId}`));
    }
    return mapScapiRole(data);
  }

  async deleteRole(roleId: string): Promise<void> {
    const client = this.scopeTier.getClientForWrite();
    const {error} = await client.DELETE('/organizations/{organizationId}/roles/{roleId}', {
      params: {path: {organizationId: this.organizationId, roleId}},
    });
    if (error) {
      throw new Error(toErrorMessage(error, `Failed to delete role ${roleId}`));
    }
  }

  async getPermissions(roleId: string): Promise<RolePermissionsInfo> {
    return this.scopeTier.tryRead(async (client) => {
      const {data, error} = await client.GET('/organizations/{organizationId}/roles/{roleId}/permissions', {
        params: {path: {organizationId: this.organizationId, roleId}},
      });
      if (error || !data) {
        throw new Error(toErrorMessage(error, `Failed to get permissions for role ${roleId}`));
      }
      return data;
    });
  }

  async setPermissions(roleId: string, permissions: RolePermissionsInfo): Promise<RolePermissionsInfo> {
    const client = this.scopeTier.getClientForWrite();
    const {data, error} = await client.PUT('/organizations/{organizationId}/roles/{roleId}/permissions', {
      params: {path: {organizationId: this.organizationId, roleId}},
      body: permissions,
    });
    if (error || !data) {
      throw new Error(toErrorMessage(error, `Failed to set permissions for role ${roleId}`));
    }
    return data;
  }

  async grantRole(roleId: string, login: string): Promise<void> {
    const client = this.scopeTier.getClientForWrite();
    const {error} = await client.PUT('/organizations/{organizationId}/roles/{roleId}/users/{login}', {
      params: {path: {organizationId: this.organizationId, roleId, login}},
    });
    if (error) {
      throw new Error(toErrorMessage(error, `Failed to grant role ${roleId} to ${login}`));
    }
  }

  async revokeRole(roleId: string, login: string): Promise<void> {
    const client = this.scopeTier.getClientForWrite();
    const {error} = await client.DELETE('/organizations/{organizationId}/roles/{roleId}/users/{login}', {
      params: {path: {organizationId: this.organizationId, roleId, login}},
    });
    if (error) {
      throw new Error(toErrorMessage(error, `Failed to revoke role ${roleId} from ${login}`));
    }
  }

  private buildClient(scopes: string[]): ScapiMerchantRolesClient {
    const clientConfig: ScapiMerchantRolesClientConfig = {
      shortCode: this.config.shortCode,
      tenantId: this.config.tenantId,
      scopes: [...scopes, buildTenantScope(this.config.tenantId)],
    };
    return createScapiMerchantRolesClient(clientConfig, this.config.auth);
  }
}

function toErrorMessage(error: unknown, fallback: string): string {
  const e = error as {detail?: string; title?: string} | undefined;
  return e?.detail ?? e?.title ?? fallback;
}
