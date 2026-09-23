/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';

const runJs = process.env.B2C_MCP_TEST_RUN_JS ?? fileURLToPath(new URL('../../bin/run.js', import.meta.url));
function json(result: {content: unknown[]}) {
  return JSON.parse((result.content[0] as {text: string}).text);
}

for (const mode of ['legacy', '2026-07-28'] as const) {
  describe(`SCAPI elicitation over ${mode} stdio`, function () {
    this.timeout(30_000);
    let directory: string;
    let client: Client;
    let transport: StdioClientTransport;

    beforeEach(async () => {
      directory = mkdtempSync(join(tmpdir(), 'scapi-approval-stdio-'));
      writeFileSync(
        join(directory, 'dw.json'),
        JSON.stringify({shortCode: 'test', tenantId: 'test_001', safety: {level: 'READ_ONLY', confirm: true}}),
      );
      const networkGuard = join(directory, 'network-guard.mjs');
      writeFileSync(
        networkGuard,
        'globalThis.fetch = async () => { throw new Error("SCAPI_TEST_NETWORK_DISABLED"); };',
      );
      client = new Client(
        {name: 'scapi-approval-test', version: '1'},
        {
          versionNegotiation: mode === 'legacy' ? {mode: 'legacy'} : {mode: {pin: mode}},
          capabilities: {elicitation: {form: {}}},
        },
      );
      transport = new StdioClientTransport({
        command: process.execPath,
        args: ['--import', networkGuard, runJs, '--tools', 'scapi_execute', '--project-directory', directory],
        cwd: directory,
        env: {
          SFCC_DISABLE_TELEMETRY: 'true',
          B2C_SKIP_PLUGIN_HOOKS: '1',
          B2C_CONFIG_DIR: directory,
          SFCC_CLIENT_ID: 'fixture-client',
          SFCC_CLIENT_SECRET: 'fixture-secret',
          SFCC_SHORTCODE: 'test',
          SFCC_TENANT_ID: 'test_001',
        },
        stderr: 'pipe',
      });
    });

    afterEach(async () => {
      await client.close();
      rmSync(directory, {recursive: true, force: true});
    });

    it('uses native elicitation twice while retaining the original program variables', async () => {
      const nonces: string[] = [];
      client.setRequestHandler('elicitation/create', async (request) => {
        const body = /Body: (.*)\n/.exec(request.params.message)!;
        nonces.push(JSON.parse(body[1]).id);
        return {action: 'accept', content: {approve: true}};
      });
      await client.connect(transport);
      // Network access deliberately fails after approval; no live API is contacted.
      const result = await client.callTool({
        name: 'scapi_execute',
        arguments: {
          skillRead: true,
          code: `async () => {
        const nonce = Math.random().toString(36);
        const request = () => scapi.request({method:'PUT',path:'/product/products/v1/organizations/{organizationId}/products/test',body:{id:nonce}}).catch(error => error.message);
        const first = await request(); const second = await request();
        return {nonce, first, second};
      }`,
        },
      });
      expect(result.isError).not.to.equal(true);
      const data = json(result);
      expect(nonces).to.have.length(2);
      expect(nonces).to.deep.equal([data.result.nonce, data.result.nonce]);
      expect(data.result.first).to.include('SCAPI_TEST_NETWORK_DISABLED');
      expect(data.result.second).to.include('SCAPI_TEST_NETWORK_DISABLED');
    });

    it('terminates on declined elicitation even when the program catches request errors', async () => {
      client.setRequestHandler('elicitation/create', async () => ({action: 'decline'}));
      await client.connect(transport);
      const result = await client.callTool({
        name: 'scapi_execute',
        arguments: {
          skillRead: true,
          code: `async () => {
        try { await scapi.request({method:'DELETE',path:'/product/products/v1/organizations/{organizationId}/products/test'}); } catch {}
        return 'must not succeed';
      }`,
        },
      });
      expect(result.isError).to.equal(true);
      expect(json(result).error).to.include('SCAPI_APPROVAL_DECLINED');
    });

    it('accepts explicit cancellation while an elicitation is outstanding', async () => {
      client.setRequestHandler('elicitation/create', async (request) => {
        const executionId = /Execution: ([\da-f-]+)\./.exec(request.params.message)![1];
        const cancelled = await client.callTool({
          name: 'scapi_execute',
          arguments: {action: 'cancel', executionId, skillRead: true},
        });
        expect(json(cancelled).status).to.equal('cancelled');
        return {action: 'accept', content: {approve: true}};
      });
      await client.connect(transport);
      const result = await client.callTool({
        name: 'scapi_execute',
        arguments: {
          skillRead: true,
          code: `async () => scapi.request({method:'DELETE',path:'/product/products/v1/organizations/{organizationId}/products/test'})`,
        },
      });
      expect(json(result).error).to.include('SCAPI_EXECUTION_CANCELLED');
    });
  });
}
