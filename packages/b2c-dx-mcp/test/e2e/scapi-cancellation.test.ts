/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {spy} from 'sinon';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import {Client, type ClientOptions} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';

const runJs = process.env.B2C_MCP_TEST_RUN_JS ?? fileURLToPath(new URL('../../bin/run.js', import.meta.url));

async function until(check: () => Promise<boolean>): Promise<void> {
  const deadline = Date.now() + 5000;
  /* eslint-disable no-await-in-loop -- Poll process lifecycle sequentially. */
  while (!(await check())) {
    if (Date.now() >= deadline) throw new Error('Timed out waiting for execution lifecycle');
    await delay(25);
  }
  /* eslint-enable no-await-in-loop */
}

for (const mode of ['legacy', '2026-07-28'] as const) {
  describe(`SCAPI cancellation over ${mode} stdio`, function () {
    this.timeout(30_000);

    it('kills the running program and keeps the server usable', async () => {
      const directory = await mkdtemp(join(tmpdir(), 'scapi-cancel-'));
      const marker = join(directory, 'started');
      const versionNegotiation: ClientOptions['versionNegotiation'] =
        mode === 'legacy' ? {mode: 'legacy'} : {mode: {pin: mode}};
      const client = new Client({name: 'scapi-cancel-test', version: '1'}, {versionNegotiation});
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [runJs, '--tools', 'scapi_search'],
        env: {SFCC_DISABLE_TELEMETRY: 'true'},
        stderr: 'pipe',
      });
      const controller = new AbortController();
      const sent = spy(transport, 'send');
      let pid: number | undefined;
      try {
        await client.connect(transport);
        const running = client
          .callTool(
            {
              name: 'scapi_search',
              arguments: {
                skillRead: true,
                api: 'product/products/v1',
                code: `async () => {
              const fs = await import('node:fs');
              fs.writeFileSync(${JSON.stringify(marker)}, String(process.pid));
              while (true) {}
            }`,
              },
            },
            {signal: controller.signal},
          )
          .catch((error: unknown) => error);
        await until(async () => {
          try {
            pid = Number(await readFile(marker, 'utf8'));
            return true;
          } catch {
            return false;
          }
        });
        const call = sent.getCalls().find(({args}) => 'method' in args[0] && args[0].method === 'tools/call')?.args[0];
        expect(call).to.have.property('id', mode === 'legacy' ? 1 : 0);
        controller.abort();
        await running;
        // Client promise rejection alone does not prove the server stopped execution.
        await until(async () => {
          try {
            process.kill(pid!, 0);
            return false;
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ESRCH') return true;
            throw error;
          }
        });
        const result = await client.callTool({
          name: 'scapi_search',
          arguments: {skillRead: true, code: 'async () => 42'},
        });
        expect(result.isError).not.to.equal(true);
        expect(result.content).to.deep.equal([{type: 'text', text: '{"result":42}'}]);
      } finally {
        controller.abort();
        if (pid) {
          try {
            process.kill(pid, 'SIGKILL');
          } catch {
            /* Already stopped. */
          }
        }
        await client.close();
        await rm(directory, {recursive: true, force: true});
      }
    });
  });
}
