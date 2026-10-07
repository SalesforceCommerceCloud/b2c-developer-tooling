/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  ConfigWriteError,
  DotenvFileSource,
  DwJsonSource,
  EnvSource,
  listConfigKeys,
  locateConfigField,
  parseConfigValue,
  readEnvFile,
  removeConfigField,
  resolveConfig,
  resolveConfigKey,
  StorefrontNextEnvSource,
  writeConfigField,
  type ConfigLoadResult,
  type ConfigSource,
  type ConfigUpdateResult,
  type NormalizedConfig,
  type ResolveConfigOptions,
} from '@salesforce/b2c-tooling-sdk/config';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';

/** A plugin-style source backed by an in-memory document (think YAML file). */
class DocumentSource implements ConfigSource {
  readonly name = 'yaml-config';
  readonly priority = -5;
  readonly writes: Array<{patch: Partial<NormalizedConfig>; options: ResolveConfigOptions}> = [];

  constructor(public document: Partial<NormalizedConfig>) {}

  load(): ConfigLoadResult {
    return {config: {...this.document}, location: '/project/b2c.yaml'};
  }

  updateConfig(patch: Partial<NormalizedConfig>, options: ResolveConfigOptions): ConfigUpdateResult {
    this.writes.push({patch, options});
    for (const [field, value] of Object.entries(patch)) {
      if (value === undefined) delete (this.document as Record<string, unknown>)[field];
      else (this.document as Record<string, unknown>)[field] = value;
    }
    return {location: '/project/b2c.yaml', instance: this.document.instanceName};
  }
}

/** A plugin-style credential store (think OS keychain). */
class CredentialStore implements ConfigSource {
  readonly name = 'keychain';
  readonly priority = 10;
  readonly credentialFields: (keyof NormalizedConfig)[] = ['clientId', 'clientSecret'];
  readonly stored = new Map<string, string>();

  constructor(values: Record<string, string>) {
    for (const [key, value] of Object.entries(values)) this.stored.set(key, value);
  }

  load(options: ResolveConfigOptions): ConfigLoadResult | undefined {
    const instance = options.instance ?? '_default';
    const config: Partial<NormalizedConfig> = {};
    for (const field of this.credentialFields) {
      const value = this.stored.get(`${instance}/${field}`);
      if (value) (config as Record<string, unknown>)[field] = value;
    }
    return Object.keys(config).length > 0 ? {config, location: `keychain:${instance}`} : undefined;
  }

  storeCredential(instanceName: string, field: keyof NormalizedConfig, value: string): void {
    this.stored.set(`${instanceName}/${field}`, value);
  }

  removeCredential(instanceName: string, field: keyof NormalizedConfig): void {
    this.stored.delete(`${instanceName}/${field}`);
  }
}

