/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {RolesBackend} from './types.js';
import {OcapiRolesBackend} from './ocapi-backend.js';
import {ScapiRolesBackend} from './scapi-backend.js';
import {createDualBackend, type DualBackendConfig} from '../../clients/dual-backend-factory.js';

export type RolesBackendConfig = DualBackendConfig;

export function createRolesBackend(config: RolesBackendConfig): RolesBackend {
  return createDualBackend<RolesBackend>(config, {
    domainName: 'Roles',
    Scapi: ScapiRolesBackend,
    Ocapi: OcapiRolesBackend,
  });
}
