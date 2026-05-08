/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {UsersBackend} from './types.js';
import {OcapiUsersBackend} from './ocapi-backend.js';
import {ScapiUsersBackend} from './scapi-backend.js';
import {createDualBackend, type DualBackendConfig} from '../../clients/dual-backend-factory.js';

export type UsersBackendConfig = DualBackendConfig;

export function createUsersBackend(config: UsersBackendConfig): UsersBackend {
  return createDualBackend<UsersBackend>(config, {
    domainName: 'Users',
    Scapi: ScapiUsersBackend,
    Ocapi: OcapiUsersBackend,
  });
}
