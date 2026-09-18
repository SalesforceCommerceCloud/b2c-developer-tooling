/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {http, HttpResponse} from 'msw';
import {setupServer} from 'msw/node';
import {createIdeContextTool, validateIdeContextConnection} from '../../src/tools/ide-context.js';
import {createToolRegistry, registerToolsets} from '../../src/registry.js';
import {Client, InMemoryTransport} from '@modelcontextprotocol/client';
import {B2CDxMcpServer} from '../../src/server.js';
import type {ToolResult} from '../../src/utils/index.js';

const connection = {url: 'http://127.0.0.1:43210/context', token: 'test-bridge-token'};
const server = setupServer();
const snapshot = (instanceName = 'development') => ({
  status: 'ready',
  selectionMode: 'workspace',
  instanceName,
  projectDirectory: '/project',
  configPath: '/global/dw.json',
  projectRootPinned: true,
  hostname: `${instanceName}.invalid`,
  codeSync: {available: true, active: true},
});
const json = (result: ToolResult) => JSON.parse(result.content[0].type === 'text' ? result.content[0].text : '{}');

describe('IDE context bridge tool', () => {
  before(() => server.listen({onUnhandledRequest: 'error'}));

  afterEach(() => server.resetHandlers());

  after(() => server.close());

  it('is present only with an explicit bridge connection and never resolves Commerce config', async () => {
    const loadServices = () => {
      throw new Error('must not resolve configuration');
    };
    const ordinary = createToolRegistry(loadServices);
    expect(
      Object.values(ordinary)
        .flat()
        .some((tool) => tool.name === 'b2c_get_ide_context'),
    ).to.equal(false);
    const connected = createToolRegistry(loadServices, undefined, [], undefined, connection);
    const tool = connected.DIAGNOSTICS.find((entry) => entry.name === 'b2c_get_ide_context')!;
    server.use(http.get(connection.url, () => HttpResponse.json(snapshot())));
    expect(json(await tool.handler({}))).to.deep.equal(snapshot());
    expect(tool.effect).to.equal('read');
    expect(tool.openWorld).to.equal(false);
  });

  it('authenticates each call, reads fresh state, and strips unexpected secret fields', async () => {
    let selected = 'development';
    server.use(
      http.get(connection.url, ({request}) => {
        expect(request.headers.get('authorization')).to.equal(`Bearer ${connection.token}`);
        return HttpResponse.json({
          ...snapshot(selected),
          password: 'secret',
          codeSync: {available: true, active: false, token: 'secret'},
        });
      }),
    );
    const tool = createIdeContextTool(connection);
    expect(json(await tool.handler({})).instanceName).to.equal('development');
    selected = 'staging';
    const result = await tool.handler({});
    expect(json(result).instanceName).to.equal('staging');
    expect(JSON.stringify(result)).not.to.include('secret');
    expect(json(result)).not.to.have.property('resolution');
  });

  it('publishes the connected tool with read-only annotations through MCP', async () => {
    const mcp = new B2CDxMcpServer({name: 'ide-test', version: '1.0.0'});
    const client = new Client({name: 'ide-test', version: '1.0.0'});
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await registerToolsets({ideContext: connection, tools: ['b2c_get_ide_context']}, mcp, () => {
      throw new Error('must not resolve Commerce config');
    });
    server.use(http.get(connection.url, () => HttpResponse.json(snapshot('staging'))));
    try {
      await mcp.connect(serverTransport);
      await client.connect(clientTransport);
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).to.deep.equal(['b2c_get_ide_context']);
      expect(tools.tools[0].annotations).to.deep.equal({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      });
      const result = await client.callTool({name: 'b2c_get_ide_context', arguments: {}});
      expect(result.isError, JSON.stringify(result)).not.to.equal(true);
      expect(JSON.stringify(result)).to.include('staging.invalid');
      expect(JSON.stringify(result)).not.to.include(connection.token);
    } finally {
      await client.close();
      await mcp.close();
    }
  });

  it('preserves an unavailable IDE selection instead of substituting a default', async () => {
    server.use(
      http.get(connection.url, () =>
        HttpResponse.json({...snapshot('missing'), status: 'unavailable', hostname: undefined}),
      ),
    );
    const result = json(await createIdeContextTool(connection).handler({}));
    expect(result.status).to.equal('unavailable');
    expect(result.instanceName).to.equal('missing');
    expect(result).not.to.have.property('hostname');
  });

  for (const [label, response] of [
    ['disconnected', new HttpResponse(null, {status: 503})],
    ['malformed', HttpResponse.json({password: 'do not echo'})],
    ['oversized', new HttpResponse('x'.repeat(65_537))],
    ['redirected', new HttpResponse(null, {status: 302, headers: {Location: 'https://example.com/context'}})],
  ] as const) {
    it(`fails closed on ${label} responses`, async () => {
      server.use(http.get(connection.url, () => response));
      const result = await createIdeContextTool(connection).handler({});
      expect(result.isError).to.equal(true);
      expect(JSON.stringify(result)).not.to.include('do not echo');
      expect(JSON.stringify(result)).not.to.include(connection.token);
    });
  }

  it('cancels bridge reads with the tool invocation', async () => {
    const controller = new AbortController();
    controller.abort();
    const result = await createIdeContextTool(connection).handler({}, {signal: controller.signal});
    expect(result.isError).to.equal(true);
  });

  it('rejects remote endpoints and missing bridge tokens before registering', () => {
    for (const url of [
      'https://example.com/context',
      'http://localhost:43210/context',
      'http://127.0.0.1:43210/context?token=x',
    ]) {
      expect(() => validateIdeContextConnection({...connection, url})).to.throw(/extension-provided/);
    }
    expect(() => validateIdeContextConnection({...connection, token: ''})).to.throw(/SFCC_IDE_CONTEXT_TOKEN/);
  });
});
