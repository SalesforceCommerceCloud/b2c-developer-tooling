/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  ConfigResolver,
  createConfigResolver,
  resolveConfig,
  globalConfigSourceRegistry,
  type ConfigSource,
  type ConfigLoadResult,
  type NormalizedConfig,
  type ResolveConfigOptions,
} from '@salesforce/b2c-tooling-sdk/config';

/**
 * Mock config source for testing.
 */
class MockSource implements ConfigSource {
  public priority?: number;

  constructor(
    public name: string,
    private config: NormalizedConfig | undefined,
    private location?: string,
    priority?: number,
  ) {
    this.priority = priority;
  }

  load(_options: ResolveConfigOptions): ConfigLoadResult | undefined {
    if (this.config === undefined) {
      return undefined;
    }
    return {config: this.config, location: this.location};
  }
}

describe('config/resolver', () => {
  describe('ConfigResolver', () => {
    describe('resolve', () => {
      it('resolves from a single source', () => {
        const source = new MockSource('test', {
          hostname: 'example.demandware.net',
          codeVersion: 'v1',
        });
        const resolver = new ConfigResolver([source]);

        const {config, warnings, sources} = resolver.resolve();

        expect(config.hostname).to.equal('example.demandware.net');
        expect(config.codeVersion).to.equal('v1');
        expect(warnings).to.have.length(0);
        expect(sources).to.have.length(1);
        expect(sources[0].name).to.equal('test');
      });

      it('resolves tenantId from source', () => {
        const source = new MockSource('test', {
          hostname: 'example.demandware.net',
          tenantId: 'test_prd',
        });
        const resolver = new ConfigResolver([source]);

        const {config} = resolver.resolve();

        expect(config.tenantId).to.equal('test_prd');
      });

      it('allows overrides to take precedence for tenantId', () => {
        const source = new MockSource('test', {
          hostname: 'example.demandware.net',
          tenantId: 'source_prd',
        });
        const resolver = new ConfigResolver([source]);

        const {config} = resolver.resolve({tenantId: 'override_prd'});

        expect(config.tenantId).to.equal('override_prd');
      });

      it('applies overrides with highest priority', () => {
        const source = new MockSource('test', {
          hostname: 'source.demandware.net',
          codeVersion: 'v1',
          clientId: 'source-client',
        });
        const resolver = new ConfigResolver([source]);

        const {config} = resolver.resolve({
          hostname: 'source.demandware.net',
          codeVersion: 'v2',
        });

        expect(config.hostname).to.equal('source.demandware.net');
        expect(config.codeVersion).to.equal('v2');
        expect(config.clientId).to.equal('source-client');
      });

      it('resolves from multiple sources with priority order', () => {
        const source1 = new MockSource('first', {
          hostname: 'first.demandware.net',
          codeVersion: 'v1',
        });
        const source2 = new MockSource('second', {
          hostname: 'second.demandware.net',
          codeVersion: 'v2',
          clientId: 'second-client',
        });
        const resolver = new ConfigResolver([source1, source2]);

        const {config, sources} = resolver.resolve();

        // First source wins for hostname and codeVersion
        expect(config.hostname).to.equal('first.demandware.net');
        expect(config.codeVersion).to.equal('v1');
        // Second source contributes clientId (not in first source)
        expect(config.clientId).to.equal('second-client');
        expect(sources).to.have.length(2);
      });

      it('tracks source locations when available', () => {
        const source = new MockSource('test', {hostname: 'example.demandware.net'}, '/path/to/dw.json');
        const resolver = new ConfigResolver([source]);

        const {sources} = resolver.resolve();

        expect(sources[0].location).to.equal('/path/to/dw.json');
      });

      it('tracks which fields each source provided', () => {
        const source1 = new MockSource('first', {
          hostname: 'example.demandware.net',
        });
        const source2 = new MockSource('second', {
          clientId: 'test-client',
          clientSecret: 'test-secret',
        });
        const resolver = new ConfigResolver([source1, source2]);

        const {sources} = resolver.resolve();

        expect(sources[0].fields).to.deep.equal(['hostname']);
        expect(sources[0].fieldsIgnored).to.be.undefined;
        expect(sources[1].fields).to.have.members(['clientId', 'clientSecret']);
        expect(sources[1].fieldsIgnored).to.be.undefined;
      });

      it('tracks fieldsIgnored when higher priority source provides same fields', () => {
        const source1 = new MockSource('higher-priority', {
          hostname: 'example.demandware.net',
          clientId: 'higher-client',
          clientSecret: 'higher-secret',
        });
        const source2 = new MockSource('lower-priority', {
          clientId: 'lower-client',
          clientSecret: 'lower-secret',
        });
        const resolver = new ConfigResolver([source1, source2]);

        const {sources, config} = resolver.resolve();

        // Higher priority source provides and uses all its fields
        expect(sources[0].fields).to.have.members(['hostname', 'clientId', 'clientSecret']);
        expect(sources[0].fieldsIgnored).to.be.undefined;

        // Lower priority source provides fields but they are ignored
        expect(sources[1].fields).to.have.members(['clientId', 'clientSecret']);
        expect(sources[1].fieldsIgnored).to.have.members(['clientId', 'clientSecret']);

        // Final config uses higher priority values
        expect(config.clientId).to.equal('higher-client');
        expect(config.clientSecret).to.equal('higher-secret');
      });

      it('skips sources that return undefined', () => {
        const source1 = new MockSource('empty', undefined);
        const source2 = new MockSource('valid', {
          hostname: 'example.demandware.net',
        });
        const resolver = new ConfigResolver([source1, source2]);

        const {config, sources} = resolver.resolve();

        expect(config.hostname).to.equal('example.demandware.net');
        expect(sources).to.have.length(1);
        expect(sources[0].name).to.equal('valid');
      });

      it('skips sources that return empty config', () => {
        const source1 = new MockSource('empty', {});
        const source2 = new MockSource('valid', {
          hostname: 'example.demandware.net',
        });
        const resolver = new ConfigResolver([source1, source2]);

        const {sources} = resolver.resolve();

        expect(sources).to.have.length(1);
        expect(sources[0].name).to.equal('valid');
      });

      it('applies hostname mismatch protection', () => {
        const source = new MockSource('test', {
          hostname: 'prod.demandware.net',
          clientId: 'prod-client',
          clientSecret: 'prod-secret',
        });
        const resolver = new ConfigResolver([source]);

        const {config, warnings} = resolver.resolve({hostname: 'staging.demandware.net'}, {hostnameProtection: true});

        expect(config.hostname).to.equal('staging.demandware.net');
        expect(config.clientId).to.be.undefined;
        expect(config.clientSecret).to.be.undefined;
        expect(warnings).to.have.length(1);
        expect(warnings[0].code).to.equal('HOSTNAME_MISMATCH');
      });

      it('creates SOURCE_ERROR warning when source throws', () => {
        // Create a source that throws an error
        const throwingSource: ConfigSource = {
          name: 'throwing-source',
          load() {
            throw new Error('Malformed config file');
          },
        };
        const validSource = new MockSource('valid', {
          hostname: 'example.demandware.net',
          clientId: 'valid-client',
        });
        const resolver = new ConfigResolver([throwingSource, validSource]);

        const {config, warnings, sources} = resolver.resolve();

        // Should have one SOURCE_ERROR warning
        expect(warnings).to.have.length(1);
        expect(warnings[0].code).to.equal('SOURCE_ERROR');
        expect(warnings[0].message).to.include('throwing-source');
        expect(warnings[0].message).to.include('Malformed config file');
        expect(warnings[0].details).to.deep.equal({
          source: 'throwing-source',
          error: 'Malformed config file',
        });

        // Valid source should still contribute config
        expect(config.hostname).to.equal('example.demandware.net');
        expect(config.clientId).to.equal('valid-client');
        expect(sources).to.have.length(1);
        expect(sources[0].name).to.equal('valid');
      });

      it('continues with remaining sources after SOURCE_ERROR', () => {
        // First source throws, second succeeds, third also throws
        const throwingSource1: ConfigSource = {
          name: 'bad-source-1',
          priority: -1,
          load() {
            throw new Error('Error 1');
          },
        };
        const validSource = new MockSource('valid', {hostname: 'example.com'}, undefined, 0);
        const throwingSource2: ConfigSource = {
          name: 'bad-source-2',
          priority: 1,
          load() {
            throw new Error('Error 2');
          },
        };
        const resolver = new ConfigResolver([throwingSource1, validSource, throwingSource2]);

        const {config, warnings, sources} = resolver.resolve();

        // Should have two SOURCE_ERROR warnings
        expect(warnings).to.have.length(2);
        expect(warnings[0].code).to.equal('SOURCE_ERROR');
        expect(warnings[0].message).to.include('bad-source-1');
        expect(warnings[1].code).to.equal('SOURCE_ERROR');
        expect(warnings[1].message).to.include('bad-source-2');

        // Valid source contributes config
        expect(config.hostname).to.equal('example.com');
        expect(sources).to.have.length(1);
      });

      it('returns empty config when no sources have data', () => {
        const resolver = new ConfigResolver([]);

        const {config, sources} = resolver.resolve();

        // Config has all fields set to undefined (not an empty object)
        expect(config.hostname).to.be.undefined;
        expect(config.clientId).to.be.undefined;
        expect(sources).to.have.length(0);
      });
    });

    describe('credential grouping', () => {
      it('does not mix clientId and clientSecret from different sources', () => {
        const source1 = new MockSource('first', {clientId: 'first-client'});
        const source2 = new MockSource('second', {clientSecret: 'second-secret'});
        const resolver = new ConfigResolver([source1, source2]);

        const {config} = resolver.resolve();

        expect(config.clientId).to.equal('first-client');
        expect(config.clientSecret).to.be.undefined; // Not mixed from source2
      });

      it('does not mix username and password from different sources', () => {
        const source1 = new MockSource('first', {username: 'user1'});
        const source2 = new MockSource('second', {password: 'pass2'});
        const resolver = new ConfigResolver([source1, source2]);

        const {config} = resolver.resolve();

        expect(config.username).to.equal('user1');
        expect(config.password).to.be.undefined; // Not mixed from source2
      });

      it('allows complete credential pairs from same source', () => {
        const source1 = new MockSource('first', {hostname: 'example.com'});
        const source2 = new MockSource('second', {
          clientId: 'client',
          clientSecret: 'secret',
        });
        const resolver = new ConfigResolver([source1, source2]);

        const {config} = resolver.resolve();

        expect(config.hostname).to.equal('example.com');
        expect(config.clientId).to.equal('client');
        expect(config.clientSecret).to.equal('secret');
      });

      it('allows non-grouped fields to merge normally', () => {
        const source1 = new MockSource('first', {clientId: 'client'});
        const source2 = new MockSource('second', {
          hostname: 'example.com',
          codeVersion: 'v1',
        });
        const resolver = new ConfigResolver([source1, source2]);

        const {config} = resolver.resolve();

        expect(config.clientId).to.equal('client');
        expect(config.hostname).to.equal('example.com');
        expect(config.codeVersion).to.equal('v1');
      });

      it('blocks both oauth fields when clientId is claimed', () => {
        const source1 = new MockSource('first', {clientId: 'first-client'});
        const source2 = new MockSource('second', {
          clientId: 'second-client',
          clientSecret: 'second-secret',
        });
        const resolver = new ConfigResolver([source1, source2]);

        const {config} = resolver.resolve();

        expect(config.clientId).to.equal('first-client');
        expect(config.clientSecret).to.be.undefined; // Blocked due to group claim
      });

      it('blocks both basic auth fields when username is claimed', () => {
        const source1 = new MockSource('first', {username: 'first-user'});
        const source2 = new MockSource('second', {
          username: 'second-user',
          password: 'second-pass',
        });
        const resolver = new ConfigResolver([source1, source2]);

        const {config} = resolver.resolve();

        expect(config.username).to.equal('first-user');
        expect(config.password).to.be.undefined; // Blocked due to group claim
      });

      it('allows independent credential groups to come from different sources', () => {
        const source1 = new MockSource('first', {
          clientId: 'oauth-client',
          clientSecret: 'oauth-secret',
        });
        const source2 = new MockSource('second', {
          username: 'basic-user',
          password: 'basic-pass',
        });
        const resolver = new ConfigResolver([source1, source2]);

        const {config} = resolver.resolve();

        // OAuth from source1
        expect(config.clientId).to.equal('oauth-client');
        expect(config.clientSecret).to.equal('oauth-secret');
        // Basic from source2
        expect(config.username).to.equal('basic-user');
        expect(config.password).to.equal('basic-pass');
      });
    });

    describe('createAuthCredentials', () => {
      it('creates auth credentials from resolved config', () => {
        const source = new MockSource('test', {
          hostname: 'example.demandware.net',
          clientId: 'test-client',
          clientSecret: 'test-secret',
          scopes: ['mail', 'roles'],
          username: 'user',
          password: 'pass',
          mrtApiKey: 'api-key',
        });
        const resolver = new ConfigResolver([source]);

        const credentials = resolver.createAuthCredentials();

        expect(credentials.clientId).to.equal('test-client');
        expect(credentials.clientSecret).to.equal('test-secret');
        expect(credentials.scopes).to.deep.equal(['mail', 'roles']);
        expect(credentials.username).to.equal('user');
        expect(credentials.password).to.equal('pass');
        expect(credentials.apiKey).to.equal('api-key');
      });

      it('applies overrides to auth credentials', () => {
        const source = new MockSource('test', {
          hostname: 'example.demandware.net',
          clientId: 'source-client',
        });
        const resolver = new ConfigResolver([source]);

        const credentials = resolver.createAuthCredentials({
          hostname: 'example.demandware.net',
          clientId: 'override-client',
        });

        expect(credentials.clientId).to.equal('override-client');
      });
    });
  });

  describe('createConfigResolver', () => {
    it('creates a resolver with default sources', () => {
      const resolver = createConfigResolver();

      // Should not throw
      const {config} = resolver.resolve({hostname: 'test.demandware.net'});

      expect(config.hostname).to.equal('test.demandware.net');
    });
  });

  describe('priority-based sorting', () => {
    it('sorts sources by priority (lower number = higher priority)', () => {
      // Sources added in wrong order, but should be sorted by priority
      const lowPriority = new MockSource('low', {clientId: 'low-client'}, undefined, 100);
      const highPriority = new MockSource('high', {clientId: 'high-client'}, undefined, -10);
      const defaultPriority = new MockSource('default', {clientId: 'default-client'}, undefined, 0);

      // Pass sources in "wrong" order - they should get sorted
      const resolver = new ConfigResolver([lowPriority, defaultPriority, highPriority]);
      const {config} = resolver.resolve();

      // High priority source (-10) wins
      expect(config.clientId).to.equal('high-client');
    });

    it('treats undefined priority as 0', () => {
      const withPriority = new MockSource('with', {clientId: 'with-priority'}, undefined, 10);
      const noPriority = new MockSource('no', {clientId: 'no-priority'}, undefined, undefined);

      // No priority (=0) should win over priority 10
      const resolver = new ConfigResolver([withPriority, noPriority]);
      const {config} = resolver.resolve();

      expect(config.clientId).to.equal('no-priority');
    });

    it('maintains insertion order for same priority', () => {
      const first = new MockSource('first', {clientId: 'first-client'}, undefined, 0);
      const second = new MockSource('second', {clientId: 'second-client'}, undefined, 0);

      const resolver = new ConfigResolver([first, second]);
      const {config} = resolver.resolve();

      // First source should win since both have same priority
      expect(config.clientId).to.equal('first-client');
    });

    it('negative priorities come before 0', () => {
      const before = new MockSource('before', {hostname: 'before.com'}, undefined, -1);
      const builtin = new MockSource('builtin', {hostname: 'builtin.com'}, undefined, 0);

      const resolver = new ConfigResolver([builtin, before]);
      const {config} = resolver.resolve();

      // -1 priority should win
      expect(config.hostname).to.equal('before.com');
    });

    it('high priorities (1000) come last', () => {
      const packageJson = new MockSource('package', {shortCode: 'package-code'}, undefined, 1000);
      const dwJson = new MockSource('dwjson', {shortCode: 'dw-code'}, undefined, 0);

      const resolver = new ConfigResolver([packageJson, dwJson]);
      const {config} = resolver.resolve();

      // 0 priority should win over 1000
      expect(config.shortCode).to.equal('dw-code');
    });

    it('plugin priorities work with before/after pattern', () => {
      // Simulating: plugin 'before' (-1), builtin (0), plugin 'after' (10)
      const pluginBefore = new MockSource('plugin-before', {clientId: 'before-client'}, undefined, -1);
      const builtin = new MockSource('builtin', {clientId: 'builtin-client', hostname: 'builtin.com'}, undefined, 0);
      const pluginAfter = new MockSource(
        'plugin-after',
        {clientId: 'after-client', mrtProject: 'after-project'},
        undefined,
        10,
      );

      const resolver = new ConfigResolver([pluginAfter, builtin, pluginBefore]);
      const {config} = resolver.resolve();

      // 'before' plugin wins for clientId
      expect(config.clientId).to.equal('before-client');
      // builtin provides hostname (not in before plugin)
      expect(config.hostname).to.equal('builtin.com');
      // 'after' plugin provides mrtProject (not in others)
      expect(config.mrtProject).to.equal('after-project');
    });
  });

  describe('global config source registry integration', () => {
    afterEach(() => {
      globalConfigSourceRegistry.clear();
    });

    it('resolveConfig() includes globally registered sources', () => {
      const source: ConfigSource = {
        name: 'global-test',
        priority: -1,
        load() {
          return {config: {hostname: 'global.example.com'}, location: 'global'};
        },
      };
      globalConfigSourceRegistry.register(source);

      const config = resolveConfig({}, {replaceDefaultSources: true});

      expect(config.values.hostname).to.equal('global.example.com');
      expect(config.sources).to.have.length(1);
      expect(config.sources[0].name).to.equal('global-test');
    });

    it('global sources participate in priority sorting', () => {
      const lowPriority: ConfigSource = {
        name: 'global-low',
        priority: 100,
        load() {
          return {config: {hostname: 'low.example.com'}};
        },
      };
      const highPriority: ConfigSource = {
        name: 'global-high',
        priority: -10,
        load() {
          return {config: {hostname: 'high.example.com'}};
        },
      };
      globalConfigSourceRegistry.register(lowPriority);
      globalConfigSourceRegistry.register(highPriority);

      const config = resolveConfig({}, {replaceDefaultSources: true});

      // High priority source (-10) wins
      expect(config.values.hostname).to.equal('high.example.com');
    });

    it('explicit sourcesBefore/sourcesAfter merge with global sources', () => {
      const globalSource: ConfigSource = {
        name: 'global-source',
        priority: 10,
        load() {
          return {config: {clientId: 'global-client'}};
        },
      };
      globalConfigSourceRegistry.register(globalSource);

      const explicitSource: ConfigSource = {
        name: 'explicit-source',
        priority: -1,
        load() {
          return {config: {hostname: 'explicit.example.com'}};
        },
      };

      const config = resolveConfig({}, {replaceDefaultSources: true, sourcesBefore: [explicitSource]});

      // Both sources should contribute
      expect(config.values.hostname).to.equal('explicit.example.com');
      expect(config.values.clientId).to.equal('global-client');
    });

    it('global sources are included when replaceDefaultSources is true', () => {
      const source: ConfigSource = {
        name: 'global-persistent',
        priority: 0,
        load() {
          return {config: {shortCode: 'global-code'}};
        },
      };
      globalConfigSourceRegistry.register(source);

      const config = resolveConfig({}, {replaceDefaultSources: true});

      expect(config.values.shortCode).to.equal('global-code');
    });
  });

  describe('TLS/mTLS configuration', () => {
    it('resolves TLS options from source', () => {
      const source = new MockSource('test', {
        hostname: 'example.demandware.net',
        certificate: '/path/to/cert.p12',
        certificatePassphrase: 'secret',
        selfSigned: true,
      });
      const resolver = new ConfigResolver([source]);

      const {config} = resolver.resolve();

      expect(config.certificate).to.equal('/path/to/cert.p12');
      expect(config.certificatePassphrase).to.equal('secret');
      expect(config.selfSigned).to.equal(true);
    });

    it('allows overrides to take precedence for TLS options', () => {
      const source = new MockSource('test', {
        hostname: 'example.demandware.net',
        certificate: '/source/cert.p12',
        selfSigned: false,
      });
      const resolver = new ConfigResolver([source]);

      const {config} = resolver.resolve({
        hostname: 'example.demandware.net',
        certificate: '/override/cert.p12',
        selfSigned: true,
      });

      expect(config.certificate).to.equal('/override/cert.p12');
      expect(config.selfSigned).to.equal(true);
    });

    it('merges TLS options from multiple sources', () => {
      const source1 = new MockSource('first', {
        hostname: 'example.demandware.net',
        certificate: '/path/to/cert.p12',
      });
      const source2 = new MockSource('second', {
        certificatePassphrase: 'passphrase-from-second',
        selfSigned: true,
      });
      const resolver = new ConfigResolver([source1, source2]);

      const {config} = resolver.resolve();

      expect(config.hostname).to.equal('example.demandware.net');
      expect(config.certificate).to.equal('/path/to/cert.p12');
      expect(config.certificatePassphrase).to.equal('passphrase-from-second');
      expect(config.selfSigned).to.equal(true);
    });

    it('discards TLS options on hostname mismatch protection', () => {
      const source = new MockSource('test', {
        hostname: 'prod.demandware.net',
        certificate: '/prod/cert.p12',
        certificatePassphrase: 'prod-secret',
        selfSigned: false,
      });
      const resolver = new ConfigResolver([source]);

      const {config, warnings} = resolver.resolve({hostname: 'staging.demandware.net'}, {hostnameProtection: true});

      expect(config.hostname).to.equal('staging.demandware.net');
      expect(config.certificate).to.be.undefined;
      expect(config.certificatePassphrase).to.be.undefined;
      expect(config.selfSigned).to.be.undefined;
      expect(warnings).to.have.length(1);
      expect(warnings[0].code).to.equal('HOSTNAME_MISMATCH');
    });
  });
});
