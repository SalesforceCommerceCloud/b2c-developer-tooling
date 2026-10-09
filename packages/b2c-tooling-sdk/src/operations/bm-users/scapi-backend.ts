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
  SearchUsersOptions,
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
import {
  createScapiRequestError,
  ScapiCapabilityUnsupportedError,
  scapiCapabilityUnsupportedMessage,
} from '../../clients/scapi-backend-utils.js';
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
  /** Unused by Users; accepted for compatibility with the dual-backend factory. */
  instance?: unknown;
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
    const {start = 0, count = 25} = options;

    return this.scopeTier.tryRead(async (client) => {
      const {data, error, response} = await client.GET('/organizations/{organizationId}/users', {
        params: {
          path: {organizationId: this.organizationId},
          query: {limit: count, offset: start},
        },
      });
      if (error || !data) {
        throw createScapiRequestError(error, response, 'Failed to list users');
      }
      const result = data as UserSearch;
      return {
        total: result.total ?? 0,
        start: result.offset ?? start,
        count: result.limit ?? count,
        hits: (result.data ?? []).map(mapScapiUser),
      };
    });
  }

  async searchUsers(options: SearchUsersOptions = {}): Promise<ListUsersResult> {
    if (options.query !== undefined) {
      throw new ScapiCapabilityUnsupportedError(
        `${scapiCapabilityUnsupportedMessage('raw OCAPI user-search JSON')} Use portable search flags to stay on SCAPI.`,
      );
    }

    const all: UserInfo[] = [];
    let offset = 0;
    const pageSize = 200;
    do {
      const page = await this.listUsers({start: offset, count: pageSize});
      all.push(...page.hits);
      offset += page.hits.length;
      if (page.hits.length === 0 || offset >= page.total) break;
    } while (true);

    const phrase = options.searchPhrase?.toLocaleLowerCase();
    const filtered = all.filter((user) => {
      if (options.login !== undefined && user.login !== options.login) return false;
      if (options.email !== undefined && user.email !== options.email) return false;
      if (options.locked !== undefined && user.locked !== options.locked) return false;
      if (options.disabled !== undefined && user.disabled !== options.disabled) return false;
      if (!phrase) return true;
      return [user.login, user.email, user.firstName, user.lastName].some((value) =>
        value?.toLocaleLowerCase().includes(phrase),
      );
    });

    if (options.sortBy) {
      const field = toCanonicalSortField(options.sortBy);
      const direction = options.sortOrder === 'desc' ? -1 : 1;
      filtered.sort(
        (left, right) =>
          String(left[field] ?? '').localeCompare(String(right[field] ?? ''), undefined, {sensitivity: 'base'}) *
          direction,
      );
    }

    const start = options.start ?? 0;
    const count = options.count ?? 25;
    const hits = filtered.slice(start, start + count);
    return {total: filtered.length, start, count: hits.length, hits};
  }

  async getUser(login: string): Promise<UserInfo> {
    return this.scopeTier.tryRead(async (client) => {
      const {data, error, response} = await client.GET('/organizations/{organizationId}/users/{login}', {
        params: {path: {organizationId: this.organizationId, login}},
      });
      if (error || !data) {
        throw createScapiRequestError(error, response, `Failed to get user ${login}`);
      }
      return mapScapiUser(data);
    });
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
    const {data, error, response} = await client.PUT('/organizations/{organizationId}/users/{login}', {
      params: {path: {organizationId: this.organizationId, login}},
      body,
    });
    if (error || !data) {
      throw createScapiRequestError(error, response, `Failed to create user ${login}`);
    }
    return mapScapiUser(data);
  }

  async updateUser(login: string, changes: UpdateUserChanges): Promise<UserInfo> {
    // PATCH does not expose `disabled`, but the live API's replace operation
    // does. Preserve the current writable fields and use PUT for that case.
    if (changes.disabled !== undefined) {
      const current = await this.getUser(login);
      if (!current.email) {
        throw new Error(`Cannot update disabled status for ${login}: the current user response has no email`);
      }
      return this.createOrReplaceUser(login, {
        login,
        email: changes.email ?? current.email,
        firstName: changes.firstName ?? current.firstName,
        lastName: changes.lastName ?? current.lastName,
        externalId: changes.externalId ?? current.externalId,
        disabled: changes.disabled,
        preferredDataLocale: changes.preferredDataLocale ?? current.preferredDataLocale,
        preferredUiLocale: changes.preferredUiLocale ?? current.preferredUiLocale,
        roles: current.roles,
      });
    }

    const client = this.scopeTier.getClientForWrite();
    const body: UserUpdateRequest = {
      email: changes.email,
      firstName: changes.firstName,
      lastName: changes.lastName,
      externalId: changes.externalId,
      preferredDataLocale: changes.preferredDataLocale,
      preferredUiLocale: changes.preferredUiLocale,
    };
    const {data, error, response} = await client.PATCH('/organizations/{organizationId}/users/{login}', {
      params: {path: {organizationId: this.organizationId, login}},
      body,
    });
    if (error || !data) {
      throw createScapiRequestError(error, response, `Failed to update user ${login}`);
    }
    return mapScapiUser(data);
  }

  async deleteUser(login: string): Promise<void> {
    const client = this.scopeTier.getClientForWrite();
    const {error, response} = await client.DELETE('/organizations/{organizationId}/users/{login}', {
      params: {path: {organizationId: this.organizationId, login}},
    });
    if (error) {
      throw createScapiRequestError(error, response, `Failed to delete user ${login}`);
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

function toCanonicalSortField(field: string): keyof UserInfo {
  const fields: Record<string, keyof UserInfo> = {
    first_name: 'firstName',
    last_name: 'lastName',
    external_id: 'externalId',
    last_login_date: 'lastLoginDate',
    is_locked: 'locked',
    is_disabled: 'disabled',
  };
  return fields[field] ?? (field as keyof UserInfo);
}
