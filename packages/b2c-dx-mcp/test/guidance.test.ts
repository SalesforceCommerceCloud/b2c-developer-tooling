/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join, dirname, resolve} from 'node:path';
import {Client, InMemoryTransport} from '@modelcontextprotocol/client';
import {expect} from 'chai';
import {GuidanceCatalog, type GuidanceManifest, type GuidanceRead} from '@salesforce/b2c-tooling-sdk/guidance';
import {z} from 'zod';
import {B2CDxMcpServer} from '../src/server.js';
import {createToolAdapter, jsonResult} from '../src/tools/adapter.js';
import {createGuidanceTool} from '../src/guidance.js';
import {Services} from '../src/services.js';
import {createMockResolvedConfig} from './test-helpers.js';
import {MCP_SKILL_REFERENCES} from '../src/skill-references.js';
import {toToolAnnotations} from '../src/utils/index.js';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageRoot, '../..');
const bundleRoot = join(packageRoot, 'content/guidance');

describe('guidance distribution and result contracts', () => {
  it('resolves every emitted skill reference to content in the MCP-only resource catalog', () => {
    const catalog = new GuidanceCatalog(bundleRoot, {collections: ['mcp']});
    for (const reference of Object.values(MCP_SKILL_REFERENCES)) {
      const result = catalog.read(reference) as GuidanceRead;
      expect(result.kind).to.equal('read');
      expect(result.content.trim().length).to.be.greaterThan(0);
      expect(catalog.readResource(reference.uri)).to.include(result.content);
    }
  });

  it('bundles every selected source entry and preserves exact authored Markdown', () => {
    const manifest = JSON.parse(readFileSync(join(bundleRoot, 'index.json'), 'utf8')) as GuidanceManifest;
    const catalog = new GuidanceCatalog(bundleRoot, {allowNonGa: true});
    expect(manifest.entries.map((entry) => entry.id)).not.to.include('mcp/pwa-kit');
    for (const collection of ['b2c', 'b2c-cli', 'storefront-next']) {
      const folders = readdirSync(join(repoRoot, 'skills', collection, 'skills'), {withFileTypes: true})
        .filter((entry) => entry.isDirectory())
        .map((entry) => `${collection}/${entry.name}`)
        .sort();
      expect(
        manifest.entries
          .filter((entry) => entry.collection === collection)
          .map((entry) => entry.id)
          .sort(),
      ).to.deep.equal(folders);
    }
    for (const entry of manifest.entries) {
      for (const file of entry.files) {
        const read = catalog.read({id: entry.id, file: file.path}) as GuidanceRead;
        expect(catalog.readResource(read.uri)).to.equal(read.content);
        const source = join(repoRoot, dirname(entry.source), file.path);
        expect(read.content, `${entry.id}/${file.path}`).to.equal(readFileSync(source, 'utf8'));
      }
    }
  });

  it('does not load configuration for guidance and rejects unexpected input', async () => {
    const tool = createGuidanceTool();
    const response = await tool.handler({id: 'mcp/server'});
    expect(response.isError).not.to.equal(true);
    expect(response.structuredContent).to.have.property('result');
    expect((await tool.handler({unexpected: true})).isError).to.equal(true);
  });

  it('returns section choices on a failed read without requiring the full skill', async () => {
    const tool = createGuidanceTool();
    const uri = 'skill://mcp/server/SKILL.md';
    const response = await tool.handler({uri, section: 'missing'});
    expect(response.isError).to.equal(true);
    const {error} = response.structuredContent as {error: {code: string; sections: {id: string}[]}};
    expect(error.code).to.equal('SECTION_NOT_FOUND');
    expect(error).not.to.have.any.keys('content', 'suggestions');
    expect(error.sections.length).to.be.greaterThan(0);
    expect(JSON.parse((response.content[0] as {text: string}).text)).to.deep.equal(response.structuredContent);
    const retry = await tool.handler({uri, section: error.sections[0].id});
    expect(retry.isError).not.to.equal(true);
    expect(z.object(tool.outputSchema!).safeParse(retry.structuredContent).success).to.equal(true);
  });

  it('keeps guidance directory-agnostic and filters the full catalog by collection', async () => {
    const tool = createGuidanceTool();
    expect(tool.inputSchema).not.to.have.property('projectDirectory');
    await Promise.all(
      ['b2c', 'b2c-cli', 'storefront-next', 'mcp'].map(async (collection) => {
        const response = await tool.handler({collection});
        expect(response.isError).not.to.equal(true);
        const page = (response.structuredContent as {result: {entries: {id: string}[]}}).result;
        expect(page.entries.length).to.be.greaterThan(0);
        expect(page.entries.every((entry) => entry.id.startsWith(`${collection}/`))).to.equal(true);
      }),
    );
    const response = await tool.handler({query: 'components', workspace: 'pwa-kit-v3'});
    expect(response.isError).not.to.equal(true);
  });

  it('validates the final enriched result and preserves payload plus resolution', async () => {
    const services = new Services({resolvedConfig: createMockResolvedConfig()});
    const tool = createToolAdapter(
      {
        name: 'contract_probe',
        title: 'Contract Probe',
        description: 'Read a project result.',
        effect: 'read',
        idempotent: true,
        openWorld: false,
        toolsets: ['DIAGNOSTICS'],
        inputSchema: {},
        usesProjectContext: true,
        outputSchema: {value: z.string(), resolution: z.object({project: z.unknown().optional()}).passthrough()},
        execute: async () => ({value: 'preserved'}),
        formatOutput: jsonResult,
      },
      () => services,
    );
    const server = new B2CDxMcpServer({name: 'contract', version: '1'});
    server.addTool(tool.name, tool.description, tool.inputSchema, tool.handler, {
      ...tool,
      annotations: toToolAnnotations(tool),
    });
    const client = new Client({name: 'contract-test', version: '1'});
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    try {
      const response = await client.callTool({name: tool.name, arguments: {}});
      expect(response.isError).not.to.equal(true);
      expect(response.structuredContent).to.include({value: 'preserved'});
      expect(response.structuredContent).to.have.property('resolution');
      const text = (response.content as {type: string; text: string}[])[0].text;
      expect(JSON.parse(text)).to.deep.equal(response.structuredContent);
      expect((await client.listTools()).tools[0]).to.include({title: 'Contract Probe'});
    } finally {
      await client.close();
      await server.close();
    }
  });
});
