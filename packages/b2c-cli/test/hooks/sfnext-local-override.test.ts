/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {mkdirSync, mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sinon from 'sinon';

import hook from '../../src/hooks/sfnext-local-override.js';

const PLUGIN_NAME = '@salesforce/storefront-next-dev';

function makeFakePluginDir(parent: string): string {
  const pluginRoot = join(parent, 'node_modules', '@salesforce', 'storefront-next-dev');
  mkdirSync(join(pluginRoot, 'dist', 'commands'), {recursive: true});
  writeFileSync(
    join(pluginRoot, 'package.json'),
    JSON.stringify({
      name: PLUGIN_NAME,
      version: '1.0.0-test',
      type: 'module',
      oclif: {
        bin: 'sfnext',
        commands: './dist/commands',
        topicSeparator: ' ',
      },
    }),
  );
  return pluginRoot;
}

function makeContext(): {
  config: {
    plugins: Map<string, {root: string; name: string; type: string}>;
    loadPluginsAndCommands: sinon.SinonStub;
  };
  ctx: {debug: sinon.SinonStub; warn: sinon.SinonStub};
} {
  const config = {
    plugins: new Map<string, {root: string; name: string; type: string}>(),
    loadPluginsAndCommands: sinon.stub().resolves(),
  };
  const ctx = {
    debug: sinon.stub(),
    warn: sinon.stub(),
  };
  return {config, ctx};
}

async function invokeHook(
  ctx: {debug: sinon.SinonStub; warn: sinon.SinonStub},
  config: unknown,
  id: string | undefined,
): Promise<void> {
  // The hook signature is `Hook<'init'>` — call with a typed-loose context to match.
  await (hook as unknown as (this: unknown, opts: unknown) => Promise<void>).call(ctx, {
    id,
    argv: [],
    config,
    context: {},
  });
}

describe('sfnext-local-override hook', () => {
  let cwdStub: sinon.SinonStub | undefined;

  afterEach(() => {
    cwdStub?.restore();
    cwdStub = undefined;
    sinon.restore();
  });

  it('no-ops for a non-sfnext command id', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'sfnext-hook-'));
    makeFakePluginDir(tmp);
    cwdStub = sinon.stub(process, 'cwd').returns(tmp);

    const {config, ctx} = makeContext();
    await invokeHook(ctx, config, 'auth:login');

    expect(config.plugins.size).to.equal(0);
    expect(config.loadPluginsAndCommands.called).to.equal(false);
  });

  it('no-ops when id is undefined', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'sfnext-hook-'));
    makeFakePluginDir(tmp);
    cwdStub = sinon.stub(process, 'cwd').returns(tmp);

    const {config, ctx} = makeContext();
    await invokeHook(ctx, config, undefined);

    expect(config.plugins.size).to.equal(0);
    expect(config.loadPluginsAndCommands.called).to.equal(false);
  });

  it('registers project-local plugin and reloads commands when found', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'sfnext-hook-'));
    const pluginRoot = makeFakePluginDir(tmp);
    cwdStub = sinon.stub(process, 'cwd').returns(tmp);

    const {config, ctx} = makeContext();
    await invokeHook(ctx, config, 'sfnext:dev');

    const registered = config.plugins.get(PLUGIN_NAME);
    expect(registered, 'plugin should be registered').to.not.equal(undefined);
    expect(registered!.root).to.equal(pluginRoot);
    expect(config.loadPluginsAndCommands.calledOnce).to.equal(true);
    expect(ctx.warn.called).to.equal(false);
  });

  it('finds project-local install when running from a nested subdirectory', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'sfnext-hook-'));
    const pluginRoot = makeFakePluginDir(tmp);
    const nested = join(tmp, 'src', 'app', 'deep');
    mkdirSync(nested, {recursive: true});
    cwdStub = sinon.stub(process, 'cwd').returns(nested);

    const {config, ctx} = makeContext();
    await invokeHook(ctx, config, 'sfnext:dev');

    const registered = config.plugins.get(PLUGIN_NAME);
    expect(registered).to.not.equal(undefined);
    expect(registered!.root).to.equal(pluginRoot);
  });

  it('no-ops when no project-local install is found', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'sfnext-hook-empty-'));
    cwdStub = sinon.stub(process, 'cwd').returns(tmp);

    const {config, ctx} = makeContext();
    await invokeHook(ctx, config, 'sfnext:dev');

    expect(config.plugins.size).to.equal(0);
    expect(config.loadPluginsAndCommands.called).to.equal(false);
    expect(ctx.warn.called).to.equal(false);
  });

  it('is idempotent when the same project-local plugin is already registered', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'sfnext-hook-'));
    const pluginRoot = makeFakePluginDir(tmp);
    cwdStub = sinon.stub(process, 'cwd').returns(tmp);

    const {config, ctx} = makeContext();
    // Pre-populate plugins map with the same root the hook would discover
    config.plugins.set(PLUGIN_NAME, {root: pluginRoot, name: PLUGIN_NAME, type: 'link'});

    await invokeHook(ctx, config, 'sfnext:dev');

    expect(config.plugins.size).to.equal(1);
    expect(config.loadPluginsAndCommands.called, 'no reload when plugin already current').to.equal(false);
  });

  it('warns and falls through on a malformed local install', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'sfnext-hook-bad-'));
    const pluginRoot = join(tmp, 'node_modules', '@salesforce', 'storefront-next-dev');
    mkdirSync(pluginRoot, {recursive: true});
    // Write an invalid package.json (truncated JSON) so Plugin.load() throws
    writeFileSync(join(pluginRoot, 'package.json'), '{ "name":');
    cwdStub = sinon.stub(process, 'cwd').returns(tmp);

    const {config, ctx} = makeContext();
    await invokeHook(ctx, config, 'sfnext:dev');

    expect(ctx.warn.calledOnce, 'should log a warning').to.equal(true);
    expect(config.plugins.has(PLUGIN_NAME)).to.equal(false);
    expect(config.loadPluginsAndCommands.called).to.equal(false);
  });

  it('matches the bare `sfnext` topic id', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'sfnext-hook-'));
    makeFakePluginDir(tmp);
    cwdStub = sinon.stub(process, 'cwd').returns(tmp);

    const {config, ctx} = makeContext();
    await invokeHook(ctx, config, 'sfnext');

    expect(config.plugins.has(PLUGIN_NAME)).to.equal(true);
  });
});