describe('config/config-write', () => {
  let directory: string;

  beforeEach(() => {
    isolateConfig();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'config-write-'));
  });

  afterEach(() => {
    restoreConfig();
    fs.rmSync(directory, {recursive: true, force: true});
  });

  function writeDwJson(content: unknown): string {
    const file = path.join(directory, 'dw.json');
    fs.writeFileSync(file, JSON.stringify(content, null, 2));
    return file;
  }

  function readDwJson(): Record<string, unknown> & {configs: Array<Record<string, unknown>>} {
    return JSON.parse(fs.readFileSync(path.join(directory, 'dw.json'), 'utf8'));
  }

  function writeDotenv(content: string): string {
    const file = path.join(directory, '.env');
    fs.writeFileSync(file, content);
    return file;
  }

  async function resolve(options: {instance?: string; before?: ConfigSource[]; after?: ConfigSource[]} = {}) {
    return resolveConfig(
      {},
      {
        replaceDefaultSources: true,
        sourcesBefore: [...(options.before ?? []), new DwJsonSource(), ...(options.after ?? [])],
        projectDirectory: directory,
        instance: options.instance,
      },
    );
  }

  async function expectWriteError(promise: Promise<unknown>, code: string): Promise<ConfigWriteError> {
    try {
      await promise;
    } catch (error) {
      expect(error).to.be.instanceOf(ConfigWriteError);
      expect((error as ConfigWriteError).code).to.equal(code);
      return error as ConfigWriteError;
    }
    throw new Error(`expected ${code}`);
  }

  describe('resolveConfigKey', () => {
    it('accepts dw.json, camelCase, alias and field names', () => {
      expect(resolveConfigKey('code-version').field).to.equal('codeVersion');
      expect(resolveConfigKey('codeVersion').key).to.equal('code-version');
      expect(resolveConfigKey('server').field).to.equal('hostname');
      expect(resolveConfigKey('scopes').key).to.equal('oauth-scopes');
      expect(resolveConfigKey('oauth-scopes').field).to.equal('scopes');
    });

    it('rejects unknown keys and keys managed elsewhere', () => {
      expect(() => resolveConfigKey('nope')).to.throw(ConfigWriteError, /Unknown configuration key/);
      expect(() => resolveConfigKey('name')).to.throw(ConfigWriteError, /setup instance/);
      expect(() => resolveConfigKey('user-auth')).to.throw(ConfigWriteError, /auth-methods/);
    });

    it('resolves every settable dw.json key', () => {
      for (const key of listConfigKeys()) expect(resolveConfigKey(key.key)).to.deep.equal(key);
    });
  });

  describe('parseConfigValue', () => {
    it('keeps string keys as text, even when the text is JSON', () => {
      expect(parseConfigValue(resolveConfigKey('code-version'), '123')).to.equal('123');
      expect(parseConfigValue(resolveConfigKey('code-version'), '"v1"')).to.equal('"v1"');
    });

    it('parses JSON for non-string keys', () => {
      expect(parseConfigValue(resolveConfigKey('auto-upload'), 'true')).to.equal(true);
      expect(parseConfigValue(resolveConfigKey('safety'), '{"level":"NO_DELETE"}')).to.deep.equal({
        level: 'NO_DELETE',
      });
      expect(parseConfigValue(resolveConfigKey('cartridges'), '["a","b"]')).to.deep.equal(['a', 'b']);
    });

    it('accepts plain and comma-separated values for string lists', () => {
      expect(parseConfigValue(resolveConfigKey('scapi-schemas'), './schemas')).to.deep.equal(['./schemas']);
      expect(parseConfigValue(resolveConfigKey('cartridges'), 'a, b')).to.deep.equal(['a', 'b']);
    });

    it('rejects values that do not match the schema', () => {
      expect(() => parseConfigValue(resolveConfigKey('auto-upload'), 'maybe')).to.throw(ConfigWriteError);
      expect(() => parseConfigValue(resolveConfigKey('safety'), '{"level":"BOGUS"}')).to.throw(/safety.level/);
      expect(() => parseConfigValue(resolveConfigKey('safety'), '{"extra":1}')).to.throw(/not a known property/);
    });
  });

  describe('writeConfigField', () => {
    it('writes a new field to the selected dw.json instance', async () => {
      writeDwJson({
        hostname: 'root.example.com',
        configs: [{name: 'staging', hostname: 'staging.example.com', active: true}],
      });
      const result = await writeConfigField(await resolve(), 'scapiSchemas', ['./schemas']);

      expect(result).to.include({source: 'DwJsonSource', instance: 'staging'});
      expect(readDwJson().configs[0]['scapi-schemas']).to.deep.equal(['./schemas']);
      expect(readDwJson()['scapi-schemas']).to.be.undefined;
      expect((await resolve()).values.scapiSchemas).to.deep.equal(['./schemas']);
    });

    it('targets the instance named by --instance', async () => {
      writeDwJson({
        configs: [
          {name: 'a', hostname: 'a.example.com', active: true},
          {name: 'b', hostname: 'b.example.com'},
        ],
      });
      await writeConfigField(await resolve({instance: 'b'}), 'codeVersion', 'v2');
      expect(readDwJson().configs[0]['code-version']).to.be.undefined;
      expect(readDwJson().configs[1]['code-version']).to.equal('v2');
    });

    it('replaces an alternate key spelling in place', async () => {
      writeDwJson({hostname: 'h.example.com', codeVersion: 'v1', 'short-code': 'x'});
      await writeConfigField(await resolve(), 'codeVersion', 'v2');
      expect(Object.keys(readDwJson())).to.deep.equal(['hostname', 'code-version', 'short-code']);
      expect(readDwJson()['code-version']).to.equal('v2');
    });

    it('removes a field', async () => {
      writeDwJson({hostname: 'h.example.com', 'code-version': 'v1'});
      await removeConfigField(await resolve(), 'codeVersion');
      expect(readDwJson()).to.deep.equal({hostname: 'h.example.com'});
    });

    it('refuses to remove a field no source sets', async () => {
      writeDwJson({hostname: 'h.example.com'});
      await expectWriteError(removeConfigField(await resolve(), 'codeVersion'), 'CONFIG_NOT_SET');
    });

    it('refuses when no instance is selected', async () => {
      writeDwJson({
        configs: [
          {name: 'a', hostname: 'a.example.com'},
          {name: 'b', hostname: 'b.example.com'},
        ],
      });
      const error = await expectWriteError(
        writeConfigField(await resolve(), 'codeVersion', 'v1'),
        'CONFIG_NO_WRITE_TARGET',
      );
      expect(error.message).to.include('--instance');
      expect(readDwJson().configs).to.deep.equal([
        {name: 'a', hostname: 'a.example.com'},
        {name: 'b', hostname: 'b.example.com'},
      ]);
    });

    it('refuses to write a value supplied by a read-only source', async () => {
      writeDwJson({hostname: 'h.example.com'});
      const config = await resolve({before: [new EnvSource({SFCC_CODE_VERSION: 'shell'})]});
      expect(locateConfigField(config, 'codeVersion').supplier?.name).to.equal('EnvSource');
      await expectWriteError(writeConfigField(config, 'codeVersion', 'v1'), 'CONFIG_SOURCE_READ_ONLY');
      expect(readDwJson()['code-version']).to.be.undefined;
    });

    it('writes to the .env file when it supplies the field', async () => {
      writeDwJson({hostname: 'h.example.com', 'code-version': 'dw'});
      const envPath = writeDotenv('# project\nexport SFCC_CODE_VERSION=old\n');
      const config = await resolve({before: [new DotenvFileSource(envPath)]});
      const result = await writeConfigField(config, 'codeVersion', 'new');

      expect(result).to.deep.equal({location: envPath, source: 'DotenvFile'});
      expect(fs.readFileSync(envPath, 'utf8')).to.equal('# project\nexport SFCC_CODE_VERSION=new\n');
      expect(readDwJson()['code-version']).to.equal('dw');
    });

    it('keeps a credential pair in the source that supplies the other half', async () => {
      writeDwJson({hostname: 'h.example.com'});
      const envPath = writeDotenv('SFCC_CLIENT_ID=abc\n');
      await writeConfigField(await resolve({before: [new DotenvFileSource(envPath)]}), 'clientSecret', 'secret');
      expect(fs.readFileSync(envPath, 'utf8')).to.equal('SFCC_CLIENT_ID=abc\nSFCC_CLIENT_SECRET=secret\n');
      expect(readDwJson()['client-secret']).to.be.undefined;
    });

    it('round-trips every settable key through dw.json', async () => {
      writeDwJson({hostname: 'h.example.com'});
      const samples: Record<string, string> = {
        'auth-methods': '["client-credentials"]',
        'auto-upload': 'true',
        'self-signed': 'true',
        'client-auth-method': 'basic',
        'api-backend': 'ocapi',
        'mrt-backend': 'scapi',
        safety: '{"level":"NO_DELETE"}',
        libraries: '["lib"]',
        hostname: 'h.example.com',
        'tenant-id': 'zzpq_019',
        'mrt-origin': 'https://cloud.example.com',
      };
      for (const key of listConfigKeys()) {
        const value = parseConfigValue(key, samples[key.key] ?? `sample-${key.key}`);
        await writeConfigField(await resolve(), key.field, value);
        const resolved = await resolve();
        expect(JSON.parse(JSON.stringify(resolved.values[key.field])), key.key).to.deep.equal(value);
      }
    });
  });

  describe('plugin sources', () => {
    it('writes new fields to a plugin source that defines the instance, not dw.json', async () => {
      writeDwJson({hostname: 'h.example.com', 'code-version': 'dw'});
      const yaml = new DocumentSource({instanceName: 'staging', hostname: 'h.example.com'});
      const config = await resolve({before: [yaml]});

      const result = await writeConfigField(config, 'scapiSchemas', ['./schemas']);

      expect(result).to.deep.equal({location: '/project/b2c.yaml', instance: 'staging', source: 'yaml-config'});
      expect(yaml.writes[0].patch).to.deep.equal({scapiSchemas: ['./schemas']});
      expect(readDwJson()['scapi-schemas']).to.be.undefined;
      expect((await resolve({before: [yaml]})).values.scapiSchemas).to.deep.equal(['./schemas']);
    });

    it('still writes fields dw.json supplies to dw.json', async () => {
      writeDwJson({hostname: 'h.example.com', 'code-version': 'dw'});
      const yaml = new DocumentSource({instanceName: 'staging', hostname: 'h.example.com'});
      await writeConfigField(await resolve({before: [yaml]}), 'codeVersion', 'v2');
      expect(readDwJson()['code-version']).to.equal('v2');
      expect(yaml.writes).to.be.empty;
    });

    it('treats a plugin source without write methods as read-only', async () => {
      const readOnly: ConfigSource = {name: 'vault', load: () => ({config: {codeVersion: 'v1'}})};
      writeDwJson({hostname: 'h.example.com'});
      await expectWriteError(
        writeConfigField(await resolve({before: [readOnly]}), 'codeVersion', 'v2'),
        'CONFIG_SOURCE_READ_ONLY',
      );
    });

    it('stores credentials through a credential store that supplies them', async () => {
      writeDwJson({name: 'staging', hostname: 'h.example.com'});
      const keychain = new CredentialStore({'staging/clientId': 'id', 'staging/clientSecret': 'old'});
      const config = await resolve({after: [keychain]});

      const result = await writeConfigField(config, 'clientSecret', 'new');
      expect(result).to.deep.equal({location: 'keychain:staging', instance: 'staging', source: 'keychain'});
      expect(keychain.stored.get('staging/clientSecret')).to.equal('new');
      expect(readDwJson()['client-secret']).to.be.undefined;

      await removeConfigField(await resolve({after: [keychain]}), 'clientSecret');
      expect(keychain.stored.has('staging/clientSecret')).to.be.false;
    });

    it('refuses fields a credential store does not declare', async () => {
      writeDwJson({name: 'staging', hostname: 'h.example.com', 'code-version': 'v1'});
      const keychain = new CredentialStore({'staging/clientId': 'id', 'staging/clientSecret': 'secret'});
      // shortCode isn't a credential field, so the keychain can't be its target
      const store: ConfigSource = Object.assign(keychain, {load: () => ({config: {shortCode: 'abc'}})});
      await expectWriteError(
        writeConfigField(await resolve({before: [store]}), 'shortCode', 'xyz'),
        'CONFIG_SOURCE_READ_ONLY',
      );
    });
  });

  describe('derived values', () => {
    /** A Storefront Next .env with no toolkit variables: the hostname comes from the organization ID. */
    async function resolveStorefrontNext() {
      const envPath = writeDotenv(
        'PUBLIC__app__commerce__api__organizationId=f_ecom_zzpq_019\nPUBLIC__app__commerce__api__shortCode=abc123\n',
      );
      const source = () => new StorefrontNextEnvSource(readEnvFile(envPath), {location: envPath, envFile: envPath});
      return {envPath, resolveAgain: () => resolve({after: [source()]})};
    }

    it('records the source a derived hostname came from', async () => {
      const {envPath, resolveAgain} = await resolveStorefrontNext();
      const config = await resolveAgain();
      expect(config.values.hostname).to.equal('zzpq-019.dx.commercecloud.salesforce.com');
      expect(config.sources.find((info) => info.name === 'SandboxTenantId')?.derivedFrom).to.deep.equal({
        field: 'tenantId',
        source: 'StorefrontNextEnvSource',
        location: envPath,
      });
    });

    it('writes new fields and the hostname to the .env the tenant ID came from', async () => {
      const {envPath, resolveAgain} = await resolveStorefrontNext();
      const result = await writeConfigField(await resolveAgain(), 'codeVersion', 'v1');
      expect(result.location).to.equal(envPath);
      await writeConfigField(await resolveAgain(), 'hostname', 'zzpq-019.dx.commercecloud.salesforce.com');
      const content = fs.readFileSync(envPath, 'utf8');
      expect(content).to.include('SFCC_CODE_VERSION=v1\n');
      expect(content).to.include('SFCC_SERVER=zzpq-019.dx.commercecloud.salesforce.com\n');
      expect(content).to.include('PUBLIC__app__commerce__api__organizationId=f_ecom_zzpq_019\n');
    });

    it('refuses to unset a derived value', async () => {
      const {resolveAgain} = await resolveStorefrontNext();
      const error = await expectWriteError(removeConfigField(await resolveAgain(), 'hostname'), 'CONFIG_NOT_SET');
      expect(error.message).to.include('derived from tenantId in StorefrontNextEnvSource');
    });

    it('leaves Storefront Next settings to the storefront app', async () => {
      const {envPath, resolveAgain} = await resolveStorefrontNext();
      try {
        await writeConfigField(await resolveAgain(), 'shortCode', 'other');
        expect.fail('expected an error');
      } catch (error) {
        expect((error as Error).message).to.include('PUBLIC__app__commerce__api__shortCode');
      }
      expect(fs.readFileSync(envPath, 'utf8')).to.not.include('SFCC_SHORTCODE');
    });

    it('writes to the dw.json entry whose tenant ID gives the hostname', async () => {
      writeDwJson({configs: [{name: 'dev', active: true, 'tenant-id': 'zzpq_019'}]});
      await writeConfigField(await resolve(), 'codeVersion', 'v1');
      await writeConfigField(await resolve(), 'hostname', 'zzpq-019.dx.commercecloud.salesforce.com');
      expect(readDwJson().configs[0]).to.include({
        'code-version': 'v1',
        hostname: 'zzpq-019.dx.commercecloud.salesforce.com',
      });
    });

    it('refuses a hostname derived from a read-only source', async () => {
      const config = await resolve({before: [new EnvSource({SFCC_TENANT_ID: 'zzpq_019'})]});
      const error = await expectWriteError(
        writeConfigField(config, 'hostname', 'x.example.com'),
        'CONFIG_SOURCE_READ_ONLY',
      );
      expect(error.message).to.include('EnvSource');
    });
  });

  describe('DotenvFileSource', () => {
    async function update(content: string, patch: Record<string, unknown>): Promise<string> {
      const envPath = writeDotenv(content);
      await new DotenvFileSource(envPath).updateConfig(patch, {});
      return fs.readFileSync(envPath, 'utf8');
    }

    it('replaces the highest-precedence alias already present', async () => {
      expect(await update('SFCC_OAUTH_CLIENT_ID=a\nSFCC_CLIENT_ID=b\n', {clientId: 'c'})).to.equal(
        'SFCC_OAUTH_CLIENT_ID=a\nSFCC_CLIENT_ID=c\n',
      );
    });

    it('appends the canonical variable', async () => {
      expect(await update('A=1', {mrtApiKey: 'k'})).to.equal('A=1\nMRT_API_KEY=k\n');
      expect(await update('A=1\n', {scapiSchemas: ['./a', './b']})).to.equal('A=1\nSFCC_SCAPI_SCHEMAS=./a,./b\n');
    });

    it('quotes values with spaces or comment characters', async () => {
      expect(await update('', {codeVersion: 'a b#c'})).to.equal("SFCC_CODE_VERSION='a b#c'\n");
    });

    it('removes every alias when unsetting', async () => {
      expect(await update('SFCC_OAUTH_CLIENT_ID=a\nX=1\nSFCC_CLIENT_ID=b\n', {clientId: undefined})).to.equal('X=1\n');
    });

    it('refuses values .env cannot represent', async () => {
      const envPath = writeDotenv('');
      const source = new DotenvFileSource(envPath);
      expect(() => source.updateConfig({safety: {level: 'NO_DELETE'}}, {})).to.throw(/dw.json/);
      expect(() => source.updateConfig({cartridges: ['a,b']}, {})).to.throw(/environment variable/);
      expect(() => source.updateConfig({contentLibrary: 'lib'}, {})).to.throw(/no environment variable/);
    });

    it('refuses to edit a multi-line value', async () => {
      const envPath = writeDotenv('SFCC_CLIENT_SECRET="line1\nline2"\n');
      expect(() => new DotenvFileSource(envPath).updateConfig({clientSecret: 'x'}, {})).to.throw(/multiple lines/);
    });
  });
});
