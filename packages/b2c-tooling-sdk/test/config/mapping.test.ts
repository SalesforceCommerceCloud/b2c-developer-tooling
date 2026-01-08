/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {
  mapDwJsonToNormalizedConfig,
  mergeConfigsWithProtection,
  getPopulatedFields,
} from '@salesforce/b2c-tooling-sdk/config';

describe('config/mapping', () => {
  describe('mapDwJsonToNormalizedConfig', () => {
    it('maps basic dw.json fields to normalized config', () => {
      const dwJson = {
        hostname: 'example.demandware.net',
        'code-version': 'v1',
        username: 'test-user',
        password: 'test-pass',
      };

      const config = mapDwJsonToNormalizedConfig(dwJson);

      expect(config.hostname).to.equal('example.demandware.net');
      expect(config.codeVersion).to.equal('v1');
      expect(config.username).to.equal('test-user');
      expect(config.password).to.equal('test-pass');
    });

    it('maps OAuth credentials', () => {
      const dwJson = {
        hostname: 'example.demandware.net',
        'client-id': 'my-client-id',
        'client-secret': 'my-client-secret',
        'oauth-scopes': ['mail', 'roles'],
      };

      const config = mapDwJsonToNormalizedConfig(dwJson);

      expect(config.clientId).to.equal('my-client-id');
      expect(config.clientSecret).to.equal('my-client-secret');
      expect(config.scopes).to.deep.equal(['mail', 'roles']);
    });

    it('maps webdav-hostname as first priority', () => {
      const dwJson = {
        hostname: 'example.demandware.net',
        'webdav-hostname': 'webdav.example.com',
        secureHostname: 'secure.example.com',
        'secure-server': 'secure-server.example.com',
      };

      const config = mapDwJsonToNormalizedConfig(dwJson);

      expect(config.webdavHostname).to.equal('webdav.example.com');
    });

    it('maps secureHostname when webdav-hostname is not present', () => {
      const dwJson = {
        hostname: 'example.demandware.net',
        secureHostname: 'secure.example.com',
        'secure-server': 'secure-server.example.com',
      };

      const config = mapDwJsonToNormalizedConfig(dwJson);

      expect(config.webdavHostname).to.equal('secure.example.com');
    });

    it('maps secure-server when other webdav options are not present', () => {
      const dwJson = {
        hostname: 'example.demandware.net',
        'secure-server': 'secure-server.example.com',
      };

      const config = mapDwJsonToNormalizedConfig(dwJson);

      expect(config.webdavHostname).to.equal('secure-server.example.com');
    });

    it('maps shortCode as first priority', () => {
      const dwJson = {
        hostname: 'example.demandware.net',
        shortCode: 'abc123',
        'short-code': 'def456',
        'scapi-shortcode': 'ghi789',
      };

      const config = mapDwJsonToNormalizedConfig(dwJson);

      expect(config.shortCode).to.equal('abc123');
    });

    it('maps short-code when shortCode is not present', () => {
      const dwJson = {
        hostname: 'example.demandware.net',
        'short-code': 'def456',
        'scapi-shortcode': 'ghi789',
      };

      const config = mapDwJsonToNormalizedConfig(dwJson);

      expect(config.shortCode).to.equal('def456');
    });

    it('maps scapi-shortcode when other short code options are not present', () => {
      const dwJson = {
        hostname: 'example.demandware.net',
        'scapi-shortcode': 'ghi789',
      };

      const config = mapDwJsonToNormalizedConfig(dwJson);

      expect(config.shortCode).to.equal('ghi789');
    });

    it('maps MRT fields', () => {
      const dwJson = {
        hostname: 'example.demandware.net',
        mrtProject: 'my-project',
        mrtEnvironment: 'staging',
      };

      const config = mapDwJsonToNormalizedConfig(dwJson);

      expect(config.mrtProject).to.equal('my-project');
      expect(config.mrtEnvironment).to.equal('staging');
    });

    it('maps instance name from dw.json name field', () => {
      const dwJson = {
        hostname: 'example.demandware.net',
        name: 'production',
      };

      const config = mapDwJsonToNormalizedConfig(dwJson);

      expect(config.instanceName).to.equal('production');
    });

    it('maps auth-methods', () => {
      const dwJson = {
        hostname: 'example.demandware.net',
        'auth-methods': ['client-credentials', 'basic'] as ('client-credentials' | 'basic')[],
      };

      const config = mapDwJsonToNormalizedConfig(dwJson);

      expect(config.authMethods).to.deep.equal(['client-credentials', 'basic']);
    });
  });

  describe('mergeConfigsWithProtection', () => {
    it('merges overrides with base config (overrides win)', () => {
      const overrides = {
        codeVersion: 'v2',
        clientId: 'override-client',
      };
      const base = {
        hostname: 'example.demandware.net',
        codeVersion: 'v1',
        clientId: 'base-client',
        clientSecret: 'base-secret',
      };

      const {config, warnings, hostnameMismatch} = mergeConfigsWithProtection(overrides, base);

      expect(config.hostname).to.equal('example.demandware.net');
      expect(config.codeVersion).to.equal('v2');
      expect(config.clientId).to.equal('override-client');
      expect(config.clientSecret).to.equal('base-secret');
      expect(warnings).to.have.length(0);
      expect(hostnameMismatch).to.equal(false);
    });

    it('detects hostname mismatch and ignores base config', () => {
      const overrides = {
        hostname: 'staging.demandware.net',
        clientId: 'staging-client',
      };
      const base = {
        hostname: 'prod.demandware.net',
        clientId: 'prod-client',
        clientSecret: 'prod-secret',
      };

      const {config, warnings, hostnameMismatch} = mergeConfigsWithProtection(overrides, base);

      expect(config.hostname).to.equal('staging.demandware.net');
      expect(config.clientId).to.equal('staging-client');
      expect(config.clientSecret).to.be.undefined;
      expect(hostnameMismatch).to.equal(true);
      expect(warnings).to.have.length(1);
      expect(warnings[0].code).to.equal('HOSTNAME_MISMATCH');
      expect(warnings[0].message).to.include('staging.demandware.net');
      expect(warnings[0].message).to.include('prod.demandware.net');
    });

    it('does not trigger mismatch when hostnames match', () => {
      const overrides = {
        hostname: 'example.demandware.net',
        codeVersion: 'v2',
      };
      const base = {
        hostname: 'example.demandware.net',
        codeVersion: 'v1',
        clientSecret: 'secret',
      };

      const {config, warnings, hostnameMismatch} = mergeConfigsWithProtection(overrides, base);

      expect(config.hostname).to.equal('example.demandware.net');
      expect(config.codeVersion).to.equal('v2');
      expect(config.clientSecret).to.equal('secret');
      expect(hostnameMismatch).to.equal(false);
      expect(warnings).to.have.length(0);
    });

    it('does not trigger mismatch when no override hostname is provided', () => {
      const overrides = {
        codeVersion: 'v2',
      };
      const base = {
        hostname: 'example.demandware.net',
        codeVersion: 'v1',
      };

      const {config, warnings, hostnameMismatch} = mergeConfigsWithProtection(overrides, base);

      expect(config.hostname).to.equal('example.demandware.net');
      expect(config.codeVersion).to.equal('v2');
      expect(hostnameMismatch).to.equal(false);
      expect(warnings).to.have.length(0);
    });

    it('can disable hostname protection', () => {
      const overrides = {
        hostname: 'staging.demandware.net',
      };
      const base = {
        hostname: 'prod.demandware.net',
        clientSecret: 'prod-secret',
      };

      const {config, warnings, hostnameMismatch} = mergeConfigsWithProtection(overrides, base, {
        hostnameProtection: false,
      });

      expect(config.hostname).to.equal('staging.demandware.net');
      expect(config.clientSecret).to.equal('prod-secret');
      expect(hostnameMismatch).to.equal(false);
      expect(warnings).to.have.length(0);
    });

    it('handles empty base config', () => {
      const overrides = {
        hostname: 'example.demandware.net',
        clientId: 'client',
      };
      const base = {};

      const {config, warnings} = mergeConfigsWithProtection(overrides, base);

      expect(config.hostname).to.equal('example.demandware.net');
      expect(config.clientId).to.equal('client');
      expect(warnings).to.have.length(0);
    });

    it('handles empty overrides', () => {
      const overrides = {};
      const base = {
        hostname: 'example.demandware.net',
        codeVersion: 'v1',
      };

      const {config, warnings} = mergeConfigsWithProtection(overrides, base);

      expect(config.hostname).to.equal('example.demandware.net');
      expect(config.codeVersion).to.equal('v1');
      expect(warnings).to.have.length(0);
    });
  });

  describe('getPopulatedFields', () => {
    it('returns list of fields with values', () => {
      const config = {
        hostname: 'example.demandware.net',
        codeVersion: 'v1',
        username: 'user',
      };

      const fields = getPopulatedFields(config);

      expect(fields).to.have.members(['hostname', 'codeVersion', 'username']);
    });

    it('excludes undefined fields', () => {
      const config = {
        hostname: 'example.demandware.net',
        codeVersion: undefined,
        username: undefined,
      };

      const fields = getPopulatedFields(config);

      expect(fields).to.deep.equal(['hostname']);
    });

    it('excludes null fields', () => {
      const config = {
        hostname: 'example.demandware.net',
        codeVersion: null as unknown as string,
      };

      const fields = getPopulatedFields(config);

      expect(fields).to.deep.equal(['hostname']);
    });

    it('excludes empty string fields', () => {
      const config = {
        hostname: 'example.demandware.net',
        codeVersion: '',
      };

      const fields = getPopulatedFields(config);

      expect(fields).to.deep.equal(['hostname']);
    });

    it('returns empty array for empty config', () => {
      const config = {};

      const fields = getPopulatedFields(config);

      expect(fields).to.have.length(0);
    });
  });
});
