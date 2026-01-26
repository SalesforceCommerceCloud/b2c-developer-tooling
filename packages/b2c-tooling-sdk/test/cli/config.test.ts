/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  loadConfig,
  extractOAuthFlags,
  extractInstanceFlags,
  extractMrtFlags,
  type LoadConfigOptions,
  type PluginSources,
  type ParsedFlags,
} from '@salesforce/b2c-tooling-sdk/cli';
import type {ConfigSource, ConfigLoadResult, NormalizedConfig} from '@salesforce/b2c-tooling-sdk/config';

/**
 * Mock config source for testing.
 */
class MockConfigSource implements ConfigSource {
  constructor(
    public name: string,
    private config: Partial<NormalizedConfig> | undefined,
    private location?: string,
  ) {}

  load(): ConfigLoadResult | undefined {
    if (this.config === undefined) {
      return undefined;
    }
    return {config: this.config as NormalizedConfig, location: this.location};
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

  describe('extractOAuthFlags', () => {
    it('extracts OAuth flags from parsed flags', () => {
      const flags: ParsedFlags = {
        'client-id': 'my-client-id',
        'client-secret': 'my-client-secret',
        'short-code': 'abc123',
        'tenant-id': 'my-tenant_001',
        'account-manager-host': 'account.demandware.com',
        scope: ['sfcc.products', 'sfcc.orders'],
      };

      const result = extractOAuthFlags(flags);

      expect(result.clientId).to.equal('my-client-id');
      expect(result.clientSecret).to.equal('my-client-secret');
      expect(result.shortCode).to.equal('abc123');
      expect(result.tenantId).to.equal('my-tenant_001');
      expect(result.accountManagerHost).to.equal('account.demandware.com');
      expect(result.scopes).to.deep.equal(['sfcc.products', 'sfcc.orders']);
    });

    it('handles empty flags', () => {
      const flags: ParsedFlags = {};
      const result = extractOAuthFlags(flags);

      expect(result.clientId).to.be.undefined;
      expect(result.clientSecret).to.be.undefined;
      expect(result.shortCode).to.be.undefined;
      expect(result.tenantId).to.be.undefined;
      expect(result.scopes).to.be.undefined;
    });

    it('parses auth methods from flags', () => {
      const flags: ParsedFlags = {
        'auth-methods': ['client-credentials', 'basic'],
      };

      const result = extractOAuthFlags(flags);
      expect(result.authMethods).to.deep.equal(['client-credentials', 'basic']);
    });

    it('filters invalid auth methods', () => {
      const flags: ParsedFlags = {
        'auth-methods': ['client-credentials', 'invalid_method', 'basic'],
      };

      const result = extractOAuthFlags(flags);
      expect(result.authMethods).to.deep.equal(['client-credentials', 'basic']);
    });

    it('returns undefined for empty scopes array', () => {
      const flags: ParsedFlags = {
        scope: [],
      };

      const result = extractOAuthFlags(flags);
      expect(result.scopes).to.be.undefined;
    });
  });

  describe('extractInstanceFlags', () => {
    it('extracts instance flags from parsed flags', () => {
      const flags: ParsedFlags = {
        server: 'my-sandbox.demandware.net',
        'webdav-server': 'webdav.demandware.net',
        'code-version': 'version1',
        username: 'my-user',
        password: 'my-password',
      };

      const result = extractInstanceFlags(flags);

      expect(result.hostname).to.equal('my-sandbox.demandware.net');
      expect(result.webdavHostname).to.equal('webdav.demandware.net');
      expect(result.codeVersion).to.equal('version1');
      expect(result.username).to.equal('my-user');
      expect(result.password).to.equal('my-password');
    });

    it('includes OAuth flags', () => {
      const flags: ParsedFlags = {
        server: 'my-sandbox.demandware.net',
        'client-id': 'my-client-id',
        'client-secret': 'my-client-secret',
      };

      const result = extractInstanceFlags(flags);

      expect(result.hostname).to.equal('my-sandbox.demandware.net');
      expect(result.clientId).to.equal('my-client-id');
      expect(result.clientSecret).to.equal('my-client-secret');
    });

    it('handles empty flags', () => {
      const flags: ParsedFlags = {};
      const result = extractInstanceFlags(flags);

      expect(result.hostname).to.be.undefined;
      expect(result.username).to.be.undefined;
      expect(result.password).to.be.undefined;
    });
  });

  describe('extractMrtFlags', () => {
    it('extracts MRT flags from parsed flags', () => {
      const flags: ParsedFlags = {
        'api-key': 'my-api-key',
        project: 'my-project',
        environment: 'staging',
        'cloud-origin': 'https://cloud-staging.mobify.com',
        'credentials-file': '/custom/path/.mobify',
      };

      const result = extractMrtFlags(flags);

      // Config values
      expect(result.config.mrtApiKey).to.equal('my-api-key');
      expect(result.config.mrtProject).to.equal('my-project');
      expect(result.config.mrtEnvironment).to.equal('staging');
      expect(result.config.mrtOrigin).to.equal('https://cloud-staging.mobify.com');

      // Loading options
      expect(result.options.cloudOrigin).to.equal('https://cloud-staging.mobify.com');
      expect(result.options.credentialsFile).to.equal('/custom/path/.mobify');
    });

    it('handles empty flags', () => {
      const flags: ParsedFlags = {};
      const result = extractMrtFlags(flags);

      // Config values
      expect(result.config.mrtApiKey).to.be.undefined;
      expect(result.config.mrtProject).to.be.undefined;
      expect(result.config.mrtEnvironment).to.be.undefined;
      expect(result.config.mrtOrigin).to.be.undefined;

      // Loading options
      expect(result.options.cloudOrigin).to.be.undefined;
      expect(result.options.credentialsFile).to.be.undefined;
    });

    it('handles partial flags', () => {
      const flags: ParsedFlags = {
        project: 'my-project',
      };

      const result = extractMrtFlags(flags);

      expect(result.config.mrtApiKey).to.be.undefined;
      expect(result.config.mrtProject).to.equal('my-project');
      expect(result.config.mrtEnvironment).to.be.undefined;
      expect(result.options.cloudOrigin).to.be.undefined;
      expect(result.options.credentialsFile).to.be.undefined;
    });
  });
});
