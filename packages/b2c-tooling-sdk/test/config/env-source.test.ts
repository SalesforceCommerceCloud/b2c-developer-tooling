/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {EnvSource, ConfigResolver, DwJsonSource} from '@salesforce/b2c-tooling-sdk/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('config/EnvSource', () => {
  describe('string mapping', () => {
    it('maps SFCC_SERVER to hostname', () => {
      const source = new EnvSource({SFCC_SERVER: 'test.demandware.net'});
      const result = source.load({});
      expect(result).to.not.be.undefined;
      expect(result!.config.hostname).to.equal('test.demandware.net');
    });

    it('maps SFCC_WEBDAV_SERVER to webdavHostname', () => {
      const source = new EnvSource({SFCC_WEBDAV_SERVER: 'webdav.example.com'});
      const result = source.load({});
      expect(result!.config.webdavHostname).to.equal('webdav.example.com');
    });

    it('maps SFCC_CODE_VERSION to codeVersion', () => {
      const source = new EnvSource({SFCC_CODE_VERSION: 'v1'});
      const result = source.load({});
      expect(result!.config.codeVersion).to.equal('v1');
    });

    it('maps SFCC_USERNAME to username', () => {
      const source = new EnvSource({SFCC_USERNAME: 'user@example.com'});
      const result = source.load({});
      expect(result!.config.username).to.equal('user@example.com');
    });

    it('maps SFCC_PASSWORD to password', () => {
      const source = new EnvSource({SFCC_PASSWORD: 'secret'});
      const result = source.load({});
      expect(result!.config.password).to.equal('secret');
    });

    it('maps SFCC_CERTIFICATE to certificate', () => {
      const source = new EnvSource({SFCC_CERTIFICATE: '/path/to/cert.p12'});
      const result = source.load({});
      expect(result!.config.certificate).to.equal('/path/to/cert.p12');
    });

    it('maps SFCC_CERTIFICATE_PASSPHRASE to certificatePassphrase', () => {
      const source = new EnvSource({SFCC_CERTIFICATE_PASSPHRASE: 'pass123'});
      const result = source.load({});
      expect(result!.config.certificatePassphrase).to.equal('pass123');
    });

    it('maps SFCC_CLIENT_ID to clientId', () => {
      const source = new EnvSource({SFCC_CLIENT_ID: 'my-client'});
      const result = source.load({});
      expect(result!.config.clientId).to.equal('my-client');
    });

    it('maps SFCC_CLIENT_SECRET to clientSecret', () => {
      const source = new EnvSource({SFCC_CLIENT_SECRET: 'my-secret'});
      const result = source.load({});
      expect(result!.config.clientSecret).to.equal('my-secret');
    });

    it('maps SFCC_SHORTCODE to shortCode', () => {
      const source = new EnvSource({SFCC_SHORTCODE: 'abc123'});
      const result = source.load({});
      expect(result!.config.shortCode).to.equal('abc123');
    });

    it('maps SFCC_TENANT_ID to tenantId', () => {
      const source = new EnvSource({SFCC_TENANT_ID: 'abcd_prd'});
      const result = source.load({});
      expect(result!.config.tenantId).to.equal('abcd_prd');
    });

    it('maps SFCC_ACCOUNT_MANAGER_HOST to accountManagerHost', () => {
      const source = new EnvSource({SFCC_ACCOUNT_MANAGER_HOST: 'account.demandware.com'});
      const result = source.load({});
      expect(result!.config.accountManagerHost).to.equal('account.demandware.com');
    });

    it('maps SFCC_SANDBOX_API_HOST to sandboxApiHost', () => {
      const source = new EnvSource({SFCC_SANDBOX_API_HOST: 'admin.dx.commercecloud.salesforce.com'});
      const result = source.load({});
      expect(result!.config.sandboxApiHost).to.equal('admin.dx.commercecloud.salesforce.com');
    });
  });

  describe('boolean parsing', () => {
    it('parses SFCC_SELFSIGNED=true as boolean true', () => {
      const source = new EnvSource({SFCC_SELFSIGNED: 'true'});
      const result = source.load({});
      expect(result!.config.selfSigned).to.be.true;
    });

    it('parses SFCC_SELFSIGNED=1 as boolean true', () => {
      const source = new EnvSource({SFCC_SELFSIGNED: '1'});
      const result = source.load({});
      expect(result!.config.selfSigned).to.be.true;
    });

    it('parses SFCC_SELFSIGNED=false as boolean false', () => {
      const source = new EnvSource({SFCC_SELFSIGNED: 'false'});
      const result = source.load({});
      expect(result!.config.selfSigned).to.be.false;
    });

    it('parses SFCC_SELFSIGNED=0 as boolean false', () => {
      const source = new EnvSource({SFCC_SELFSIGNED: '0'});
      const result = source.load({});
      expect(result!.config.selfSigned).to.be.false;
    });
  });

  describe('array parsing', () => {
    it('parses SFCC_OAUTH_SCOPES as comma-separated array', () => {
      const source = new EnvSource({SFCC_OAUTH_SCOPES: 'mail,roles,openid'});
      const result = source.load({});
      expect(result!.config.scopes).to.deep.equal(['mail', 'roles', 'openid']);
    });

    it('trims whitespace in comma-separated values', () => {
      const source = new EnvSource({SFCC_OAUTH_SCOPES: ' mail , roles , openid '});
      const result = source.load({});
      expect(result!.config.scopes).to.deep.equal(['mail', 'roles', 'openid']);
    });

    it('filters empty values in comma-separated arrays', () => {
      const source = new EnvSource({SFCC_OAUTH_SCOPES: 'mail,,roles,'});
      const result = source.load({});
      expect(result!.config.scopes).to.deep.equal(['mail', 'roles']);
    });

    it('parses SFCC_AUTH_METHODS as comma-separated array', () => {
      const source = new EnvSource({SFCC_AUTH_METHODS: 'client-credentials,implicit'});
      const result = source.load({});
      expect(result!.config.authMethods).to.deep.equal(['client-credentials', 'implicit']);
    });
  });

  describe('empty/undefined handling', () => {
    it('returns undefined when no SFCC_* vars are set', () => {
      const source = new EnvSource({});
      const result = source.load({});
      expect(result).to.be.undefined;
    });

    it('skips empty string values', () => {
      const source = new EnvSource({SFCC_SERVER: '', SFCC_CLIENT_ID: 'my-client'});
      const result = source.load({});
      expect(result).to.not.be.undefined;
      expect(result!.config.hostname).to.be.undefined;
      expect(result!.config.clientId).to.equal('my-client');
    });

    it('skips undefined values', () => {
      const source = new EnvSource({SFCC_SERVER: undefined, SFCC_CLIENT_ID: 'my-client'});
      const result = source.load({});
      expect(result!.config.hostname).to.be.undefined;
      expect(result!.config.clientId).to.equal('my-client');
    });

    it('ignores non-SFCC environment variables', () => {
      const source = new EnvSource({HOME: '/home/user', PATH: '/usr/bin', SFCC_SERVER: 'test.demandware.net'});
      const result = source.load({});
      expect(result!.config.hostname).to.equal('test.demandware.net');
      expect(Object.keys(result!.config)).to.have.length(1);
    });
  });

  describe('metadata', () => {
    it('has name EnvSource', () => {
      const source = new EnvSource({});
      expect(source.name).to.equal('EnvSource');
    });

    it('has priority -10', () => {
      const source = new EnvSource({});
      expect(source.priority).to.equal(-10);
    });

    it('reports location as environment variables', () => {
      const source = new EnvSource({SFCC_SERVER: 'test.demandware.net'});
      const result = source.load({});
      expect(result!.location).to.equal('environment variables');
    });
  });

  describe('integration with ConfigResolver', () => {
    let tempDir: string;
    let originalCwd: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-source-test-'));
      originalCwd = process.cwd();
      process.chdir(tempDir);
    });

    afterEach(() => {
      process.chdir(originalCwd);
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, {recursive: true, force: true});
      }
    });

    it('EnvSource overrides DwJsonSource values (priority -10 < 0)', async () => {
      // Create dw.json with a hostname
      fs.writeFileSync(path.join(tempDir, 'dw.json'), JSON.stringify({hostname: 'dw.demandware.net'}));

      // EnvSource with different hostname
      const envSource = new EnvSource({SFCC_SERVER: 'env.demandware.net'});
      const resolver = new ConfigResolver([envSource, new DwJsonSource()]);
      const {config} = await resolver.resolve();

      // EnvSource should win (priority -10 < 0)
      expect(config.hostname).to.equal('env.demandware.net');
    });

    it('DwJsonSource fills gaps not covered by EnvSource', async () => {
      // dw.json provides code-version
      fs.writeFileSync(
        path.join(tempDir, 'dw.json'),
        JSON.stringify({hostname: 'dw.demandware.net', 'code-version': 'v2'}),
      );

      // EnvSource provides only hostname
      const envSource = new EnvSource({SFCC_SERVER: 'env.demandware.net'});
      const resolver = new ConfigResolver([envSource, new DwJsonSource()]);
      const {config} = await resolver.resolve();

      expect(config.hostname).to.equal('env.demandware.net');
      expect(config.codeVersion).to.equal('v2');
    });
  });

  describe('defaults to process.env', () => {
    it('reads from process.env when no env param given', () => {
      const original = process.env.SFCC_SERVER;
      try {
        process.env.SFCC_SERVER = 'from-process-env.demandware.net';
        const source = new EnvSource();
        const result = source.load({});
        expect(result).to.not.be.undefined;
        expect(result!.config.hostname).to.equal('from-process-env.demandware.net');
      } finally {
        if (original === undefined) {
          delete process.env.SFCC_SERVER;
        } else {
          process.env.SFCC_SERVER = original;
        }
      }
    });
  });
});
