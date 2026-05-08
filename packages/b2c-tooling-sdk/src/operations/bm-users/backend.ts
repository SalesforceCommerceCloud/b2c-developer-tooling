/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '../../instance/index.js';
import type {AuthStrategy} from '../../auth/types.js';
import type {
  UsersBackend,
  UserInfo,
  ListUsersResult,
  ListUsersOptions,
  UpdateUserChanges,
  CreateUserInput,
} from './types.js';
import {OcapiUsersBackend} from './ocapi-backend.js';
import {ScapiUsersBackend} from './scapi-backend.js';
import {ScapiFallbackBackend} from '../../clients/scapi-fallback-backend.js';
import {resolveScapiOrOcapi, type ApiBackendPreference} from '../../clients/scapi-backend-utils.js';

export interface UsersBackendConfig {
  preference: ApiBackendPreference;
  instance: B2CInstance;
  shortCode?: string;
  tenantId?: string;
  auth?: AuthStrategy;
}

export function createUsersBackend(config: UsersBackendConfig): UsersBackend {
  const hasScapiConfig = Boolean(config.shortCode && config.tenantId && config.auth);
  const resolved = resolveScapiOrOcapi({
    preference: config.preference,
    hasScapiConfig,
    domainName: 'Users',
  });

  if (resolved === 'ocapi') {
    return new OcapiUsersBackend(config.instance);
  }

  const scapiBackend = new ScapiUsersBackend({
    shortCode: config.shortCode!,
    tenantId: config.tenantId!,
    auth: config.auth!,
  });

  if (config.preference === 'scapi') {
    return scapiBackend;
  }

  const ocapiBackend = new OcapiUsersBackend(config.instance);
  return new FallbackUsersBackend(scapiBackend, ocapiBackend);
}

export class FallbackUsersBackend extends ScapiFallbackBackend<UsersBackend> implements UsersBackend {
  constructor(scapiBackend: ScapiUsersBackend, ocapiBackend: OcapiUsersBackend) {
    super(scapiBackend, ocapiBackend, 'users');
  }

  async listUsers(options?: ListUsersOptions): Promise<ListUsersResult> {
    return this.withFallback((b) => b.listUsers(options));
  }

  async getUser(login: string): Promise<UserInfo> {
    return this.withFallback((b) => b.getUser(login));
  }

  async createOrReplaceUser(login: string, input: CreateUserInput): Promise<UserInfo> {
    return this.withFallback((b) => b.createOrReplaceUser(login, input));
  }

  async updateUser(login: string, changes: UpdateUserChanges): Promise<UserInfo> {
    return this.withFallback((b) => b.updateUser(login, changes));
  }

  async deleteUser(login: string): Promise<void> {
    return this.withFallback((b) => b.deleteUser(login));
  }
}
