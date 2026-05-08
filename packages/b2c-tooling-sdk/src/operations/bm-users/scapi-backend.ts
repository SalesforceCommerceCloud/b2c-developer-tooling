/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthStrategy} from '../../auth/types.js';
import type {
  UsersBackend,
  UserInfo,
  ListUsersResult,
  ListUsersOptions,
  UpdateUserChanges,
  CreateUserInput,
} from './types.js';
import {
  createScapiMerchantUsersClient,
  SCAPI_MERCHANT_USERS_RW_SCOPES,
  SCAPI_MERCHANT_USERS_READ_SCOPES,
  type ScapiMerchantUsersClient,
  type ScapiMerchantUsersClientConfig,
  type User as ScapiUser,
  type UserUpdateRequest,
  type UserSearch,
} from '../../clients/scapi-merchant-users.js';
import {buildTenantScope, toOrganizationId} from '../../clients/custom-apis.js';
import {ScopeTierManager} from '../../clients/scapi-scope-tier.js';

function mapScapiUser(scapi: ScapiUser): UserInfo {
  return {
    login: scapi.login,
    email: scapi.email,
    firstName: scapi.firstName,
    lastName: scapi.lastName,
    externalId: scapi.externalId,
    disabled: scapi.disabled,
    locked: scapi.locked,
    lastLoginDate: scapi.lastLoginDate,
    passwordExpirationDate: scapi.passwordExpirationDate,
    passwordModificationDate: scapi.passwordModificationDate,
    preferredDataLocale: scapi.preferredDataLocale as string | undefined,
    preferredUiLocale: scapi.preferredUiLocale as string | undefined,
    roles: scapi.roles,
    _raw: scapi,
  };
}

export interface ScapiUsersBackendConfig {
  shortCode: string;
  tenantId: string;
  auth: AuthStrategy;
}

export class ScapiUsersBackend implements UsersBackend {
  readonly name = 'scapi' as const;

  private organizationId: string;
  private scopeTier: ScopeTierManager<ScapiMerchantUsersClient>;

  constructor(private config: ScapiUsersBackendConfig) {
    this.organizationId = toOrganizationId(config.tenantId);
    this.scopeTier = new ScopeTierManager<ScapiMerchantUsersClient>({
      buildClient: (scopes) => this.buildClient(scopes),
      rwScopes: SCAPI_MERCHANT_USERS_RW_SCOPES,
      readScopes: SCAPI_MERCHANT_USERS_READ_SCOPES,
      domainName: 'Users',
    });
  }

  async listUsers(options: ListUsersOptions = {}): Promise<ListUsersResult> {
    const client = this.scopeTier.getClientForRead();
    const {start = 0, count = 25} = options;

    const {data, error} = await client.GET('/organizations/{organizationId}/users', {
      params: {
        path: {organizationId: this.organizationId},
        query: {limit: count, offset: start},
      },
    });
    if (error || !data) {
      throw new Error(toErrorMessage(error, 'Failed to list users'));
    }
    const result = data as UserSearch;
    return {
      total: result.total ?? 0,
      start: result.offset ?? start,
      count: result.limit ?? count,
      hits: (result.data ?? []).map(mapScapiUser),
    };
  }

  async getUser(login: string): Promise<UserInfo> {
    const client = this.scopeTier.getClientForRead();
    const {data, error} = await client.GET('/organizations/{organizationId}/users/{login}', {
      params: {path: {organizationId: this.organizationId, login}},
    });
    if (error || !data) {
      throw new Error(toErrorMessage(error, `Failed to get user ${login}`));
    }
    return mapScapiUser(data);
  }

  async createOrReplaceUser(login: string, input: CreateUserInput): Promise<UserInfo> {
    const client = this.scopeTier.getClientForWrite();
    const body: ScapiUser = {
      login: input.login,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      externalId: input.externalId,
      password: input.password,
      disabled: input.disabled,
      preferredDataLocale: input.preferredDataLocale,
      preferredUiLocale: input.preferredUiLocale,
      roles: input.roles,
    };
    const {data, error} = await client.PUT('/organizations/{organizationId}/users/{login}', {
      params: {path: {organizationId: this.organizationId, login}},
      body,
    });
    if (error || !data) {
      throw new Error(toErrorMessage(error, `Failed to create user ${login}`));
    }
    return mapScapiUser(data);
  }

  async updateUser(login: string, changes: UpdateUserChanges): Promise<UserInfo> {
    const client = this.scopeTier.getClientForWrite();
    // SCAPI UserUpdateRequest doesn't include `disabled`. To toggle disabled,
    // callers must use createOrReplaceUser (PUT) on SCAPI or the OCAPI backend.
    const body: UserUpdateRequest = {
      email: changes.email,
      firstName: changes.firstName,
      lastName: changes.lastName,
      externalId: changes.externalId,
      preferredDataLocale: changes.preferredDataLocale,
      preferredUiLocale: changes.preferredUiLocale,
    };
    if (changes.disabled !== undefined) {
      throw new Error(
        'SCAPI Users API does not support updating the `disabled` flag via PATCH. ' +
          'Use --api-backend ocapi to change disabled status.',
      );
    }
    const {data, error} = await client.PATCH('/organizations/{organizationId}/users/{login}', {
      params: {path: {organizationId: this.organizationId, login}},
      body,
    });
    if (error || !data) {
      throw new Error(toErrorMessage(error, `Failed to update user ${login}`));
    }
    return mapScapiUser(data);
  }

  async deleteUser(login: string): Promise<void> {
    const client = this.scopeTier.getClientForWrite();
    const {error} = await client.DELETE('/organizations/{organizationId}/users/{login}', {
      params: {path: {organizationId: this.organizationId, login}},
    });
    if (error) {
      throw new Error(toErrorMessage(error, `Failed to delete user ${login}`));
    }
  }

  private buildClient(scopes: string[]): ScapiMerchantUsersClient {
    const clientConfig: ScapiMerchantUsersClientConfig = {
      shortCode: this.config.shortCode,
      tenantId: this.config.tenantId,
      scopes: [...scopes, buildTenantScope(this.config.tenantId)],
    };
    return createScapiMerchantUsersClient(clientConfig, this.config.auth);
  }
}

function toErrorMessage(error: unknown, fallback: string): string {
  const e = error as {detail?: string; title?: string} | undefined;
  return e?.detail ?? e?.title ?? fallback;
}
