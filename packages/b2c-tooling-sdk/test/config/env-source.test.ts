/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {EnvSource, ConfigResolver, DwJsonSource, StorefrontNextEnvSource} from '@salesforce/b2c-tooling-sdk/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('config/EnvSource', () => {
  describe('CLI environment aliases', () => {
    const aliases: Array<{
      alias: string;
      canonical: string;
      field: string;
    }> = [
      {alias: 'SFCC_OAUTH_CLIENT_ID', canonical: 'SFCC_CLIENT_ID', field: 'clientId'},
      {alias: 'SFCC_OAUTH_CLIENT_SECRET', canonical: 'SFCC_CLIENT_SECRET', field: 'clientSecret'},
      {alias: 'SFCC_LOGIN_URL', canonical: 'SFCC_ACCOUNT_MANAGER_HOST', field: 'accountManagerHost'},
      {alias: 'SFCC_SHORT_CODE', canonical: 'SFCC_SHORTCODE', field: 'shortCode'},
      {alias: 'SFCC_MRT_API_KEY', canonical: 'MRT_API_KEY', field: 'mrtApiKey'},
      {alias: 'SFCC_MRT_PROJECT', canonical: 'MRT_PROJECT', field: 'mrtProject'},
      {alias: 'SFCC_MRT_ENVIRONMENT', canonical: 'MRT_ENVIRONMENT', field: 'mrtEnvironment'},
      {alias: 'MRT_TARGET', canonical: 'MRT_ENVIRONMENT', field: 'mrtEnvironment'},
      {alias: 'SFCC_MRT_CLOUD_ORIGIN', canonical: 'MRT_CLOUD_ORIGIN', field: 'mrtOrigin'},
    ];

    for (const {alias, canonical, field} of aliases) {
      it(`maps ${alias} to ${field}`, () => {
        const source = new EnvSource({[alias]: 'alias-value'});
        const result = source.load({});
        expect(result?.config).to.have.property(field, 'alias-value');
      });

      it(`${canonical} takes precedence over ${alias}`, () => {
        const source = new EnvSource({[alias]: 'alias-value', [canonical]: 'canonical-value'});
        const result = source.load({});
        expect(result?.config).to.have.property(field, 'canonical-value');
      });
    }

    it('SFCC_MRT_ENVIRONMENT takes precedence over MRT_TARGET', () => {
      const source = new EnvSource({MRT_TARGET: 'legacy-target', SFCC_MRT_ENVIRONMENT: 'sfcc-environment'});
      const result = source.load({});
      expect(result?.config.mrtEnvironment).to.equal('sfcc-environment');
    });
  });

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

    it('maps SFCC_SHORT_CODE to shortCode (legacy alias)', () => {
      const source = new EnvSource({SFCC_SHORT_CODE: 'abc123'});
      const result = source.load({});
      expect(result!.config.shortCode).to.equal('abc123');
    });

    it('SFCC_SHORTCODE takes precedence over SFCC_SHORT_CODE when both set', () => {
      const source = new EnvSource({SFCC_SHORT_CODE: 'legacy-code', SFCC_SHORTCODE: 'canonical-code'});
      const result = source.load({});
      expect(result!.config.shortCode).to.equal('canonical-code');
    });

    it('maps SFCC_TENANT_ID to tenantId', () => {
      const source = new EnvSource({SFCC_TENANT_ID: 'abcd_prd'});
      const result = source.load({});
      expect(result!.config.tenantId).to.equal('abcd_prd');
    });

    it('maps SFCC_SITE_ID to siteId', () => {
      const source = new EnvSource({SFCC_SITE_ID: 'RefArch'});
      const result = source.load({});
      expect(result!.config.siteId).to.equal('RefArch');
    });

    it('maps SFCC_SLAS_CLIENT_ID to slasClientId', () => {
      const source = new EnvSource({SFCC_SLAS_CLIENT_ID: 'slas-client'});
      const result = source.load({});
      expect(result!.config.slasClientId).to.equal('slas-client');
    });

    it('maps SFCC_SLAS_CLIENT_SECRET to slasClientSecret', () => {
      const source = new EnvSource({SFCC_SLAS_CLIENT_SECRET: 'slas-secret'});
      const result = source.load({});
      expect(result!.config.slasClientSecret).to.equal('slas-secret');
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

    it('maps SFCC_CIP_HOST to cipHost', () => {
      const source = new EnvSource({SFCC_CIP_HOST: 'cip.example.com'});
      const result = source.load({});
      expect(result!.config.cipHost).to.equal('cip.example.com');
    });
  });

  describe('apiBackend (SFCC_API_BACKEND)', () => {
    for (const value of ['auto', 'scapi', 'ocapi']) {
      it(`maps SFCC_API_BACKEND=${value} to apiBackend`, () => {
        const source = new EnvSource({SFCC_API_BACKEND: value});
        const result = source.load({});
        expect(result!.config.apiBackend).to.equal(value);
      });
    }

    it('ignores an invalid SFCC_API_BACKEND value', () => {
      const source = new EnvSource({SFCC_API_BACKEND: 'bogus'});
      const result = source.load({});
      // No valid fields → source contributes nothing.
      expect(result).to.be.undefined;
    });

    it('ignores an invalid value but keeps other valid env fields', () => {
      const source = new EnvSource({SFCC_API_BACKEND: 'bogus', SFCC_SERVER: 'test.demandware.net'});
      const result = source.load({});
      expect(result!.config.apiBackend).to.be.undefined;
      expect(result!.config.hostname).to.equal('test.demandware.net');
    });
  });

  describe('clientAuthMethod (SFCC_CLIENT_AUTH_METHOD)', () => {
    for (const value of ['basic', 'basic-unencoded', 'body']) {
      it(`maps SFCC_CLIENT_AUTH_METHOD=${value} to clientAuthMethod`, () => {
        const source = new EnvSource({SFCC_CLIENT_AUTH_METHOD: value});
        const result = source.load({});
        expect(result!.config.clientAuthMethod).to.equal(value);
      });
    }

    it('ignores an invalid SFCC_CLIENT_AUTH_METHOD value', () => {
      const source = new EnvSource({SFCC_CLIENT_AUTH_METHOD: 'header'});
      const result = source.load({});
      expect(result).to.be.undefined;
    });
  });

  describe('mrtBackend (MRT_BACKEND / SFCC_MRT_BACKEND)', () => {
    for (const value of ['auto', 'legacy', 'scapi']) {
      it(`maps MRT_BACKEND=${value} to mrtBackend`, () => {
        const source = new EnvSource({MRT_BACKEND: value});
        const result = source.load({});
        expect(result!.config.mrtBackend).to.equal(value);
      });

      it(`maps SFCC_MRT_BACKEND=${value} to mrtBackend`, () => {
        const source = new EnvSource({SFCC_MRT_BACKEND: value});
        const result = source.load({});
        expect(result!.config.mrtBackend).to.equal(value);
      });
    }

    it('MRT_BACKEND takes precedence over SFCC_MRT_BACKEND', () => {
      const source = new EnvSource({SFCC_MRT_BACKEND: 'legacy', MRT_BACKEND: 'scapi'});
      const result = source.load({});
      expect(result!.config.mrtBackend).to.equal('scapi');
    });

    it('ignores an invalid MRT_BACKEND value', () => {
      const source = new EnvSource({MRT_BACKEND: 'bogus'});
      const result = source.load({});
      // No valid fields → source contributes nothing.
      expect(result).to.be.undefined;
    });

    it('rejects an OCAPI/SCAPI apiBackend value (mrtBackend enum is distinct)', () => {
      // `ocapi` is valid for apiBackend but NOT for mrtBackend.
      const source = new EnvSource({MRT_BACKEND: 'ocapi', SFCC_MRT_PROJECT: 'my-project'});
      const result = source.load({});
      expect(result!.config.mrtBackend).to.be.undefined;
      expect(result!.config.mrtProject).to.equal('my-project');
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
    it('parses import-set directory exclusions', () => {
      const source = new EnvSource({SFCC_IMPORT_SET_EXCLUDE: 'fixtures, test/integration'});
      const result = source.load({});
      expect(result?.config.importSetExclude).to.deep.equal(['fixtures', 'test/integration']);
    });

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
    it('returns undefined when no supported environment variables are set', () => {
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

  describe('StorefrontNextEnvSource', () => {
    const variables = {
      PUBLIC__app__commerce__api__clientId: 'slasClientId',
      PUBLIC__app__commerce__api__organizationId: 'tenantId',
      PUBLIC__app__commerce__api__shortCode: 'shortCode',
      COMMERCE_API_SLAS_SECRET: 'slasClientSecret',
      PUBLIC__app__defaultSiteId: 'siteId',
    };

    for (const [variable, field] of Object.entries(variables)) {
      it(`maps ${variable} to ${field}`, () => {
        const result = new StorefrontNextEnvSource({[variable]: 'sfn-value'}).load({});
        expect(result?.config).to.have.property(field, 'sfn-value');
      });

      it(`is not read by EnvSource (${variable})`, () => {
        expect(new EnvSource({[variable]: 'sfn-value'}).load({})).to.be.undefined;
      });
    }

    it('ignores toolkit variables', () => {
      expect(new StorefrontNextEnvSource({SFCC_SERVER: 'test.demandware.net'}).load({})).to.be.undefined;
    });

    it('sits just below dw.json (priority 1)', () => {
      expect(new StorefrontNextEnvSource({}).priority).to.equal(1);
    });

    it('reports the configured location', () => {
      const result = new StorefrontNextEnvSource(
        {PUBLIC__app__defaultSiteId: 'RefArch'},
        {location: '/project/.env'},
      ).load({});
      expect(result?.location).to.equal('/project/.env');
    });
  });

  describe('metadata', () => {
    it('accepts a custom name and location', () => {
      const source = new EnvSource({SFCC_SERVER: 'test.demandware.net'}, {name: 'DotenvFile', location: '/p/.env'});
      expect(source.name).to.equal('DotenvFile');
      expect(source.load({})!.location).to.equal('/p/.env');
    });

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

      // EnvSource provides only a client ID
      const envSource = new EnvSource({SFCC_CLIENT_ID: 'env-client'});
      const resolver = new ConfigResolver([envSource, new DwJsonSource()]);
      const {config} = await resolver.resolve();

      expect(config.hostname).to.equal('dw.demandware.net');
      expect(config.clientId).to.equal('env-client');
      expect(config.codeVersion).to.equal('v2');
    });

    it('skips dw.json entirely when EnvSource sets a different hostname', async () => {
      fs.writeFileSync(
        path.join(tempDir, 'dw.json'),
        JSON.stringify({hostname: 'dw.demandware.net', 'code-version': 'v2', username: 'dw-user'}),
      );

      const envSource = new EnvSource({SFCC_SERVER: 'env.demandware.net'});
      const resolver = new ConfigResolver([envSource, new DwJsonSource()]);
      const {config, warnings, sources} = await resolver.resolve();

      expect(config.hostname).to.equal('env.demandware.net');
      expect(config.codeVersion).to.be.undefined;
      expect(config.username).to.be.undefined;
      expect(warnings.map((w) => w.code)).to.include('HOSTNAME_MISMATCH');
      expect(sources.find((source) => source.name === 'DwJsonSource')?.fields).to.deep.equal([]);
    });

    it('keeps the selected dw.json instance above Storefront Next variables', async () => {
      fs.writeFileSync(
        path.join(tempDir, 'dw.json'),
        JSON.stringify({
          configs: [
            {name: 'dev', active: true, hostname: 'dev.example.com', 'tenant-id': 'aaaa_001'},
            {
              name: 'stg',
              hostname: 'stg.example.com',
              'short-code': 'stgshort',
              'tenant-id': 'bbbb_002',
              'slas-client-id': 'stg-slas',
              'slas-client-secret': 'stg-secret',
            },
          ],
        }),
      );

      const storefrontNext = new StorefrontNextEnvSource({
        PUBLIC__app__commerce__api__clientId: 'sfn-slas',
        PUBLIC__app__commerce__api__organizationId: 'f_ecom_zzzz_001',
        PUBLIC__app__commerce__api__shortCode: 'sfnshort',
        COMMERCE_API_SLAS_SECRET: 'sfn-secret',
        PUBLIC__app__defaultSiteId: 'RefArch',
      });
      const resolver = new ConfigResolver([storefrontNext, new DwJsonSource()]);
      const {config, warnings} = await resolver.resolve({}, {instance: 'stg'});

      expect(config.hostname).to.equal('stg.example.com');
      expect(config.shortCode).to.equal('stgshort');
      expect(config.tenantId).to.equal('bbbb_002');
      expect(config.slasClientId).to.equal('stg-slas');
      expect(config.slasClientSecret).to.equal('stg-secret');
      expect(config.siteId).to.equal('RefArch');
      expect(warnings).to.be.empty;
    });

    it('lets Storefront Next variables fill an instance without SLAS settings', async () => {
      fs.writeFileSync(path.join(tempDir, 'dw.json'), JSON.stringify({hostname: 'dw.example.com', username: 'u'}));

      const storefrontNext = new StorefrontNextEnvSource({
        PUBLIC__app__commerce__api__clientId: 'sfn-slas',
        COMMERCE_API_SLAS_SECRET: 'sfn-secret',
        PUBLIC__app__commerce__api__organizationId: 'f_ecom_zzzz_001',
      });
      const resolver = new ConfigResolver([storefrontNext, new DwJsonSource()]);
      const {config} = await resolver.resolve();

      expect(config.hostname).to.equal('dw.example.com');
      expect(config.slasClientId).to.equal('sfn-slas');
      expect(config.slasClientSecret).to.equal('sfn-secret');
      expect(config.tenantId).to.equal('zzzz_001');
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
