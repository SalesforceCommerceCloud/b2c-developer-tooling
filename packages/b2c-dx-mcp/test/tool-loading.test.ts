/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Client, InMemoryTransport} from '@modelcontextprotocol/client';
import {expect} from 'chai';
import {SERVER_INSTRUCTIONS} from '../src/commands/mcp.js';
import {registerToolsets} from '../src/registry.js';
import {B2CDxMcpServer} from '../src/server.js';
import {Services} from '../src/services.js';
import {ALWAYS_LOAD_META_KEY} from '../src/utils/index.js';
import {rankClaudeCode, rankCodex} from './tool-search-models.js';
import {createMockResolvedConfig} from './test-helpers.js';

/** Codex hides plugin-provided MCP tools past these model-spec budgets. */
const CODEX_PLUGIN_TOOL_BYTES = 8000;
const CODEX_PLUGIN_TOTAL_BYTES = 64_000;

const ALWAYS_LOADED = ['config_inspect', 'docs_search', 'project_inspect', 'scapi_search', 'skills_read'];

/** Codex keeps the top 8 tool search results and Claude Code the top 5; require a margin under both. */
const CODEX_TOP = 5;
const CLAUDE_CODE_TOP = 3;
const SERVER_NAME = 'b2c-dx-mcp';

/** Task phrasings an assistant might pass to client tool search, and the tool it should find. */
const SEARCH_CASES: Array<[query: string, tool: string]> = [
  ['deploy my cartridge to the sandbox', 'cartridge_deploy'],
  ['upload code to instance', 'cartridge_deploy'],
  ['why is checkout failing errors in logs', 'logs_get_recent'],
  ['show recent exceptions on sandbox', 'logs_get_recent'],
  ['tail the server error log', 'logs_watch'],
  ['which log files exist', 'logs_list_files'],
  ['set a breakpoint in my controller', 'debug_set_breakpoints'],
  ['debug script on instance', 'debug_start_session'],
  ['inspect variables at breakpoint', 'debug_inspect'],
  ['download a file from webdav', 'webdav_get'],
  ['upload a file to impex', 'webdav_put'],
  ['import promotions xml site archive', 'site_archive_import'],
  ['add a discount rule to a promotion', 'site_archive_import'],
  ['list files in impex folder', 'webdav_list'],
  ['save site export zip locally', 'webdav_get_to_file'],
  ['validate my catalog xml against schema', 'validate_xml_schema'],
  ['xml schema for price books', 'docs_schema_search'],
  ['sales revenue report last week', 'cip_query'],
  ['top selling products analytics', 'cip_query'],
  ['managed runtime logs for pwa kit storefront', 'mrt_logs_watch'],
  ['storefront next server logs', 'mrt_logs_watch'],
  ['api response time latency metrics', 'metrics_get'],
  ['what middleware runs for Cart-AddProduct', 'project_inspect'],
  ['which cartridge registers this hook', 'project_inspect'],
  ['check my cartridges for security issues', 'security_scan'],
  ['find csrf problems in my controllers', 'security_scan'],
  ['custom attributes on product object type', 'object_types_describe'],
  ['enum values of a system object attribute', 'object_types_describe'],
  ['get product by id via shopper api', 'scapi_execute'],
  ['update order status', 'scapi_execute'],
  ['create a customer', 'scapi_execute'],
  ['is my custom api registered', 'scapi_custom_apis_get_status'],
  ['list available scapi apis', 'scapi_schemas_list'],
  ['script api class reference', 'docs_read'],
  ['api error rate over the last day', 'metrics_get'],
  ['xsd for site import', 'docs_schema_search'],
  ['what is the xml format for promotions import', 'docs_schema_read'],
  ['list available xsd schemas', 'docs_schema_list'],
  ['list all documentation topics', 'docs_list'],
  ['list active debugger sessions', 'debug_list_sessions'],
  ['stop debugging and disconnect', 'debug_end_session'],
  ['wait until the debugger hits the breakpoint', 'debug_wait_for_stop'],
  ['evaluate an expression in the debugger', 'debug_evaluate'],
  ['step over to the next line', 'debug_control'],
  ['debug why the cart total is wrong', 'debug_capture_at_breakpoint'],
  ['read new lines from my log watch', 'logs_watch_poll'],
  ['read new lines from the mrt log watch', 'mrt_logs_watch_poll'],
  ['save this api call as a snippet', 'scapi_snippet_save'],
  ['which analytics reports are available', 'cip_discover'],
];

async function listTools() {
  const services = new Services({resolvedConfig: createMockResolvedConfig()});
  const server = new B2CDxMcpServer({name: 'tool-loading', version: '1'});
  await registerToolsets({toolsets: ['ALL']}, server, () => services);
  const client = new Client({name: 'tool-loading-test', version: '1'});
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    return {...(await client.listTools()), instructions: SERVER_INSTRUCTIONS};
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

  it('ranks the right tool near the top of Codex and Claude Code tool search', async () => {
    const {tools, instructions} = await listTools();
    const misses = SEARCH_CASES.flatMap(([query, tool]) => {
      const codex = rankCodex(tools, query, SERVER_NAME, instructions).indexOf(tool) + 1;
      const claudeCode = rankClaudeCode(tools, query, SERVER_NAME).indexOf(tool) + 1;
      const failures = [];
      if (codex < 1 || codex > CODEX_TOP) failures.push(`Codex ranked ${tool} ${codex} for "${query}"`);
      if (claudeCode < 1 || claudeCode > CLAUDE_CODE_TOP)
        failures.push(`Claude Code ranked ${tool} ${claudeCode} for "${query}"`);
      return failures;
    });
    expect(misses).to.deep.equal([]);
  });

  it('has a search case for every tool that is not loaded upfront', async () => {
    const {tools} = await listTools();
    const covered = new Set(SEARCH_CASES.map(([, tool]) => tool));
    const uncovered = tools
      .map((tool) => tool.name)
      .filter((name) => !ALWAYS_LOADED.includes(name) && !covered.has(name));
    expect(uncovered).to.deep.equal([]);
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
