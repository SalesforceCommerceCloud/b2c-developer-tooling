/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '../../instance/index.js';
import {throwOcapiError} from '../../clients/error-utils.js';
import type {CatalogInfo, CatalogsBackend, ListCatalogsOptions} from './catalogs-types.js';

const PAGE_SIZE = 200;
const SCAPI_CATALOG_SCOPES = ['sfcc.catalogs.rw', 'sfcc.catalogs'];

export class OcapiCatalogsBackend implements CatalogsBackend {
  readonly name = 'ocapi' as const;

  constructor(private readonly instance: B2CInstance) {}

  async listCatalogs(options: ListCatalogsOptions = {}): Promise<CatalogInfo[]> {
    const start = options.start ?? 0;
    const target = options.count;
    const catalogs: CatalogInfo[] = [];
    let offset = start;

    while (target === undefined || catalogs.length < target) {
      const count = target === undefined ? PAGE_SIZE : Math.min(PAGE_SIZE, target - catalogs.length);
      const {data, error, response} = await this.instance.ocapi.GET('/catalogs', {
        params: {query: {start: offset, count, select: '(**)'}},
      });
      if (error || !data) throwOcapiError(error, response, 'Failed to list catalogs', SCAPI_CATALOG_SCOPES);

      const page = data.data ?? [];
      catalogs.push(
        ...page.map((catalog) => ({
          id: catalog.id ?? '',
          name: catalog.name?.default,
          online: catalog.online,
          _raw: catalog,
        })),
      );
      offset += page.length;
      if (page.length === 0 || offset >= (data.total ?? offset)) break;
    }

    return catalogs;
  }
}
