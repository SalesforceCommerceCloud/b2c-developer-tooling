/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import {expect} from 'chai';
import sinon from 'sinon';
import {ux} from '@oclif/core';
import SearchAnalyze from '../../../src/commands/search/analyze.js';
import {createIsolatedConfigHooks, createTestCommand, expectError, stubJsonEnabled} from '../../helpers/test-setup.js';

const CAPTURED_AT = '2026-01-01T00:00:00.000Z';

interface Result {
  extra?: Record<string, unknown>;
  ids: string[];
  query: string;
}

function entries(results: Result[]) {
  return results.map(({query, ids, extra}) => ({
    query,
    status: 200,
    latencyMs: 10,
    total: ids.length,
    hits: ids.map((productId) => ({productId})),
    refinements: [],
    ...extra,
  }));
}

function apiCapture(label: string, searchMode: string, results: Result[], limit = 25) {
  return {
    schemaVersion: 1,
    label,
    capturedAt: CAPTURED_AT,
    request: {organizationId: 'f_ecom_abcd_123', siteId: 'RefArch', limit, searchMode},
    results: entries(results),
  };
}

function storefrontCapture(label: string, results: Result[]) {
  return {
    schemaVersion: 1,
    label,
    capturedAt: CAPTURED_AT,
    request: {
      source: 'storefront',
      host: 'www.example.com',
      siteId: 'RefArch',
      locale: 'default',
      path: '/on/demandware.store/Sites-RefArch-Site/default/Search-Show',
      limit: 25,
    },
    results: entries(results),
  };
}

const SEMANTIC = {effectiveSearchMode: 'semantic'};

