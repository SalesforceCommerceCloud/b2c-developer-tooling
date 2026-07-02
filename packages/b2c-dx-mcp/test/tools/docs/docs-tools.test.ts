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

    it('keeps every tool description within the 1024-char MCP limit (even with all storefronts detected)', () => {
      // Worst case: every storefront detected → longest appended detection note.
      const tools = createDocsTools(loadServices, ['cartridges', 'pwa-kit-v3', 'storefront-next']);
      for (const tool of tools) {
        expect(tool.description.length, `${tool.name} description too long`).to.be.at.most(1024);
      }
    });

    it('surfaces the detected storefront in the search tool description', () => {
      const [search] = createDocsTools(loadServices, ['storefront-next']);
      expect(search.description).to.contain('Detected storefront');
      expect(search.description).to.contain('Storefront Next');
    });
  });

  describe('docs_search', () => {
    it('returns matches for a known class', async () => {
      const tool = createDocsSearchTool(loadServices);
      const result = await tool.handler({query: 'ProductMgr', limit: 5});
      const json = getResultJson<{query: string; results: Array<{entry: {id: string}; score: number}>}>(result);
      expect(json.query).to.equal('ProductMgr');
      expect(json.results.length).to.be.greaterThan(0);
      expect(json.results.some((r) => r.entry.id.includes('ProductMgr'))).to.be.true;
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
      const json = getResultJson<{category: string; results: Array<{entry: {category: string}}>}>(result);
      expect(json.category).to.equal('script-api');
      expect(json.results.length).to.be.greaterThan(0);
      expect(json.results.every((r) => r.entry.category === 'script-api')).to.be.true;
    });

    it('defaults storefront="current" to the detected storefront and echoes it', async () => {
      const tool = createDocsSearchTool(loadServices, ['storefront-next']);
      const result = await tool.handler({query: 'components', limit: 5});
      const json = getResultJson<{storefront?: string[]}>(result);
      expect(json.storefront).to.deep.equal(['storefront-next']);
    });

    it('storefront="all" disables the detected-storefront preference', async () => {
      const tool = createDocsSearchTool(loadServices, ['storefront-next']);
      const result = await tool.handler({query: 'components', storefront: 'all', limit: 5});
      const json = getResultJson<{storefront?: string[]}>(result);
      expect(json.storefront).to.equal(undefined);
    });

    it('storefront filter mode excludes other storefronts', async () => {
      const tool = createDocsSearchTool(loadServices);
      const result = await tool.handler({
        query: 'storefront',
        storefront: 'cartridges',
        storefrontMode: 'filter',
        limit: 50,
      });
      const json = getResultJson<{results: Array<{entry: {category: string}}>}>(result);
      const cats = new Set(json.results.map((r) => r.entry.category));
      expect(cats.has('pwa-kit-managed-runtime')).to.be.false;
      expect(cats.has('sfnext')).to.be.false;
    });
  });

  describe('docs_read', () => {
    it('returns content for a known doc', async () => {
      const tool = createDocsReadTool(loadServices);
      const result = await tool.handler({query: 'dw.catalog.ProductMgr'});
      expect(result.isError).to.be.undefined;
      const json = getResultJson<{entry: {id: string}; content: string}>(result);
      expect(json.entry.id).to.match(/ProductMgr/);
      expect(json.content).to.be.a('string').and.have.length.greaterThan(0);
    });

    it('returns errorResult when nothing matches', async () => {
      const tool = createDocsReadTool(loadServices);
      const result = await tool.handler({query: 'zzzzzqqqqxxxxnomatch'});
      expect(result.isError).to.be.true;
      expect(getResultText(result)).to.include('No documentation found');
    });
  });

  describe('docs_list', () => {
    it('returns full count + entries', async () => {
      const tool = createDocsListTool(loadServices);
      const result = await tool.handler({});
      const json = getResultJson<{count: number; entries: unknown[]}>(result);
      expect(json.count).to.be.greaterThan(0);
      expect(json.entries).to.have.lengthOf(json.count);
    });

    it('filters the listing by category', async () => {
      const tool = createDocsListTool(loadServices);
      const all = getResultJson<{count: number}>(await tool.handler({}));
      const scriptApi = getResultJson<{count: number; entries: Array<{category: string}>}>(
        await tool.handler({category: 'script-api'}),
      );
      expect(scriptApi.count).to.be.greaterThan(0);
      expect(scriptApi.count).to.be.lessThan(all.count);
      expect(scriptApi.entries.every((e) => e.category === 'script-api')).to.be.true;
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
