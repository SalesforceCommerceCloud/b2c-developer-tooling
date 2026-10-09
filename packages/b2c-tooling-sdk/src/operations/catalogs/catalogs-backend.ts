/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createDualBackend, type DualBackendConfig} from '../../clients/dual-backend-factory.js';
import type {CatalogsBackend} from './catalogs-types.js';
import {OcapiCatalogsBackend} from './ocapi-catalogs-backend.js';
import {ScapiCatalogsBackend} from './scapi-catalogs-backend.js';

export type CatalogsBackendConfig = DualBackendConfig;

export function createCatalogsBackend(config: CatalogsBackendConfig): CatalogsBackend {
  return createDualBackend<CatalogsBackend>(config, {
    domainName: 'Catalogs',
    Scapi: ScapiCatalogsBackend,
    Ocapi: OcapiCatalogsBackend,
  });
}
