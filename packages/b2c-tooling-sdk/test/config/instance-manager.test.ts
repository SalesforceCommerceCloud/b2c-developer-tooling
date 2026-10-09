/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  DwJsonSource,
  InstanceManager,
  createConfigSources,
  createInstanceManager,
  globalConfigSourceRegistry,
  type ConfigLoadResult,
  type ConfigSource,
  type CreateInstanceOptions,
  type InstanceInfo,
  type NormalizedConfig,
  type ResolveConfigOptions,
} from '@salesforce/b2c-tooling-sdk/config';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';

/** A plugin-style source that stores instances in memory (think YAML file). */
class MemoryInstanceSource implements ConfigSource {
  readonly instances = new Map<string, {active: boolean; config: Partial<NormalizedConfig>}>();

  constructor(
    readonly name: string,
    readonly priority: number,
  ) {}

  createInstance(options: CreateInstanceOptions & ResolveConfigOptions): void {
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

  load(): ConfigLoadResult | undefined {
    return undefined;
  }

  removeInstance(name: string): void {
    this.instances.delete(name);
  }

  setActiveInstance(name: string): void {
    for (const [key, entry] of this.instances) entry.active = key === name;
  }
}

/** A plugin-style credential store (think OS keychain). */
class KeychainSource implements ConfigSource {
  readonly name = 'keychain';
  readonly priority = 10;
  readonly stored = new Map<string, string>();

  constructor(readonly credentialFields: (keyof NormalizedConfig)[]) {}

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

describe('config/instance-manager', () => {
  let directory: string;
  let options: ResolveConfigOptions;

  beforeEach(() => {
    isolateConfig();
    globalConfigSourceRegistry.clear();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'instance-manager-'));
    options = {projectDirectory: directory};
  });

  afterEach(() => {
    globalConfigSourceRegistry.clear();
    restoreConfig();
    fs.rmSync(directory, {recursive: true, force: true});
  });

