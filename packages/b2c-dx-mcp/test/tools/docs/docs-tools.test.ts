/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {Services} from '../../../src/services.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import {createDocsSearchTool} from '../../../src/tools/docs/docs-search.js';
import {createDocsReadTool} from '../../../src/tools/docs/docs-read.js';
import {createDocsListTool} from '../../../src/tools/docs/docs-list.js';
import {createDocsSchemaSearchTool} from '../../../src/tools/docs/docs-schema-search.js';
import {createDocsSchemaReadTool} from '../../../src/tools/docs/docs-schema-read.js';
import {createDocsSchemaListTool} from '../../../src/tools/docs/docs-schema-list.js';
import {createDocsTools} from '../../../src/tools/docs/index.js';
import type {ToolResult} from '../../../src/utils/index.js';

function getResultJson<T>(result: ToolResult): T {
  const text = result.content[0];
  if (text?.type !== 'text') throw new Error('Expected text content');
  return JSON.parse(text.text) as T;
}

function getResultText(result: ToolResult): string {
  const text = result.content[0];
  if (text?.type !== 'text') throw new Error('Expected text content');
  return text.text;
}

function makeServices(): Services {
  return new Services({resolvedConfig: createMockResolvedConfig()});
}

describe('tools/docs', () => {
  const loadServices = () => makeServices();

  // Online-only guide entries (Developer Center corpus) are read via a live
  // fetch. Unit tests must never touch the network: an unbounded fetch to a
  // host the runner can't reach hangs the whole suite (observed hanging Windows
  // CI for 6h). Stub fetch to fail fast so reads fall back to the offline
  // summary; individual tests that assert live-fetch behavior can override.
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = (() => Promise.reject(new Error('network disabled in test'))) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('createDocsTools', () => {
    it('creates all six tools', () => {
      const tools = createDocsTools(loadServices);
      expect(tools.map((t) => t.name)).to.deep.equal([
        'docs_search',
        'docs_read',
        'docs_list',
        'docs_schema_search',
        'docs_schema_read',
        'docs_schema_list',
      ]);
    });

    it('registers tools to all toolsets', () => {
      const [search] = createDocsTools(loadServices);
      expect(search.toolsets).to.have.members(['CARTRIDGES', 'DIAGNOSTICS', 'MRT', 'PWAV3', 'SCAPI', 'STOREFRONTNEXT']);
    });

    it('keeps every tool description within the 1024-char MCP limit (even with all workspaces detected)', () => {
      // Worst case: every workspace detected + a full topic allowlist → longest appended notes.
      const tools = createDocsTools(loadServices, {
        detectedWorkspaces: ['cartridges', 'sfra', 'pwa-kit-v3', 'storefront-next'],
        enabledCategories: ['script-api', 'job-step', 'commerce-api', 'pwa-kit-managed-runtime', 'sfnext', 'sfra'],
      });
      for (const tool of tools) {
        expect(tool.description.length, `${tool.name} description too long`).to.be.at.most(1024);
      }
    });

    it('surfaces the detected workspace in the search tool description', () => {
      const [search] = createDocsTools(loadServices, {detectedWorkspaces: ['storefront-next']});
      expect(search.description).to.contain('Detected workspace');
      expect(search.description).to.contain('Storefront Next');
    });
  });

  describe('docs topic allowlist (launch-time)', () => {
    it('bounds search/list/read to the enabled categories and notes it in descriptions', async () => {
      const [search, read, list] = createDocsTools(loadServices, {enabledCategories: ['sfnext', 'commerce-api']});
      for (const tool of [search, read, list]) {
        expect(tool.description, `${tool.name} should note the restriction`).to.contain('restricted at startup');
        expect(tool.description).to.contain('sfnext');
      }

      // Search only returns enabled categories...
      const searchJson = getResultJson<{results: Array<{category: string}>}>(
        await search.handler({query: 'login', limit: 50}),
      );
      expect(searchJson.results.length).to.be.greaterThan(0);
      expect(searchJson.results.every((r) => ['commerce-api', 'sfnext'].includes(r.category))).to.be.true;

      // ...and the category enum is narrowed to the allowlist (script-api rejected).
      const rejected = await search.handler({query: 'catalog', category: 'script-api'});
      expect(rejected.isError, 'a disabled category must be rejected by the schema').to.be.true;

      // The list directory only shows enabled categories.
      const dir = getResultJson<{categories: Array<{category: string}>}>(await list.handler({}));
      expect(dir.categories.every((c) => ['commerce-api', 'sfnext'].includes(c.category))).to.be.true;
    });

    it('read never returns content outside the allowlist', async () => {
      const [, read] = createDocsTools(loadServices, {enabledCategories: ['commerce-api']});
      // A script-api id that would normally resolve must not, since it is disabled.
      const result = await read.handler({query: 'dw.catalog.ProductMgr'});
      if (!result.isError) {
        const json = getResultJson<{entry: {category: string}}>(result);
        expect(json.entry.category).to.equal('commerce-api');
      }
    });
  });

  describe('docs_search', () => {
    it('returns matches for a known class', async () => {
      const tool = createDocsSearchTool(loadServices);
      const result = await tool.handler({query: 'ProductMgr', limit: 5});
      const json = getResultJson<{query: string; results: Array<{id: string; score: number}>}>(result);
      expect(json.query).to.equal('ProductMgr');
      expect(json.results.length).to.be.greaterThan(0);
      expect(json.results.some((r) => r.id.includes('ProductMgr'))).to.be.true;
    });

    it('returns lean results without keywords/url by default, verbose adds them', async () => {
      const tool = createDocsSearchTool(loadServices);
      const lean = getResultJson<{results: Array<Record<string, unknown>>}>(
        await tool.handler({query: 'passwordless login', limit: 3}),
      );
      expect(lean.results.length).to.be.greaterThan(0);
      expect(lean.results.every((r) => !('keywords' in r) && !('url' in r))).to.be.true;
      // Every result carries the triage fields.
      expect(lean.results.every((r) => 'id' in r && 'title' in r && 'score' in r)).to.be.true;

      const verbose = getResultJson<{results: Array<Record<string, unknown>>}>(
        await tool.handler({query: 'passwordless login', limit: 3, verbose: true}),
      );
      // At least one verbose result exposes keywords or url (metadata present in the corpus).
      expect(verbose.results.some((r) => 'keywords' in r || 'url' in r)).to.be.true;
    });

    it('defaults to a small result set when limit is omitted', async () => {
      const tool = createDocsSearchTool(loadServices);
      const json = getResultJson<{results: unknown[]}>(await tool.handler({query: 'login'}));
      expect(json.results.length).to.be.at.most(5);
    });

    it('returns empty results on a miss', async () => {
      const tool = createDocsSearchTool(loadServices);
      const result = await tool.handler({query: 'zzzzzqqqqxxxxnomatch', limit: 5});
      const json = getResultJson<{results: unknown[]}>(result);
      expect(json.results).to.deep.equal([]);
    });

    it('rejects empty query', async () => {
      const tool = createDocsSearchTool(loadServices);
      const result = await tool.handler({query: ''});
      expect(result.isError).to.be.true;
    });

    it('restricts results to a category', async () => {
      const tool = createDocsSearchTool(loadServices);
      const result = await tool.handler({query: 'catalog', category: 'script-api', limit: 10});
      const json = getResultJson<{category: string; results: Array<{category: string}>}>(result);
      expect(json.category).to.equal('script-api');
      expect(json.results.length).to.be.greaterThan(0);
      expect(json.results.every((r) => r.category === 'script-api')).to.be.true;
    });

    it('defaults workspace (unset/auto) to the detected workspace and echoes it', async () => {
      const tool = createDocsSearchTool(loadServices, ['storefront-next']);
      const result = await tool.handler({query: 'components', limit: 5});
      const json = getResultJson<{workspace?: string[]}>(result);
      expect(json.workspace).to.deep.equal(['storefront-next']);
    });

    it('workspace="all" disables the detected-workspace preference', async () => {
      const tool = createDocsSearchTool(loadServices, ['storefront-next']);
      const result = await tool.handler({query: 'components', workspace: 'all', limit: 5});
      const json = getResultJson<{workspace?: string[]}>(result);
      expect(json.workspace).to.equal(undefined);
    });
  });

  describe('docs_read', () => {
    it('returns content for a known doc', async () => {
      const tool = createDocsReadTool(loadServices);
      const result = await tool.handler({query: 'dw.catalog.ProductMgr'});
      expect(result.isError).to.be.undefined;
      const json = getResultJson<{entry: {id: string}; content: string; totalLength: number}>(result);
      expect(json.entry.id).to.match(/ProductMgr/);
      expect(json.content).to.be.a('string').and.have.length.greaterThan(0);
      expect(json.totalLength).to.be.a('number');
    });

    it('truncates long content to maxLength and pages via offset', async () => {
      const tool = createDocsReadTool(loadServices);
      const first = getResultJson<{
        content: string;
        totalLength: number;
        offset: number;
        truncated?: boolean;
        nextOffset?: number;
      }>(await tool.handler({query: 'dw.catalog.ProductMgr', maxLength: 200}));
      expect(first.content.length).to.be.at.most(200);
      if (first.totalLength > 200) {
        expect(first.truncated).to.be.true;
        expect(first.nextOffset).to.equal(200);
        // Second page starts where the first ended and differs.
        const second = getResultJson<{content: string; offset: number}>(
          await tool.handler({query: 'dw.catalog.ProductMgr', maxLength: 200, offset: first.nextOffset}),
        );
        expect(second.offset).to.equal(200);
        expect(second.content).to.not.equal(first.content);
      }
    });

    it('returns errorResult when nothing matches', async () => {
      const tool = createDocsReadTool(loadServices);
      const result = await tool.handler({query: 'zzzzzqqqqxxxxnomatch'});
      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('No documentation found');
    });

    it('resolves a fuzzy query with the detected workspace (parity with docs_search)', async () => {
      // "productmgr" (no dw. prefix) is a fuzzy query — with cartridges detected,
      // the Script API boost should still resolve the ProductMgr class.
      const tool = createDocsReadTool(loadServices, undefined, ['cartridges']);
      const result = await tool.handler({query: 'productmgr'});
      expect(result.isError).to.be.undefined;
      const json = getResultJson<{entry: {id: string}}>(result);
      expect(json.entry.id).to.match(/ProductMgr/);
    });
  });

  describe('docs_list', () => {
    it('returns a category directory (not the whole corpus) when unfiltered', async () => {
      const tool = createDocsListTool(loadServices);
      const result = await tool.handler({});
      const json = getResultJson<{
        note: string;
        total: number;
        categories: Array<{category: string; count: number}>;
        entries?: unknown;
      }>(result);
      expect(json.entries, 'unfiltered list must not dump entries').to.equal(undefined);
      expect(json.categories.length).to.be.greaterThan(0);
      expect(json.total).to.equal(json.categories.reduce((s, c) => s + c.count, 0));
    });

    it('filters the listing by category and returns lean TOC entries', async () => {
      const tool = createDocsListTool(loadServices);
      const scriptApi = getResultJson<{
        total: number;
        count: number;
        entries: Array<Record<string, unknown>>;
      }>(await tool.handler({category: 'script-api', limit: 500}));
      expect(scriptApi.total).to.be.greaterThan(0);
      expect(scriptApi.entries.every((e) => e.category === 'script-api')).to.be.true;
      // Table-of-contents shape only — no summary/keywords/url leaking in.
      expect(scriptApi.entries.every((e) => !('summary' in e) && !('keywords' in e) && !('url' in e))).to.be.true;
    });

    it('paginates a large category via limit/offset', async () => {
      const tool = createDocsListTool(loadServices);
      const page1 = getResultJson<{
        total: number;
        count: number;
        offset: number;
        entries: Array<{id: string}>;
        truncated?: boolean;
        nextOffset?: number;
      }>(await tool.handler({category: 'script-api', limit: 10}));
      expect(page1.count).to.equal(10);
      expect(page1.truncated).to.be.true;
      expect(page1.nextOffset).to.equal(10);
      const page2 = getResultJson<{offset: number; entries: Array<{id: string}>}>(
        await tool.handler({category: 'script-api', limit: 10, offset: page1.nextOffset}),
      );
      expect(page2.offset).to.equal(10);
      expect(page2.entries[0].id).to.not.equal(page1.entries[0].id);
    });
  });

  describe('docs_schema_search', () => {
    it('returns matches for a known schema', async () => {
      const tool = createDocsSchemaSearchTool(loadServices);
      const result = await tool.handler({query: 'catalog'});
      const json = getResultJson<{results: Array<{entry: {id: string}}>}>(result);
      expect(json.results.length).to.be.greaterThan(0);
    });
  });

  describe('docs_schema_read', () => {
    it('returns schema content for a known id (fuzzy)', async () => {
      const tool = createDocsSchemaReadTool(loadServices);
      const result = await tool.handler({query: 'catalog'});
      expect(result.isError).to.be.undefined;
      const json = getResultJson<{entry: {id: string}; content: string; path: string}>(result);
      expect(json.content).to.match(/<\?xml|<xsd:schema|<xs:schema/);
      expect(json.path).to.be.a('string');
    });

    it('returns error for unknown schema', async () => {
      const tool = createDocsSchemaReadTool(loadServices);
      const result = await tool.handler({query: 'zzzzz_no_schema_zzzzz'});
      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('No schema found');
    });
  });

  describe('docs_schema_list', () => {
    it('lists all schemas', async () => {
      const tool = createDocsSchemaListTool(loadServices);
      const result = await tool.handler({});
      const json = getResultJson<{count: number; entries: Array<{id: string}>}>(result);
      expect(json.count).to.be.greaterThan(0);
      expect(json.entries[0]).to.have.property('id');
    });
  });
});
