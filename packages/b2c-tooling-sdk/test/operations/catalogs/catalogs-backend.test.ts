/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import type {AuthStrategy} from '../../../src/auth/types.js';
import {ScapiCatalogsBackend} from '../../../src/operations/catalogs/scapi-catalogs-backend.js';

describe('ScapiCatalogsBackend', () => {
  it('paginates the live 50-item collection and maps localized names', async () => {
    const backend = new ScapiCatalogsBackend({
      shortCode: 'abcd1234',
      tenantId: 'zzxy_dev',
      auth: {} as AuthStrategy,
    });
    const offsets: number[] = [];
    (backend as unknown as {client: unknown}).client = {
      async GET(_path: string, options: {params: {query: {offset: number; limit: number}}}) {
        const {offset, limit} = options.params.query;
        offsets.push(offset);
        const data = Array.from({length: Math.min(limit, 75 - offset)}, (_, index) => ({
          id: `catalog-${offset + index}`,
          name: {default: `Catalog ${offset + index}`},
          online: true,
        }));
        return {data: {data, offset, limit, total: 75}, error: undefined, response: {status: 200}};
      },
    };

    const catalogs = await backend.listCatalogs();

    expect(catalogs).to.have.length(75);
    expect(offsets).to.deep.equal([0, 50]);
    expect(catalogs[0]).to.include({id: 'catalog-0', name: 'Catalog 0', online: true});
  });
});
