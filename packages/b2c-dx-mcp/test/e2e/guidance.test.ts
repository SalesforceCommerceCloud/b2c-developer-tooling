/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable no-await-in-loop -- Discovery pages and dependent reads must run in protocol order. */
import {expect} from 'chai';
import type {GuidanceRead, GuidancePage} from '@salesforce/b2c-tooling-sdk/guidance';
import {McpE2EClient} from './stdio-client.js';

interface GuidanceToolResult {
  isError?: boolean;
  content: {type: string; text: string}[];
  structuredContent: {result: GuidancePage | GuidanceRead; error?: {code: string}};
}

describe('guidance over real stdio', function () {
  this.timeout(30_000);
  let client: McpE2EClient;

  before(async () => {
    client = new McpE2EClient({args: ['--tools', 'skills_read', '--docs-topics', 'script-api']});
    await client.start();
  });

  after(async () => client.stop());

  async function call(args: Record<string, unknown>): Promise<GuidanceToolResult> {
    return (await client.call('tools/call', {name: 'skills_read', arguments: args})) as GuidanceToolResult;
  }

  it('keeps MCP resources available without skills_read and excludes shared collections', async () => {
    const restricted = new McpE2EClient({args: ['--tools', 'config_inspect']});
    await restricted.start();
    try {
      const {tools} = (await restricted.call('tools/list')) as {tools: {name: string}[]};
      expect(tools.map((tool) => tool.name)).to.deep.equal(['config_inspect']);
      const {resources} = (await restricted.call('resources/list')) as {resources: {uri: string}[]};
      expect(resources.map((resource) => resource.uri)).to.include.members([
        'skill://index',
        'skill://mcp/server/SKILL.md',
        'skill://mcp/b2c-config/SKILL.md',
        'skill://mcp/debugger/SKILL.md',
      ]);
      for (const resource of resources) {
        const {contents} = (await restricted.call('resources/read', {uri: resource.uri})) as {
          contents: {text: string}[];
        };
        expect(contents[0].text.length).to.be.greaterThan(0);
        if (resource.uri === 'skill://index') {
          const links = [...contents[0].text.matchAll(/\]\((skill:\/\/[^)]+)\)/g)];
          expect(links.length).to.be.greaterThan(0);
          expect(links.every(([, uri]) => uri.startsWith('skill://mcp/'))).to.equal(true);
        }
      }
      const templates = (await restricted.call('resources/templates/list')) as {resourceTemplates: unknown[]};
      expect(templates.resourceTemplates).to.have.length(1);
      for (const id of ['b2c-cli/b2c-code', 'b2c/b2c-onboarding', 'storefront-next/sfnext-configuration']) {
        const response = await restricted.request(id, 'resources/read', {uri: `skill://${id}/SKILL.md`});
        expect(response.error, id).to.exist;
      }
    } finally {
      await restricted.stop();
    }
  });

  it('advertises one concise read-only tool with title and an object-root output schema', async () => {
    const {tools} = (await client.call('tools/list')) as {
      tools: {
        name: string;
        title: string;
        description: string;
        inputSchema: {properties: Record<string, {description: string}>};
        outputSchema: {type: string};
        annotations: {readOnlyHint: boolean; openWorldHint: boolean};
      }[];
    };
    expect(tools.map((tool) => tool.name)).to.deep.equal(['skills_read']);
    expect(tools[0].title).to.equal('Read B2C Skills');
    expect(tools[0].annotations).to.include({readOnlyHint: true, openWorldHint: false});
    expect(tools[0].outputSchema.type).to.equal('object');
    expect(Buffer.byteLength(tools[0].description)).to.be.at.most(240);
    for (const property of Object.values(tools[0].inputSchema.properties))
      expect(Buffer.byteLength(property.description)).to.be.at.most(80);
  });

  it('paginates the complete catalog without docs-topic restrictions or duplicate entries', async () => {
    const ids: string[] = [];
    let offset: number | undefined = 0;
    let total = 0;
    while (offset !== undefined) {
      const response = await call({offset});
      expect(response.isError).not.to.equal(true);
      expect(Buffer.byteLength(JSON.stringify(response))).to.be.lessThan(16 * 1024);
      expect(JSON.parse(response.content[0].text)).to.deep.equal(response.structuredContent);
      const page = response.structuredContent.result as GuidancePage;
      total = page.total;
      ids.push(...page.entries.map((entry) => entry.id));
      offset = page.nextOffset;
    }
    expect(ids.length).to.equal(total);
    expect(new Set(ids).size).to.equal(total);
    expect(new Set(ids.map((id) => id.split('/')[0]))).to.deep.equal(
      new Set(['b2c', 'b2c-cli', 'mcp', 'storefront-next']),
    );
    expect(ids).to.include('mcp/server');
  });

  it('reads published MCP skills identically through resources and tools', async () => {
    for (const id of ['mcp/server', 'mcp/debugger', 'mcp/b2c-config', 'b2c-cli/b2c-code']) {
      const response = await call({id});
      const initial = response.structuredContent.result as GuidanceRead;
      expect(initial.uri).to.equal(`skill://${id}/SKILL.md`);
      const native = (await client.call('resources/read', {uri: initial.uri})) as {contents: {text: string}[]};
      expect(response.isError).not.to.equal(true);
      expect(JSON.parse(response.content[0].text)).to.deep.equal(response.structuredContent);
      expect(initial.content).to.equal(native.contents[0].text);
      expect(initial.totalLength).to.equal(initial.content.length);
      const page = (await call({id, maxLength: 100})).structuredContent.result as GuidanceRead;
      expect(page).to.include({totalLength: initial.content.length, offset: 0, nextOffset: 100, truncated: true});
      const rest = (await call({id, offset: page.nextOffset})).structuredContent.result as GuidanceRead;
      expect(page.content + rest.content).to.equal(initial.content);
      expect(rest).not.to.have.any.keys('truncated', 'nextOffset');
      expect(initial).not.to.have.any.keys('hash', 'complete', 'nextCursor');
      const section = initial.sections[0].id;
      const selected = await call({id, section});
      expect((selected.structuredContent.result as GuidanceRead).content).to.match(/^#/);
      if (initial.references.length > 0) {
        const ref = await call({id, file: initial.references[0]});
        const refRead = ref.structuredContent.result as GuidanceRead;
        const resource = (await client.call('resources/read', {uri: refRead.uri})) as {contents: {text: string}[]};
        expect(resource.contents[0].text).to.equal(refRead.content);
      }
    }
    const templates = (await client.call('resources/templates/list')) as {resourceTemplates: {uriTemplate: string}[]};
    expect(templates.resourceTemplates[0].uriTemplate).to.equal('skill://{collection}/{entry}/{+path}');
  });

  it('returns structured errors without success-schema rejection and rejects raw resource traversal', async () => {
    const response = await call({id: 'mcp/unknown'});
    expect(response.isError).to.equal(true);
    expect(response.structuredContent.error?.code).to.equal('NOT_FOUND');
    for (const suffix of ['../server/SKILL.md', '%2e%2e/server/SKILL.md', 'SKILL.md?x=1']) {
      const result = await client.request(`invalid-${suffix}`, 'resources/read', {
        uri: `skill://mcp/server/${suffix}`,
      });
      expect(result.error, suffix).to.exist;
    }
    for (const uri of [
      'skill://mcp/../mcp/debugger/SKILL.md',
      'skill://mcp/%64ebugger/SKILL.md',
      'skill://mcp/debugger/SKILL.md?x=1',
    ]) {
      const result = await client.request(`invalid-${uri}`, 'resources/read', {uri});
      expect(result.error, uri).to.exist;
    }
    const conflicting = await call({id: 'mcp/server', query: 'deploy'});
    expect(conflicting.structuredContent.error?.code).to.equal('INVALID_REQUEST');
  });

  it('advertises an index and featured skills while the index discovers every skill URI', async () => {
    const listed = (await client.call('resources/list')) as {
      resources: {name: string; uri: string; description: string}[];
    };
    expect(listed.resources.map((resource) => resource.name).sort()).to.deep.equal([
      'mcp/b2c-config',
      'mcp/debugger',
      'mcp/server',
      'skill-index',
    ]);
    for (const resource of listed.resources) {
      expect(resource.uri).to.equal(
        resource.name === 'skill-index' ? 'skill://index' : `skill://${resource.name}/SKILL.md`,
      );
      expect(resource.description.length).to.be.within(1, 200);
    }
    expect(Buffer.byteLength(JSON.stringify(listed))).to.be.lessThan(2000);
    const index = (await client.call('resources/read', {uri: 'skill://index'})) as {contents: {text: string}[]};
    expect(Buffer.byteLength(index.contents[0].text)).to.be.lessThan(16 * 1024);
    const links = [...index.contents[0].text.matchAll(/\[([^\]]+)\]\((skill:\/\/[^)]+)\)/g)];
    const directory = (await call({})).structuredContent.result as GuidancePage;
    expect(links.length).to.equal(directory.total);
    expect(new Set(links.map(([, id]) => id)).size).to.equal(directory.total);
    expect(index.contents[0].text).not.to.include('mcp/pwa-kit');
    for (const [, id, uri] of links) {
      const response = await call({uri});
      expect(response.isError).not.to.equal(true);
      const read = response.structuredContent.result as GuidanceRead;
      expect(read.id).to.equal(id);
      expect(read.uri).to.equal(uri);
      const native = (await client.call('resources/read', {uri})) as {contents: {text: string}[]};
      expect(native.contents[0].text.startsWith(read.content)).to.equal(true);
    }
  });

  it('finds deploy workflows with a lean default search', async () => {
    const response = await call({query: 'deploy cartridges'});
    const page = response.structuredContent.result as GuidancePage;
    expect(page.kind).to.equal('search');
    expect(page.entries.length).to.be.at.most(5);
    expect(page.entries.map((entry) => entry.id)).to.include('b2c-cli/b2c-code');
  });
});
