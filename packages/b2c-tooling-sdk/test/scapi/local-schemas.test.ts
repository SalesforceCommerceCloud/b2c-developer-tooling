/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {MiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/clients';
import {
  createLiveScapiDocument,
  createScapiRequest,
  loadLocalScapiSchemas,
  loadScapiSchemaOverrides,
  loadScapiSchemas,
  mergeScapiSchemas,
  type ApiDocument,
} from '@salesforce/b2c-tooling-sdk/scapi';

const server = setupServer();
const origin = 'https://test.api.commercecloud.salesforce.com';
const auth: AuthStrategy = {fetch, getAuthorizationHeader: async () => 'Bearer test-token'};

function contract(id: string, path: string): ApiDocument {
  return {
    openapi: '3.0.3',
    info: {version: '1.2.3-beta'},
    servers: [{url: `https://{shortCode}.api.commercecloud.salesforce.com/${id}`}],
    security: [{AmOAuth2: ['sfcc.cdn-zones']}],
    paths: {[path]: {get: {operationId: 'localOnly', responses: {'200': {description: 'OK'}}}}},
  };
}

describe('scapi/local', () => {
  let directory: string;
  const write = (name: string, value: unknown) => {
    const file = join(directory, name);
    mkdirSync(join(file, '..'), {recursive: true});
    writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
    return file;
  };

  before(() => server.listen({onUnhandledRequest: 'error'}));
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'b2c-local-scapi-'));
  });
  afterEach(() => {
    server.resetHandlers();
    rmSync(directory, {recursive: true, force: true});
  });
  after(() => server.close());

  it('loads files and directories, identifying each API from its server URL', () => {
    write('nested/zones.json', contract('cdn/zones/v1', '/organizations/{organizationId}/zones/{zoneId}/insights'));
    write('nested/notes.txt', 'ignored');
    const single = write('beta.json', contract('product/beta-api/v1', '/organizations/{organizationId}/beta'));
    const documents = loadLocalScapiSchemas([join(directory, 'nested'), single]);
    expect(documents.map((document) => document.entry)).to.deep.equal([
      {
        id: 'cdn/zones/v1',
        apiFamily: 'cdn',
        apiName: 'zones',
        apiVersion: 'v1',
        schemaVersion: '1.2.3-beta',
        status: 'local',
        file: join(directory, 'nested/zones.json'),
        source: join(directory, 'nested/zones.json'),
        origin: 'local',
      },
      {
        id: 'product/beta-api/v1',
        apiFamily: 'product',
        apiName: 'beta-api',
        apiVersion: 'v1',
        schemaVersion: '1.2.3-beta',
        status: 'local',
        file: single,
        source: single,
        origin: 'local',
      },
    ]);
  });

  it('rejects missing paths, invalid contracts, unidentifiable servers and duplicate ids', () => {
    expect(() => loadLocalScapiSchemas([join(directory, 'missing.json')])).to.throw('SCAPI_LOCAL_SCHEMA_INVALID');
    expect(() => loadLocalScapiSchemas([write('broken.json', '{')])).to.throw('SCAPI_LOCAL_SCHEMA_INVALID');
    expect(() => loadLocalScapiSchemas([write('swagger.json', {swagger: '2.0', paths: {}})])).to.throw(
      'expected an OpenAPI 3 contract',
    );
    const unidentified = {...contract('cdn/zones/v1', '/x'), servers: [{url: 'https://example.com/zones'}]};
    expect(() => loadLocalScapiSchemas([write('unidentified.json', unidentified)])).to.throw(
      'servers[0].url must end in /<family>/<name>/<version>',
    );
    write('a/zones.json', contract('cdn/zones/v1', '/a'));
    write('b/zones.json', contract('cdn/zones/v1', '/b'));
    expect(() => loadLocalScapiSchemas([join(directory, 'a'), join(directory, 'b')])).to.throw(
      'cdn/zones/v1 is defined by both',
    );
  });

  it('fetches http(s) entries alongside files, caching successful fetches', async () => {
    const url = 'https://schemas.example.com/cdn-zones-v1.json';
    let requests = 0;
    server.use(
      http.get(url, () => {
        requests++;
        return HttpResponse.json(contract('cdn/zones/v1', '/remote'));
      }),
    );
    const file = write('beta.json', contract('product/beta-api/v1', '/beta'));
    const cache = new Map();
    const documents = await loadScapiSchemaOverrides([url, file], {cache});
    expect(documents.map((document) => [document.entry.id, document.entry.file, document.entry.origin])).to.deep.equal([
      ['cdn/zones/v1', url, 'local'],
      ['product/beta-api/v1', file, 'local'],
    ]);
    await loadScapiSchemaOverrides([url], {cache});
    expect(requests).to.equal(1);
  });

  it('rejects failed fetches and invalid remote contracts without caching them', async () => {
    const url = 'https://schemas.example.com/zones.json';
    const cache = new Map();
    server.use(http.get(url, () => new HttpResponse(null, {status: 404, statusText: 'Not Found'}), {once: true}));
    let error: Error | undefined;
    await loadScapiSchemaOverrides([url], {cache}).catch((caught: Error) => (error = caught));
    expect(error?.message).to.equal(`SCAPI_LOCAL_SCHEMA_INVALID: ${url}: HTTP 404 Not Found`);
    expect(cache.size).to.equal(0);

    server.use(http.get(url, () => HttpResponse.json({swagger: '2.0'})));
    error = undefined;
    await loadScapiSchemaOverrides([url], {cache}).catch((caught: Error) => (error = caught));
    expect(error?.message).to.contain('expected an OpenAPI 3 contract');

    server.use(http.get(url, () => HttpResponse.json(contract('cdn/zones/v1', '/remote'))));
    error = undefined;
    await loadScapiSchemaOverrides([url, write('zones.json', contract('cdn/zones/v1', '/file'))]).catch(
      (caught: Error) => (error = caught),
    );
    expect(error?.message).to.contain('cdn/zones/v1 is defined by both');
  });

  it('takes precedence over bundled and live contracts, including schemas fetched during execution', async () => {
    const path = '/organizations/{organizationId}/zones/{zoneId}/insights';
    const [local] = loadLocalScapiSchemas([write('zones.json', contract('cdn/zones/v1', path))]);
    const live = createLiveScapiDocument(
      {apiFamily: 'cdn', apiName: 'zones', apiVersion: 'v1'},
      contract('x/y/v1', '/x'),
    );
    const added = loadLocalScapiSchemas([write('new.json', contract('product/beta-api/v1', '/beta'))]);
    const merged = mergeScapiSchemas(loadScapiSchemas(), [live], [local, ...added]);
    expect(merged).to.have.length(loadScapiSchemas().length + 1);
    expect(merged.find((document) => document.entry.id === 'cdn/zones/v1')).to.equal(local);

    server.use(
      http.get(`${origin}/dx/scapi-schemas/v1/organizations/f_ecom_test_001/schemas/cdn/zones/v1`, () =>
        HttpResponse.json(contract('cdn/zones/v1', '/organizations/{organizationId}/live-only')),
      ),
      http.get(`${origin}/cdn/zones/v1/organizations/f_ecom_test_001/zones/z1/insights`, () =>
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
    const signal = new AbortController().signal;
    await call(
      {method: 'GET', path: '/dx/scapi-schemas/v1/organizations/{organizationId}/schemas/cdn/zones/v1'},
      signal,
    );
    expect(
      await call({method: 'GET', path: '/cdn/zones/v1/organizations/{organizationId}/zones/z1/insights'}, signal),
    ).to.deep.include({ok: true});
  });
});
