/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import type {ScapiSchemasClient} from '@salesforce/b2c-tooling-sdk/clients';
import {
  ScapiLiveSchemaCache,
  ScapiUnknownApiError,
  loadScapiSchemas,
  resolveScapiDocuments,
  type ApiDocument,
} from '@salesforce/b2c-tooling-sdk/scapi';

const contract: ApiDocument = {
  openapi: '3.0.3',
  info: {version: '9.9.9'},
  paths: {'/organizations/{organizationId}/widgets': {get: {operationId: 'liveOnly', responses: {}}}},
};

function schemasClient(listing: ApiDocument[] | Error): ScapiSchemasClient {
  return {
    async GET(path: string) {
      if (listing instanceof Error) throw listing;
      if (path === '/organizations/{organizationId}/schemas') return {data: {data: listing}, response: new Response()};
      return {data: contract, response: new Response()};
    },
  } as unknown as ScapiSchemasClient;
}

const tenant = (client: ScapiSchemasClient) => ({client, shortCode: 'abc123', organizationId: 'f_ecom_zzzz_001'});

async function rejection(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (error) {
    return error as Error;
  }
  throw new Error('expected a rejection');
}

describe('resolveScapiDocuments', () => {
  it('returns bundled contracts filtered by api, with local contracts replacing them', async () => {
    const product = loadScapiSchemas().find((document) => document.entry.id === 'product/products/v1')!;
    const local = {...product, entry: {...product.entry, origin: 'local'}};
    const resolved = await resolveScapiDocuments({api: 'product/products', local: [local]});
    expect(resolved.source).to.equal('bundled');
    expect(resolved.documents.map((document) => document.entry.id)).to.deep.equal(['product/products/v1']);
    expect(resolved.documents[0]).to.equal(local);
  });

  it('names close API IDs for an unknown filter', async () => {
    const error = await rejection(resolveScapiDocuments({api: 'products'}));
    expect(error).to.be.instanceOf(ScapiUnknownApiError);
    expect((error as ScapiUnknownApiError).suggestions).to.include('product/products/v1');
  });

  it('loads live contracts through a lazy tenant and caches them', async () => {
    const cache = new ScapiLiveSchemaCache();
    const client = schemasClient([{apiFamily: 'product', apiName: 'widgets', apiVersion: 'v1'}]);
    const resolved = await resolveScapiDocuments({api: 'product/widgets', live: {tenant: () => tenant(client), cache}});
    expect(resolved).to.include({source: 'live'});
    expect(resolved.documents.map((document) => document.entry.id)).to.deep.equal(['product/widgets/v1']);
    expect(cache.get('abc123/f_ecom_zzzz_001')).to.have.length(1);
  });

  it('falls back to bundled contracts with a warning when live loading or configuration fails', async () => {
    const cache = new ScapiLiveSchemaCache();
    for (const live of [
      {tenant: tenant(schemasClient(new Error('403 Forbidden'))), cache},
      {
        tenant: () => {
          throw new Error('SCAPI short code required');
        },
        cache,
      },
    ]) {
      const resolved = await resolveScapiDocuments({api: 'product/products/v1', live});
      expect(resolved.source).to.equal('bundled');
      expect(resolved.documents.map((document) => document.entry.id)).to.deep.equal(['product/products/v1']);
      expect(resolved.warnings[0]).to.include('Live schemas unavailable');
    }
  });

  it('does not fall back for custom APIs or an API unknown to the tenant', async () => {
    const cache = new ScapiLiveSchemaCache();
    const failing = {tenant: tenant(schemasClient(new Error('403 Forbidden'))), cache};
    expect((await rejection(resolveScapiDocuments({api: 'custom/loyalty', live: failing}))).message).to.include('403');
    const empty = {tenant: tenant(schemasClient([])), cache};
    expect(await rejection(resolveScapiDocuments({api: 'product/products/v1', live: empty}))).to.be.instanceOf(
      ScapiUnknownApiError,
    );
  });
});
