/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  ConfigResolver,
  createConfigResolver,
  type ConfigSource,
  type NormalizedConfig,
  type ResolveConfigOptions,
} from '@salesforce/b2c-tooling-sdk/config';

/**
 * Mock config source for testing.
 */
class MockSource implements ConfigSource {
  constructor(
    public name: string,
    private config: NormalizedConfig | undefined,
    private path?: string,
  ) {}

  load(_options: ResolveConfigOptions): NormalizedConfig | undefined {
    return this.config;
  }

  getPath(): string | undefined {
    return this.path;
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

      it('tracks source paths when available', () => {
        const source = new MockSource('test', {hostname: 'example.demandware.net'}, '/path/to/dw.json');
        const resolver = new ConfigResolver([source]);

        const {sources} = resolver.resolve();

        expect(sources[0].path).to.equal('/path/to/dw.json');
      });

      it('tracks which fields each source contributed', () => {
        const source1 = new MockSource('first', {
          hostname: 'example.demandware.net',
        });
        const source2 = new MockSource('second', {
          clientId: 'test-client',
          clientSecret: 'test-secret',
        });
        const resolver = new ConfigResolver([source1, source2]);

        const {sources} = resolver.resolve();

        expect(sources[0].fieldsContributed).to.deep.equal(['hostname']);
        expect(sources[1].fieldsContributed).to.have.members(['clientId', 'clientSecret']);
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
});
