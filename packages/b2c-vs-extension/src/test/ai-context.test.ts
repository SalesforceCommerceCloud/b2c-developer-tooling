/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import {B2CExtensionConfig} from '../config-provider.js';
import {IdeContextTool, readIdeContext, type IdeContext} from '../ai/ide-context.js';
import {B2CMcpServerDefinitionProvider} from '../ai/mcp-provider.js';
import {CursorMcpRegistration, type CursorMcpApi} from '../ai/cursor-mcp.js';
import {CodeSyncManager} from '../code-sync/code-sync-manager.js';

suite('AI context and MCP registration', () => {
  let directory: string;
  let configPath: string;
  let configProvider: B2CExtensionConfig;
  let log: vscode.OutputChannel;
  let state: vscode.Memento;
  let cancellation: vscode.CancellationTokenSource;
  const inactive = () => ({available: false, active: false});

  setup(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-ai-'));
    configPath = path.join(directory, 'dw.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        configs: [
          {
            name: 'development',
            hostname: 'development.invalid',
            active: true,
            'code-version': 'v1',
            password: 'never-return-this',
          },
          {
            name: 'staging',
            hostname: 'staging.invalid',
            'code-version': 'v2',
            'client-secret': 'never-return-this-either',
          },
        ],
      }),
    );
    const values = new Map<string, unknown>([['b2c-dx.projectRoot', directory]]);
    state = {
      keys: () => [...values.keys()],
      get: <T>(key: string, fallback?: T) => (values.has(key) ? (values.get(key) as T) : fallback),
      update: async (key: string, value: unknown) => {
        values.set(key, value);
      },
    } as vscode.Memento;
    log = vscode.window.createOutputChannel('B2C AI Tests');
    configProvider = new B2CExtensionConfig(log, state, {
      B2C_CONFIG_DIR: path.join(directory, 'settings'),
      MRT_CREDENTIALS_FILE: path.join(directory, 'missing.mobify'),
    });
    cancellation = new vscode.CancellationTokenSource();
    await configProvider.ensureResolved();
  });

  teardown(() => {
    cancellation.dispose();
    configProvider.dispose();
    log.dispose();
    fs.rmSync(directory, {recursive: true, force: true});
  });

  test('returns exact selection without credentials and waits for an in-progress reset', async () => {
    await configProvider.selectInstanceForWorkspace({name: 'staging', location: configPath});
    const context = await readIdeContext(configProvider, inactive);
    assert.strictEqual(context.instanceName, 'staging');
    assert.strictEqual(context.hostname, 'staging.invalid');
    assert.strictEqual(context.codeVersion, 'v2');
    assert.strictEqual(context.configPath, configPath);
    assert.strictEqual(context.projectDirectory, directory);
    assert.strictEqual(context.selectionMode, 'workspace');
    assert.strictEqual(context.projectRootPinned, true);
    assert.ok(!JSON.stringify(context).includes('never-return'));
    await configProvider.followDefaultInstance();
    const followed = await readIdeContext(configProvider, inactive);
    assert.strictEqual(followed.instanceName, 'development');
    assert.strictEqual(followed.selectionMode, 'default');
  });

  test('concurrent switches resolve the latest selection, never a stale snapshot', async () => {
    await configProvider.selectInstanceForWorkspace({name: 'staging', location: configPath});
    const firstRead = readIdeContext(configProvider, inactive);
    await configProvider.selectInstanceForWorkspace({name: 'development', location: configPath});
    const secondRead = readIdeContext(configProvider, inactive);
    for (const result of await Promise.all([firstRead, secondRead])) {
      assert.strictEqual(result.instanceName, 'development');
      assert.strictEqual(result.hostname, 'development.invalid');
    }
  });

  test('reports a missing selected instance without falling back to the default', async () => {
    await configProvider.selectInstanceForWorkspace({name: 'missing', location: configPath});
    const context = await readIdeContext(configProvider, inactive);
    assert.strictEqual(context.status, 'unavailable');
    assert.strictEqual(context.instanceName, 'missing');
    assert.strictEqual(context.hostname, undefined);
  });

  test('reports actual code-sync activity and its retained upload target', async () => {
    const cartridge = path.join(directory, 'app_test');
    fs.mkdirSync(path.join(cartridge, 'cartridge'), {recursive: true});
    fs.writeFileSync(
      path.join(cartridge, '.project'),
      '<projectDescription><name>app_test</name></projectDescription>',
    );
    const manager = new CodeSyncManager(state, configProvider);
    try {
      assert.deepStrictEqual(manager.getStatus(), {active: false});
      await manager.startWatch(configProvider.getInstance()!, directory);
      assert.deepStrictEqual(manager.getStatus(), {active: true, hostname: 'development.invalid', codeVersion: 'v1'});
      await configProvider.selectInstanceForWorkspace({name: 'staging', location: configPath});
      const context = await readIdeContext(configProvider, () => ({available: true, ...manager.getStatus()}));
      assert.strictEqual(context.hostname, 'staging.invalid');
      assert.strictEqual(context.codeSync.hostname, 'development.invalid');
      await manager.stopWatch();
      assert.deepStrictEqual(manager.getStatus(), {active: false});
    } finally {
      await manager.stopWatch();
      manager.dispose();
    }
  });

  test('native tool reads on every invocation and supports cancellation', async () => {
    const tool = new IdeContextTool(() => readIdeContext(configProvider, inactive));
    const input = {input: {}, toolInvocationToken: undefined};
    const first = await tool.invoke(input, cancellation.token);
    assert.ok((first.content[0] as vscode.LanguageModelTextPart).value.includes('development.invalid'));
    await configProvider.selectInstanceForWorkspace({name: 'staging', location: configPath});
    const second = await tool.invoke(input, cancellation.token);
    assert.ok((second.content[0] as vscode.LanguageModelTextPart).value.includes('staging.invalid'));
    cancellation.cancel();
    await assert.rejects(tool.invoke(input, cancellation.token), vscode.CancellationError);
  });

  test('provider refreshes launch defaults and respects disabled/cancelled discovery', async () => {
    let enabled = true;
    const provider = new B2CMcpServerDefinitionProvider(
      () => readIdeContext(configProvider, inactive),
      () => ({enabled, command: 'node', args: ['/test/mcp.js']}),
      () => ({dispose() {}}),
      '3.0.1',
    );
    const [initial] = await provider.provideMcpServerDefinitions(cancellation.token);
    assert.strictEqual(initial.cwd?.fsPath, directory);
    assert.deepStrictEqual(initial.args, [
      '/test/mcp.js',
      '--project-directory',
      directory,
      '--config',
      configPath,
      '--instance',
      'development',
    ]);
    await configProvider.selectInstanceForWorkspace({name: 'staging', location: configPath});
    const started = await provider.resolveMcpServerDefinition(initial, cancellation.token);
    assert.strictEqual(started?.args.at(-1), 'staging');
    assert.deepStrictEqual(started?.env, {});
    await configProvider.selectInstanceForWorkspace({name: 'missing', location: configPath});
    await assert.rejects(provider.resolveMcpServerDefinition(initial, cancellation.token), /unavailable/);
    enabled = false;
    assert.deepStrictEqual(await provider.provideMcpServerDefinitions(cancellation.token), []);
    enabled = true;
    cancellation.cancel();
    assert.deepStrictEqual(await provider.provideMcpServerDefinitions(cancellation.token), []);
  });

  test('Cursor registers one server with a live bridge and cleans up on disable', async () => {
    const servers = new Map<string, Parameters<CursorMcpApi['registerServer']>[0]['server']>();
    let registrations = 0;
    let enabled = true;
    const read = () => readIdeContext(configProvider, inactive);
    const provider = new B2CMcpServerDefinitionProvider(
      read,
      () => ({enabled, command: 'node', args: ['/test/mcp.js']}),
      () => ({dispose() {}}),
      '3.0.1',
    );
    const registration = new CursorMcpRegistration(
      {
        registerServer({name, server}) {
          registrations++;
          servers.set(name, server);
        },
        unregisterServer(name) {
          servers.delete(name);
        },
      },
      provider,
      read,
    );
    try {
      await registration.refresh();
      assert.strictEqual(servers.size, 1);
      assert.strictEqual(registrations, 1);
      await registration.refresh();
      assert.strictEqual(registrations, 1);
      await configProvider.selectInstanceForWorkspace({name: 'staging', location: configPath});
      await registration.refresh();
      assert.strictEqual(registrations, 2);
      const commerce = servers.get('salesforce-b2c-commerce')!;
      assert.ok(commerce.args.includes('staging'));
      assert.ok(commerce.args.includes('--ide-context-url'));
      const bridgeUrl = commerce.args.at(-1)!;
      const headers = {Authorization: `Bearer ${commerce.env.SFCC_IDE_CONTEXT_TOKEN}`};
      assert.ok(!commerce.args.includes(commerce.env.SFCC_IDE_CONTEXT_TOKEN));
      assert.strictEqual((await (await fetch(bridgeUrl, {headers})).json()).instanceName, 'staging');
      enabled = false;
      await registration.refresh();
      assert.strictEqual(servers.size, 0);
      await assert.rejects(fetch(bridgeUrl, {headers}));
    } finally {
      await registration.dispose();
    }
  });

  test('provider does not launch from an empty window', async () => {
    const context: IdeContext = {
      status: 'unconfigured',
      selectionMode: 'default',
      projectRootPinned: false,
      codeSync: inactive(),
    };
    const provider = new B2CMcpServerDefinitionProvider(
      async () => context,
      () => ({enabled: true, command: 'node', args: []}),
      () => ({dispose() {}}),
      '3.0.1',
    );
    assert.deepStrictEqual(await provider.provideMcpServerDefinitions(cancellation.token), []);
  });
});
