/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {createRequire} from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  listDocs,
  searchDocs,
  readDocByQuery,
  readEntryContent,
  categoriesForWorkspace,
  resolveEnabledCategories,
  DOC_CATEGORIES,
  type DocEntry,
} from '@salesforce/b2c-tooling-sdk/docs';

const require = createRequire(import.meta.url);
const packageRoot = path.dirname(require.resolve('@salesforce/b2c-tooling-sdk/package.json'));
const GUIDES_INDEX = path.join(packageRoot, 'data/guides/index.json');
const TOOLING_INDEX = path.join(packageRoot, 'data/tooling/index.json');

const hasGuides = fs.existsSync(GUIDES_INDEX);
const hasTooling = fs.existsSync(TOOLING_INDEX);

describe('docs: Developer Center guides corpus', function () {
  before(function () {
    if (!hasGuides) this.skip();
  });

  it('indexes guides across the five Developer Center categories', () => {
    const cats = new Set(listDocs().map((e) => e.category));
    for (const c of ['commerce-api', 'pwa-kit-managed-runtime', 'sfnext', 'sfra', 'b2c-commerce']) {
      expect(cats.has(c as DocEntry['category']), `missing category ${c}`).to.equal(true);
    }
  });

  it('namespaces guide ids by category and carries a derived url (no bundled filePath)', () => {
    const guides = listDocs('sfnext');
    expect(guides.length).to.be.greaterThan(0);
    const entry = guides[0];
    expect(entry.id).to.match(/^sfnext\//);
    expect(entry.url).to.match(/^https:\/\/developer\.salesforce\.com\/docs\/commerce\/sfnext\/guide\//);
    expect(entry.filePath, 'guides are online-only, not bundled').to.equal(undefined);
  });

  it('filters search by a single category', () => {
    const results = searchDocs('login', {category: 'commerce-api', limit: 10});
    expect(results.length).to.be.greaterThan(0);
    expect(results.every((r) => r.entry.category === 'commerce-api')).to.equal(true);
  });

  it('filters search by multiple categories', () => {
    const results = searchDocs('storefront', {category: ['sfnext', 'pwa-kit-managed-runtime'], limit: 20});
    expect(results.length).to.be.greaterThan(0);
    expect(results.every((r) => ['sfnext', 'pwa-kit-managed-runtime'].includes(r.entry.category as string))).to.equal(
      true,
    );
  });

  it('ranks a prose guide first for a natural-language query', () => {
    const results = searchDocs('passwordless login', {category: 'commerce-api', limit: 5});
    expect(results.length).to.be.greaterThan(0);
    expect(results[0].entry.id).to.contain('passwordless');
  });

  it('boosts a workspace-relevant category to the top of cross-corpus results', () => {
    // "components" spans several corpora; a Storefront Next workspace should
    // float an sfnext guide to the top of the mixed result set.
    const results = searchDocs('components', {workspace: 'storefront-next', limit: 10});
    expect(results.length).to.be.greaterThan(0);
    expect(results[0].entry.category).to.equal('sfnext');
  });

  it('omits the internal headings field from search and list results (payload hygiene)', () => {
    const searched = searchDocs('storefront', {limit: 5});
    expect(searched.length).to.be.greaterThan(0);
    expect(
      searched.every((r) => !('headings' in r.entry)),
      'headings must not leak into search results',
    ).to.equal(true);
    expect(
      listDocs('sfnext').every((e) => !('headings' in e)),
      'headings must not leak into list results',
    ).to.equal(true);
  });

  describe('workspace → category taxonomy', () => {
    it('always-relevant categories (b2c-commerce, tooling) are relevant to every workspace', () => {
      for (const ws of ['cartridges', 'sfra', 'pwa-kit-v3', 'storefront-next'] as const) {
        const relevant = categoriesForWorkspace(ws);
        expect(relevant, `b2c-commerce should be relevant to ${ws}`).to.include('b2c-commerce');
        expect(relevant, `tooling should be relevant to ${ws}`).to.include('tooling');
      }
    });

    it('cartridges boosts server-side reference (script-api, job-step) but NOT a storefront framework', () => {
      const cart = categoriesForWorkspace('cartridges');
      expect(cart).to.include.members(['script-api', 'job-step']);
      // A generic cartridge project is not SFRA and not a JS storefront.
      expect(cart).to.not.include('sfra');
      expect(cart).to.not.include('pwa-kit-managed-runtime');
      expect(cart).to.not.include('sfnext');
    });

    it('sfra is a refinement of cartridges: [cartridges, sfra] boosts sfra AND the cartridge reference', () => {
      const sfra = categoriesForWorkspace(['cartridges', 'sfra']);
      expect(sfra).to.include.members(['sfra', 'script-api', 'job-step']);
    });

    it('JS storefronts boost their guides + commerce-api, and are merged (not summed) across markers', () => {
      expect(categoriesForWorkspace('pwa-kit-v3')).to.include.members(['pwa-kit-managed-runtime', 'commerce-api']);
      expect(categoriesForWorkspace('storefront-next')).to.include.members(['sfnext', 'commerce-api']);
      // commerce-api is shared by both; the union contains it exactly once.
      const both = categoriesForWorkspace(['pwa-kit-v3', 'storefront-next']);
      expect(both.filter((c) => c === 'commerce-api')).to.have.length(1);
    });

    it('a cartridge-bearing Storefront Next project does NOT boost sfra', () => {
      // The exact scenario from the field: detection yields [storefront-next, cartridges].
      const relevant = categoriesForWorkspace(['storefront-next', 'cartridges']);
      expect(relevant, 'sfra must not be boosted for a non-SFRA workspace').to.not.include('sfra');
      expect(relevant).to.include.members(['sfnext', 'script-api', 'job-step', 'commerce-api']);
    });
  });

  describe('workspace awareness (search)', () => {
    it('boosts a workspace-relevant category but hides nothing', () => {
      const pwa = searchDocs('components', {workspace: 'pwa-kit-v3', limit: 20});
      // A PWA Kit guide ranks first for this cross-workspace term...
      expect(pwa[0].entry.category).to.equal('pwa-kit-managed-runtime');
      // ...but other categories are still present (a workspace never filters).
      expect(pwa.some((r) => r.entry.category === 'sfnext')).to.equal(true);
    });

    it('accepts multiple workspace markers and boosts the union', () => {
      const results = searchDocs('login', {workspace: ['storefront-next', 'cartridges'], limit: 30});
      const cats = new Set(results.map((r) => r.entry.category));
      // Nothing is filtered out; sfra can still appear (just not boosted).
      expect(results.length).to.be.greaterThan(0);
      expect(cats.size).to.be.greaterThan(1);
    });

    it('an explicit category filter hard-scopes regardless of workspace', () => {
      const results = searchDocs('login', {workspace: 'cartridges', category: 'sfnext', limit: 20});
      expect(results.length).to.be.greaterThan(0);
      expect(results.every((r) => r.entry.category === 'sfnext')).to.equal(true);
    });
  });

  describe('enabledCategories allowlist (launch-time topics boundary)', () => {
    it('resolveEnabledCategories parses, lower-cases, de-dupes, and reports unknowns', () => {
      expect(resolveEnabledCategories('sfnext, Commerce-API , SFNEXT')).to.deep.equal(['sfnext', 'commerce-api']);
      expect(resolveEnabledCategories(['tooling'])).to.deep.equal(['tooling']);
      let invalid: string[] = [];
      expect(resolveEnabledCategories('sfnext,bogus,nope', (i) => (invalid = i))).to.deep.equal(['sfnext']);
      expect(invalid).to.deep.equal(['bogus', 'nope']);
      // Empty / all-invalid / undefined → no restriction.
      expect(resolveEnabledCategories('')).to.equal(undefined);
      expect(resolveEnabledCategories(undefined)).to.equal(undefined);
      expect(resolveEnabledCategories('bogus,nope')).to.equal(undefined);
      expect([...DOC_CATEGORIES]).to.include('sfnext');
    });

    it('search only returns entries within the allowlist', () => {
      const results = searchDocs('login', {enabledCategories: ['sfnext', 'commerce-api'], limit: 50});
      expect(results.length).to.be.greaterThan(0);
      expect(results.every((r) => ['sfnext', 'commerce-api'].includes(r.entry.category as string))).to.equal(true);
    });

    it('a per-query category outside the allowlist yields nothing (intersection wins)', () => {
      const results = searchDocs('login', {enabledCategories: ['sfnext'], category: 'script-api', limit: 50});
      expect(results.length).to.equal(0);
    });

    it('list is bounded by the allowlist', () => {
      const cats = new Set(listDocs(undefined, ['sfnext', 'commerce-api']).map((e) => e.category));
      expect([...cats].sort()).to.deep.equal(['commerce-api', 'sfnext']);
      // An explicit category outside the allowlist returns nothing.
      expect(listDocs('sfra', ['sfnext']).length).to.equal(0);
    });

    it('read never returns out-of-allowlist content, even for an exact id', async () => {
      const guide = listDocs('sfnext')[0];
      // The exact sfnext id must not resolve to that sfnext doc when only
      // commerce-api is enabled; any fuzzy fallback must stay within the allowlist.
      const blocked = await readDocByQuery(guide.id, {enabledCategories: ['commerce-api']});
      expect(blocked?.entry.id, 'must not return the disabled sfnext doc').to.not.equal(guide.id);
      if (blocked) expect(blocked.entry.category).to.equal('commerce-api');
      // With sfnext enabled the exact id resolves.
      const allowed = await readDocByQuery(guide.id, {enabledCategories: ['sfnext']});
      expect(allowed?.entry.id).to.equal(guide.id);
    });
  });

  it('honors a category constraint on the exact-id read fast path', async () => {
    const guide = listDocs('sfnext')[0];
    // Same id, but constrained to a different corpus -> no exact-id shortcut match.
    const wrongCat = await readDocByQuery(guide.id, {category: 'script-api'});
    expect(wrongCat, 'exact id in a non-requested category must not short-circuit').to.equal(null);
    // Correct category resolves.
    const rightCat = await readDocByQuery(guide.id, {category: 'sfnext'});
    expect(rightCat?.entry.id).to.equal(guide.id);
  });

  it('falls back to an offline summary when online content cannot be fetched', async () => {
    const entry: DocEntry = {
      id: 'sfnext/__test__',
      title: 'Test Guide',
      category: 'sfnext',
      url: 'https://developer.salesforce.com/docs/commerce/sfnext/guide/__test__.md',
      headings: 'Section A • Section B',
      summary: 'A test guide used to exercise the offline fallback path.',
    };
    // Stub fetch to fail deterministically (no real network in tests).
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => Promise.reject(new Error('network disabled in test'))) as typeof fetch;
    try {
      const content = await readEntryContent(entry);
      expect(content).to.include('# Test Guide');
      expect(content).to.include('A test guide used to exercise the offline fallback path.');
      expect(content).to.include('Section A');
      expect(content).to.include('could not be fetched');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fetches live guide content via a stubbed successful response', async () => {
    const entry: DocEntry = {
      id: 'sfnext/__test_ok__',
      title: 'Ignored',
      category: 'sfnext',
      url: 'https://developer.salesforce.com/docs/commerce/sfnext/guide/__test_ok__.md',
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() =>
      Promise.resolve(new Response('# Live Content\n\nfetched body', {status: 200}))) as typeof fetch;
    try {
      const content = await readEntryContent(entry);
      expect(content).to.equal('# Live Content\n\nfetched body');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('docs: tooling corpus', function () {
  before(function () {
    if (!hasTooling) this.skip();
  });

  it('includes bundled tooling guides with a category of "tooling"', () => {
    const tooling = listDocs('tooling');
    expect(tooling.length).to.be.greaterThan(0);
    expect(tooling.every((e) => e.category === 'tooling')).to.equal(true);
    // tooling docs are bundled on disk
    expect(tooling.every((e) => !!e.filePath)).to.equal(true);
  });

  it('reads bundled tooling content offline', async () => {
    const auth = listDocs('tooling').find((e) => e.id.includes('authentication'));
    expect(auth, 'expected an authentication tooling doc').to.not.equal(undefined);
    const content = await readEntryContent(auth!);
    expect(content).to.be.a('string').and.have.length.greaterThan(0);
  });
});
