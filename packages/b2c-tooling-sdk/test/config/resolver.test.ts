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
