/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createScapiRequestError} from '../../clients/scapi-backend-utils.js';
import {
  createScapiCatalogsClient,
  type Catalog as ScapiCatalog,
  type ScapiCatalogsClient,
} from '../../clients/scapi-catalogs.js';
import {toOrganizationId} from '../../clients/custom-apis.js';
import {SCOPE_MODE_HEADER} from '../../clients/middleware.js';
import type {CatalogInfo, CatalogsBackend, ListCatalogsOptions} from './catalogs-types.js';

const MAX_PAGE = 50;
const READ_HEADERS = {[SCOPE_MODE_HEADER]: 'read'};

export interface ScapiCatalogsBackendConfig {
  shortCode: string;
  tenantId: string;
  auth: AuthStrategy;
  instance?: unknown;
}

export class ScapiCatalogsBackend implements CatalogsBackend {
  readonly name = 'scapi' as const;
  private readonly client: ScapiCatalogsClient;
  private readonly organizationId: string;

  constructor(config: ScapiCatalogsBackendConfig) {
    this.organizationId = toOrganizationId(config.tenantId);
    this.client = createScapiCatalogsClient(config, config.auth);
  }

  async listCatalogs(options: ListCatalogsOptions = {}): Promise<CatalogInfo[]> {
    const start = options.start ?? 0;
    const target = options.count;
    const catalogs: ScapiCatalog[] = [];
    let offset = start;

    while (target === undefined || catalogs.length < target) {
      const limit = Math.min(MAX_PAGE, target === undefined ? MAX_PAGE : target - catalogs.length);
      const {data, error, response} = await this.client.GET('/organizations/{organizationId}/catalogs', {
        params: {path: {organizationId: this.organizationId}, query: {limit, offset}},
        headers: READ_HEADERS,
      });
      if (error || !data) throw createScapiRequestError(error, response, 'Failed to list catalogs');

      const page = data.data ?? [];
      catalogs.push(...page);
      offset += page.length;
      if (page.length === 0 || offset >= data.total) break;
    }

    return catalogs.map((catalog) => ({
      id: catalog.id,
      name: catalog.name?.default ?? Object.values(catalog.name ?? {})[0],
      online: catalog.online,
      _raw: catalog,
    }));
  }
}
