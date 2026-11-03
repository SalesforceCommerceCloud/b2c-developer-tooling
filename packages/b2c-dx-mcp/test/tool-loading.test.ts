/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Client, InMemoryTransport} from '@modelcontextprotocol/client';
import {expect} from 'chai';
import {registerToolsets} from '../src/registry.js';
import {B2CDxMcpServer} from '../src/server.js';
import {Services} from '../src/services.js';
import {ALWAYS_LOAD_META_KEY} from '../src/utils/index.js';
import {createMockResolvedConfig} from './test-helpers.js';

/** Codex hides plugin-provided MCP tools past these model-spec budgets. */
const CODEX_PLUGIN_TOOL_BYTES = 8000;
const CODEX_PLUGIN_TOTAL_BYTES = 64_000;

const ALWAYS_LOADED = ['config_inspect', 'docs_search', 'scapi_search', 'skills_read'];

async function listTools() {
  const services = new Services({resolvedConfig: createMockResolvedConfig()});
  const server = new B2CDxMcpServer({name: 'tool-loading', version: '1'});
  await registerToolsets({toolsets: ['ALL']}, server, () => services);
  const client = new Client({name: 'tool-loading-test', version: '1'});
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    return await client.listTools();
  } finally {
    await client.close();
    await server.close();
  }
}

describe('tool loading hints', () => {
  it('marks only the entry-point tools to load upfront', async () => {
    const {tools} = await listTools();
    const marked = tools.filter((tool) => tool._meta?.[ALWAYS_LOAD_META_KEY] === true).map((tool) => tool.name);
    expect(marked.sort()).to.deep.equal(ALWAYS_LOADED);
  });

  it('returns tools/list as one page', async () => {
    const result = await listTools();
    expect(result.nextCursor).to.equal(undefined);
  });

  it('omits JSON Schema noise from listed schemas', async () => {
    const {tools} = await listTools();
    const listed = JSON.stringify(tools);
    expect(listed).not.to.include('"$schema"');
    expect(listed).not.to.include(String(Number.MAX_SAFE_INTEGER));
  });

  it('stays within the Codex plugin tool budget', async () => {
    const {tools} = await listTools();
    let total = 0;
    for (const tool of tools) {
      const bytes = JSON.stringify({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      }).length;
      expect(bytes, tool.name).to.be.at.most(CODEX_PLUGIN_TOOL_BYTES);
      total += bytes;
    }
    expect(total).to.be.at.most(CODEX_PLUGIN_TOTAL_BYTES);
  });
});
