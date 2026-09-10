/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {mkdtempSync, rmSync, readFileSync, readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  runScapiCode,
  loadScapiSnippets,
  loadBuiltinScapiSnippets,
  saveScapiSnippet,
  createScapiRequest,
  loadScapiSchemas,
  type ScapiSnippet,
} from '@salesforce/b2c-tooling-sdk/scapi';

const snippet: ScapiSnippet = {
  name: 'user/inspect-product',
  description: 'Inspect a product.',
  effect: 'read',
  inputSchema: {type: 'object', required: ['id'], properties: {id: {type: 'string'}}, additionalProperties: false},
  code: `async (input) => scapi.request({method: 'GET', path: '/product/products/v1/organizations/' + organizationId + '/products/' + encodeURIComponent(input.id)})`,
};

async function rejects(run: () => Promise<unknown>, message: string) {
  let caught;
  try {
    await run();
  } catch (error) {
    caught = error;
  }
  expect(caught).to.be.instanceOf(Error);
  expect(String(caught)).to.include(message);
}

describe('SCAPI snippets', () => {
  let directory: string;
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'b2c-snippets-'));
  });
  afterEach(() => rmSync(directory, {recursive: true, force: true}));

  it('persists only source and metadata, preserves namespaces, and refuses overwrites', () => {
    saveScapiSnippet(snippet, directory);
    const loaded = loadScapiSnippets(directory);
    expect(loaded.map((s) => s.name)).to.include.members(['builtin/create-product', snippet.name]);
    expect(loaded.find((s) => s.name === snippet.name)).to.include({code: snippet.code});
    expect(() => saveScapiSnippet(snippet, directory)).to.throw('SCAPI_SNIPPET_EXISTS');
    for (const name of ['builtin/inspect-product', 'user/../escape', 'user/x/y']) {
      expect(() => saveScapiSnippet({...snippet, name}, directory)).to.throw();
    }
    expect(readdirSync(directory)).to.deep.equal(['inspect-product.json']);
    expect(Object.keys(JSON.parse(readFileSync(join(directory, 'inspect-product.json'), 'utf8')))).to.have.members([
      'name',
      'description',
      'effect',
      'code',
      'inputSchema',
      'savedAt',
    ]);
  });

  it('discovers metadata without code and describes the exact saved source offline', async () => {
    saveScapiSnippet(snippet, directory);
    const result = await runScapiCode({
      snippets: loadScapiSnippets(directory),
      code: `async () => ({
      matches: await codemode.search('inspect product'), detail: await codemode.describe('user/inspect-product')})`,
    });
    const value = result as {matches: {results: object[]}; detail: ScapiSnippet};
    expect(value.matches.results).not.to.be.empty;
    for (const match of value.matches.results) expect(match).not.to.have.property('code');
    expect(value.detail.code).to.equal(snippet.code);
  });

  it('rejects invocation in discovery and names missing dependencies', async () => {
    await rejects(
      () => runScapiCode({code: `async () => codemode.run('builtin/failed-job-triage', {})`}),
      'Use scapi_execute',
    );
    await rejects(
      () => runScapiCode({request: async () => null, code: `async () => codemode.run('user/missing', {})`}),
      'SCAPI_SNIPPET_NOT_FOUND',
    );
  });

  it('validates required inputs, formats and page bounds before any request', async () => {
    let calls = 0;
    const invalid = [
      ['builtin/create-product', undefined],
      ['builtin/create-product', null],
      ['builtin/create-product', {}],
      ['builtin/create-product', {productId: 'a', catalogId: 'b', offline: 'false'}],
      ['builtin/create-product', {productId: 'a', catalogId: 'b', name: ''}],
      ['builtin/create-product', {productId: 'a', catalogId: 'b', unexpected: true}],
      ['builtin/campaign-promotions', {campaignId: 'a', limit: 13}],
      ['builtin/failed-job-triage', {from: 'bad', to: 'bad'}],
    ];
    for (const [name, input] of invalid) {
      await rejects(
        () =>
          runScapiCode({
            input,
            request: async () => {
              calls++;
            },
            code: `async (input) => codemode.run('${name}', input)`,
          }),
        'SCAPI_SNIPPET_INPUT',
      );
    }
    expect(calls).to.equal(0);
  });

  it('passes intermediate values between nested snippets using the current target', async () => {
    const paths: string[] = [];
    const result = await runScapiCode({
      organizationId: 'current-org',
      snippets: [
        snippet,
        {
          ...snippet,
          name: 'user/compose',
          code: `async (input) => {
        const first = await codemode.run('user/inspect-product', input);
        return codemode.run('user/inspect-product', {id: first.data.relatedId});
      }`,
        },
      ],
      input: {id: 'first'},
      code: `async (input) => codemode.run('user/compose', input)`,
      request: async (options) => {
        paths.push((options as {path: string}).path);
        return {ok: true, status: 200, data: {relatedId: 'second'}};
      },
    });
    expect(result).to.have.property('ok', true);
    expect(paths).to.deep.equal(
      ['first', 'second'].map((id) => `/product/products/v1/organizations/current-org/products/${id}`),
    );
  });

  it('shares the request budget across repeated named calls', async () => {
    let calls = 0;
    await rejects(
      () =>
        runScapiCode({
          snippets: [snippet],
          request: async () => {
            calls++;
            return {};
          },
          code: `async () => { for (let i = 0; i < 21; i++) await codemode.run('user/inspect-product', {id: String(i)}); }`,
        }),
      'SCAPI_CALL_LIMIT',
    );
    expect(calls).to.equal(20);
  });

  it('bounds recursive snippets and requires awaiting them', async () => {
    const snippets = [{...snippet, name: 'user/recurse', code: `async (input) => codemode.run('user/recurse', input)`}];
    await rejects(
      () =>
        runScapiCode({snippets, request: async () => null, code: `async () => codemode.run('user/recurse', {id:'a'})`}),
      'SCAPI_SNIPPET_LIMIT',
    );
    await rejects(
      () =>
        runScapiCode({
          snippets: [snippet],
          request: async () => null,
          code: `async () => { codemode.run('user/inspect-product', {id:'a'}); return 1; }`,
        }),
      'Await every',
    );
  });

  it('enforces safety before authentication inside a named snippet', async () => {
    let authCalls = 0;
    const request = createScapiRequest({
      shortCode: 'test',
      tenantId: 'test_001',
      documents: loadScapiSchemas(),
      safety: {level: 'READ_ONLY'},
      auth: () => {
        authCalls++;
        throw new Error('Must not authenticate');
      },
    });
    await rejects(
      () =>
        runScapiCode({
          request,
          organizationId: 'f_ecom_test_001',
          input: {from: '2026-09-01T00:00:00Z', to: '2026-09-08T00:00:00Z'},
          code: `async (input) => codemode.run('builtin/failed-job-triage', input)`,
        }),
      'READ_ONLY',
    );
    expect(authCalls).to.equal(0);
  });

  it('cancels pending named requests through the enclosing execution signal', async () => {
    const controller = new AbortController();
    let aborted = false;
    await rejects(
      () =>
        runScapiCode({
          snippets: [snippet],
          signal: controller.signal,
          code: `async () => codemode.run('user/inspect-product', {id:'a'})`,
          request: async (_options, signal) =>
            new Promise((resolve) => {
              signal.addEventListener(
                'abort',
                () => {
                  aborted = true;
                  resolve(null);
                },
                {once: true},
              );
              controller.abort();
            }),
        }),
      'SCAPI_EXECUTION_CANCELLED',
    );
    expect(aborted).to.equal(true);
  });

  it('loads all built-in sources from the installed SDK data directory', () => {
    expect(loadBuiltinScapiSnippets()).to.have.length(3);
    for (const item of loadBuiltinScapiSnippets()) expect(item.code).to.include('async (input)');
  });

  it('describes the full built-in product program and its input schema', async () => {
    const expected = loadBuiltinScapiSnippets().find((item) => item.name === 'builtin/create-product');
    const result = await runScapiCode({code: "async () => codemode.describe('builtin/create-product')"});
    expect(result).to.deep.equal(expected);
    expect((result as ScapiSnippet).inputSchema.properties).to.have.keys('productId', 'catalogId', 'name', 'offline');
  });
});
