/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import sinon from 'sinon';
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import {
  globalConfigSourceRegistry,
  type ConfigLoadResult,
  type ConfigSource,
  type CreateInstanceOptions,
  type InstanceInfo,
  type NormalizedConfig,
  type ResolveConfigOptions,
} from '@salesforce/b2c-tooling-sdk/config';
import SetupInstanceSetActive from '../../../src/commands/setup/instance/set-active.js';
import {createIsolatedEnvHooks} from '../../helpers/test-setup.js';

/** A plugin-style source that stores instances in memory, registered like a `b2c:config-sources` hook would. */
class MemoryInstanceSource implements ConfigSource {
  readonly instances = new Map<string, {active: boolean; config: Partial<NormalizedConfig>}>();
  readonly name = 'yaml-config';

  constructor(readonly priority: number) {}

  createInstance(options: CreateInstanceOptions): void {
    this.instances.set(options.name, {active: false, config: options.config});
    if (options.setActive) this.setActiveInstance(options.name);
  }

  listInstances(): InstanceInfo[] {
    return [...this.instances].map(([name, entry]) => ({
      name,
      hostname: entry.config.hostname,
      active: entry.active,
      source: this.name,
    }));
  }

  load(_options: ResolveConfigOptions): ConfigLoadResult | undefined {
    return undefined;
  }

  removeInstance(name: string): void {
    this.instances.delete(name);
  }

  setActiveInstance(name: string): void {
    for (const [key, entry] of this.instances) entry.active = key === name;
  }
}

/** A plugin-style credential store for the client credential pair. */
class KeychainSource implements ConfigSource {
  readonly credentialFields: (keyof NormalizedConfig)[] = ['clientId', 'clientSecret'];
  readonly name = 'keychain';
  readonly priority = 10;
  readonly stored = new Map<string, string>();

  load(): ConfigLoadResult | undefined {
    return undefined;
  }

  removeCredential(instanceName: string, field: keyof NormalizedConfig): void {
    this.stored.delete(`${instanceName}/${field}`);
  }

  storeCredential(instanceName: string, field: keyof NormalizedConfig, value: string): void {
    this.stored.set(`${instanceName}/${field}`, value);
  }
}

describe('setup instance with plugin config sources', () => {
  const hooks = createIsolatedEnvHooks();
  let directory: string;
  let dwJsonPath: string;

  beforeEach(() => {
    hooks.beforeEach();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-setup-instance-'));
    dwJsonPath = path.join(directory, 'dw.json');
    fs.writeFileSync(dwJsonPath, JSON.stringify({configs: [{name: 'dw', hostname: 'dw.example.com', active: true}]}));
  });

  afterEach(() => {
    hooks.afterEach();
    fs.rmSync(directory, {recursive: true, force: true});
  });

  // --json only where the command succeeds: under runCommand, a command error with --json ends the test process.
  async function run(command: string, ...args: string[]) {
    return runCommand([`setup:instance:${command}`, ...args, '--config', dwJsonPath, '--json']);
  }

  async function runFailing(command: string, ...args: string[]) {
    return runCommand([`setup:instance:${command}`, ...args, '--config', dwJsonPath]);
  }

  it('lists, activates and removes plugin instances alongside dw.json', async () => {
    const plugin = new MemoryInstanceSource(-1);
    plugin.createInstance({name: 'yaml', config: {hostname: 'yaml.example.com'}});
    globalConfigSourceRegistry.register(plugin);

    const list = await run('list');
    expect(list.error).to.be.undefined;
    expect(
      JSON.parse(list.stdout).instances.map((instance: InstanceInfo) => [instance.name, instance.source]),
    ).to.deep.equal([
      ['yaml', 'yaml-config'],
      ['dw', 'DwJsonSource'],
    ]);

    expect((await run('set-active', 'yaml')).error).to.be.undefined;
    expect(plugin.instances.get('yaml')?.active).to.be.true;

    expect((await run('remove', 'yaml', '--force')).error).to.be.undefined;
    expect(plugin.instances.size).to.equal(0);
  });

  it('warns when a higher-priority source keeps its own active instance as the default', async () => {
    const plugin = new MemoryInstanceSource(-1);
    plugin.createInstance({name: 'yaml', config: {hostname: 'yaml.example.com'}, setActive: true});
    // Like a real instance source, load the active instance when none is requested.
    plugin.load = (options) => {
      const name = options.instance ?? [...plugin.instances].find(([, entry]) => entry.active)?.[0];
      const entry = name ? plugin.instances.get(name) : undefined;
      return entry ? {config: {...entry.config, instanceName: name}} : undefined;
    };
    globalConfigSourceRegistry.register(plugin);

    const warn = sinon.stub(SetupInstanceSetActive.prototype, 'warn');
    const result = await runFailing('set-active', 'dw');
    warn.restore();
    expect(result.error).to.be.undefined;
    expect(warn.firstCall?.args[0]).to.include('"yaml" from yaml-config is still the default');
  });

  it('creates instances in the highest-priority source, or the one named by --source', async () => {
    const plugin = new MemoryInstanceSource(-1);
    globalConfigSourceRegistry.register(plugin);

    const created = await run('create', 'staging', '--hostname', 'staging.example.com', '--force');
    expect(created.error).to.be.undefined;
    expect(JSON.parse(created.stdout)).to.include({source: 'yaml-config'});
    expect(plugin.instances.has('staging')).to.be.true;

    const dw = await run('create', 'dev', '--hostname', 'dev.example.com', '--force', '--source', 'DwJsonSource');
    expect(dw.error).to.be.undefined;
    const names = JSON.parse(fs.readFileSync(dwJsonPath, 'utf8')).configs.map((c: {name: string}) => c.name);
    expect(names).to.deep.equal(['dw', 'dev']);

    const bad = await runFailing('create', 'x', '--hostname', 'x.example.com', '--force', '--source', 'nope');
    expect(bad.error?.message).to.include("can't store instances");
  });

  it('stores a credential pair in a credential store and removes it with the instance', async () => {
    const keychain = new KeychainSource();
    globalConfigSourceRegistry.register(keychain);

    const created = await run(
      'create',
      'staging',
      '--hostname',
      'staging.example.com',
      '--client-id',
      'id',
      '--client-secret',
      'secret',
      '--force',
    );
    expect(created.error).to.be.undefined;
    expect(JSON.parse(created.stdout).credentials).to.deep.equal([
      {field: 'clientId', source: 'keychain'},
      {field: 'clientSecret', source: 'keychain'},
    ]);
    const entry = JSON.parse(fs.readFileSync(dwJsonPath, 'utf8')).configs[1];
    expect(entry).to.include({name: 'staging', hostname: 'staging.example.com'});
    expect(entry).to.not.have.property('clientSecret');
    expect(keychain.stored.get('staging/clientSecret')).to.equal('secret');

    expect((await run('remove', 'staging', '--force')).error).to.be.undefined;
    expect(keychain.stored.size).to.equal(0);
  });
});
