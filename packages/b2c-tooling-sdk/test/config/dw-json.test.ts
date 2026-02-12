/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  findDwJson,
  loadDwJson,
  loadFullDwJson,
  saveDwJson,
  addInstance,
  removeInstance,
  setActiveInstance,
  type DwJsonMultiConfig,
} from '@salesforce/b2c-tooling-sdk/config';

describe('config/dw-json', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create a temporary directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dw-json-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Clean up
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  describe('findDwJson', () => {
    it('returns undefined when no dw.json exists', () => {
      const result = findDwJson();
      expect(result).to.be.undefined;
    });

    it('finds dw.json in current directory', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(dwJsonPath, JSON.stringify({hostname: 'test.demandware.net'}));

      const result = findDwJson(tempDir);
      expect(result).to.equal(dwJsonPath);
    });

    it('finds dw.json in parent directory', () => {
      const subDir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subDir);
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(dwJsonPath, JSON.stringify({hostname: 'test.demandware.net'}));

      const result = findDwJson(subDir);
      expect(result).to.equal(dwJsonPath);
    });

    it('stops at filesystem root', () => {
      const root = path.parse(tempDir).root;
      const result = findDwJson(root);
      expect(result).to.be.undefined;
    });
  });

  describe('loadDwJson', () => {
    it('returns undefined when no dw.json exists', () => {
      const result = loadDwJson();
      expect(result).to.be.undefined;
    });

    it('loads basic dw.json config', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'test.demandware.net',
          'code-version': 'v1',
          username: 'test-user',
          password: 'test-pass',
        }),
      );

      const result = loadDwJson();
      // Keys are normalized to camelCase
      expect(result?.config.hostname).to.equal('test.demandware.net');
      expect(result?.config.codeVersion).to.equal('v1');
      expect(result?.config.username).to.equal('test-user');
      expect(result?.config.password).to.equal('test-pass');
    });

    it('loads config from explicit path', () => {
      const customPath = path.join(tempDir, 'custom-dw.json');
      fs.writeFileSync(customPath, JSON.stringify({hostname: 'custom.demandware.net'}));

      const result = loadDwJson({path: customPath});
      expect(result?.config.hostname).to.equal('custom.demandware.net');
    });

    it('selects named instance from multi-config', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      const multiConfig = {
        hostname: 'root.demandware.net',
        configs: [
          {name: 'staging', hostname: 'staging.demandware.net'},
          {name: 'production', hostname: 'prod.demandware.net'},
        ],
      };
      fs.writeFileSync(dwJsonPath, JSON.stringify(multiConfig));

      const result = loadDwJson({instance: 'staging'});
      expect(result?.config.hostname).to.equal('staging.demandware.net');
      expect(result?.config.name).to.equal('staging');
    });

    it('returns undefined when requested instance does not exist', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      const multiConfig = {
        hostname: 'root.demandware.net',
        configs: [
          {name: 'staging', hostname: 'staging.demandware.net'},
          {name: 'production', hostname: 'prod.demandware.net'},
        ],
      };
      fs.writeFileSync(dwJsonPath, JSON.stringify(multiConfig));

      const result = loadDwJson({instance: 'nonexistent'});
      expect(result).to.be.undefined;
    });

    it('selects active config when no instance specified', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      const multiConfig = {
        active: false,
        hostname: 'root.demandware.net',
        configs: [
          {name: 'staging', hostname: 'staging.demandware.net', active: false},
          {name: 'production', hostname: 'prod.demandware.net', active: true},
        ],
      };
      fs.writeFileSync(dwJsonPath, JSON.stringify(multiConfig));

      const result = loadDwJson();
      expect(result?.config.hostname).to.equal('prod.demandware.net');
      expect(result?.config.name).to.equal('production');
    });

    it('returns root config when no active config found', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      const multiConfig = {
        active: true,
        hostname: 'root.demandware.net',
        configs: [{name: 'staging', hostname: 'staging.demandware.net', active: false}],
      };
      fs.writeFileSync(dwJsonPath, JSON.stringify(multiConfig));

      const result = loadDwJson();
      expect(result?.config.hostname).to.equal('root.demandware.net');
    });

    it('throws for invalid JSON', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(dwJsonPath, 'invalid json');

      expect(() => loadDwJson()).to.throw(SyntaxError);
    });

    it('returns undefined for non-existent explicit path', () => {
      const result = loadDwJson({path: '/nonexistent/dw.json'});
      expect(result).to.be.undefined;
    });

    it('handles OAuth credentials (kebab-case input)', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'test.demandware.net',
          'client-id': 'test-client',
          'client-secret': 'test-secret',
          'oauth-scopes': ['mail', 'roles'],
        }),
      );

      const result = loadDwJson();
      // Kebab-case keys are normalized to camelCase
      expect(result?.config.clientId).to.equal('test-client');
      expect(result?.config.clientSecret).to.equal('test-secret');
      expect(result?.config.oauthScopes).to.deep.equal(['mail', 'roles']);
    });

    it('handles OAuth credentials (camelCase input)', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'test.demandware.net',
          clientId: 'test-client',
          clientSecret: 'test-secret',
          oauthScopes: ['mail', 'roles'],
        }),
      );

      const result = loadDwJson();
      expect(result?.config.clientId).to.equal('test-client');
      expect(result?.config.clientSecret).to.equal('test-secret');
      expect(result?.config.oauthScopes).to.deep.equal(['mail', 'roles']);
    });

    it('handles webdav-hostname', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'test.demandware.net',
          'webdav-hostname': 'webdav.test.com',
        }),
      );

      const result = loadDwJson();
      // webdav-hostname normalizes to webdavHostname
      expect(result?.config.webdavHostname).to.equal('webdav.test.com');
    });

    it('normalizes configs[] items', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          configs: [
            {
              name: 'staging',
              hostname: 'staging.demandware.net',
              'client-id': 'staging-client',
              'code-version': 'v2',
            },
          ],
        }),
      );

      const result = loadDwJson({instance: 'staging'});
      expect(result?.config.clientId).to.equal('staging-client');
      expect(result?.config.codeVersion).to.equal('v2');
    });

    it('normalizes legacy aliases', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          server: 'test.demandware.net',
          secureHostname: 'webdav.test.com',
          passphrase: 'cert-pass',
          selfsigned: true,
          cloudOrigin: 'https://cloud.example.com',
          'scapi-shortcode': 'abc123',
        }),
      );

      const result = loadDwJson();
      expect(result?.config.hostname).to.equal('test.demandware.net');
      expect(result?.config.webdavHostname).to.equal('webdav.test.com');
      expect(result?.config.certificatePassphrase).to.equal('cert-pass');
      expect(result?.config.selfSigned).to.equal(true);
      expect(result?.config.mrtOrigin).to.equal('https://cloud.example.com');
      expect(result?.config.shortCode).to.equal('abc123');
    });
  });

  describe('loadFullDwJson', () => {
    it('returns undefined when no dw.json exists', () => {
      const result = loadFullDwJson();
      expect(result).to.be.undefined;
    });

    it('loads the full multi-config structure', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      const multiConfig: DwJsonMultiConfig = {
        hostname: 'root.demandware.net',
        configs: [
          {name: 'staging', hostname: 'staging.demandware.net'},
          {name: 'production', hostname: 'prod.demandware.net'},
        ],
      };
      fs.writeFileSync(dwJsonPath, JSON.stringify(multiConfig));

      const result = loadFullDwJson();
      expect(result?.config).to.deep.equal(multiConfig);
      expect(result?.config.configs).to.have.length(2);
    });
  });

  describe('saveDwJson', () => {
    it('writes config to file', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      const config: DwJsonMultiConfig = {
        hostname: 'test.demandware.net',
        configs: [{name: 'staging', hostname: 'staging.demandware.net'}],
      };

      saveDwJson(config, dwJsonPath);

      const content = fs.readFileSync(dwJsonPath, 'utf8');
      expect(JSON.parse(content)).to.deep.equal(config);
    });

    it('formats with 2-space indentation and trailing newline', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      const config: DwJsonMultiConfig = {hostname: 'test.demandware.net'};

      saveDwJson(config, dwJsonPath);

      const content = fs.readFileSync(dwJsonPath, 'utf8');
      expect(content).to.match(/^\{[\s\S]*\}\n$/);
      expect(content).to.contain('  "hostname"');
    });
  });

  describe('addInstance', () => {
    it('creates dw.json if it does not exist', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      expect(fs.existsSync(dwJsonPath)).to.be.false;

      addInstance({name: 'staging', hostname: 'staging.demandware.net'});

      expect(fs.existsSync(dwJsonPath)).to.be.true;
      const result = loadFullDwJson();
      expect(result?.config.configs).to.have.length(1);
      expect(result?.config.configs?.[0].name).to.equal('staging');
    });

    it('adds instance to existing configs array', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          configs: [{name: 'production', hostname: 'prod.demandware.net'}],
        }),
      );

      addInstance({name: 'staging', hostname: 'staging.demandware.net'});

      const result = loadFullDwJson();
      expect(result?.config.configs).to.have.length(2);
      expect(result?.config.configs?.[1].name).to.equal('staging');
    });

    it('throws if instance already exists in configs array', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          configs: [{name: 'staging', hostname: 'staging.demandware.net'}],
        }),
      );

      expect(() => addInstance({name: 'staging', hostname: 'new.demandware.net'})).to.throw('already exists');
    });

    it('throws if instance name matches root config name', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          name: 'staging',
          hostname: 'staging.demandware.net',
        }),
      );

      expect(() => addInstance({name: 'staging', hostname: 'new.demandware.net'})).to.throw('already exists');
    });

    it('throws if instance has no name', () => {
      expect(() => addInstance({hostname: 'test.demandware.net'})).to.throw('must have a name');
    });

    it('sets instance as active and clears other active flags', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          active: true,
          hostname: 'root.demandware.net',
          configs: [{name: 'production', hostname: 'prod.demandware.net', active: true}],
        }),
      );

      addInstance({name: 'staging', hostname: 'staging.demandware.net'}, {setActive: true});

      const result = loadFullDwJson();
      expect(result?.config.active).to.be.false;
      expect(result?.config.configs?.[0].active).to.be.false;
      expect(result?.config.configs?.[1].active).to.be.true;
    });
  });

  describe('removeInstance', () => {
    it('removes instance from configs array', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          configs: [
            {name: 'staging', hostname: 'staging.demandware.net'},
            {name: 'production', hostname: 'prod.demandware.net'},
          ],
        }),
      );

      removeInstance('staging');

      const result = loadFullDwJson();
      expect(result?.config.configs).to.have.length(1);
      expect(result?.config.configs?.[0].name).to.equal('production');
    });

    it('throws if dw.json does not exist', () => {
      expect(() => removeInstance('staging')).to.throw('No dw.json file found');
    });

    it('throws if instance not found', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          configs: [{name: 'production', hostname: 'prod.demandware.net'}],
        }),
      );

      expect(() => removeInstance('staging')).to.throw('not found');
    });

    it('throws if trying to remove root config', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          name: 'staging',
          hostname: 'staging.demandware.net',
        }),
      );

      expect(() => removeInstance('staging')).to.throw('Cannot remove root instance');
    });
  });

  describe('setActiveInstance', () => {
    it('sets instance as active in configs array', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          configs: [
            {name: 'staging', hostname: 'staging.demandware.net'},
            {name: 'production', hostname: 'prod.demandware.net'},
          ],
        }),
      );

      setActiveInstance('staging');

      const result = loadFullDwJson();
      expect(result?.config.configs?.[0].active).to.be.true;
      expect(result?.config.configs?.[1].active).to.be.undefined;
    });

    it('sets root config as active', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          name: 'root',
          hostname: 'root.demandware.net',
          configs: [{name: 'staging', hostname: 'staging.demandware.net', active: true}],
        }),
      );

      setActiveInstance('root');

      const result = loadFullDwJson();
      expect(result?.config.active).to.be.true;
      expect(result?.config.configs?.[0].active).to.be.false;
    });

    it('clears other active flags when setting new active', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          active: true,
          hostname: 'root.demandware.net',
          configs: [
            {name: 'staging', hostname: 'staging.demandware.net', active: true},
            {name: 'production', hostname: 'prod.demandware.net'},
          ],
        }),
      );

      setActiveInstance('production');

      const result = loadFullDwJson();
      expect(result?.config.active).to.be.false;
      expect(result?.config.configs?.[0].active).to.be.false;
      expect(result?.config.configs?.[1].active).to.be.true;
    });

    it('throws if dw.json does not exist', () => {
      expect(() => setActiveInstance('staging')).to.throw('No dw.json file found');
    });

    it('throws if instance not found', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          configs: [{name: 'production', hostname: 'prod.demandware.net'}],
        }),
      );

      expect(() => setActiveInstance('staging')).to.throw('not found');
    });
  });
});
