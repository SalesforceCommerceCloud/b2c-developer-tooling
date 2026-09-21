/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {spy, type SinonSpy} from 'sinon';
import {fileURLToPath} from 'node:url';
import {Client, type ClientOptions} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';

const runJs = fileURLToPath(new URL('../../bin/run.js', import.meta.url));
const skillUri = 'skill://mcp/debugger/SKILL.md';

const modes: {name: string; negotiation: ClientOptions['versionNegotiation']; era: string}[] = [
  {name: 'legacy', negotiation: {mode: 'legacy'}, era: 'legacy'},
  {name: '2026-07-28', negotiation: {mode: {pin: '2026-07-28'}}, era: 'modern'},
  {name: 'automatic negotiation', negotiation: {mode: 'auto'}, era: 'modern'},
];

for (const mode of modes) {
  describe(`SDK v2 stdio: ${mode.name}`, function () {
    this.timeout(30_000);
    let client: Client;
    let transport: StdioClientTransport;
    let stderr = '';
    let sent: SinonSpy<Parameters<StdioClientTransport['send']>, ReturnType<StdioClientTransport['send']>>;

    before(async () => {
      transport = new StdioClientTransport({
        command: process.execPath,
        args: [runJs, '--tools', 'skills_read,logs_watch', '--log-level', 'debug', '--jsonl'],
        env: {SFCC_DISABLE_TELEMETRY: 'true'},
        stderr: 'pipe',
      });
      transport.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      sent = spy(transport, 'send');
      client = new Client({name: 'b2c-v2-test', version: '1'}, {versionNegotiation: mode.negotiation});
      await client.connect(transport);
    });

    after(async () => client?.close());

    it('negotiates the intended protocol and preserves the selected catalog', async () => {
      expect(client.getProtocolEra()).to.equal(mode.era);
      const {tools} = await client.listTools();
      expect(tools.map(({name}) => name)).to.have.members(['skills_read', 'logs_watch']);
      expect(tools.every(({annotations}) => annotations?.readOnlyHint === true)).to.equal(true);
      expect(client.getServerVersion()?.name).to.equal('@salesforce/b2c-dx-mcp');
    });

    it('reads skills through resources, templates, and the tool with matching content', async () => {
      const {resources} = await client.listResources();
      expect(resources.map(({uri}) => uri)).to.include(skillUri);
      const {resourceTemplates} = await client.listResourceTemplates();
      expect(resourceTemplates[0].uriTemplate).to.equal('skill://{collection}/{entry}/{+path}');
      const resource = await client.readResource({uri: skillUri});
      const content = resource.contents[0];
      if (!('text' in content)) throw new Error('Expected Markdown skill content.');
      const read = await client.callTool({name: 'skills_read', arguments: {uri: skillUri}});
      expect(read.isError).not.to.equal(true);
      expect(read.structuredContent).to.have.nested.property('result.content', content.text);
      const reference = await client.readResource({uri: 'skill://b2c-cli/b2c-code/SKILL.md'});
      expect(reference.contents[0]).to.have.property('text').that.is.a('string').and.not.empty;
    });

    it('preserves tool errors and rejects resource traversal', async () => {
      const result = await client.callTool({name: 'skills_read', arguments: {id: 'mcp/missing'}});
      expect(result.isError).to.equal(true);
      expect(result.structuredContent).to.have.nested.property('error.code', 'NOT_FOUND');
      await Promise.all(
        ['skill://mcp/../mcp/debugger/SKILL.md', 'skill://mcp/%64ebugger/SKILL.md'].map(async (uri) => {
          let rejected = false;
          try {
            await client.readResource({uri});
          } catch {
            rejected = true;
          }
          expect(rejected, uri).to.equal(true);
        }),
      );
    });

    it('caches stable discovery/skills on the modern protocol but never tool calls', async () => {
      const requestCount = (method: string) =>
        sent.getCalls().filter(({args}) => 'method' in args[0] && args[0].method === method).length;
      await client.listTools(undefined, {cacheMode: 'refresh'});
      await client.readResource({uri: skillUri}, {cacheMode: 'refresh'});
      sent.resetHistory();
      await client.listTools();
      await client.readResource({uri: skillUri});
      expect(requestCount('tools/list')).to.equal(mode.era === 'modern' ? 0 : 1);
      expect(requestCount('resources/read')).to.equal(mode.era === 'modern' ? 0 : 1);
      for (let count = 0; count < 2; count++) {
        // eslint-disable-next-line no-await-in-loop -- Check a repeated call after its predecessor completes.
        const result = await client.callTool({name: 'logs_watch', arguments: {action: 'list'}});
        expect(result.isError).not.to.equal(true);
      }
      expect(requestCount('tools/call')).to.equal(2);
    });

    it('logs client identity and protocol once on stderr at debug level', async () => {
      await client.close();
      const connections = stderr
        .split('\n')
        .filter((line) => line.startsWith('{'))
        .map((line) => JSON.parse(line))
        .filter((entry) => entry.protocolEra);
      expect(connections).to.have.length(1);
      expect(connections[0]).to.include({
        level: 'debug',
        protocolEra: mode.era,
        clientName: 'b2c-v2-test',
        clientVersion: '1',
      });
      if (mode.era === 'modern') expect(connections[0].protocolVersion).to.equal('2026-07-28');
    });
  });
}

describe('SDK v2 restricted resources', function () {
  this.timeout(30_000);

  it('keeps MCP skills readable while excluding unselected broader collections', async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [runJs, '--tools', 'config_inspect'],
      env: {SFCC_DISABLE_TELEMETRY: 'true'},
      stderr: 'pipe',
    });
    const client = new Client(
      {name: 'b2c-restricted-test', version: '1'},
      {
        versionNegotiation: {mode: {pin: '2026-07-28'}},
      },
    );
    try {
      await client.connect(transport);
      expect((await client.listTools()).tools.map(({name}) => name)).to.deep.equal(['config_inspect']);
      expect((await client.readResource({uri: skillUri})).contents[0]).to.have.property('text');
      let rejected = false;
      try {
        await client.readResource({uri: 'skill://b2c-cli/b2c-code/SKILL.md'});
      } catch {
        rejected = true;
      }
      expect(rejected).to.equal(true);
    } finally {
      await client.close();
    }
  });
});
