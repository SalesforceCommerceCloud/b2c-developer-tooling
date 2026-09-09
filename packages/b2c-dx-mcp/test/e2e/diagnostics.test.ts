/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {readFileSync} from 'node:fs';
import {expect} from 'chai';
import {McpE2EClient} from './stdio-client.js';

describe('consolidated diagnostics over stdio', function () {
  this.timeout(30_000);
  let client: McpE2EClient;

  before(async () => {
    client = new McpE2EClient();
    await client.start();
  });

  after(async () => client.stop());

  it('publishes the compact catalog with exact names matching the human reference', async () => {
    const {tools} = (await client.call('tools/list')) as {tools: {name: string}[]};
    const names = tools.map((tool) => tool.name);
    expect(names.filter((name) => name.startsWith('debug_'))).to.have.length(9);
    expect(names.filter((name) => /^(mrt_)?logs_/.test(name))).to.have.length(6);
    const reference = readFileSync(new URL('../../../../docs/mcp/toolsets.md', import.meta.url), 'utf8');
    const documented = [...reference.matchAll(/^\| `([a-z_]+)`\s+\|/gm)].map((match) => match[1]);
    expect(names).to.have.members(documented);
  });

  for (const name of ['logs_watch', 'mrt_logs_watch']) {
    it(`${name} lists and cleans up through the published action schema`, async () => {
      const list = (await client.call('tools/call', {name, arguments: {action: 'list'}})) as {
        isError?: boolean;
        content: {text: string}[];
      };
      expect(list.isError).not.to.equal(true);
      expect(JSON.parse(list.content[0].text)).to.deep.equal({watches: []});
      const stop = (await client.call('tools/call', {
        name,
        arguments: {action: 'stop', watch_id: 'already-stopped'},
      })) as {isError?: boolean};
      expect(stop.isError).not.to.equal(true);
      const invalid = (await client.call('tools/call', {name, arguments: {action: 'stop'}})) as {isError?: boolean};
      expect(invalid.isError).to.equal(true);
    });
  }
});
