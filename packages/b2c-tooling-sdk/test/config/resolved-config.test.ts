/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
import {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';

describe('config/resolved-config', () => {
  describe('ResolvedB2CConfig', () => {
    describe('validation methods', () => {
      it('hasB2CInstanceConfig returns true when hostname is present', () => {
        const config = resolveConfig({hostname: 'test.demandware.net'});
        expect(config.hasB2CInstanceConfig()).to.be.true;
      });

      it('hasB2CInstanceConfig returns false when hostname is missing', () => {
        const config = resolveConfig({}, {replaceDefaultSources: true, sources: []});
        expect(config.hasB2CInstanceConfig()).to.be.false;
      });

      it('hasMrtConfig returns true when mrtApiKey is present', () => {
        const config = resolveConfig({mrtApiKey: 'test-api-key'});
        expect(config.hasMrtConfig()).to.be.true;
      });

      it('hasMrtConfig returns false when mrtApiKey is missing', () => {
        const config = resolveConfig({}, {replaceDefaultSources: true, sources: []});
        expect(config.hasMrtConfig()).to.be.false;
      });

      it('hasOAuthConfig returns true when clientId is present', () => {
        const config = resolveConfig({clientId: 'test-client'});
        expect(config.hasOAuthConfig()).to.be.true;
      });

      it('hasOAuthConfig returns false when clientId is missing', () => {
        const config = resolveConfig({}, {replaceDefaultSources: true, sources: []});
        expect(config.hasOAuthConfig()).to.be.false;
      });

      it('hasBasicAuthConfig returns true when username and password are present', () => {
        const config = resolveConfig({username: 'user', password: 'pass'});
        expect(config.hasBasicAuthConfig()).to.be.true;
      });

      it('hasBasicAuthConfig returns false when username is missing', () => {
        const config = resolveConfig({password: 'pass'}, {replaceDefaultSources: true, sources: []});
        expect(config.hasBasicAuthConfig()).to.be.false;
      });

      it('hasBasicAuthConfig returns false when password is missing', () => {
        const config = resolveConfig({username: 'user'}, {replaceDefaultSources: true, sources: []});
        expect(config.hasBasicAuthConfig()).to.be.false;
      });
    });

    describe('createB2CInstance', () => {
      it('creates B2CInstance when hostname is present', () => {
        const config = resolveConfig({
          hostname: 'test.demandware.net',
          clientId: 'test-client',
        });
        const instance = config.createB2CInstance();
        expect(instance).to.be.instanceOf(B2CInstance);
      });

      it('throws error when hostname is missing', () => {
        const config = resolveConfig({}, {replaceDefaultSources: true, sources: []});
        expect(() => config.createB2CInstance()).to.throw('B2C instance requires hostname');
      });
    });

    describe('createBasicAuth', () => {
      it('creates BasicAuthStrategy when credentials are present', () => {
        const config = resolveConfig({username: 'user', password: 'pass'});
        const auth = config.createBasicAuth();
        expect(auth).to.be.an('object');
        expect(auth).to.have.property('fetch');
        expect(auth.fetch).to.be.a('function');
      });

      it('throws error when username is missing', () => {
        const config = resolveConfig({password: 'pass'}, {replaceDefaultSources: true, sources: []});
        expect(() => config.createBasicAuth()).to.throw('Basic auth requires username and password');
      });

      it('throws error when password is missing', () => {
        const config = resolveConfig({username: 'user'}, {replaceDefaultSources: true, sources: []});
        expect(() => config.createBasicAuth()).to.throw('Basic auth requires username and password');
      });
    });

    describe('createOAuth', () => {
      it('creates OAuth strategy when clientId is present', () => {
        const config = resolveConfig({clientId: 'test-client'});
        const auth = config.createOAuth();
        expect(auth).to.be.an('object');
        expect(auth).to.have.property('fetch');
        expect(auth.fetch).to.be.a('function');
      });

      it('throws error when clientId is missing', () => {
        const config = resolveConfig({}, {replaceDefaultSources: true, sources: []});
        expect(() => config.createOAuth()).to.throw('OAuth requires clientId');
      });

      it('accepts allowedMethods option', () => {
        const config = resolveConfig({clientId: 'test-client', clientSecret: 'test-secret'});
        const auth = config.createOAuth({allowedMethods: ['client-credentials']});
        expect(auth).to.be.an('object');
      });
    });

    describe('createMrtAuth', () => {
      it('creates ApiKeyStrategy when mrtApiKey is present', () => {
        const config = resolveConfig({mrtApiKey: 'test-api-key'});
        const auth = config.createMrtAuth();
        expect(auth).to.be.an('object');
        expect(auth).to.have.property('fetch');
        expect(auth.fetch).to.be.a('function');
      });

      it('throws error when mrtApiKey is missing', () => {
        const config = resolveConfig({}, {replaceDefaultSources: true, sources: []});
        expect(() => config.createMrtAuth()).to.throw('MRT auth requires mrtApiKey');
      });
    });

    describe('createWebDavAuth', () => {
      it('creates BasicAuthStrategy when basic auth is available', () => {
        const config = resolveConfig({username: 'user', password: 'pass'});
        const auth = config.createWebDavAuth();
        expect(auth).to.be.an('object');
        expect(auth).to.have.property('fetch');
        expect(auth.fetch).to.be.a('function');
      });

      it('creates OAuth strategy when OAuth is available and basic auth is not', () => {
        const config = resolveConfig({clientId: 'test-client'});
        const auth = config.createWebDavAuth();
        expect(auth).to.be.an('object');
        expect(auth).to.have.property('fetch');
        expect(auth.fetch).to.be.a('function');
      });

      it('throws error when no auth is available', () => {
        const config = resolveConfig({}, {replaceDefaultSources: true, sources: []});
        expect(() => config.createWebDavAuth()).to.throw(
          'WebDAV auth requires basic auth (username/password) or OAuth (clientId)',
        );
      });
    });

    describe('createMrtClient', () => {
      it('creates MrtClient when mrtApiKey is present', () => {
        const config = resolveConfig({mrtApiKey: 'test-api-key'});
        const client = config.createMrtClient({org: 'test-org', project: 'test-project', env: 'staging'});
        expect(client).to.be.an('object');
      });

      it('uses config values when options not provided', () => {
        const config = resolveConfig({
          mrtApiKey: 'test-api-key',
          mrtProject: 'config-project',
          mrtEnvironment: 'production',
        });
        const client = config.createMrtClient({org: 'test-org'});
        expect(client).to.be.an('object');
      });

      it('throws error when mrtApiKey is missing', () => {
        const config = resolveConfig({}, {replaceDefaultSources: true, sources: []});
        expect(() => config.createMrtClient({org: 'test-org', project: 'test-project'})).to.throw(
          'MRT auth requires mrtApiKey',
        );
      });
    });

    describe('warnings and sources', () => {
      it('exposes warnings from resolution', () => {
        const config = resolveConfig({hostname: 'override.demandware.net'});
        expect(config.warnings).to.be.an('array');
      });

      it('exposes sources from resolution', () => {
        const config = resolveConfig({hostname: 'test.demandware.net'});
        expect(config.sources).to.be.an('array');
      });

      it('exposes values from resolution', () => {
        const config = resolveConfig({hostname: 'test.demandware.net', codeVersion: 'v1'});
        expect(config.values).to.be.an('object');
        expect(config.values.hostname).to.equal('test.demandware.net');
        expect(config.values.codeVersion).to.equal('v1');
      });
    });
  });
});
