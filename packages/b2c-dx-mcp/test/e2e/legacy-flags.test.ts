/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';

const runJs = fileURLToPath(new URL('../../bin/run.js', import.meta.url));

describe('Legacy startup flags', function () {
  this.timeout(30_000);

  it('accepts --allow-non-ga-tools without changing tools and warns only on stderr', async () => {
    const results = await Promise.all(
      [false, true].map(async (legacyFlag) => {
        const transport = new StdioClientTransport({
          command: process.execPath,
          args: [runJs, '--jsonl', ...(legacyFlag ? ['--allow-non-ga-tools'] : [])],
          env: {SFCC_DISABLE_TELEMETRY: 'true'},
          stderr: 'pipe',
        });
        let stderr = '';
        transport.stderr?.on('data', (chunk: Buffer) => {
          stderr += chunk.toString();
        });
        const client = new Client({name: 'b2c-legacy-flag-test', version: '1'});
        try {
          await client.connect(transport);
          const {tools} = await client.listTools();
          await client.close();
          const warnings = stderr
            .split('\n')
            .filter((line) => line.startsWith('{'))
            .map((line) => JSON.parse(line))
            .filter((entry) => entry.level === 'warn' && entry.msg?.includes('--allow-non-ga-tools'));
          expect(warnings).to.have.length(legacyFlag ? 1 : 0);
          return tools;
        } finally {
          await client.close();
        }
      }),
    );
    expect(results[0]).to.not.be.empty;
    expect(results[1]).to.deep.equal(results[0]);
  });
});
