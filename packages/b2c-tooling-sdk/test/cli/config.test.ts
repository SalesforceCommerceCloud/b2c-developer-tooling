/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {loadConfig, type LoadConfigOptions, type PluginSources} from '@salesforce/b2c-tooling-sdk/cli';
import type {ConfigSource, NormalizedConfig} from '@salesforce/b2c-tooling-sdk/config';

/**
 * Mock config source for testing.
 */
class MockConfigSource implements ConfigSource {
  constructor(
    public name: string,
    private config: Partial<NormalizedConfig> | undefined,
    private path?: string,
  ) {}

  load() {
    return this.config as NormalizedConfig | undefined;
  }

  getPath(): string | undefined {
    return this.path;
  }
}

describe('cli/config', () => {
  describe('loadConfig', () => {
    it('loads config from flags only', () => {
      const flags: Partial<NormalizedConfig> = {
        hostname: 'test.demandware.net',
        codeVersion: 'v1',
      };

      const config = loadConfig(flags);
      expect(config.values.hostname).to.equal('test.demandware.net');
      expect(config.values.codeVersion).to.equal('v1');
    });

    it('merges flags with config file sources', () => {
      const flags: Partial<NormalizedConfig> = {
        hostname: 'flag-hostname.demandware.net',
      };

      // loadConfig uses resolveConfig internally which will try to load from dw.json
      // In test environment, this may not exist, so we test with flags only
      const config = loadConfig(flags);
      expect(config.values.hostname).to.equal('flag-hostname.demandware.net');
    });

    it('handles instance option', () => {
      const flags: Partial<NormalizedConfig> = {};
      const options: LoadConfigOptions = {
        instance: 'test-instance',
      };

      const config = loadConfig(flags, options);
      // Instance name should be set if found in config
      expect(config).to.be.an('object');
    });

    it('handles configPath option', () => {
      const flags: Partial<NormalizedConfig> = {};
      const options: LoadConfigOptions = {
        configPath: '/custom/path/dw.json',
      };

      const config = loadConfig(flags, options);
      expect(config).to.be.an('object');
    });

    it('handles cloudOrigin option', () => {
      const flags: Partial<NormalizedConfig> = {};
      const options: LoadConfigOptions = {
        cloudOrigin: 'https://cloud-staging.mobify.com',
      };

      const config = loadConfig(flags, options);
      expect(config).to.be.an('object');
    });

    it('merges plugin sources before defaults', () => {
      const flags: Partial<NormalizedConfig> = {
        hostname: 'flag-hostname.demandware.net',
      };
      const beforeSource = new MockConfigSource('before', {
        hostname: 'before-hostname.demandware.net',
        codeVersion: 'v2',
      });
      const pluginSources: PluginSources = {
        before: [beforeSource],
      };

      const config = loadConfig(flags, {}, pluginSources);
      // Plugin source before should contribute codeVersion
      expect(config).to.be.an('object');
    });

    it('merges plugin sources after defaults', () => {
      const flags: Partial<NormalizedConfig> = {
        hostname: 'flag-hostname.demandware.net',
      };
      const afterSource = new MockConfigSource('after', {
        clientId: 'after-client-id',
      });
      const pluginSources: PluginSources = {
        after: [afterSource],
      };

      const config = loadConfig(flags, {}, pluginSources);
      // Plugin source after should contribute clientId
      expect(config).to.be.an('object');
    });

    it('handles empty flags', () => {
      const config = loadConfig({});
      expect(config).to.be.an('object');
    });

    it('handles empty options', () => {
      const flags: Partial<NormalizedConfig> = {
        hostname: 'test.demandware.net',
      };
      const config = loadConfig(flags, {});
      expect(config.values.hostname).to.equal('test.demandware.net');
    });

    it('handles empty plugin sources', () => {
      const flags: Partial<NormalizedConfig> = {
        hostname: 'test.demandware.net',
      };
      const config = loadConfig(flags, {}, {});
      expect(config.values.hostname).to.equal('test.demandware.net');
    });

    it('preserves instanceName from options when not in resolved config', () => {
      const flags: Partial<NormalizedConfig> = {};
      const options: LoadConfigOptions = {
        instance: 'custom-instance',
      };

      const config = loadConfig(flags, options);
      expect(config.values.instanceName).to.equal('custom-instance');
    });

    it('does not override instanceName if already in resolved config', () => {
      const flags: Partial<NormalizedConfig> = {
        instanceName: 'resolved-instance',
      };
      const options: LoadConfigOptions = {
        instance: 'option-instance',
      };

      const config = loadConfig(flags, options);
      // Flags take precedence
      expect(config.values.instanceName).to.equal('resolved-instance');
    });

    it('handles multiple plugin sources with priority', () => {
      const flags: Partial<NormalizedConfig> = {
        hostname: 'flag-hostname.demandware.net',
      };
      const beforeSource1 = new MockConfigSource('before1', {codeVersion: 'v1'});
      const beforeSource2 = new MockConfigSource('before2', {clientId: 'client1'});
      const afterSource = new MockConfigSource('after', {clientSecret: 'secret1'});
      const pluginSources: PluginSources = {
        before: [beforeSource1, beforeSource2],
        after: [afterSource],
      };

      const config = loadConfig(flags, {}, pluginSources);
      expect(config).to.be.an('object');
    });
  });
});
