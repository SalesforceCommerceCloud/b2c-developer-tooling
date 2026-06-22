/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {SitesBackend} from './sites-types.js';
import {OcapiSitesBackend} from './ocapi-sites-backend.js';
import {ScapiSitesBackend} from './scapi-sites-backend.js';
import {createDualBackend, type DualBackendConfig} from '../../clients/dual-backend-factory.js';

export type SitesBackendConfig = DualBackendConfig;

/**
 * Builds a Sites backend for read operations (list/get). In `auto` mode
 * (the default) it prefers SCAPI (`site/sites/v1`) and falls back to the
 * deprecated OCAPI Data API on `invalid_scope`.
 */
export function createSitesBackend(config: SitesBackendConfig): SitesBackend {
  return createDualBackend<SitesBackend>(config, {
    domainName: 'Sites',
    Scapi: ScapiSitesBackend,
    Ocapi: OcapiSitesBackend,
  });
}
