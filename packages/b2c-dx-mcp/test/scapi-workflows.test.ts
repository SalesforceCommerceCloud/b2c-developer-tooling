/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {runScapiCode, type ScapiCodeOptions} from '@salesforce/b2c-tooling-sdk/scapi';

function runExample(name: string, request: ScapiCodeOptions['request'], inputs: Record<string, unknown> = {}) {
  const examples = {
    products: {name: 'create-product', input: {productId: 'PRODUCT_ID', catalogId: 'CATALOG_ID'}},
    promotions: {name: 'campaign-promotions', input: {campaignId: 'CAMPAIGN_ID'}},
    jobs: {name: 'failed-job-triage', input: {from: '2026-09-01T00:00:00Z', to: '2026-09-08T00:00:00Z'}},
  };
  const example = examples[name as keyof typeof examples];
  return runScapiCode({
    code: `async (input) => codemode.run('builtin/${example.name}', input)`,
    input: {...example.input, ...inputs},
    request,
    organizationId: 'f_ecom_test_001',
    siteId: 'test-site',
  });
}

describe('SCAPI workflow examples', () => {
  it('does not overwrite an existing product', async () => {
    let calls = 0;
    const result = await runExample('products', async (input) => {
      expect(input).to.have.property('method', 'GET');
      calls++;
      return {ok: true, status: 200, data: {id: 'PRODUCT_ID'}};
    });
    expect(result).to.deep.equal({state: 'exists', id: 'PRODUCT_ID', changed: false});
    expect(calls).to.equal(1);
  });

  it('creates once and verifies the selected catalog and offline flag', async () => {
    const methods: string[] = [];
    let product: unknown;
    const result = await runExample('products', async (input) => {
      const {method, body} = input as {method: string; body?: unknown};
      methods.push(method);
      if (method === 'PUT') {
        product = body;
        return {ok: true, status: 201, data: product};
      }
      return product ? {ok: true, status: 200, data: product} : {ok: false, status: 404, data: {}};
    });
    expect(methods).to.deep.equal(['GET', 'PUT', 'GET']);
    expect(result).to.deep.equal({
      state: 'verified',
      id: 'PRODUCT_ID',
      catalog: 'CATALOG_ID',
      onlineFlag: {default: false},
      writeStatus: 201,
    });
  });

  it('preserves a completed write when verification throws', async () => {
    let calls = 0;
    const result = await runExample('products', async () => {
      calls++;
      if (calls === 1) return {ok: false, status: 404};
      if (calls === 2) return {ok: true, status: 201};
      throw new Error('SCAPI_SCOPE_MISSING: verification access');
    });
    expect(result).to.deep.equal({
      stage: 'verify',
      id: 'PRODUCT_ID',
      writeStatus: 201,
      error: 'Error: SCAPI_SCOPE_MISSING: verification access',
      checkWriteBeforeRetry: true,
    });
    expect(calls).to.equal(3);
  });

  it('creates a named product online when offline is false and verifies the saved fields', async () => {
    let product: unknown;
    const result = await runExample(
      'products',
      async (input) => {
        const {method, body} = input as {method: string; body?: unknown};
        if (method === 'PUT') {
          expect(body).to.deep.equal({
            id: 'PRODUCT_ID',
            owningCatalogId: 'CATALOG_ID',
            name: {default: 'Basic product'},
            onlineFlag: {default: true},
          });
          product = body;
          return {ok: true, status: 201, data: body};
        }
        return product ? {ok: true, status: 200, data: product} : {ok: false, status: 404};
      },
      {name: 'Basic product', offline: false},
    );
    expect(result).to.deep.equal({
      state: 'verified',
      id: 'PRODUCT_ID',
      catalog: 'CATALOG_ID',
      name: 'Basic product',
      onlineFlag: {default: true},
      writeStatus: 201,
    });
  });

  it('reports verification failure when a requested name or online flag was not saved', async () => {
    await Promise.all(
      [
        {name: {default: 'Different name'}, onlineFlag: {default: true}},
        {name: {default: 'Basic product'}, onlineFlag: {default: false}},
      ].map(async (fields) => {
        let calls = 0;
        const result = await runExample(
          'products',
          async () => {
            calls++;
            if (calls === 1) return {ok: false, status: 404};
            if (calls === 2) return {ok: true, status: 201};
            return {ok: true, status: 200, data: {id: 'PRODUCT_ID', owningCatalogId: 'CATALOG_ID', ...fields}};
          },
          {name: 'Basic product', offline: false},
        );
        expect(result).to.include({state: 'verification_failed', writeStatus: 201});
        expect(calls).to.equal(3);
      }),
    );
  });

  it('joins bounded promotion batches and preserves per-record failures and continuation', async () => {
    let calls = 0;
    let active = 0;
    let peak = 0;
    const result = await runExample('promotions', async (input) => {
      const {path} = input as {path: string};
      calls++;
      if (path.includes('/campaigns/'))
        return {
          ok: true,
          status: 200,
          data: {
            data: Array.from({length: 15}, (_, index) => ({promotionId: `p${index}`, enabled: true})),
          },
        };
      peak = Math.max(peak, ++active);
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
      active--;
      if (path.endsWith('/p1')) throw new Error('Connection closed');
      if (path.endsWith('/p2'))
        return {ok: false, status: 403, data: {title: 'Forbidden'}, diagnostic: {code: 'SCAPI_FORBIDDEN'}};
      return {
        ok: true,
        status: 200,
        data: {enabled: false, archived: false, promotionClass: 'order', unrelated: 'omit'},
      };
    });
    expect(calls).to.equal(13);
    expect(peak).to.equal(4);
    expect(result).to.include({total: 15, returned: 12, nextOffset: 12});
    const {assignments} = result as {
      assignments: {promotionId: string; assignmentEnabled: boolean; promotion: object}[];
    };
    expect(assignments[0]).to.deep.equal({
      promotionId: 'p0',
      assignmentEnabled: true,
      promotion: {status: 200, enabled: false, archived: false, promotionClass: 'order'},
    });
    expect(assignments[1].promotion).to.deep.equal({error: 'Error: Connection closed'});
    expect(assignments[2].promotion).to.have.nested.property('diagnostic.code', 'SCAPI_FORBIDDEN');
  });

  it('carries job IDs from search into detail requests and returns a fixed-window continuation', async () => {
    const paths: string[] = [];
    let window: undefined | {from: string; to: string};
    const result = await runExample('jobs', async (input) => {
      const {method, path, body} = input as {
        method: string;
        path: string;
        body: {query: {filteredQuery: {filter: {rangeFilter: {from: string; to: string}}}}};
      };
      if (method === 'POST') {
        window = body.query.filteredQuery.filter.rangeFilter;
        return {
          ok: true,
          status: 200,
          data: {
            total: 5,
            hits: [
              {id: 'e1', jobId: 'job-a'},
              {id: 'e2', jobId: 'job-b'},
            ],
          },
        };
      }
      paths.push(path);
      if (path.endsWith('/e2')) throw new Error('Detail unavailable');
      return {ok: true, status: 200, data: {status: 'ERROR', logFilePath: '/Logs/job.log', parameters: ['omit']}};
    });
    expect(paths).to.have.members([
      '/operation/jobs/v1/organizations/f_ecom_test_001/jobs/job-a/executions/e1',
      '/operation/jobs/v1/organizations/f_ecom_test_001/jobs/job-b/executions/e2',
    ]);
    expect(result).to.include({
      from: window!.from,
      to: window!.to,
      returned: 2,
      total: 5,
      hasMore: true,
      nextOffset: 2,
    });
    const {executions} = result as {executions: object[]};
    expect(executions).to.deep.equal([
      {id: 'e1', jobId: 'job-a', status: 200, jobStatus: 'ERROR', logFilePath: '/Logs/job.log'},
      {id: 'e2', jobId: 'job-b', error: 'Error: Detail unavailable'},
    ]);
  });
});
