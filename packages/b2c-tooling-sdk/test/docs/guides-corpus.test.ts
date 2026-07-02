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
  categoriesForStorefront,
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

  it('boosts favored categories (sfnext) in cross-corpus results', () => {
    // Unfiltered "get started" spans several corpora; the sfnext boost should
    // rank an sfnext guide at the top of the mixed result set.
    const results = searchDocs('get started', {limit: 10});
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

  describe('storefront awareness', () => {
    it('maps each storefront to always-relevant + storefront-specific categories', () => {
      expect(categoriesForStorefront('cartridges')).to.include.members([
        'sfra',
        'commerce-api',
        'script-api',
        'tooling',
      ]);
      expect(categoriesForStorefront('cartridges')).to.not.include('pwa-kit-managed-runtime');
      expect(categoriesForStorefront('pwa-kit-v3')).to.include('pwa-kit-managed-runtime');
      expect(categoriesForStorefront('pwa-kit-v3')).to.not.include('sfnext');
      expect(categoriesForStorefront('storefront-next')).to.include('sfnext');
    });

    it('boost mode keeps all corpora but favors the storefront (nothing hidden)', () => {
      const pwa = searchDocs('components', {storefront: 'pwa-kit-v3', limit: 20});
      // A PWA Kit guide should now rank first for this cross-storefront term...
      expect(pwa[0].entry.category).to.equal('pwa-kit-managed-runtime');
      // ...but other storefronts are still present (not filtered out).
      expect(pwa.some((r) => r.entry.category === 'sfnext')).to.equal(true);
    });

    it('filter mode returns only the storefront-relevant categories', () => {
      const results = searchDocs('storefront', {storefront: 'cartridges', storefrontMode: 'filter', limit: 50});
      const cats = new Set(results.map((r) => r.entry.category));
      expect(cats.has('pwa-kit-managed-runtime'), 'PWA Kit docs must be excluded for a cartridge storefront').to.equal(
        false,
      );
      expect(cats.has('sfnext'), 'Storefront Next docs must be excluded for a cartridge storefront').to.equal(false);
      // always-relevant + sfra remain eligible
      expect([...cats].every((c) => categoriesForStorefront('cartridges').includes(c!))).to.equal(true);
    });

    it('an explicit category filter overrides the storefront', () => {
      const results = searchDocs('login', {storefront: 'cartridges', storefrontMode: 'filter', category: 'sfnext'});
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
