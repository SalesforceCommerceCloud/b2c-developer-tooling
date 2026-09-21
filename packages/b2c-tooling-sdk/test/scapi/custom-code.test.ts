/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {rejects} from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {OAuthStrategy, type AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {MiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/clients';
import {createScapiRequest, loadScapiSchemas, runScapiCode, type ApiDocument} from '@salesforce/b2c-tooling-sdk/scapi';
import type {SafetyConfig} from '@salesforce/b2c-tooling-sdk/safety';

const server = setupServer();
const origin = 'https://test.api.commercecloud.salesforce.com';
const schemaPath = '/dx/scapi-schemas/v1/organizations/{organizationId}/schemas/custom/admin-info/v1';
const endpoint = '/custom/admin-info/v1/organizations/f_ecom_test_001/info';
const signal = () => new AbortController().signal;
const auth: AuthStrategy = {fetch, getAuthorizationHeader: async () => 'Bearer test-token'};
function schema(): ApiDocument {
  return {
    openapi: '3.0.0',
    info: {title: 'Admin Info', version: '1.0.0'},
    servers: [{url: 'https://untrusted.example'}],
    security: [{AmOAuth2: ['c_admin_info']}],
    paths: {
      '/info': {
        get: {operationId: 'getInfo', responses: {'200': {content: {'application/json': {schema: {type: 'object'}}}}}},
        post: {
          operationId: 'updateInfo',
          security: [{AmOAuth2: ['c_admin_info_rw']}],
          requestBody: {required: true, content: {'application/json': {schema: {type: 'object'}}}},
          responses: {'200': {description: 'Updated'}},
        },
      },
    },
  };
}
function request(safety: SafetyConfig = {level: 'NONE'}, authentication: AuthStrategy = auth) {
  return createScapiRequest({
    shortCode: 'test',
    tenantId: 'test_001',
    auth: authentication,
    safety,
    documents: loadScapiSchemas(),
    middlewareRegistry: new MiddlewareRegistry(),
  });
}
function serveSchema(data: ApiDocument = schema(), status = 200) {
  server.use(
    http.get(origin + schemaPath.replace('{organizationId}', 'f_ecom_test_001'), () =>
      HttpResponse.json(data, {status}),
    ),
  );
}
async function discover(call: ReturnType<typeof request>) {
  return call({method: 'GET', path: schemaPath}, signal());
}

describe('SCAPI custom code mode', () => {
  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it('discovers a live contract, selects each operation scope, and composes custom requests in the child', async () => {
    serveSchema();
    const token = `${Buffer.from('{}').toString('base64url')}.${Buffer.from('{}').toString('base64url')}.signature`;
    const scopes: string[][] = [];
    server.use(
      http.post('https://account.demandware.com/dwsso/oauth2/access_token', async ({request: req}) => {
        scopes.push((new URLSearchParams(await req.text()).get('scope') ?? '').split(' '));
        return HttpResponse.json({access_token: token, expires_in: 300});
      }),
      http.get(origin + endpoint, () => HttpResponse.json({message: 'before', extra: 'omit'})),
      http.post(origin + endpoint, async ({request: req}) => {
        expect(req.headers.get('authorization')).to.equal(`Bearer ${token}`);
        return HttpResponse.json(await req.json());
      }),
    );
    const result = await runScapiCode({
      request: request({level: 'NONE'}, new OAuthStrategy({clientId: randomUUID(), clientSecret: 'secret'})),
      code: `async () => {
        const contract = await scapi.request({method: 'GET', path: '${schemaPath}'});
        if (!contract.ok) return contract;
        // Mutating the worker's copy must not change host authorization.
        contract.data.paths['/info'].post.security = [{AmOAuth2: ['c_forged']}];
        const before = await scapi.request({method: 'GET', path: '${endpoint}'});
        const updated = await scapi.request({method: 'POST', path: '${endpoint}', body: {message: before.data.message + ' updated'}});
        return {status: updated.status, message: updated.data.message};
      }`,
    });
    expect(result).to.deep.equal({status: 200, message: 'before updated'});
    expect(scopes).to.have.length(3);
    for (const [index, scope] of ['sfcc.scapi-schemas', 'c_admin_info', 'c_admin_info_rw'].entries())
      expect(scopes[index]).to.have.members([scope, 'SALESFORCE_COMMERCE_API:test_001']);
  });

  it('requires discovery in each execution without modifying the bundled catalog', async () => {
    const call = request();
    await rejects(() => call({method: 'GET', path: endpoint}, signal()), /SCAPI_CUSTOM_SCHEMA_REQUIRED/);
    serveSchema();
    await discover(call);
    server.use(http.get(origin + endpoint, () => HttpResponse.json({ok: true})));
    expect(await call({method: 'GET', path: endpoint}, signal())).to.have.property('ok', true);
    await rejects(() => request()({method: 'GET', path: endpoint}, signal()), /SCAPI_CUSTOM_SCHEMA_REQUIRED/);
    expect(loadScapiSchemas().some(({entry}) => entry.apiFamily === 'custom')).to.equal(false);
  });

  it('preserves failed schema reads and refuses to authorize endpoints from them', async () => {
    serveSchema({detail: 'Schema access denied'}, 403);
    const call = request();
    const result = await discover(call);
    expect(result).to.include({status: 403, ok: false});
    expect(result).to.have.nested.property('diagnostic.message').that.includes('sfcc.scapi-schemas');
    await rejects(() => call({method: 'GET', path: endpoint}, signal()), /SCAPI_CUSTOM_SCHEMA_REQUIRED/);
  });

  it('rejects malformed live contracts', async () => {
    serveSchema({openapi: '3.0.0', paths: []});
    const call = request();
    await rejects(() => discover(call), /SCAPI_CUSTOM_SCHEMA_INVALID/);
    await rejects(() => call({method: 'GET', path: endpoint}, signal()), /SCAPI_CUSTOM_SCHEMA_REQUIRED/);
  });

  it('honors refreshed contracts without retaining removed operations', async () => {
    const call = request();
    serveSchema();
    await discover(call);
    const changed = schema();
    delete changed.paths['/info'].get;
    serveSchema(changed);
    await discover(call);
    await rejects(() => call({method: 'GET', path: endpoint}, signal()), /SCAPI_OPERATION_NOT_FOUND/);
  });

  it('rejects other organizations, undeclared endpoints, and origins from schema server metadata', async () => {
    const call = request();
    serveSchema();
    await discover(call);
    await rejects(
      () => call({method: 'GET', path: endpoint.replace('test_001', 'other_001')}, signal()),
      /differs from resolved/,
    );
    await rejects(() => call({method: 'GET', path: endpoint + '/undeclared'}, signal()), /SCAPI_OPERATION_NOT_FOUND/);
    await rejects(() => call({method: 'GET', path: 'https://untrusted.example/info'}, signal()), /without origin/);
  });

  it('rejects Shopper operations before requesting an Admin token for them', async () => {
    const contract = schema();
    contract.paths['/info'].get.security = [{ShopperToken: ['c_shopper_info']}];
    serveSchema(contract);
    let grants = 0;
    const call = request(
      {level: 'NONE'},
      {
        ...auth,
        getAuthorizationHeader: async () => {
          grants++;
          return 'Bearer test';
        },
      },
    );
    await discover(call);
    await rejects(() => call({method: 'GET', path: endpoint}, signal()), /SCAPI_SHOPPER_AUTH_UNSUPPORTED/);
    expect(grants).to.equal(1);
  });

  it('applies safety before custom writes and honors a targeted exception', async () => {
    serveSchema();
    const input = {method: 'POST', path: endpoint, body: {message: 'test'}};
    const blocked = request({level: 'READ_ONLY'});
    await discover(blocked);
    await rejects(() => blocked(input, signal()), /READ_ONLY/);
    const allowed = request({
      level: 'READ_ONLY',
      rules: [{method: 'POST', path: '/custom/admin-info/**', action: 'allow'}],
    });
    await discover(allowed);
    server.use(http.post(origin + endpoint, () => HttpResponse.json({updated: true})));
    expect(await allowed(input, signal())).to.have.property('ok', true);
  });

  it('reports custom operation scope failures with the operation and tenant', async () => {
    serveSchema();
    const call = request(
      {level: 'NONE'},
      {
        ...auth,
        getAccessTokenForCascade: async (scopes) => {
          if (scopes.flat().includes('c_admin_info')) throw new Error('invalid_scope');
          return 'test-token';
        },
      },
    );
    await discover(call);
    await rejects(
      () => call({method: 'GET', path: endpoint}, signal()),
      /SCAPI_SCOPE_MISSING:.*getInfo.*c_admin_info.*test_001/,
    );
  });
});
