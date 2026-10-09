/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {BasicAuthStrategy, OAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {globalMiddlewareRegistry, createSafetyMiddleware} from '@salesforce/b2c-tooling-sdk/clients';
import {SafetyGuard, type SafetyConfigFragment} from '@salesforce/b2c-tooling-sdk/safety';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import McpServerCommand from '../../src/commands/mcp.js';
import {Services} from '../../src/services.js';
import {createCartridgesTools} from '../../src/tools/cartridges/index.js';
import {createToolAdapter, jsonResult} from '../../src/tools/adapter.js';
import type {ProjectContextInput} from '../../src/tools/project-context.js';

describe('per-call MCP safety', () => {
  let root: string;
  let command: McpServerCommand;
  let deploy: ReturnType<typeof createCartridgesTools>[0];
  let requests: Request[];
  const load = (context?: ProjectContextInput) =>
    (command as unknown as {loadServices(context?: ProjectContextInput): Promise<Services>}).loadServices(context);
  const args = () => ({projectDirectory: root, files: ['app/cartridge/a.js']});
  const configure = (safety: SafetyConfigFragment, extra: Record<string, unknown> = {}) =>
    writeFile(
      join(root, 'dw.json'),
      JSON.stringify({
        hostname: 'safety.example.com',
        username: 'test',
        password: 'test',
        'client-id': 'test-client',
        'client-secret': 'test-secret',
        'code-version': 'demo',
        safety,
        ...extra,
      }),
    );

  beforeEach(async () => {
    isolateConfig();
    delete process.env.SFCC_CONFIG;
    root = await mkdtemp(join(tmpdir(), 'mcp-call-safety-'));
    process.env.SFCC_SAFETY_CONFIG = join(root, 'safety.json');
    await mkdir(join(root, 'app', 'cartridge'), {recursive: true});
    await writeFile(join(root, 'app', '.project'), '<projectDescription/>');
    await writeFile(join(root, 'app', 'cartridge', 'a.js'), 'demo');
    command = new McpServerCommand([], {name: 'test', version: '1.0.0', root} as never);
    (command as unknown as {flags: Record<string, unknown>}).flags = {};
    sinon.stub(command as unknown as Record<string, unknown>, 'getBaseConfigOptions').returns({
      defaultConfigPath: join(root, 'no-default.json'),
    });
    sinon.stub(OAuthStrategy.prototype, 'getAuthorizationHeader').resolves('Bearer test');
    requests = [];
    // WebDAV uses undici directly, so intercept at the auth transport boundary.
    sinon.stub(BasicAuthStrategy.prototype, 'fetch').callsFake(async (url, init) => {
      requests.push(new Request(url, init as ConstructorParameters<typeof Request>[1]));
      return new Response(null, {status: 201});
    });
    sinon.stub(globalThis, 'fetch').callsFake(async (input, init) => {
      requests.push(new Request(input, init));
      return Response.json({});
    });
    // Reproduce the policy installed when the long-running MCP process starts.
    globalMiddlewareRegistry.register({
      name: 'cli-safety-guard',
      getMiddleware: () => createSafetyMiddleware(new SafetyGuard({level: 'READ_ONLY'})),
    });
    deploy = createCartridgesTools(load)[0];
  });

  afterEach(async () => {
    sinon.restore();
    globalMiddlewareRegistry.clear();
    delete process.env.SFCC_SAFETY_CONFIG;
    delete process.env.SFCC_SAFETY_LEVEL;
    restoreConfig();
    await rm(root, {recursive: true, force: true});
  });

  it('rereads dw.json when restrictions are loosened and tightened, including reload', async () => {
    await configure({level: 'READ_ONLY'});
    expect((await deploy.handler(args())).isError).to.equal(true);
    expect(requests).to.have.length(0);

    await configure({level: 'NONE'});
    const result = await deploy.handler({...args(), reload: true});
    expect(result.isError, JSON.stringify(result)).not.to.equal(true);
    expect(JSON.parse((result.content[0] as {text: string}).text).reloaded).to.equal(true);
    expect(requests.map((request) => request.method)).to.include.members(['PUT', 'POST', 'DELETE', 'PATCH']);

    requests = [];
    await configure({level: 'READ_ONLY'});
    expect((await deploy.handler(args())).isError).to.equal(true);
    expect(requests).to.have.length(0);
  });

  it('retains plugin middleware while replacing the startup guard', async () => {
    globalMiddlewareRegistry.register({
      name: 'test-header',
      getMiddleware: () => ({
        onRequest({request}) {
          request.headers.set('x-project-plugin', 'preserved');
          return request;
        },
      }),
    });
    await configure({level: 'NONE'});
    expect((await deploy.handler(args())).isError).not.to.equal(true);
    expect(requests.length).to.be.greaterThan(0);
    expect(requests.every((request) => request.headers.get('x-project-plugin') === 'preserved')).to.equal(true);
  });

  it('uses the refreshed policy for SCAPI code reload after upload', async () => {
    await configure(
      {level: 'NONE'},
      {
        'api-backend': 'scapi',
        'short-code': 'test',
        'tenant-id': 'test_001',
      },
    );
    const result = await deploy.handler({...args(), reload: true});
    expect(result.isError, JSON.stringify(result)).not.to.equal(true);
    expect(JSON.parse((result.content[0] as {text: string}).text).reloaded).to.equal(true);
    expect(requests.some((request) => request.method === 'PATCH' && request.url.includes('/dx/scripts/v1/'))).to.equal(
      true,
    );
  });

  it('rereads global safety policy and retains environment restrictions', async () => {
    await configure({level: 'NONE'});
    await writeFile(join(root, 'safety.json'), JSON.stringify({level: 'READ_ONLY'}));
    expect((await deploy.handler(args())).isError).to.equal(true);
    expect(requests).to.have.length(0);

    await writeFile(join(root, 'safety.json'), JSON.stringify({level: 'NONE'}));
    expect((await deploy.handler(args())).isError).not.to.equal(true);
    requests = [];
    process.env.SFCC_SAFETY_LEVEL = 'READ_ONLY';
    expect((await deploy.handler(args())).isError).to.equal(true);
    expect(requests).to.have.length(0);
  });

  it('honors project .env safety and resolves its safety file relative to the project', async () => {
    delete process.env.SFCC_SAFETY_CONFIG;
    await configure({level: 'NONE'});
    await writeFile(join(root, '.env'), 'SFCC_SAFETY_CONFIG=policy.json\n');
    await writeFile(join(root, 'policy.json'), JSON.stringify({level: 'READ_ONLY'}));
    expect((await deploy.handler(args())).isError).to.equal(true);
    expect(requests).to.have.length(0);

    await writeFile(join(root, 'policy.json'), JSON.stringify({level: 'NONE'}));
    expect((await deploy.handler(args())).isError).not.to.equal(true);
  });

  it('keeps explicit block and confirmation rules active at level NONE', async () => {
    await configure({level: 'NONE', rules: [{method: 'PUT', path: '/**', action: 'block'}]});
    expect((await deploy.handler(args())).isError).to.equal(true);
    await configure({level: 'NONE', rules: [{method: 'PUT', path: '/**', action: 'confirm'}]});
    const result = await deploy.handler(args());
    expect(result.isError).to.equal(true);
    expect((result.content[0] as {text: string}).text).to.match(/confirm/i);
    expect(requests).to.have.length(0);
  });

  it('isolates overlapping calls for different named instances', async () => {
    await writeFile(
      join(root, 'dw.json'),
      JSON.stringify({
        configs: ['READ_ONLY', 'NONE'].map((level) => ({
          name: level,
          hostname: 'safety.example.com',
          username: 'test',
          password: 'test',
          safety: {level},
        })),
      }),
    );
    let release!: () => void;
    const bothStarted = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started = 0;
    const tool = createToolAdapter(
      {
        name: 'test-write',
        effect: 'write',
        idempotent: false,
        openWorld: true,
        description: 'Test write',
        toolsets: ['CARTRIDGES'],
        requiresInstance: true,
        inputSchema: {},
        async execute(_args, {b2cInstance}) {
          if (++started === 2) release();
          await bothStarted;
          await b2cInstance!.webdav.put('Cartridges/demo/test.txt', Buffer.from('test'));
          return {written: true};
        },
        formatOutput: jsonResult,
      },
      load,
    );
    const [blocked, allowed] = await Promise.all([
      tool.handler({projectDirectory: root, instanceName: 'READ_ONLY'}),
      tool.handler({projectDirectory: root, instanceName: 'NONE'}),
    ]);
    expect(blocked.isError).to.equal(true);
    expect(allowed.isError, JSON.stringify(allowed)).not.to.equal(true);
    expect(requests).to.have.length(1);
  });
});
