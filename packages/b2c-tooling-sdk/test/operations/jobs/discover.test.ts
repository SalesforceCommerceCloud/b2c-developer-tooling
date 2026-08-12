/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {discoverExportableUnits} from '@salesforce/b2c-tooling-sdk/operations/jobs';

type GetResult = {data?: unknown; error?: unknown};
type GetHandler = (path: string, init: {params?: {query?: {start?: number; count?: number}}}) => Promise<GetResult>;

/** Builds a fake B2CInstance whose ocapi.GET is driven by per-path handlers. */
function fakeInstance(handlers: Record<string, GetHandler>): never {
  return {
    ocapi: {
      async GET(path: string, init: {params?: {query?: {start?: number; count?: number}}}) {
        const handler = handlers[path];
        if (!handler) {
          return {error: {fault: {message: `unexpected path ${path}`}}};
        }
        return handler(path, init);
      },
    },
  } as unknown as never;
}

/** Handler returning a single page of documents with the given ids. */
function pageOf(ids: string[]): GetHandler {
  return async () => ({data: {data: ids.map((id) => ({id})), total: ids.length}});
}

describe('operations/jobs/discover', () => {
  describe('discoverExportableUnits', () => {
    it('lists sites, catalogs, and inventory lists sorted alphabetically', async () => {
      const instance = fakeInstance({
        '/sites': pageOf(['SiteB', 'SiteA']),
        '/catalogs': pageOf(['master-catalog', 'apparel-catalog']),
        '/inventory_lists': pageOf(['inventory']),
      });

      const result = await discoverExportableUnits(instance);

      expect(result.sites).to.deep.equal(['SiteA', 'SiteB']);
      expect(result.catalogs).to.deep.equal(['apparel-catalog', 'master-catalog']);
      expect(result.inventoryLists).to.deep.equal(['inventory']);
      expect(result.warnings).to.deep.equal([]);
    });

    it('records a warning and leaves the list empty when a category errors (permission denied)', async () => {
      const instance = fakeInstance({
        '/sites': pageOf(['RefArch']),
        '/catalogs': async () => ({error: {fault: {message: 'Access to resource is forbidden'}}}),
        '/inventory_lists': pageOf(['inventory']),
      });

      const result = await discoverExportableUnits(instance);

      expect(result.sites).to.deep.equal(['RefArch']);
      expect(result.catalogs).to.deep.equal([]);
      expect(result.inventoryLists).to.deep.equal(['inventory']);
      expect(result.warnings).to.have.lengthOf(1);
      expect(result.warnings[0]).to.include('catalogs');
      expect(result.warnings[0]).to.include('Access to resource is forbidden');
    });

    it('follows pagination until all documents are read', async () => {
      const allSites = Array.from({length: 250}, (_, i) => `Site${String(i).padStart(3, '0')}`);
      const instance = fakeInstance({
        '/sites': async (_path, init) => {
          const start = init.params?.query?.start ?? 0;
          const count = init.params?.query?.count ?? 200;
          return {data: {data: allSites.slice(start, start + count).map((id) => ({id})), total: allSites.length}};
        },
        '/catalogs': pageOf([]),
        '/inventory_lists': pageOf([]),
      });

      const result = await discoverExportableUnits(instance);

      expect(result.sites).to.have.lengthOf(250);
      expect(result.sites[0]).to.equal('Site000');
      expect(result.sites[249]).to.equal('Site249');
    });

    it('skips documents without an id', async () => {
      const instance = fakeInstance({
        '/sites': async () => ({data: {data: [{id: 'RefArch'}, {}, {id: 'SiteGenesis'}], total: 3}}),
        '/catalogs': pageOf([]),
        '/inventory_lists': pageOf([]),
      });

      const result = await discoverExportableUnits(instance);

      expect(result.sites).to.deep.equal(['RefArch', 'SiteGenesis']);
    });

    it('treats missing data as an error per category', async () => {
      const instance = fakeInstance({
        '/sites': async () => ({}),
        '/catalogs': pageOf(['c1']),
        '/inventory_lists': pageOf([]),
      });

      const result = await discoverExportableUnits(instance);

      expect(result.sites).to.deep.equal([]);
      expect(result.catalogs).to.deep.equal(['c1']);
      expect(result.warnings).to.have.lengthOf(1);
      expect(result.warnings[0]).to.include('sites');
    });
  });
});
