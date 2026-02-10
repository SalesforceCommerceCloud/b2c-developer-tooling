/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {kebabToCamelCase, normalizeConfigKeys, CONFIG_KEY_ALIASES} from '../../src/config/mapping.js';

describe('config/mapping', () => {
  describe('kebabToCamelCase', () => {
    it('converts kebab-case to camelCase', () => {
      expect(kebabToCamelCase('code-version')).to.equal('codeVersion');
      expect(kebabToCamelCase('client-id')).to.equal('clientId');
      expect(kebabToCamelCase('sandbox-api-host')).to.equal('sandboxApiHost');
      expect(kebabToCamelCase('account-manager-host')).to.equal('accountManagerHost');
    });

    it('passes through already-camelCase strings unchanged', () => {
      expect(kebabToCamelCase('hostname')).to.equal('hostname');
      expect(kebabToCamelCase('shortCode')).to.equal('shortCode');
      expect(kebabToCamelCase('mrtProject')).to.equal('mrtProject');
    });

    it('handles multi-segment kebab-case', () => {
      expect(kebabToCamelCase('certificate-passphrase')).to.equal('certificatePassphrase');
      expect(kebabToCamelCase('webdav-hostname')).to.equal('webdavHostname');
    });
  });

  describe('CONFIG_KEY_ALIASES', () => {
    it('maps server to hostname', () => {
      expect(CONFIG_KEY_ALIASES['server']).to.equal('hostname');
    });

    it('maps scapi-shortcode to shortCode', () => {
      expect(CONFIG_KEY_ALIASES['scapi-shortcode']).to.equal('shortCode');
    });

    it('maps WebDAV aliases to webdavHostname', () => {
      expect(CONFIG_KEY_ALIASES['webdav-server']).to.equal('webdavHostname');
      expect(CONFIG_KEY_ALIASES['secure-server']).to.equal('webdavHostname');
      expect(CONFIG_KEY_ALIASES['secureHostname']).to.equal('webdavHostname');
    });

    it('maps legacy TLS/cert aliases', () => {
      expect(CONFIG_KEY_ALIASES['passphrase']).to.equal('certificatePassphrase');
      expect(CONFIG_KEY_ALIASES['selfsigned']).to.equal('selfSigned');
    });

    it('maps cloudOrigin to mrtOrigin', () => {
      expect(CONFIG_KEY_ALIASES['cloudOrigin']).to.equal('mrtOrigin');
    });

    it('maps oauth-scopes to oauthScopes', () => {
      expect(CONFIG_KEY_ALIASES['oauth-scopes']).to.equal('oauthScopes');
    });
  });

  describe('normalizeConfigKeys', () => {
    it('converts kebab-case keys to camelCase', () => {
      const result = normalizeConfigKeys({
        'client-id': 'abc',
        'code-version': 'v1',
        'tenant-id': 'org_123',
      });
      expect(result).to.deep.equal({
        clientId: 'abc',
        codeVersion: 'v1',
        tenantId: 'org_123',
      });
    });

    it('passes through camelCase keys unchanged', () => {
      const result = normalizeConfigKeys({
        hostname: 'test.com',
        shortCode: 'abc',
        mrtProject: 'proj',
      });
      expect(result).to.deep.equal({
        hostname: 'test.com',
        shortCode: 'abc',
        mrtProject: 'proj',
      });
    });

    it('resolves legacy aliases', () => {
      const result = normalizeConfigKeys({
        server: 'test.com',
        passphrase: 'secret',
        selfsigned: true,
        cloudOrigin: 'https://cloud.example.com',
        'scapi-shortcode': 'abc',
      });
      expect(result).to.deep.equal({
        hostname: 'test.com',
        certificatePassphrase: 'secret',
        selfSigned: true,
        mrtOrigin: 'https://cloud.example.com',
        shortCode: 'abc',
      });
    });

    it('first value wins when multiple keys resolve to the same canonical name', () => {
      // Both 'server' (alias) and 'hostname' (canonical) resolve to 'hostname'
      // In JSON object literal order, 'server' comes first
      const result = normalizeConfigKeys({
        server: 'first.com',
        hostname: 'second.com',
      });
      expect(result.hostname).to.equal('first.com');
    });

    it('skips undefined values', () => {
      const result = normalizeConfigKeys({
        hostname: 'test.com',
        'client-id': undefined,
      });
      expect(result).to.deep.equal({hostname: 'test.com'});
      expect('clientId' in result).to.be.false;
    });

    it('handles mixed kebab-case and camelCase input', () => {
      const result = normalizeConfigKeys({
        hostname: 'test.com',
        'client-id': 'abc',
        clientSecret: 'xyz',
        'code-version': 'v1',
        mrtProject: 'proj',
      });
      expect(result).to.deep.equal({
        hostname: 'test.com',
        clientId: 'abc',
        clientSecret: 'xyz',
        codeVersion: 'v1',
        mrtProject: 'proj',
      });
    });

    it('handles empty object', () => {
      expect(normalizeConfigKeys({})).to.deep.equal({});
    });

    it('preserves non-string values', () => {
      const result = normalizeConfigKeys({
        'oauth-scopes': ['mail', 'roles'],
        'self-signed': true,
        'auth-methods': ['client-credentials', 'implicit'],
      });
      expect(result.oauthScopes).to.deep.equal(['mail', 'roles']);
      expect(result.selfSigned).to.equal(true);
      expect(result.authMethods).to.deep.equal(['client-credentials', 'implicit']);
    });
  });
});
