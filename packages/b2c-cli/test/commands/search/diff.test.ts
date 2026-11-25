/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import sinon from 'sinon';
import {ux} from '@oclif/core';
import SearchDiff from '../../../src/commands/search/diff.js';
import {createIsolatedConfigHooks, createTestCommand, expectError, stubJsonEnabled} from '../../helpers/test-setup.js';

function capture(label: string, searchMode: string, results: Array<{ids: string[]; mode?: string; query: string}>) {
  return {
    schemaVersion: 1,
    label,
    capturedAt: '2026-01-01T00:00:00.000Z',
    request: {organizationId: 'f_ecom_abcd_123', siteId: 'RefArch', limit: 25, searchMode},
    results: results.map(({query, ids, mode}) => ({
      query,
      status: 200,
      latencyMs: 10,
      total: ids.length,
      hits: ids.map((productId) => ({productId})),
      refinements: [],
      ...(mode && {effectiveSearchMode: mode}),
    })),
  };
}

describe('search diff', () => {
  const hooks = createIsolatedConfigHooks();
  let tmp: string;
  let baselineFile: string;
  let candidateFile: string;

  function write(name: string, value: unknown): string {
    const file = path.join(tmp, name);
    fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
    return file;
  }

  beforeEach(async () => {
    await hooks.beforeEach();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-search-diff-'));
    baselineFile = write(
      'lexical.json',
      capture('lexical', 'lexical', [
        {query: 'shirt', ids: ['a', 'b', 'c']},
        {query: 'dress', ids: ['d', 'e']},
      ]),
    );
    candidateFile = write(
      'semantic.json',
      capture('semantic', 'semantic', [
        {query: 'shirt', ids: ['x', 'y'], mode: 'semantic'},
        {query: 'dress', ids: ['x', 'y'], mode: 'lexical'},
      ]),
    );
  });

  afterEach(() => {
    hooks.afterEach();
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  it('returns the diff as JSON and writes it to a file', async () => {
    const output = path.join(tmp, 'diff.json');
    const command: any = await createTestCommand(
      SearchDiff,
      hooks.getConfig(),
      {k: [2, 1], output},
      {baseline: baselineFile, candidate: candidateFile},
    );
    stubJsonEnabled(command, true);

    const diff = await command.run();

    expect(diff.kValues).to.deep.equal([1, 2]);
    expect(diff.summary).to.include({queries: 2, compared: 2, top1Agreements: 0});
    expect(diff.summary.meanOverlapAtK).to.deep.equal({'1': 0, '2': 0});
    expect(diff.summary.candidate).to.include({distinctResultSets: 1, largestSharedResultSet: 2, modeFallbacks: 1});
    expect(JSON.parse(fs.readFileSync(output, 'utf8'))).to.deep.equal(diff);
  });

  it('prints a summary and a per-query table', async () => {
    const stdout = sinon.stub(ux, 'stdout');
    const command: any = await createTestCommand(
      SearchDiff,
      hooks.getConfig(),
      {},
      {baseline: baselineFile, candidate: candidateFile},
    );
    stubJsonEnabled(command, false);

    await command.run();

    const printed = stdout.args.map((args) => String(args[0])).join('\n');
    expect(printed).to.include('Queries compared: 2 of 2');
    expect(printed).to.include('Mean overlap');
    expect(printed).to.include('lexical (fallback)');
    expect(printed).to.include('2 queries returned the same result list in the candidate');
  });

  it('prints refinement, sorting and price order differences', async () => {
    interface SortedCapture {
      brandCount: number;
      mode: string;
      prices: number[];
      sort: string;
    }
    const sorted = ({mode, sort, prices, brandCount}: SortedCapture) => ({
      ...capture(mode, mode, []),
      request: {organizationId: 'f_ecom_abcd_123', siteId: 'RefArch', limit: 25, searchMode: mode, sort},
      results: [
        {
          query: 'mug',
          status: 200,
          latencyMs: 10,
          total: prices.length,
          hits: prices.map((price, index) => ({productId: `mug-${index}`, price})),
          refinements: [
            {attributeId: 'brand', values: [{value: 'Acme', hitCount: brandCount}]},
            ...(mode === 'lexical' ? [{attributeId: 'c_productType', values: [{value: 'Mugs', hitCount: 3}]}] : []),
          ],
          sortingOptions: mode === 'lexical' ? ['best-matches', 'top-sellers'] : ['best-match', 'price-asc'],
          selectedSortingOption: sort,
        },
      ],
    });
    const baseline = write(
      'lexical-sorted.json',
      sorted({mode: 'lexical', sort: 'price-low-to-high', prices: [5, 9, 12], brandCount: 3}),
    );
    const candidate = write(
      'semantic-sorted.json',
      sorted({mode: 'semantic', sort: 'price-asc', prices: [12, 5, 9], brandCount: 2}),
    );
    const stdout = sinon.stub(ux, 'stdout');
    const command: any = await createTestCommand(SearchDiff, hooks.getConfig(), {}, {baseline, candidate});
    sinon.stub(command, 'warn');
    stubJsonEnabled(command, false);

    await command.run();

    const printed = stdout.args.map((args) => String(args[0])).join('\n');
    expect(printed).to.include(
      'Baseline:  lexical (2026-01-01T00:00:00.000Z, site RefArch, mode lexical, sort price-low-to-high)',
    );
    expect(printed).to.include('Refinement differences: 1 of 1');
    expect(printed).to.include('Refinement count differences: 1 of 1');
    expect(printed).to.include('Sorting differences: 1 of 1');
    expect(printed).to.match(/Sort options\s+best-matches, top-sellers\s+best-match, price-asc/);
    expect(printed).to.match(/Selected sort\s+price-low-to-high: 1\s+price-asc: 1/);
    expect(printed).to.match(/Price order\s+ascending: 1\s+unordered: 1/);
    expect(printed).to.match(/Refinement\s+Both\s+Only B\s+Only C\s+Values differ\s+Counts differ/);
    expect(printed).to.match(/c_productType\s+0\s+1\s+0\s+0\s+0/);
    expect(printed).to.match(/Price B\/C/);
    expect(printed).to.match(/asc\/unordered/);
  });

  it('leaves out the price order when neither capture asked for a sort', async () => {
    const stdout = sinon.stub(ux, 'stdout');
    const command: any = await createTestCommand(
      SearchDiff,
      hooks.getConfig(),
      {},
      {baseline: baselineFile, candidate: candidateFile},
    );
    stubJsonEnabled(command, false);

    await command.run();

    const printed = stdout.args.map((args) => String(args[0])).join('\n');
    expect(printed).to.include('Sorting differences: 0 of 2');
    expect(printed).to.not.include('Price order');
    expect(printed).to.not.include('Price B/C');
    expect(printed).to.not.include('Counts differ');
  });

  it('compares a storefront capture with a Shopper Search capture', async () => {
    const storefront = write('storefront.json', {
      ...capture('storefront', 'lexical', [
        {query: 'shirt', ids: ['a', 'b']},
        {query: 'dress', ids: ['d', 'e']},
      ]),
      request: {
        source: 'storefront',
        host: 'www.example.com',
        siteId: 'RefArch',
        locale: 'default',
        path: '/on/demandware.store/Sites-RefArch-Site/default/Search-Show',
        limit: 25,
      },
    });
    const stdout = sinon.stub(ux, 'stdout');
    const command: any = await createTestCommand(
      SearchDiff,
      hooks.getConfig(),
      {},
      {baseline: storefront, candidate: baselineFile},
    );
    const warn = sinon.stub(command, 'warn');
    stubJsonEnabled(command, false);

    const diff = await command.run();

    const printed = stdout.args.map((args) => String(args[0])).join('\n');
    expect(printed).to.include(
      'Baseline:  storefront (2026-01-01T00:00:00.000Z, site RefArch, storefront www.example.com)',
    );
    expect(printed).to.include('Candidate: lexical (2026-01-01T00:00:00.000Z, site RefArch, mode lexical)');
    expect(String(warn.args[0][0])).to.match(/^The captures come from different sources \(baseline storefront/);
    expect(diff.summary).to.include({compared: 2, top1Agreements: 2});
  });

  it('rejects a file that cannot be read', async () => {
    const command: any = await createTestCommand(
      SearchDiff,
      hooks.getConfig(),
      {},
      {baseline: path.join(tmp, 'missing.json'), candidate: candidateFile},
    );

    await expectError(() => command.run(), 'Could not read capture file');
  });

  it('rejects JSON that is not a capture', async () => {
    const other = write('other.json', {hello: 'world'});
    const command: any = await createTestCommand(
      SearchDiff,
      hooks.getConfig(),
      {},
      {baseline: baselineFile, candidate: other},
    );

    await expectError(() => command.run(), 'not a search capture');
  });
});
