/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {rejects} from 'node:assert/strict';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {MiddlewareRegistry, type ScapiSchemasClient} from '@salesforce/b2c-tooling-sdk/clients';
import {
  ScapiLiveSchemaCache,
  createLiveScapiDocument,
  createScapiRequest,
  loadScapiSchemas,
  mergeScapiSchemas,
  scapiTenantKey,
  type ApiDocument,
  type ScapiSchemaDocument,
} from '@salesforce/b2c-tooling-sdk/scapi';

const server = setupServer();
const origin = 'https://test.api.commercecloud.salesforce.com';
const signal = () => new AbortController().signal;
const auth: AuthStrategy = {fetch, getAuthorizationHeader: async () => 'Bearer test-token'};
const tenant = scapiTenantKey('test', 'f_ecom_test_001');

function contract(path: string): ApiDocument {
  return {
    openapi: '3.0.3',
    info: {version: '9.9.9'},
    security: [{AmOAuth2: ['sfcc.products']}],
    paths: {[path]: {get: {operationId: 'liveOnly', responses: {'200': {description: 'OK'}}}}},
  };
}
function client(listing: ApiDocument[], schemas: Record<string, ApiDocument | number>) {
  const calls: string[] = [];
  const GET = async (path: string, options: {params: {path: Record<string, string>}}) => {
    if (path === '/organizations/{organizationId}/schemas') {
      calls.push('list');
      return {data: {data: listing}, response: new Response()};
    }
    const {apiFamily, apiName, apiVersion} = options.params.path;
    const id = `${apiFamily}/${apiName}/${apiVersion}`;
    calls.push(id);
    const schema = schemas[id];
    return typeof schema === 'number'
      ? {error: {}, response: new Response(null, {status: schema})}
      : {data: schema, response: new Response()};
  };
  return {client: {GET} as unknown as ScapiSchemasClient, calls};
}

describe('SCAPI live schemas', () => {
  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it('loads, filters, caches, and refreshes tenant contracts, reporting individual failures', async () => {
    const {client: schemas, calls} = client(
      [
        {apiFamily: 'product', apiName: 'widgets', apiVersion: 'v1', status: 'current'},
        {apiFamily: 'product', apiName: 'broken', apiVersion: 'v1', status: 'current'},
        {apiFamily: 'custom', apiName: '../escape', apiVersion: 'v1'},
      ],
      {'product/widgets/v1': contract('/organizations/{organizationId}/widgets'), 'product/broken/v1': 403},
    );
    const cache = new ScapiLiveSchemaCache();
    const loaded = await cache.load(tenant, schemas, 'f_ecom_test_001');
    expect(loaded.documents.map((document) => [document.entry.id, document.entry.origin])).to.deep.equal([
      ['product/widgets/v1', 'live'],
    ]);
    expect(loaded.failures).to.deep.equal([{api: 'product/broken/v1', error: 'HTTP 403'}]);
    expect(cache.get(tenant)).to.have.length(1);
    expect(cache.get(scapiTenantKey('other', 'f_ecom_test_001'))).to.deep.equal([]);

    calls.length = 0;
    const filtered = await cache.load(tenant, schemas, 'f_ecom_test_001', {api: 'product/widgets/v1'});
    expect(filtered.documents).to.have.length(1);
    expect(calls).to.deep.equal([]);
    await cache.load(tenant, schemas, 'f_ecom_test_001', {api: 'product/widgets/v1', refresh: true});
    expect(calls).to.deep.equal(['list', 'product/widgets/v1']);
  });

  it('refetches stale contracts on discovery but never evicts them', async () => {
    const cache = new ScapiLiveSchemaCache({ttlMs: -1});
    const kept = createLiveScapiDocument({apiFamily: 'product', apiName: 'widgets', apiVersion: 'v1'}, contract('/x'));
    cache.put(tenant, kept);
    expect(cache.get(tenant)).to.deep.equal([kept]);
    const {client: schemas, calls} = client([{apiFamily: 'product', apiName: 'widgets', apiVersion: 'v1'}], {
      'product/widgets/v1': 503,
    });
    const loaded = await cache.load(tenant, schemas, 'f_ecom_test_001');
    expect(calls).to.deep.equal(['list', 'product/widgets/v1']);
    expect(loaded.documents).to.deep.equal([kept]);
    expect(loaded.failures).to.deep.equal([{api: 'product/widgets/v1', error: 'HTTP 503'}]);
    expect(cache.get(tenant)).to.deep.equal([kept]);
  });

  it('rejects invalid contracts and identities', () => {
    expect(() => createLiveScapiDocument({apiFamily: 'product', apiName: 'x', apiVersion: 'v1'}, {})).to.throw(
      'SCAPI_SCHEMA_INVALID',
    );
    expect(() =>
      createLiveScapiDocument({apiFamily: 'product', apiName: 'a/b', apiVersion: 'v1'}, contract('/x')),
    ).to.throw('SCAPI_SCHEMA_INVALID');
  });

  it('lets live contracts replace bundled ones for routing', async () => {
    const live = createLiveScapiDocument(
      {apiFamily: 'product', apiName: 'products', apiVersion: 'v1'},
      contract('/organizations/{organizationId}/live-only'),
    );
    const merged = mergeScapiSchemas(loadScapiSchemas(), [live]);
    expect(merged).to.have.length(loadScapiSchemas().length);
    expect(merged.find((document) => document.entry.id === 'product/products/v1')).to.equal(live);
    server.use(
      http.get(`${origin}/product/products/v1/organizations/f_ecom_test_001/live-only`, () =>
        HttpResponse.json({ok: true}),
      ),
    );
    const call = createScapiRequest({
      shortCode: 'test',
      tenantId: 'test_001',
      auth,
      safety: {level: 'NONE'},
      documents: merged,
      middlewareRegistry: new MiddlewareRegistry(),
    });
    expect(
      await call({method: 'GET', path: '/product/products/v1/organizations/{organizationId}/live-only'}, signal()),
    ).to.deep.include({ok: true});
  });

  it('registers standard contracts fetched inside an execution and reports them to the host', async () => {
    const path = '/organizations/f_ecom_test_001/live-only';
    server.use(
      http.get(`${origin}/dx/scapi-schemas/v1/organizations/f_ecom_test_001/schemas/product/products/v1`, () =>
        HttpResponse.json(contract('/organizations/{organizationId}/live-only')),
      ),
      http.get(`${origin}/product/products/v1${path}`, () => HttpResponse.json({ok: true})),
    );
    const reported: Array<[ScapiSchemaDocument, boolean]> = [];
    const call = createScapiRequest({
      shortCode: 'test',
      tenantId: 'test_001',
      auth,
      safety: {level: 'NONE'},
      documents: loadScapiSchemas(),
      middlewareRegistry: new MiddlewareRegistry(),
      onSchema: (document, customProperties) => reported.push([document, customProperties]),
    });
    await rejects(() => call({method: 'GET', path: `/product/products/v1${path}`}, signal()), /NOT_FOUND/);
    await call(
      {
        method: 'GET',
        path: '/dx/scapi-schemas/v1/organizations/{organizationId}/schemas/product/products/v1',
        query: {expand: 'custom_properties'},
      },
      signal(),
    );
    expect(reported.map(([document, expanded]) => [document.entry.id, expanded])).to.deep.equal([
      ['product/products/v1', true],
    ]);
    expect(await call({method: 'GET', path: `/product/products/v1${path}`}, signal())).to.deep.include({ok: true});
  });
});