describe('search analyze', () => {
  const hooks = createIsolatedConfigHooks();
  let tmp: string;
  let stdout: sinon.SinonStub;
  let files: Record<'scapi-lexical' | 'scapi-semantic' | 'storefront-lexical' | 'storefront-semantic', string>;

  function write(name: string, value: unknown): string {
    const file = path.join(tmp, name);
    fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
    return file;
  }

  /** What the command printed to stdout. */
  function printed(): string {
    return stdout.args.map((args) => String(args[0])).join('\n');
  }

  /** The lines one finding printed, from its header to the next finding or section. */
  function findingBlock(header: string): string[] {
    const lines = printed().split('\n');
    const start = lines.indexOf(header);
    expect(start, `"${header}" was not printed`).to.be.greaterThan(-1);
    const length = lines.slice(start + 1).findIndex((line) => !line.startsWith('    '));
    return lines.slice(start, length === -1 ? undefined : start + 1 + length);
  }

  async function create(flags: Record<string, unknown>, json: boolean): Promise<any> {
    const command: any = await createTestCommand(SearchAnalyze, hooks.getConfig(), flags, {});
    stubJsonEnabled(command, json);
    return command;
  }

  beforeEach(async () => {
    await hooks.beforeEach();
    stdout = sinon.stub(ux, 'stdout');
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-search-analyze-'));
    // The storefront returns the same products under both engines; the API's semantic results differ.
    files = {
      'storefront-lexical': write(
        'storefront-lexical.json',
        storefrontCapture('storefront-lexical', [
          {query: 'shirt', ids: ['a', 'b', 'c']},
          {query: 'dress', ids: ['d', 'e']},
        ]),
      ),
      'storefront-semantic': write(
        'storefront-semantic.json',
        storefrontCapture('storefront-semantic', [
          {query: 'shirt', ids: ['a', 'b', 'c']},
          {query: 'dress', ids: ['d', 'e']},
        ]),
      ),
      'scapi-lexical': write(
        'api-lexical.json',
        apiCapture(
          'api-lexical',
          'lexical',
          [
            {query: 'shirt', ids: ['a', 'b', 'c', 'x']},
            {query: 'dress', ids: ['d', 'e']},
          ],
          10,
        ),
      ),
      'scapi-semantic': write(
        'api-semantic.json',
        apiCapture('api-semantic', 'semantic', [
          {query: 'shirt', ids: ['s1', 's2', 's3'], extra: SEMANTIC},
          {query: 'dress', ids: ['s4', 's5'], extra: SEMANTIC},
        ]),
      ),
    };
  });

  afterEach(() => {
    hooks.afterEach();
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  describe('analysis', () => {
    it('returns the analysis of four sources as JSON and writes it to a file', async () => {
      const output = path.join(tmp, 'analysis.json');
      const command = await create({...files, k: [3, 1], output}, true);

      const analysis = await command.run();

      expect(analysis.schemaVersion).to.equal(1);
      expect(analysis.kValues).to.deep.equal([1, 3]);
      expect(Object.keys(analysis.sources)).to.deep.equal([
        'storefrontLexical',
        'storefrontSemantic',
        'scapiLexical',
        'scapiSemantic',
      ]);
      expect(analysis.sources.scapiSemantic).to.include({label: 'api-semantic', source: 'scapi', queries: 2});
      expect(analysis.pairs.map((pair: {id: string}) => pair.id)).to.deep.equal([
        'storefront-vs-scapi-lexical',
        'storefront-vs-scapi-semantic',
        'scapi-lexical-vs-semantic',
        'storefront-lexical-vs-semantic',
      ]);
      expect(analysis.engineAttribution.storefrontSemantic).to.include({closerTo: 'lexical', k: 3});
      const codes = analysis.findings.map((finding: {code: string}) => finding.code);
      expect(codes).to.include.members(['api-only-products', 'channel-gap-grew', 'storefront-engine-mismatch']);
      expect(JSON.parse(fs.readFileSync(output, 'utf8'))).to.deep.equal(analysis);
      expect(stdout.called).to.equal(false);
    });

    it('analyzes two captures', async () => {
      const command = await create(
        {'scapi-lexical': files['scapi-lexical'], 'scapi-semantic': files['scapi-semantic']},
        true,
      );

      const analysis = await command.run();

      expect(analysis.pairs.map((pair: {id: string}) => pair.id)).to.deep.equal(['scapi-lexical-vs-semantic']);
      expect(analysis.engineAttribution).to.equal(undefined);
      expect(analysis.findings.map((finding: {code: string}) => finding.code)).to.deep.equal(['engine-change']);
    });

    it('passes the number of examples on', async () => {
      const command = await create({...files, 'max-examples': 0}, true);

      const analysis = await command.run();

      expect(analysis.findings.length).to.be.greaterThan(0);
      for (const finding of analysis.findings) expect(finding).to.not.have.property('examples');
    });

    it('rejects a depth that is not positive', async () => {
      const command = await create({...files, k: [0]}, true);

      await expectError(() => command.run(), 'kValues must contain at least one positive integer');
    });

    it('reads one capture from stdin', async () => {
      const original = Object.getOwnPropertyDescriptor(process, 'stdin');
      const capture = apiCapture('from-stdin', 'lexical', [{query: 'shirt', ids: ['a']}]);
      Object.defineProperty(process, 'stdin', {
        value: Readable.from([Buffer.from(JSON.stringify(capture))]),
        configurable: true,
      });
      try {
        const command = await create({'scapi-lexical': '-', 'scapi-semantic': files['scapi-semantic']}, true);

        const analysis = await command.run();

        expect(analysis.sources.scapiLexical.label).to.equal('from-stdin');
      } finally {
        if (original) Object.defineProperty(process, 'stdin', original);
      }
    });
  });

  describe('output', () => {
    it('prints the sources, the comparisons and the engine attribution', async () => {
      const command = await create({...files, k: [3, 1]}, false);
      sinon.stub(command, 'warn');

      await command.run();

      const out = printed();
      expect(out).to.match(/Role\s+Label\s+Source\s+Captured\s+Queries\s+Served by/);
      expect(out).to.match(
        /Storefront \(lexical\)\s+storefront-lexical\s+storefront\s+2026-01-01T00:00:00\.000Z\s+2\s+-/,
      );
      expect(out).to.match(/API \(semantic\)\s+api-semantic\s+scapi\s+2026-01-01T00:00:00\.000Z\s+2\s+semantic: 2/);
      expect(out).to.match(/Pair\s+Compared\s+@1\s+@3\s+Top-1 same\s+Facet diffs\s+Sort diffs\s+IDs via variant/);
      expect(out).to.match(/storefront-vs-scapi-lexical\s+2 of 2\s+1\.00\s+1\.00\s+2 of 2\s+0\s+0\s+0\n/);
      expect(out).to.match(/scapi-lexical-vs-semantic\s+2 of 2\s+0\.00\s+0\.00\s+0 of 2\s+0\s+0\s+-\n/);
      expect(out).to.include('Engine attribution');
      expect(out).to.include(
        '  Storefront (semantic): closer to lexical (mean overlap at 3: 1.00 with the lexical API results, 0.00 with the semantic API results)',
      );
    });

    it('prints the findings by severity with likely causes, queries and examples', async () => {
      const command = await create(files, false);
      sinon.stub(command, 'warn');

      await command.run();

      const out = printed();
      expect(out).to.match(/Warnings \(\d+\)[\s\S]*Info \(\d+\)/);
      expect(out).to.not.include('Notices');
      expect(out).to.include('  storefront-engine-mismatch (Storefront (semantic))\n');
      expect(out).to.include('  api-only-products (storefront-vs-scapi-lexical)\n');
      expect(out).to.include('  engine-change (scapi-lexical-vs-semantic)\n');
      expect(out).to.include('  channel-gap-grew\n');
      expect(out).to.include(
        '    With lexical search, the API returns products the storefront does not show in 1 of 2 compared queries (1 product in total).\n',
      );
      expect(out).to.include('    Likely causes:\n      - ');
      expect(out).to.include('    Queries: shirt\n    Examples:\n      shirt: x\n');
    });

    it('prints a few examples of each finding', async () => {
      const queries = ['q1', 'q2', 'q3', 'q4', 'q5'];
      // The storefront of query N shows N products the API does not return, so q5 is the most affected.
      const extras = (query: string, count: number) => Array.from({length: count}, (_, i) => `${query}-extra${i + 1}`);
      const storefront = write(
        'storefront-many.json',
        storefrontCapture(
          'storefront',
          queries.map((query, index) => ({query, ids: [`${query}-common`, ...extras(query, index + 1)]})),
        ),
      );
      const api = write(
        'api-many.json',
        apiCapture(
          'api',
          'lexical',
          queries.map((query) => ({query, ids: [`${query}-common`]})),
        ),
      );
      const command = await create({'storefront-lexical': storefront, 'scapi-lexical': api}, false);
      sinon.stub(command, 'warn');

      const analysis = await command.run();

      // The analysis keeps five examples; the command prints the first three.
      const found = analysis.findings.find((finding: {code: string}) => finding.code === 'storefront-only-products');
      expect(found.examples).to.have.lengthOf(5);
      expect(found.queries).to.have.lengthOf(5);
      const block = findingBlock('  storefront-only-products (storefront-vs-scapi-lexical)');
      expect(block.filter((line) => /^ {6}q\d: /.test(line))).to.deep.equal([
        '      q5: q5-extra1, q5-extra2, q5-extra3, q5-extra4, q5-extra5',
        '      q4: q4-extra1, q4-extra2, q4-extra3, q4-extra4',
        '      q3: q3-extra1, q3-extra2, q3-extra3',
      ]);
      expect(block).to.include('    Queries: q5, q4, q3, q2, q1');
    });

    it('says so when there are no findings', async () => {
      const same = [{query: 'shirt', ids: ['a', 'b']}];
      const command = await create(
        {
          'storefront-lexical': write('same-storefront.json', storefrontCapture('storefront', same)),
          'scapi-lexical': write('same-api.json', apiCapture('api', 'lexical', same)),
        },
        false,
      );
      sinon.stub(command, 'warn');

      const analysis = await command.run();

      expect(analysis.findings).to.deep.equal([]);
      expect(printed()).to.include('No findings.');
      expect(printed()).to.not.include('Warnings');
    });

    it('prints the file it wrote', async () => {
      const output = path.join(tmp, 'analysis.json');
      const command = await create({...files, output}, false);
      sinon.stub(command, 'warn');

      const analysis = await command.run();

      expect(printed()).to.include(`Wrote ${output}`);
      expect(JSON.parse(fs.readFileSync(output, 'utf8'))).to.deep.equal(analysis);
    });

    it('warns about the sources, and leaves out what every storefront comparison says', async () => {
      const wrongMode = write(
        'api-wrong-mode.json',
        apiCapture('api-wrong-mode', 'lexical', [{query: 'shirt', ids: ['a', 'b', 'c', 'x']}]),
      );
      const command = await create(
        {
          'storefront-lexical': files['storefront-lexical'],
          'scapi-lexical': files['scapi-lexical'],
          'scapi-semantic': wrongMode,
        },
        false,
      );
      const warn = sinon.stub(command, 'warn');

      await command.run();

      const warnings = warn.args.map((args) => String(args[0]));
      expect(warnings).to.include('The --scapi-semantic source requested the lexical search mode, not semantic');
      expect(warnings).to.include('storefront-vs-scapi-lexical: Captures differ in limit: baseline 25, candidate 10');
      expect(warnings.join('\n')).to.not.include('The captures come from different sources');
    });
  });

  describe('validation', () => {
    it('requires at least two captures', async () => {
      const one = await create({'scapi-lexical': files['scapi-lexical']}, true);
      await expectError(() => one.run(), 'Provide at least two captures to analyze (got 1)');

      const none = await create({}, true);
      await expectError(() => none.run(), 'Provide at least two captures to analyze (got 0)');
    });

    it('reads stdin for one capture only', async () => {
      const command = await create({'scapi-lexical': '-', 'scapi-semantic': '-'}, true);

      await expectError(
        () => command.run(),
        'Only one capture can be read from stdin (-), but --scapi-lexical, --scapi-semantic all use it.',
      );
    });

    it('names the flag of a file that cannot be read', async () => {
      const command = await create(
        {'scapi-lexical': path.join(tmp, 'missing.json'), 'scapi-semantic': files['scapi-semantic']},
        true,
      );

      await expectError(() => command.run(), 'Could not read the capture for --scapi-lexical');
    });

    it('names the flag of a file that is not JSON', async () => {
      const command = await create(
        {'scapi-lexical': files['scapi-lexical'], 'scapi-semantic': write('broken.json', '{"schemaVersion":')},
        true,
      );

      await expectError(() => command.run(), 'Could not read the capture for --scapi-semantic');
    });

    it('names the flag and the file of JSON that is not a capture', async () => {
      const other = write('other.json', {hello: 'world'});
      const command = await create({'scapi-lexical': files['scapi-lexical'], 'storefront-lexical': other}, true);

      const error = await expectError(() => command.run(), 'The file for --storefront-lexical');
      expect(error.message).to.include(other);
      expect(error.message).to.include('is not a search capture');
    });

    it('names the flag of a capture of another schema version', async () => {
      const old = write('old.json', {...apiCapture('old', 'semantic', []), schemaVersion: 2});
      const command = await create({'scapi-lexical': files['scapi-lexical'], 'scapi-semantic': old}, true);

      await expectError(
        () => command.run(),
        'The --scapi-semantic source is not a search capture with schemaVersion 1 (got 2)',
      );
    });

    it('names the flag of a capture from the wrong channel', async () => {
      const storefront = await create(
        {'storefront-lexical': files['scapi-lexical'], 'scapi-semantic': files['scapi-semantic']},
        true,
      );
      await expectError(
        () => storefront.run(),
        'The --storefront-lexical source must be a storefront capture, but its request source is "scapi"',
      );

      const api = await create(
        {'storefront-lexical': files['storefront-lexical'], 'scapi-semantic': files['storefront-semantic']},
        true,
      );
      await expectError(
        () => api.run(),
        'The --scapi-semantic source must be a scapi capture, but its request source is "storefront"',
      );
    });
  });
});
