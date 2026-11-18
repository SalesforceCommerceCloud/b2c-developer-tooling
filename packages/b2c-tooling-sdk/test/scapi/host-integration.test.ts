/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {createServer, type Server} from 'node:http';
import {expect} from 'chai';
import {stub, restore} from 'sinon';
import {
  createScapiRequest,
  filterScapiDocumentsBySafety,
  loadBundledScapiDocuments,
  loadScapiSchemas,
  runScapiCode,
  searchScapiOperations,
  type ScapiConfirmation,
} from '@salesforce/b2c-tooling-sdk/scapi';
import {MiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/clients';
import {configureLogger, resetLogger} from '@salesforce/b2c-tooling-sdk/logging';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import type {SafetyConfig} from '@salesforce/b2c-tooling-sdk/safety';

const ORG = 'f_ecom_test_001';
const product = (id: string) => `/product/products/v1/organizations/{organizationId}/products/${id}`;

async function rejects(fn: () => Promise<unknown>, text: string) {
  let error: unknown;
  try {
    await fn();
  } catch (caught) {
    error = caught;
  }
  expect(error, `expected rejection containing ${text}`).to.be.instanceOf(Error);
  expect((error as Error).message).to.include(text);
}

/** Capability allow-list: product reads and searches, confirm product updates, block everything else. */
const allowList: SafetyConfig = {
  level: 'READ_ONLY',
  confirm: true,
  rules: [
    {method: 'GET', api: 'product/products/*', action: 'allow'},
    {readOnlySearch: true, api: 'product/**', action: 'allow'},
    {operationId: 'updateProduct', action: 'confirm'},
    {path: '**', action: 'block'},
  ],
};

describe('SCAPI host integration', function () {
  this.timeout(15_000);
  afterEach(() => {
    restore();
    resetLogger();
  });

  describe('sandbox (U8)', () => {
    let server: Server;
    let port: number;
    let hits = 0;
    before(async () => {
      server = createServer((_req, res) => {
        hits++;
        res.end('reached');
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      port = (server.address() as {port: number}).port;
    });
    after(() => new Promise<void>((resolve) => server.close(() => resolve())));

    it('has no module loader, process, timers or host objects', async () => {
      const result = await runScapiCode({
        code: `async () => ({
          WebAssembly: typeof WebAssembly,
          Buffer: typeof Buffer,
          URL: typeof URL,
          TextEncoder: typeof TextEncoder,
          Intl: typeof Intl,
          clone: structuredClone({a: [1, {b: 2}]}),
        })`,
      });
      expect(result).to.deep.equal({
        WebAssembly: 'undefined',
        Buffer: 'undefined',
        URL: 'undefined',
        TextEncoder: 'undefined',
        Intl: 'undefined',
        clone: {a: [1, {b: 2}]},
      });
      for (const code of [
        "async () => require('net')",
        "async () => process.getBuiltinModule('fs')",
        "async () => process.binding('tcp_wrap')",
        'async () => process.versions',
        'async () => setTimeout(() => {}, 1)',
        'async () => setInterval(() => {}, 1)',
      ]) {
        await rejects(() => runScapiCode({code}), 'SCAPI_RUNTIME_RESTRICTED');
      }
      await rejects(() => runScapiCode({code: "async () => import('node:net')"}), '');
    });

    it('cannot reach a local HTTP server, while scapi.request still works', async () => {
      hits = 0;
      for (const code of [
        'async (port) => fetch(`http://127.0.0.1:${port}/`)',
        'async (port) => globalThis.fetch(`http://127.0.0.1:${port}/`)',
        "async (port) => import('node:http').then((http) => http.get(`http://127.0.0.1:${port}/`))",
        "async (port) => Function('p', 'return import(\"node:net\")')(port)",
      ]) {
        await rejects(() => runScapiCode({code, input: port}), '');
      }
      expect(hits).to.equal(0);
      const result = await runScapiCode({
        request: async (options) => ({ok: true, echo: options}),
        code: "async () => scapi.request({method: 'GET', path: '/x'})",
      });
      expect(result).to.deep.equal({ok: true, echo: {method: 'GET', path: '/x'}});
    });

    it('waits with sleep() and points setTimeout at it', async () => {
      expect(
        await runScapiCode({
          code: 'async () => { const a = Date.now(); await sleep(30); return Date.now() - a >= 30; }',
        }),
      ).to.equal(true);
      await rejects(() => runScapiCode({code: 'async () => new Promise((r) => setTimeout(r, 1))'}), 'sleep(ms)');
    });
  });

  describe('operationId, api and readOnlySearch rules (U9)', () => {
    function request(safety: SafetyConfig, confirm?: (r: ScapiConfirmation) => Promise<void>) {
      const fetchStub = stub(globalThis, 'fetch').callsFake(
        async () => new Response('{"ok":true}', {headers: {'content-type': 'application/json'}}),
      );
      const helper = createScapiRequest({
        shortCode: 'test',
        tenantId: 'test_001',
        auth: {fetch: fetchStub, getAuthorizationHeader: async () => 'Bearer t'} as AuthStrategy,
        safety,
        documents: loadScapiSchemas(),
        middlewareRegistry: new MiddlewareRegistry(),
        confirm: confirm ? async (r) => confirm(r) : undefined,
      });
      return {helper, fetchStub};
    }
    const signal = () => new AbortController().signal;

    it('allows listed operations, keeps searches working and blocks everything else', async () => {
      const {helper, fetchStub} = request(allowList);
      expect(await helper({method: 'GET', path: product('p1')}, signal())).to.deep.include({status: 200});
      expect(
        await helper(
          {
            method: 'POST',
            path: '/product/products/v1/organizations/{organizationId}/product-search',
            body: {query: {matchAllQuery: {}}},
          },
          signal(),
        ),
      ).to.deep.include({status: 200});
      await rejects(
        () =>
          helper(
            {
              method: 'GET',
              path: '/customer/customers/v1/organizations/{organizationId}/customer-lists/l1/customers/c1',
            },
            signal(),
          ),
        'matched safety rule',
      );
      await rejects(() => helper({method: 'DELETE', path: product('p1')}, signal()), 'matched safety rule');
      expect(fetchStub.callCount).to.equal(2);
    });

    it('sends confirm rules to the host with a rich payload (U14)', async () => {
      const seen: ScapiConfirmation[] = [];
      const {helper} = request(allowList, async (r) => {
        seen.push(r);
      });
      await helper({method: 'GET', path: product('p0')}, signal());
      await helper({method: 'PATCH', path: product('p%2F1'), body: {name: {default: 'x'}}}, signal());
      expect(seen).to.have.length(1);
      expect(seen[0]).to.deep.include({
        operationId: 'updateProduct',
        method: 'PATCH',
        api: 'product/products/v1',
        apiFamily: 'product',
        pathTemplate: '/product/products/v1/organizations/{organizationId}/products/{productId}',
        requestIndex: 1,
      });
      expect(seen[0].pathParams).to.deep.equal({organizationId: ORG, productId: 'p/1'});
      expect(seen[0].url).to.include(`/organizations/${ORG}/products/p%2F1`);
    });

    it('a declined confirmation blocks the write', async () => {
      const {helper, fetchStub} = request(allowList, async () => {
        throw new Error('declined');
      });
      await rejects(() => helper({method: 'PATCH', path: product('p1'), body: {}}, signal()), 'declined');
      expect(fetchStub.called).to.equal(false);
    });

    it('a trailing catch-all block also blocks searches without a readOnlySearch rule', async () => {
      const {helper} = request({level: 'READ_ONLY', rules: [{path: '**', action: 'block'}]});
      await rejects(
        () =>
          helper(
            {
              method: 'POST',
              path: '/product/products/v1/organizations/{organizationId}/product-search',
              body: {query: {matchAllQuery: {}}},
            },
            signal(),
          ),
        'matched safety rule',
      );
    });
  });

  describe('safety-filtered discovery (U10)', () => {
    it('hides always-blocked operations from search and spec.operations but keeps confirm and allow', async () => {
      const documents = loadScapiSchemas();
      const visible = filterScapiDocumentsBySafety(documents, allowList, ORG);
      const ids = new Set(visible.map((d) => d.entry.id));
      expect(ids.has('product/products/v1')).to.equal(true);
      expect(ids.has('customer/customers/v1')).to.equal(false);
      const products = visible.find((d) => d.entry.id === 'product/products/v1')!;
      const item = products.schema.paths['/organizations/{organizationId}/products/{productId}'];
      expect(
        Object.keys(item)
          .filter((k) => ['get', 'put', 'patch', 'delete'].includes(k))
          .sort(),
      ).to.deep.equal(['get', 'patch']);
      // The source documents are not mutated.
      expect(
        documents.find((d) => d.entry.id === 'product/products/v1')!.schema.paths[
          '/organizations/{organizationId}/products/{productId}'
        ].delete,
      ).to.not.equal(undefined);

      const hits = searchScapiOperations(documents, 'delete product', {limit: 50, safety: allowList});
      expect(hits.some((hit) => hit.operationId === 'deleteProduct')).to.equal(false);
      expect(
        searchScapiOperations(documents, 'update product', {limit: 50, safety: allowList}).some(
          (hit) => hit.operationId === 'updateProduct',
        ),
      ).to.equal(true);
      expect(
        searchScapiOperations(documents, 'delete product', {limit: 50}).some(
          (hit) => hit.operationId === 'deleteProduct',
        ),
      ).to.equal(true);

      const spec = (await runScapiCode({
        documents,
        safety: allowList,
        organizationId: 'test_001',
        code: "async () => { const ops = await spec.operations(); return {paths: ops.filter(o => o.path.includes('/customers/')).length, product: ops.filter(o => o.path === '/product/products/v1/organizations/{organizationId}/products/{productId}').map(o => o.method).sort(), search: (await spec.search('delete product', {limit: 50})).map(h => h.operationId)}; }",
      })) as {paths: number; product: string[]; search: string[]};
      expect(spec.paths).to.equal(0);
      expect(spec.product).to.include.members(['get', 'patch']);
      expect(spec.product).to.not.include('delete');
      expect(spec.search).to.not.include('deleteProduct');
    });

    it('does not hide anything when the level would only confirm', () => {
      const documents = loadScapiSchemas();
      const visible = filterScapiDocumentsBySafety(documents, {level: 'READ_ONLY', confirm: true});
      expect(visible.length).to.equal(documents.length);
      const blocked = filterScapiDocumentsBySafety(documents, {level: 'READ_ONLY'});
      const products = blocked.find((d) => d.entry.id === 'product/products/v1')!;
      expect(products.schema.paths['/organizations/{organizationId}/products/{productId}'].delete).to.equal(undefined);
      expect(
        products.schema.paths['/organizations/{organizationId}/products/{productId}/variant-search'].post,
      ).to.not.equal(undefined);
    });

    it('keeps job executions visible when a job rule may allow them', () => {
      const documents = loadScapiSchemas();
      const visible = filterScapiDocumentsBySafety(documents, {
        level: 'READ_ONLY',
        rules: [{job: 'sfcc-site-archive-export', action: 'allow'}],
      });
      const jobs = visible.find((d) => d.entry.id === 'operation/jobs/v1')!;
      const executions = (Object.entries(jobs.schema.paths) as [string, Record<string, unknown>][]).find(([p]) =>
        p.endsWith('/jobs/{jobId}/executions'),
      );
      expect(executions?.[1].post).to.not.equal(undefined);
    });
  });

  describe('bundled Admin documents (U11)', () => {
    it('returns only Admin operations and caches the result', () => {
      const admin = loadBundledScapiDocuments({authType: 'admin'});
      expect(admin).to.equal(loadBundledScapiDocuments({authType: 'admin'}));
      expect(admin.some((d) => d.entry.id === 'product/products/v1')).to.equal(true);
      expect(admin.some((d) => d.entry.id === 'product/shopper-products/v1')).to.equal(false);
      expect(loadBundledScapiDocuments()).to.equal(loadScapiSchemas());
    });
  });

  describe('logging (U12)', () => {
    it('keeps the token and secrets out of results, console output and logs', async () => {
      const lines: string[] = [];
      configureLogger({
        level: 'trace',
        json: true,
        destination: {write: (line: string | Buffer) => lines.push(String(line)) > 0},
      });
      const token = 'test-access-token-7f3a9c';
      const secret = 'test-client-secret-2b8d41';
      const fetchStub = stub(globalThis, 'fetch').callsFake(
        async () => new Response('{"id":"p1"}', {headers: {'content-type': 'application/json'}}),
      );
      const auth: AuthStrategy = {
        fetch: fetchStub,
        getAuthorizationHeader: async () => `Bearer ${token}`,
      };
      const scapiRequest = createScapiRequest({
        shortCode: 'test',
        tenantId: 'test_001',
        auth,
        safety: {level: 'READ_ONLY'},
        documents: loadScapiSchemas(),
        middlewareRegistry: new MiddlewareRegistry(),
      });
      const result = await runScapiCode({
        request: scapiRequest,
        input: {note: 'no secrets here'},
        code: `async (input) => { console.log('working'); const r = await scapi.request({method: 'GET', path: '${product('p1')}'}); return {r, input}; }`,
      });
      expect(fetchStub.calledOnce).to.equal(true);
      const sent = fetchStub.firstCall.args[0] as Request;
      expect(sent.headers.get('authorization')).to.equal(`Bearer ${token}`);
      const output = JSON.stringify(result) + lines.join('\n');
      expect(lines.some((line) => line.includes('SCAPI code request'))).to.equal(true);
      expect(output).to.not.include(token);
      expect(output).to.not.include(secret);
    });
  });
});
