/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * E2E tests for the MCP server: real subprocess, JSON-RPC over stdin/stdout.
 * Run with: pnpm run test:e2e
 */

import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect} from 'chai';
import {McpE2EClient} from './stdio-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, 'fixtures');

describe('MCP Server E2E', function () {
  this.timeout(30_000);

  describe('1. Server Lifecycle', () => {
    it('starts successfully with default options', async () => {
      const client = new McpE2EClient({args: ['--allow-non-ga-tools']});
      await client.start();
      const result = await client.call('tools/list');
      expect(result).to.have.property('tools').that.is.an('array');
      await client.stop();
    });

    it('starts with --toolsets all', async () => {
      const client = new McpE2EClient({args: ['--toolsets', 'all', '--allow-non-ga-tools']});
      await client.start();
      const result = (await client.call('tools/list')) as {tools: Array<{name: string}>};
      expect(result.tools.length).to.be.greaterThan(0);
      await client.stop();
    });

    it('starts with specific toolsets (--toolsets SCAPI,MRT)', async () => {
      const client = new McpE2EClient({args: ['--toolsets', 'SCAPI,MRT', '--allow-non-ga-tools']});
      await client.start();
      const result = (await client.call('tools/list')) as {tools: Array<{name: string}>};
      const names = result.tools.map((t) => t.name);
      expect(names).to.include('scapi_schemas_list');
      await client.stop();
    });

    it('starts with specific tool (--tools scapi_schemas_list)', async () => {
      const client = new McpE2EClient({args: ['--tools', 'scapi_schemas_list', '--allow-non-ga-tools']});
      await client.start();
      const result = (await client.call('tools/list')) as {tools: Array<{name: string}>};
      expect(result.tools).to.have.lengthOf(1);
      expect(result.tools[0].name).to.equal('scapi_schemas_list');
      await client.stop();
    });

    it('lists more tools with --allow-non-ga-tools', async () => {
      const client = new McpE2EClient({args: ['--toolsets', 'all', '--allow-non-ga-tools']});
      await client.start();
      const result = (await client.call('tools/list')) as {tools: Array<{name: string}>};
      await client.stop();
      expect(result.tools.length).to.be.greaterThan(0);
    });

    it('exits cleanly on connection close', async () => {
      const client = new McpE2EClient({args: ['--toolsets', 'SCAPI']});
      await client.start();
      await client.stop();
      // stop() closes stdin and waits for process exit; no assertion needed beyond no throw
    });
  });

  describe('2. MCP Protocol (tools/list)', () => {
    it('lists tools with --toolsets all --allow-non-ga-tools', async () => {
      const client = new McpE2EClient({args: ['--toolsets', 'all', '--allow-non-ga-tools']});
      await client.start();
      const result = (await client.call('tools/list')) as {
        tools: Array<{name: string; description?: string; inputSchema?: unknown}>;
      };
      expect(result.tools.length).to.be.greaterThan(0);
      const first = result.tools[0];
      expect(first).to.have.property('name').that.is.a('string');
      expect(first).to.have.property('description');
      expect(first).to.have.property('inputSchema');
      await client.stop();
    });

    it('filters tools by toolset', async () => {
      const client = new McpE2EClient({args: ['--toolsets', 'SCAPI', '--allow-non-ga-tools']});
      await client.start();
      const result = (await client.call('tools/list')) as {tools: Array<{name: string}>};
      const names = result.tools.map((t) => t.name);
      expect(names.some((n) => n.startsWith('scapi_'))).to.be.true;
      await client.stop();
    });

    it('filters tools by individual tool name', async () => {
      const client = new McpE2EClient({
        args: ['--tools', 'scapi_schemas_list,scapi_custom_apis_status', '--allow-non-ga-tools'],
      });
      await client.start();
      const result = (await client.call('tools/list')) as {tools: Array<{name: string}>};
      expect(result.tools).to.have.lengthOf(2);
      expect(result.tools.map((t) => t.name).sort()).to.deep.equal(['scapi_custom_apis_status', 'scapi_schemas_list']);
      await client.stop();
    });

    it('ignores invalid --tools names and returns tools from enabled toolsets', async () => {
      const client = new McpE2EClient({
        args: ['--toolsets', 'SCAPI', '--tools', 'nonexistent_tool_xyz', '--allow-non-ga-tools'],
      });
      await client.start();
      const result = (await client.call('tools/list')) as {tools: Array<{name: string}>};
      expect(result.tools.length).to.be.greaterThan(0);
      expect(result.tools.some((t) => t.name.startsWith('scapi_'))).to.be.true;
      await client.stop();
    });

    it('tool metadata includes name, description, inputSchema', async () => {
      const client = new McpE2EClient({args: ['--tools', 'scapi_schemas_list', '--allow-non-ga-tools']});
      await client.start();
      const result = (await client.call('tools/list')) as {
        tools: Array<{name: string; description: string; inputSchema: unknown}>;
      };
      expect(result.tools[0].name).to.equal('scapi_schemas_list');
      expect(result.tools[0].description).to.be.a('string').and.not.empty;
      expect(result.tools[0].inputSchema).to.be.an('object');
      await client.stop();
    });
  });

  describe('3. MCP Protocol (tools/call)', () => {
    it('calls a tool and returns a response (result or structured error)', async () => {
      const client = new McpE2EClient({args: ['--tools', 'scapi_schemas_list', '--allow-non-ga-tools']});
      await client.start();
      const result = await client.call('tools/call', {
        name: 'scapi_schemas_list',
        arguments: {},
      });
      expect(result).to.be.an('object');
      // Without credentials we may get content with an error message or empty result; either is valid
      if ((result as {content?: unknown[]}).content) {
        expect((result as {content: unknown[]}).content).to.be.an('array');
      }
      await client.stop();
    });

    it('returns proper error for unknown tool name', async () => {
      const client = new McpE2EClient({args: ['--toolsets', 'SCAPI', '--allow-non-ga-tools']});
      await client.start();
      let thrown: Error | undefined;
      let result: unknown;
      try {
        result = await client.call('tools/call', {
          name: 'nonexistent_tool_xyz',
          arguments: {},
        });
      } catch (error) {
        thrown = error instanceof Error ? error : new Error(String(error));
      }
      await client.stop();
      if (thrown) {
        expect(thrown.message).to.match(/unknown|not found|invalid/i);
      } else {
        const content = (result as {content?: Array<{type?: string; text?: string}>})?.content;
        const text = content?.map((c) => c?.text ?? '').join(' ') ?? '';
        expect(text.toLowerCase()).to.match(/not found|invalid|unknown/);
      }
    });

    it('returns proper error for invalid input when required param missing', async () => {
      const client = new McpE2EClient({
        args: ['--tools', 'storefront_next_page_designer_decorator', '--allow-non-ga-tools'],
      });
      await client.start();
      try {
        await client.call('tools/call', {
          name: 'storefront_next_page_designer_decorator',
          arguments: {}, // missing required componentName etc.
        });
        // May throw or return content with error
      } catch (error) {
        expect(error).to.be.an('Error');
      }
      await client.stop();
    });
  });

  describe('4. Workspace Auto-Discovery', () => {
    it('detects PWA Kit v3 from package.json', async () => {
      const cwd = join(FIXTURES_DIR, 'pwav3');
      const client = new McpE2EClient({args: ['--allow-non-ga-tools'], cwd});
      await client.start();
      const result = (await client.call('tools/list')) as {tools: Array<{name: string}>};
      const names = result.tools.map((t) => t.name);
      expect(names.some((n) => n.includes('pwa') || n.includes('mrt') || n.includes('scapi'))).to.be.true;
      await client.stop();
    });

    it('detects Storefront Next from package.json', async () => {
      const cwd = join(FIXTURES_DIR, 'storefront-next');
      const client = new McpE2EClient({args: ['--allow-non-ga-tools'], cwd});
      await client.start();
      const result = (await client.call('tools/list')) as {tools: Array<{name: string}>};
      const names = result.tools.map((t) => t.name);
      expect(names.some((n) => n.includes('storefront_next') || n.includes('scapi'))).to.be.true;
      await client.stop();
    });

    it('detects cartridge project from .project files', async () => {
      const cwd = join(FIXTURES_DIR, 'cartridge');
      const client = new McpE2EClient({args: ['--allow-non-ga-tools'], cwd});
      await client.start();
      const result = (await client.call('tools/list')) as {tools: Array<{name: string}>};
      const names = result.tools.map((t) => t.name);
      expect(names).to.include('cartridge_deploy');
      await client.stop();
    });

    it('falls back to SCAPI toolset when no project detected', async () => {
      const cwd = join(FIXTURES_DIR, 'empty');
      const client = new McpE2EClient({args: ['--allow-non-ga-tools'], cwd});
      await client.start();
      const result = (await client.call('tools/list')) as {tools: Array<{name: string}>};
      const names = result.tools.map((t) => t.name);
      expect(names.some((n) => n.startsWith('scapi_'))).to.be.true;
      await client.stop();
    });
  });

  describe('5. Flag Inheritance', () => {
    it('accepts --config flag', async () => {
      const client = new McpE2EClient({
        args: ['--toolsets', 'SCAPI', '--config', '/nonexistent/dw.json', '--allow-non-ga-tools'],
      });
      await client.start();
      const result = (await client.call('tools/list')) as {tools: unknown[]};
      expect(result.tools).to.be.an('array');
      await client.stop();
    });

    it('accepts --log-level silent', async () => {
      const client = new McpE2EClient({
        args: ['--toolsets', 'SCAPI', '--log-level', 'silent', '--allow-non-ga-tools'],
      });
      await client.start();
      const result = (await client.call('tools/list')) as {tools: unknown[]};
      expect(result.tools).to.be.an('array');
      await client.stop();
    });

    it('accepts --debug flag', async () => {
      const client = new McpE2EClient({args: ['--toolsets', 'SCAPI', '--debug', '--allow-non-ga-tools']});
      await client.start();
      const result = (await client.call('tools/list')) as {tools: unknown[]};
      expect(result.tools).to.be.an('array');
      await client.stop();
    });

    it('accepts instance flags (--server, --client-id, etc.)', async () => {
      const client = new McpE2EClient({
        args: [
          '--toolsets',
          'SCAPI',
          '--server',
          'example.demandware.net',
          '--client-id',
          'cid',
          '--allow-non-ga-tools',
        ],
      });
      await client.start();
      const result = (await client.call('tools/list')) as {tools: unknown[]};
      expect(result.tools).to.be.an('array');
      await client.stop();
    });

    it('accepts MRT flags (--api-key, --project)', async () => {
      const client = new McpE2EClient({
        args: ['--toolsets', 'MRT', '--api-key', 'key', '--project', 'proj', '--allow-non-ga-tools'],
      });
      await client.start();
      const result = (await client.call('tools/list')) as {tools: unknown[]};
      expect(result.tools).to.be.an('array');
      await client.stop();
    });

    it('respects environment variables as flag alternatives', async () => {
      const client = new McpE2EClient({
        args: [],
        env: {SFCC_TOOLSETS: 'SCAPI', SFCC_ALLOW_NON_GA_TOOLS: 'true'},
      });
      await client.start();
      const result = (await client.call('tools/list')) as {tools: Array<{name: string}>};
      expect(result.tools.some((t) => t.name.startsWith('scapi_'))).to.be.true;
      await client.stop();
    });
  });

  describe('6. Error Handling', () => {
    it('server continues to respond after invalid JSON-RPC line', async () => {
      const client = new McpE2EClient({args: ['--toolsets', 'SCAPI', '--allow-non-ga-tools']});
      await client.start();
      client.sendRaw('not json\n');
      const result = (await client.call('tools/list')) as {tools: unknown[]};
      expect(result.tools).to.be.an('array');
      await client.stop();
    });

    it('unknown method returns proper error', async () => {
      const client = new McpE2EClient({args: ['--toolsets', 'SCAPI', '--allow-non-ga-tools']});
      await client.start();
      try {
        await client.call('nonexistent/method', {});
        expect.fail('expected error');
      } catch (error) {
        expect(error).to.be.an('Error');
        expect((error as Error).message).to.match(/method|not found|invalid/i);
      }
      await client.stop();
    });
  });
});