  function readDwJsonInstance(): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(path.join(directory, 'dw.json'), 'utf8')).configs[0];
  }

  describe('createConfigSources', () => {
    it('includes registered plugin sources in priority order', () => {
      globalConfigSourceRegistry.register(new MemoryInstanceSource('late', 10));
      globalConfigSourceRegistry.register(new MemoryInstanceSource('early', -1));
      const names = createConfigSources().map((source) => source.name);
      expect(names[0]).to.equal('early');
      expect(names.indexOf('DwJsonSource')).to.be.lessThan(names.indexOf('late'));
      expect(names.indexOf('late')).to.be.lessThan(names.indexOf('PackageJsonSource'));
    });

    it('omits the defaults when replacing them', () => {
      const names = createConfigSources({replaceDefaultSources: true, sourcesBefore: [new KeychainSource([])]}).map(
        (source) => source.name,
      );
      expect(names).to.deep.equal(['keychain']);
    });
  });

  it('defaults to the configured sources, including plugins', async () => {
    const plugin = new MemoryInstanceSource('yaml-config', -1);
    plugin.createInstance({name: 'plugin-staging', config: {hostname: 'p.example.com'}});
    globalConfigSourceRegistry.register(plugin);
    fs.writeFileSync(path.join(directory, 'dw.json'), JSON.stringify({name: 'dw', hostname: 'dw.example.com'}));

    const instances = await createInstanceManager().listAllInstances(options);
    expect(instances.map((instance) => [instance.name, instance.source])).to.deep.equal([
      ['plugin-staging', 'yaml-config'],
      ['dw', 'DwJsonSource'],
    ]);
  });

  it('creates instances in the highest-priority source that can, or the one named', async () => {
    const plugin = new MemoryInstanceSource('yaml-config', -1);
    const manager = new InstanceManager([new DwJsonSource(), plugin]);

    const result = await manager.createInstance({name: 'a', config: {hostname: 'a.example.com'}, ...options});
    expect(result).to.deep.equal({source: 'yaml-config', credentials: []});
    expect(plugin.instances.has('a')).to.be.true;
    expect(fs.existsSync(path.join(directory, 'dw.json'))).to.be.false;

    await manager.createInstance({name: 'b', config: {hostname: 'b.example.com'}, ...options}, 'DwJsonSource');
    expect(readDwJsonInstance()).to.include({name: 'b', hostname: 'b.example.com'});
  });

  it('removes and activates instances in the source that lists them', async () => {
    const plugin = new MemoryInstanceSource('yaml-config', -1);
    plugin.createInstance({name: 'a', config: {}});
    plugin.createInstance({name: 'b', config: {}});
    const manager = new InstanceManager([new DwJsonSource(), plugin]);

    expect((await manager.setActiveInstance('b', options)).source).to.equal('yaml-config');
    expect(plugin.instances.get('b')?.active).to.be.true;

    await manager.removeInstance('a', options);
    expect([...plugin.instances.keys()]).to.deep.equal(['b']);

    try {
      await manager.removeInstance('missing', options);
      expect.fail('expected an error');
    } catch (error) {
      expect((error as Error).message).to.include('not found');
    }
  });

  it('targets a named source when two list the same instance', async () => {
    const early = new MemoryInstanceSource('early', -1);
    const late = new MemoryInstanceSource('late', 5);
    early.createInstance({name: 'staging', config: {}});
    late.createInstance({name: 'staging', config: {}});
    const manager = new InstanceManager([early, late]);

    await manager.setActiveInstance('staging', options, 'late');
    expect(late.instances.get('staging')?.active).to.be.true;
    expect(early.instances.get('staging')?.active).to.be.false;

    await manager.removeInstance('staging', options);
    expect(early.instances.has('staging')).to.be.false;
    expect(late.instances.has('staging')).to.be.true;
  });

  it('skips a source whose listing fails', async () => {
    const broken: ConfigSource = {
      name: 'broken',
      load: () => undefined,
      listInstances() {
        throw new Error('unreachable vault');
      },
    };
    const plugin = new MemoryInstanceSource('yaml-config', 0);
    plugin.createInstance({name: 'a', config: {}});
    const instances = await new InstanceManager([broken, plugin]).listAllInstances(options);
    expect(instances.map((instance) => instance.name)).to.deep.equal(['a']);
  });

  describe('credential stores', () => {
    it('stores a credential pair in a store that declares both fields', async () => {
      const keychain = new KeychainSource(['clientId', 'clientSecret']);
      const manager = new InstanceManager([new DwJsonSource(), keychain]);

      const result = await manager.createInstance({
        name: 'staging',
        config: {hostname: 'h.example.com', clientId: 'id', clientSecret: 'secret', username: 'u', password: 'p'},
        ...options,
      });

      expect(result.credentials).to.deep.equal([
        {field: 'clientId', source: 'keychain'},
        {field: 'clientSecret', source: 'keychain'},
      ]);
      expect(keychain.stored.get('staging/clientSecret')).to.equal('secret');
      const dwJson = readDwJsonInstance();
      expect(dwJson).to.not.have.property('clientSecret');
      expect(dwJson).to.not.have.property('clientId');
      // The keychain doesn't declare username/password, so that pair stays in dw.json.
      expect(dwJson).to.include({username: 'u', password: 'p'});
    });

    it('keeps a pair together when the store declares only the secret', async () => {
      const keychain = new KeychainSource(['clientSecret']);
      await new InstanceManager([new DwJsonSource(), keychain]).createInstance({
        name: 'staging',
        config: {hostname: 'h.example.com', clientId: 'id', clientSecret: 'secret'},
        ...options,
      });
      expect(keychain.stored.size).to.equal(0);
      expect(readDwJsonInstance()).to.include({clientId: 'id', clientSecret: 'secret'});
    });

    it('removes stored credentials with the instance', async () => {
      const keychain = new KeychainSource(['clientId', 'clientSecret']);
      const manager = new InstanceManager([new DwJsonSource(), keychain]);
      await manager.createInstance({
        name: 'staging',
        config: {hostname: 'h.example.com', clientId: 'id', clientSecret: 'secret'},
        ...options,
      });

      await manager.removeInstance('staging', options);
      expect(keychain.stored.size).to.equal(0);
    });
  });
});
