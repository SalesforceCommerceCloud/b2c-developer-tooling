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
  it('reviews successful and failed runs in a stable window with continuation', async () => {
    const result = (await runScapiCode({
      input: {from: '2026-09-01T00:00:00Z', to: '2026-09-02T00:00:00Z', jobId: 'Import', limit: 1},
      code: `async (input) => codemode.run('builtin/job-execution-review', input)`,
      request: async (args) => {
        const request = args as {path: string; body: {query: unknown; limit: number}};
        expect(request.path).to.include('job-execution-search');
        expect(request.body.query).to.deep.equal({
          filteredQuery: {
            query: {termQuery: {fields: ['jobId'], operator: 'is', values: ['Import']}},
            filter: {rangeFilter: {field: 'startTime', from: '2026-09-01T00:00:00Z', to: '2026-09-02T00:00:00Z'}},
          },
        });
        expect(request.body.limit).to.equal(1);
        return {
          ok: true,
          data: {total: 2, hits: [{id: 'first', jobId: 'Import', status: 'OK', logFilePath: '/Sites/LOGS/run.log'}]},
        };
      },
    })) as {total: number; nextOffset: number; executions: object[]};
    expect(result).to.include({total: 2, nextOffset: 1});
    expect(result.executions[0]).to.include({status: 'OK', logFilePath: '/Sites/LOGS/run.log'});
  });

  it('projects a bounded step page for an exact execution', async () => {
    const result = (await runScapiCode({
      input: {jobId: 'Import A', executionId: '123', offset: 1, limit: 1},
      code: `async (input) => codemode.run('builtin/job-execution-inspect', input)`,
      request: async (args) => {
        expect((args as {path: string}).path).to.include('/jobs/Import%20A/executions/123');
        return {
          ok: true,
          data: {
            id: '123',
            logFilePath: 'Logs/jobs/a.log',
            stepExecutions: [
              {stepId: 'first'},
              {stepId: 'second', itemWriteCount: 4, executionScope: 'SiteA'},
              {stepId: 'third'},
            ],
          },
        };
      },
    })) as {steps: object[]};
    expect(result).to.include({totalSteps: 3, returned: 1, nextOffset: 2, logFilePath: 'Logs/jobs/a.log'});
    expect(result.steps).to.deep.equal([{stepId: 'second', itemWriteCount: 4, executionScope: 'SiteA'}]);
  });

  it('identifies active versions outside the returned page and preserves activation timestamps', async () => {
    const result = (await runScapiCode({
      input: {limit: 1},
      code: `async (input) => codemode.run('builtin/code-version-inspect', input)`,
      request: async () => ({
        ok: true,
        data: {
          data: [
            {id: 'old', rollback: true, activationTime: '2026-09-01T00:00:00Z'},
            {id: 'current', active: true},
          ],
        },
      }),
    })) as {active: string[]; versions: object[]};
    expect(result).to.include({total: 2, nextOffset: 1});
    expect(result.active).to.deep.equal(['current']);
    expect(result.versions[0]).to.include({activationTime: '2026-09-01T00:00:00Z'});
  });

  it('keeps site cartridge order and distinguishes omitted paths from missing cartridges', async () => {
    for (const cartridges of ['custom:base', undefined]) {
      const result = (await runScapiCode({
        input: {siteId: 'SiteA', expectedCartridges: ['custom', 'missing']},
        code: `async (input) => codemode.run('builtin/site-cartridge-inspect', input)`,
        request: async () => ({ok: true, data: {id: 'SiteA', cartridges, siteCatalogId: 'storefront'}}),
      })) as {cartridges?: string[]; missing: string[] | null};
      expect(result.missing).to.deep.equal(cartridges ? ['missing'] : null);
      if (cartridges) expect(result.cartridges).to.deep.equal(['custom', 'base']);
    }
  });

  it('preserves upstream errors from operational snippets', async () => {
    for (const [name, input] of [
      ['job-execution-review', {from: '2026-09-01T00:00:00Z', to: '2026-09-02T00:00:00Z'}],
      ['job-execution-inspect', {jobId: 'a', executionId: 'b'}],
      ['code-version-inspect', {}],
      ['site-cartridge-inspect', {siteId: 'a'}],
    ] as const) {
      const result = await runScapiCode({
        input,
        code: `async (input) => codemode.run('builtin/${name}', input)`,
        request: async () => ({ok: false, status: 403, data: {detail: 'Access denied'}}),
      });
      expect(result).to.deep.include({ok: false, status: 403, data: {detail: 'Access denied'}});
    }
  });

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
      ['builtin/create-product', {productId: 'a', catalogId: 'b', category: {catalogId: 'storefront'}}],
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
    expect(loadBuiltinScapiSnippets()).to.have.length(7);
    for (const item of loadBuiltinScapiSnippets()) expect(item.code).to.include('async (input)');
  });

  it('describes the full built-in product program and its input schema', async () => {
    const expected = loadBuiltinScapiSnippets().find((item) => item.name === 'builtin/create-product');
    const result = await runScapiCode({code: "async () => codemode.describe('builtin/create-product')"});
    expect(result).to.deep.equal(expected);
    expect((result as ScapiSnippet).inputSchema.properties).to.have.keys(
      'productId',
      'catalogId',
      'name',
      'offline',
      'category',
    );
  });
});
