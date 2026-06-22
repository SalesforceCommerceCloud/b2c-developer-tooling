/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '../../instance/index.js';
import type {
  UsersBackend,
  UserInfo,
  ListUsersResult,
  ListUsersOptions,
  UpdateUserChanges,
  CreateUserInput,
} from './types.js';
import {
  listBmUsers as ocapiListBmUsers,
  getBmUser as ocapiGetBmUser,
  updateBmUser as ocapiUpdateBmUser,
  deleteBmUser as ocapiDeleteBmUser,
  type BmUser,
} from './users.js';
import {throwOcapiError} from '../../clients/error-utils.js';
import {SCAPI_MERCHANT_USERS_RW_SCOPES} from '../../clients/scapi-merchant-users.js';
import type {components} from '../../clients/ocapi.generated.js';

function mapOcapiUser(ocapi: BmUser): UserInfo {
  return {
    login: ocapi.login ?? '',
    email: ocapi.email,
    firstName: ocapi.first_name,
    lastName: ocapi.last_name,
    externalId: ocapi.external_id,
    disabled: ocapi.disabled,
    locked: ocapi.locked,
    lastLoginDate: ocapi.last_login_date,
    passwordExpirationDate: ocapi.password_expiration_date,
    passwordModificationDate: ocapi.password_modification_date,
    preferredDataLocale: ocapi.preferred_data_locale,
    preferredUiLocale: ocapi.preferred_ui_locale,
    roles: ocapi.roles,
    _raw: ocapi,
  };
}

export class OcapiUsersBackend implements UsersBackend {
  readonly name = 'ocapi' as const;

  constructor(private instance: B2CInstance) {}

  async listUsers(options: ListUsersOptions = {}): Promise<ListUsersResult> {
    const result = await ocapiListBmUsers(this.instance, options);
    const users = (result.data ?? []) as BmUser[];
    return {
      total: result.total ?? 0,
      start: result.start ?? 0,
      count: result.count ?? users.length,
      hits: users.map(mapOcapiUser),
    };
  }

  async getUser(login: string): Promise<UserInfo> {
    const user = await ocapiGetBmUser(this.instance, login);
    return mapOcapiUser(user);
  }

  async createOrReplaceUser(login: string, input: CreateUserInput): Promise<UserInfo> {
    // Map canonical camelCase → OCAPI snake_case.
    const body: Record<string, unknown> = {
      login: input.login,
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      external_id: input.externalId,
      password: input.password,
      disabled: input.disabled,
      preferred_data_locale: input.preferredDataLocale,
      preferred_ui_locale: input.preferredUiLocale,
      roles: input.roles,
    };
    const {data, error, response} = await this.instance.ocapi.PUT('/users/{login}', {
      params: {path: {login}},
      body: body as components['schemas']['user'],
    });
    if (error) {
      throwOcapiError(error, response, `Failed to create user ${login}`, SCAPI_MERCHANT_USERS_RW_SCOPES);
    }
    return mapOcapiUser(data as BmUser);
  }

  async updateUser(login: string, changes: UpdateUserChanges): Promise<UserInfo> {
    const ocapiChanges: Record<string, unknown> = {
      email: changes.email,
      first_name: changes.firstName,
      last_name: changes.lastName,
      external_id: changes.externalId,
      disabled: changes.disabled,
      preferred_data_locale: changes.preferredDataLocale,
      preferred_ui_locale: changes.preferredUiLocale,
    };
    const updated = await ocapiUpdateBmUser(this.instance, login, ocapiChanges);
    return mapOcapiUser(updated);
  }

  async deleteUser(login: string): Promise<void> {
    await ocapiDeleteBmUser(this.instance, login);
  }
}
