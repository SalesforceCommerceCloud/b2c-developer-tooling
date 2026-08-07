/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createRequire} from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {listDocs, readDoc, readDocByQuery, searchDocs} from '@salesforce/b2c-tooling-sdk/docs';

const require = createRequire(import.meta.url);
const packageRoot = path.dirname(require.resolve('@salesforce/b2c-tooling-sdk/package.json'));
const JOB_STEPS_DIR = path.join(packageRoot, 'data/job-steps');

interface JobStepsDataset {
  steps: {typeId: string; kind: string; scope: string; parameters: unknown[]}[];
}

const dataset = JSON.parse(fs.readFileSync(path.join(JOB_STEPS_DIR, 'job-steps.json'), 'utf-8')) as JobStepsDataset;

describe('docs: standard job steps corpus', () => {
  it('includes every dataset step as a searchable doc entry', () => {
    const entries = listDocs();
    const ids = new Set(entries.map((e) => e.id));
    for (const step of dataset.steps) {
      expect(ids.has(step.typeId), `missing job-step doc entry: ${step.typeId}`).to.equal(true);
    }
    // plus the catalog overview page
    expect(ids.has('job-steps')).to.equal(true);
  });

  it('still includes the Script API corpus (combined index)', () => {
    const entries = listDocs();
    const ids = new Set(entries.map((e) => e.id));
    expect(ids.has('dw.catalog.ProductMgr')).to.equal(true);
  });

  it('finds a standard job step by exact type id', () => {
    const results = searchDocs('ImportCatalog', 5);
    expect(results.length).to.be.greaterThan(0);
    expect(results[0].entry.id).to.equal('ImportCatalog');
    // combined-index results carry their corpus/category
    expect(results[0].entry.category).to.equal('job-step');
  });

  it('finds the catalog overview when searching for job steps', () => {
    const results = searchDocs('job steps', 5);
    expect(results.some((r) => r.entry.id === 'job-steps')).to.equal(true);
  });

  it('reads a job step doc with purpose and parameter table', async () => {
    const content = await readDoc('ImportCatalog');
    expect(content).to.include('# Job Step: ImportCatalog');
    expect(content).to.include('## Configuration Parameters');
    expect(content).to.include('`ImportMode`');
    // IMPEX hand-off guidance is present for import steps
    expect(content).to.include('IMPEX');
  });

  it('renders the Scope field on every step doc', async () => {
    for (const step of dataset.steps) {
      const content = await readDoc(step.typeId);
      expect(content, `${step.typeId} missing Scope`).to.include('**Scope:**');
      expect(content, `${step.typeId} wrong scope`).to.include(step.scope);
    }
  });

  it('includes the framework and replication steps (full BM catalog)', () => {
    const ids = new Set(listDocs().map((e) => e.id));
    for (const id of [
      'ExecutePipeline',
      'ExecuteScriptModule',
      'IncludeStepsFromJob',
      'ExecutePreconfiguredDataReplicationProcess',
      'SiteExport',
      'SearchReindex',
    ]) {
      expect(ids.has(id), `missing ${id}`).to.equal(true);
    }
  });

  it('resolves a job step via readDocByQuery (cross-corpus file resolution)', async () => {
    const result = await readDocByQuery('ExportInventoryLists');
    expect(result).to.not.equal(null);
    expect(result?.entry.id).to.equal('ExportInventoryLists');
    expect(result?.content).to.include('# Job Step: ExportInventoryLists');
  });

  it('does not collide ids with the Script API corpus', () => {
    const entries = listDocs();
    const counts = new Map<string, number>();
    for (const e of entries) {
      counts.set(e.id, (counts.get(e.id) ?? 0) + 1);
    }
    const dupes = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
    expect(dupes, `duplicate doc ids: ${dupes.join(', ')}`).to.deep.equal([]);
  });

  it('keeps the generated index in sync with the dataset', () => {
    // The bundled index.json must list exactly the dataset steps + the catalog page.
    const index = JSON.parse(fs.readFileSync(path.join(JOB_STEPS_DIR, 'index.json'), 'utf-8')) as {
      entries: {id: string}[];
    };
    const indexIds = new Set(index.entries.map((e) => e.id));
    expect(indexIds.size).to.equal(dataset.steps.length + 1); // +1 catalog page
    for (const step of dataset.steps) {
      expect(indexIds.has(step.typeId), `index missing ${step.typeId}`).to.equal(true);
    }
    expect(indexIds.has('job-steps')).to.equal(true);
  });
});
