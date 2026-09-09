/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {
  loadScapiSchemas,
  createScapiRequest,
  runScapiCode,
  getScapiAuthInfo,
  type ScapiRequestOptions,
  type ApiDocument,
} from '@salesforce/b2c-tooling-sdk/scapi';
import {MiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/clients';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import type {SafetyConfig} from '@salesforce/b2c-tooling-sdk/safety';

const server = setupServer();
const prefix = '/product/products/v1/organizations/f_ecom_test_001/products/';
const endpoint = 'https://test.api.commercecloud.salesforce.com' + prefix + ':id';
const auth: AuthStrategy = {fetch, getAuthorizationHeader: async () => 'Bearer test-token'};
function request(safety: SafetyConfig = {level: 'NONE'}, authentication: ScapiRequestOptions['auth'] = auth) {
  return createScapiRequest({
    shortCode: 'test',
    tenantId: 'test_001',
    auth: authentication,
    safety,
    documents: loadScapiSchemas(),
    middlewareRegistry: new MiddlewareRegistry(),
  });
}
async function rejects(fn: () => Promise<unknown>, text: string) {
  let error: unknown;
  try {
    await fn();
  } catch (caught) {
    error = caught;
  }
  expect(error).to.be.instanceOf(Error);
  expect((error as Error).message).to.include(text);
}

describe('SCAPI code mode', function () {
  this.timeout(10_000);
  before(() => server.listen({onUnhandledRequest: 'error'}));
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it('ships every inventoried schema intact and excludes custom APIs', () => {
    const root = dirname(createRequire(import.meta.url).resolve('@salesforce/b2c-api-schemas/manifest.json'));
    const docs = loadScapiSchemas();
    expect(docs.length).to.be.greaterThan(40);
    expect(docs.some(({entry}) => entry.apiFamily === 'custom')).to.equal(false);
    for (const {entry, schema} of docs) {
      expect(
        createHash('sha256')
          .update(readFileSync(join(root, entry.file)))
          .digest('hex'),
      ).to.equal(entry.sha256);
      expect(schema.openapi).to.match(/^3\./);
      expect(schema.paths).to.be.an('object');
    }
  });

  it('discovers the product create contract without network or configuration', async () => {
    const result = await runScapiCode({
      documents: loadScapiSchemas(),
      code: `async () => {
      const op = spec.paths['/product/products/v1/organizations/{organizationId}/products/{productId}'].put;
      const body = spec.resolve(op.requestBody, op.api).content['application/json'].schema;
      return {operation: op.operationId, required: body.required, scopes: op.security, fields: Object.keys(body.properties)};
    }`,
    });
    expect(result).to.have.property('operation', 'createProduct');
    expect(result).to.have.property('required').that.includes('id');
    expect(result).to.have.property('fields').that.includes('owningCatalogId');
  });

  it('classifies mixed authentication per operation and distinguishes SLAS token/admin contracts', async () => {
    const docs = loadScapiSchemas();
    const orders = docs.find(({entry}) => entry.id === 'checkout/orders/v1')!;
    const mixed = Object.values<ApiDocument>(orders.schema.paths)
      .flatMap((item) => Object.values<ApiDocument>(item))
      .find(
        (op) =>
          op?.security?.some((s: Record<string, unknown>) => s.AmOAuth2) &&
          op.security.some((s: Record<string, unknown>) => s.ShopperTokenTsob),
      );
    expect(getScapiAuthInfo(orders, mixed!)).to.deep.equal({
      types: ['admin', 'shopper'],
      schemes: ['AmOAuth2', 'ShopperTokenTsob'],
      executable: true,
    });
    for (const id of ['shopper/auth/v1', 'shopper/auth-admin/v1']) {
      const document = docs.find(({entry}) => entry.id === id)!;
      const operations = Object.values<ApiDocument>(document.schema.paths).flatMap((item) =>
        Object.entries<ApiDocument>(item)
          .filter(([method]) => ['get', 'post', 'patch', 'put', 'delete'].includes(method))
          .map(([, op]) => op),
      );
      for (const operation of operations) {
        expect(getScapiAuthInfo(document, operation)).to.include({executable: false});
        expect(getScapiAuthInfo(document, operation).types).to.deep.equal([
          id.includes('auth-admin') ? 'admin' : 'shopper',
        ]);
      }
    }
    const result = await runScapiCode({
      documents: docs,
      authType: 'shopper',
      code: `async () => ({
      allMatch: Object.values(spec.paths).flatMap(Object.values).every(op => op.auth.types.includes('shopper')),
      mixed: spec.apis.find(api => api.id === 'checkout/orders/v1').authTypes,
      standardProductPresent: spec.apis.some(api => api.id === 'product/products/v1')
    })`,
    });
    expect(result).to.deep.equal({allMatch: true, mixed: ['admin', 'shopper'], standardProductPresent: false});
    expect(orders.schema.paths['/organizations/{organizationId}/orders']?.get).not.to.have.property('auth');
  });

  it('rejects Shopper execution before looking for Admin credentials or missing site parameters', async () => {
    let authLoaded = false;
    const call = request({level: 'NONE'}, () => {
      authLoaded = true;
      throw new Error('OAuth requires clientId');
    });
    await rejects(
      () =>
        runScapiCode({
          request: call,
          code: `async () => scapi.request({method:'GET',path:'/product/shopper-products/v1/organizations/f_ecom_test_001/products/test'})`,
        }),
      'SCAPI_SHOPPER_AUTH_UNSUPPORTED',
    );
    expect(authLoaded).to.equal(false);
  });

  it('reports missing Admin configuration with the operation and distinct credential family', async () => {
    const call = request({level: 'NONE'}, () => {
      throw new Error('OAuth requires clientId');
    });
    await rejects(
      () => call({method: 'GET', path: prefix + 'test'}, new AbortController().signal),
      'SCAPI_ADMIN_CONFIG_MISSING',
    );
    await rejects(
      () => call({method: 'GET', path: prefix + 'test'}, new AbortController().signal),
      'slasClientId is for Shopper',
    );
  });

  it('reports scope alternatives through native execution without leaking raw auth error text', async () => {
    let candidates: string[][] = [];
    const call = request(
      {level: 'NONE'},
      {
        ...auth,
        getAccessTokenForCascade: async (values) => {
          candidates = values;
          throw new Error('invalid_scope: raw-token-placeholder');
        },
      },
    );
    let message = '';
    try {
      await runScapiCode({request: call, code: `async () => scapi.request({method:'GET',path:'${prefix}test'})`});
    } catch (error) {
      message = (error as Error).message;
    }
    expect(candidates).to.deep.equal([['sfcc.products'], ['sfcc.products.rw']]);
    expect(message)
      .to.include('SCAPI_SCOPE_MISSING')
      .and.include('sfcc.products OR sfcc.products.rw')
      .and.include('getProduct');
    expect(message).not.to.include('raw-token-placeholder');
  });

  it('preserves HTTP auth errors with actionable diagnostics and does not label every 403 a scope failure', async () => {
    const data = {title: 'Forbidden', detail: 'Access denied'};
    server.use(http.get(endpoint, () => HttpResponse.json(data, {status: 403})));
    const result = (await request()({method: 'GET', path: prefix + 'test'}, new AbortController().signal)) as {
      data: unknown;
      status: number;
      diagnostic: {code: string; message: string};
    };
    expect(result.data).to.deep.equal(data);
    expect(result.status).to.equal(403);
    expect(result.diagnostic.code).to.equal('SCAPI_FORBIDDEN');
    expect(result.diagnostic.message).to.include('sfcc.products').and.include('instance access');
  });

  it('distinguishes rejected Admin credentials from API token rejection', async () => {
    const invalid = request(
      {level: 'NONE'},
      {
        ...auth,
        getAuthorizationHeader: async () => {
          throw new Error('Failed to get access token: 401 Unauthorized');
        },
      },
    );
    await rejects(
      () => invalid({method: 'GET', path: prefix + 'test'}, new AbortController().signal),
      'SCAPI_ADMIN_CREDENTIALS_REJECTED',
    );
    const data = {title: 'Unauthorized'};
    server.use(http.get(endpoint, () => HttpResponse.json(data, {status: 401})));
    const result = (await request()({method: 'GET', path: prefix + 'test'}, new AbortController().signal)) as {
      status: number;
      data: unknown;
      diagnostic: {code: string};
    };
    expect(result).to.include({status: 401});
    expect(result.data).to.deep.equal(data);
    expect(result.diagnostic.code).to.equal('SCAPI_UNAUTHORIZED');
  });

  it('creates a product and reads it back through real child execution and SDK HTTP middleware', async () => {
    let product: Record<string, unknown> | undefined;
    let puts = 0;
    server.use(
      http.get(endpoint, () =>
        product ? HttpResponse.json(product) : HttpResponse.json({detail: 'Not found'}, {status: 404}),
      ),
      http.put(endpoint, async ({request: req}) => {
        expect(req.headers.get('authorization')).to.equal('Bearer test-token');
        puts++;
        product = (await req.json()) as Record<string, unknown>;
        return HttpResponse.json(product, {status: 201});
      }),
    );
    const code = `async () => {
      const path = '/product/products/v1/organizations/' + organizationId + '/products/phase1-test';
      const before = await scapi.request({method: 'GET', path});
      if (before.status !== 404) throw new Error('Product already exists or cannot be inspected');
      const created = await scapi.request({method: 'PUT', path, body: {id:'phase1-test', owningCatalogId:'master', name:{default:'Test product'}}});
      if (!created.ok) throw new Error('Creation failed');
      const after = await scapi.request({method:'GET', path});
      return {status:created.status, id:after.data.id, name:after.data.name.default};
    }`;
    expect(await runScapiCode({code, organizationId: 'f_ecom_test_001', request: request()})).to.deep.equal({
      status: 201,
      id: 'phase1-test',
      name: 'Test product',
    });
    expect(puts).to.equal(1);
    await rejects(() => runScapiCode({code, organizationId: 'f_ecom_test_001', request: request()}), 'already exists');
    expect(puts).to.equal(1);
  });

  it('applies the selected safety policy before authentication or writes', async () => {
    let writes = 0;
    server.use(
      http.put(endpoint, () => {
        writes++;
        return HttpResponse.json({id: 'test'});
      }),
    );
    const run = (safety: SafetyConfig) =>
      runScapiCode({
        request: request(safety),
        code: `async () => scapi.request({method:'PUT',path:'${prefix}test',body:{id:'test'}})`,
      });
    await rejects(() => run({level: 'READ_ONLY'}), 'blocked');
    await rejects(() => run({level: 'READ_ONLY', confirm: true}), 'Confirmation required');
    expect(writes).to.equal(0);
    const result = await run({level: 'READ_ONLY', rules: [{method: 'PUT', path: prefix + '*', action: 'allow'}]});
    expect(result).to.have.property('ok', true);
    expect(writes).to.equal(1);
  });

  it('blocks DELETE under NO_DELETE and returns SCAPI validation errors unchanged', async () => {
    const call = request({level: 'NO_DELETE'});
    await rejects(() => call({method: 'DELETE', path: prefix + 'test'}, new AbortController().signal), 'blocked');
    const data = {title: 'Bad Request', detail: 'id is required'};
    server.use(http.put(endpoint, () => HttpResponse.json(data, {status: 400})));
    expect(await call({method: 'PUT', path: prefix + 'test', body: {}}, new AbortController().signal)).to.deep.equal({
      status: 400,
      ok: false,
      data,
    });
  });

  it('rejects a different tenant, arbitrary origins and undeclared auth headers', async () => {
    const call = request();
    for (const input of [
      {method: 'GET', path: prefix.replace('test_001', 'other_001') + 'test'},
      {method: 'GET', path: 'https://example.com'},
      {method: 'GET', path: prefix + 'test', headers: {Authorization: 'secret'}},
      {method: 'GET', path: prefix + '%2e%2e'},
    ]) {
      let failed = false;
      try {
        await call(input, new AbortController().signal);
      } catch {
        failed = true;
      }
      expect(failed).to.equal(true);
    }
  });

  it('does not retry an earlier write when a later request fails', async () => {
    let writes = 0;
    server.use(
      http.put(endpoint, () => {
        writes++;
        return HttpResponse.json({id: 'test'}, {status: 201});
      }),
    );
    await rejects(
      () =>
        runScapiCode({
          request: request(),
          code: `async () => {
      await scapi.request({method:'PUT',path:'${prefix}test',body:{id:'test'}});
      throw new Error('Later failure');
    }`,
        }),
      'Later failure',
    );
    expect(writes).to.equal(1);
  });

  it('uses the contract query serialization for array filters', async () => {
    const path = '/merchant/roles/v1/organizations/f_ecom_test_001/roles';
    server.use(
      http.get('https://test.api.commercecloud.salesforce.com' + path, ({request: req}) => {
        const query = new URL(req.url).searchParams;
        expect(query.getAll('expand')).to.deep.equal(['permissions,users']);
        return HttpResponse.json({data: []});
      }),
    );
    const result = await request()(
      {method: 'GET', path, query: {expand: ['permissions', 'users']}},
      new AbortController().signal,
    );
    expect(result).to.have.property('ok', true);
  });

  it('bounds synchronous execution, cancellation, output and outstanding requests', async () => {
    await rejects(() => runScapiCode({code: 'async () => { while(true) {} }', timeoutMs: 150}), 'TIMEOUT');
    const controller = new AbortController();
    const running = runScapiCode({code: 'async () => { while(true) {} }', signal: controller.signal});
    setTimeout(() => controller.abort(), 100);
    await rejects(() => running, 'CANCELLED');
    await rejects(() => runScapiCode({code: 'async () => "x".repeat(70000)'}), 'RESULT_TOO_LARGE');
    await rejects(
      () => runScapiCode({code: 'async () => scapi.request({method:"GET",path:"/"})'}),
      'cannot make SCAPI',
    );
    await rejects(
      () =>
        runScapiCode({
          code: 'async () => { scapi.request({}); return true; }',
          request: async (_args, signal) =>
            new Promise((resolve) => signal.addEventListener('abort', () => resolve(null), {once: true})),
        }),
      'Await every',
    );
  });

  it('does not install the startup safety guard when replacing it with per-target policy', () => {
    const registry = new MiddlewareRegistry();
    registry.register({
      name: 'cli-safety-guard',
      getMiddleware: () => {
        throw new Error('Startup guard must not run');
      },
    });
    registry.register({name: 'custom', getMiddleware: () => ({onRequest: ({request: req}) => req})});
    expect(registry.getMiddleware('scapi', {exclude: ['cli-safety-guard']})).to.have.length(1);
    expect(registry.getProviderNames()).to.include('cli-safety-guard');
  });
});
