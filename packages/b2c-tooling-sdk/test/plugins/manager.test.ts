/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {B2CPluginManager} from '@salesforce/b2c-tooling-sdk/plugins';
import {globalMiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/clients';
import {globalAuthMiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/auth';

describe('plugins/manager', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-plugin-manager-'));
    globalMiddlewareRegistry.clear();
    globalAuthMiddlewareRegistry.clear();
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
    globalMiddlewareRegistry.clear();
    globalAuthMiddlewareRegistry.clear();
  });

  it('initializes with no plugins when data dir is empty', async () => {
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({oclif: {plugins: []}}));

    const manager = new B2CPluginManager({discoveryOptions: {dataDir: tempDir}});
    await manager.initialize();

    expect(manager.initialized).to.be.true;
    expect(manager.pluginNames).to.deep.equal([]);
    const {sourcesBefore, sourcesAfter} = manager.getConfigSources();
    expect(sourcesBefore).to.deep.equal([]);
    expect(sourcesAfter).to.deep.equal([]);
  });

  it('initializes with no plugins when data dir does not exist', async () => {
    const manager = new B2CPluginManager({
      discoveryOptions: {dataDir: path.join(tempDir, 'nonexistent')},
    });
    await manager.initialize();

    expect(manager.initialized).to.be.true;
    expect(manager.pluginNames).to.deep.equal([]);
  });

  it('only initializes once', async () => {
    const manager = new B2CPluginManager({
      discoveryOptions: {dataDir: path.join(tempDir, 'nonexistent')},
    });
    await manager.initialize();
    await manager.initialize(); // second call is a no-op

    expect(manager.initialized).to.be.true;
  });

  it('collects config sources from a plugin with priority "before"', async () => {
    setupPlugin(tempDir, 'keychain-plugin', {
      'b2c:config-sources': './hooks/config.mjs',
    });

    // Write hook that returns sources with priority 'before'
    const hooksDir = path.join(tempDir, 'node_modules', 'keychain-plugin', 'hooks');
    fs.mkdirSync(hooksDir, {recursive: true});
    fs.writeFileSync(
      path.join(hooksDir, 'config.mjs'),
      `export default async function(options) {
        return {
          sources: [{ name: 'keychain', priority: undefined, load() { return undefined; } }],
          priority: 'before',
        };
      }`,
    );

    const manager = new B2CPluginManager({discoveryOptions: {dataDir: tempDir}});
    await manager.initialize();

    expect(manager.pluginNames).to.deep.equal(['keychain-plugin']);
    const {sourcesBefore, sourcesAfter} = manager.getConfigSources();
    expect(sourcesBefore).to.have.length(1);
    expect(sourcesBefore[0].name).to.equal('keychain');
    expect(sourcesBefore[0].priority).to.equal(-1);
    expect(sourcesAfter).to.deep.equal([]);
  });

  it('collects config sources with priority "after" (default)', async () => {
    setupPlugin(tempDir, 'fallback-plugin', {
      'b2c:config-sources': './hooks/config.mjs',
    });

    const hooksDir = path.join(tempDir, 'node_modules', 'fallback-plugin', 'hooks');
    fs.mkdirSync(hooksDir, {recursive: true});
    fs.writeFileSync(
      path.join(hooksDir, 'config.mjs'),
      `export default async function(options) {
        return {
          sources: [{ name: 'fallback', load() { return undefined; } }],
        };
      }`,
    );

    const manager = new B2CPluginManager({discoveryOptions: {dataDir: tempDir}});
    await manager.initialize();

    const {sourcesBefore, sourcesAfter} = manager.getConfigSources();
    expect(sourcesBefore).to.deep.equal([]);
    expect(sourcesAfter).to.have.length(1);
    expect(sourcesAfter[0].name).to.equal('fallback');
    expect(sourcesAfter[0].priority).to.equal(10);
  });

  it('collects config sources with numeric priority', async () => {
    setupPlugin(tempDir, 'priority-plugin', {
      'b2c:config-sources': './hooks/config.mjs',
    });

    const hooksDir = path.join(tempDir, 'node_modules', 'priority-plugin', 'hooks');
    fs.mkdirSync(hooksDir, {recursive: true});
    fs.writeFileSync(
      path.join(hooksDir, 'config.mjs'),
      `export default async function(options) {
        return {
          sources: [{ name: 'custom-priority', load() { return undefined; } }],
          priority: -5,
        };
      }`,
    );

    const manager = new B2CPluginManager({discoveryOptions: {dataDir: tempDir}});
    await manager.initialize();

    const {sourcesBefore} = manager.getConfigSources();
    expect(sourcesBefore).to.have.length(1);
    expect(sourcesBefore[0].priority).to.equal(-5);
  });

  it('does not override source priority if already set', async () => {
    setupPlugin(tempDir, 'presorted-plugin', {
      'b2c:config-sources': './hooks/config.mjs',
    });

    const hooksDir = path.join(tempDir, 'node_modules', 'presorted-plugin', 'hooks');
    fs.mkdirSync(hooksDir, {recursive: true});
    fs.writeFileSync(
      path.join(hooksDir, 'config.mjs'),
      `export default async function(options) {
        return {
          sources: [{ name: 'pre-prioritized', priority: 42, load() { return undefined; } }],
          priority: 'before',
        };
      }`,
    );

    const manager = new B2CPluginManager({discoveryOptions: {dataDir: tempDir}});
    await manager.initialize();

    // Source had priority 42 already set, so hook-level 'before' (-1) should not override it
    // But it goes into sourcesAfter because the hook priority ('before'/-1) determines the bucket
    const {sourcesBefore} = manager.getConfigSources();
    expect(sourcesBefore).to.have.length(1);
    expect(sourcesBefore[0].priority).to.equal(42);
  });

  it('collects and applies HTTP middleware', async () => {
    setupPlugin(tempDir, 'middleware-plugin', {
      'b2c:http-middleware': './hooks/http.mjs',
    });

    const hooksDir = path.join(tempDir, 'node_modules', 'middleware-plugin', 'hooks');
    fs.mkdirSync(hooksDir, {recursive: true});
    fs.writeFileSync(
      path.join(hooksDir, 'http.mjs'),
      `export default async function(options) {
        return {
          providers: [{
            name: 'test-middleware',
            getMiddleware() { return undefined; },
          }],
        };
      }`,
    );

    const manager = new B2CPluginManager({discoveryOptions: {dataDir: tempDir}});
    await manager.initialize();
    manager.applyMiddleware();

    expect(globalMiddlewareRegistry.getProviderNames()).to.include('test-middleware');
  });

  it('collects and applies auth middleware', async () => {
    setupPlugin(tempDir, 'auth-plugin', {
      'b2c:auth-middleware': './hooks/auth.mjs',
    });

    const hooksDir = path.join(tempDir, 'node_modules', 'auth-plugin', 'hooks');
    fs.mkdirSync(hooksDir, {recursive: true});
    fs.writeFileSync(
      path.join(hooksDir, 'auth.mjs'),
      `export default async function(options) {
        return {
          providers: [{
            name: 'test-auth-middleware',
            getMiddleware() { return undefined; },
          }],
        };
      }`,
    );

    const manager = new B2CPluginManager({discoveryOptions: {dataDir: tempDir}});
    await manager.initialize();
    manager.applyMiddleware();

    expect(globalAuthMiddlewareRegistry.getProviderNames()).to.include('test-auth-middleware');
  });

  it('handles hook invocation errors gracefully', async () => {
    setupPlugin(tempDir, 'broken-plugin', {
      'b2c:config-sources': './hooks/broken.mjs',
    });

    const hooksDir = path.join(tempDir, 'node_modules', 'broken-plugin', 'hooks');
    fs.mkdirSync(hooksDir, {recursive: true});
    fs.writeFileSync(
      path.join(hooksDir, 'broken.mjs'),
      `export default async function() { throw new Error('hook crashed'); }`,
    );

    const manager = new B2CPluginManager({discoveryOptions: {dataDir: tempDir}});
    // Should not throw
    await manager.initialize();

    expect(manager.pluginNames).to.deep.equal(['broken-plugin']);
    const {sourcesBefore, sourcesAfter} = manager.getConfigSources();
    expect(sourcesBefore).to.deep.equal([]);
    expect(sourcesAfter).to.deep.equal([]);
  });
});

/**
 * Helper to set up a mock plugin in the temp data directory.
 */
function setupPlugin(dataDir: string, pluginName: string, hooks: Record<string, string>): void {
  // Ensure root package.json lists this plugin
  const rootPkgPath = path.join(dataDir, 'package.json');
  let rootPkg: {oclif: {plugins: string[]}} = {oclif: {plugins: []}};
  try {
    rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
  } catch {
    // first plugin
  }
  if (!rootPkg.oclif?.plugins) {
    rootPkg.oclif = {plugins: []};
  }
  if (!rootPkg.oclif.plugins.includes(pluginName)) {
    rootPkg.oclif.plugins.push(pluginName);
  }
  fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg));

  // Create plugin package.json
  const pluginDir = path.join(dataDir, 'node_modules', pluginName);
  fs.mkdirSync(pluginDir, {recursive: true});
  fs.writeFileSync(
    path.join(pluginDir, 'package.json'),
    JSON.stringify({
      name: pluginName,
      oclif: {hooks},
    }),
  );
}
