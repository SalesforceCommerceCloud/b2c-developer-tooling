/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {findDwJson, loadDwJson, type DwJsonConfig} from '@salesforce/b2c-tooling-sdk/config';

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
      const config: DwJsonConfig = {
        hostname: 'test.demandware.net',
        'code-version': 'v1',
        username: 'test-user',
        password: 'test-pass',
      };
      fs.writeFileSync(dwJsonPath, JSON.stringify(config));

      const result = loadDwJson();
      expect(result?.config).to.deep.equal(config);
    });

    it('loads config from explicit path', () => {
      const customPath = path.join(tempDir, 'custom-dw.json');
      const config: DwJsonConfig = {
        hostname: 'custom.demandware.net',
      };
      fs.writeFileSync(customPath, JSON.stringify(config));

      const result = loadDwJson({path: customPath});
      expect(result?.config).to.deep.equal(config);
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

    it('returns undefined for invalid JSON', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(dwJsonPath, 'invalid json');

      const result = loadDwJson();
      expect(result).to.be.undefined;
    });

    it('returns undefined for non-existent explicit path', () => {
      const result = loadDwJson({path: '/nonexistent/dw.json'});
      expect(result).to.be.undefined;
    });

    it('handles OAuth credentials', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      const config: DwJsonConfig = {
        hostname: 'test.demandware.net',
        'client-id': 'test-client',
        'client-secret': 'test-secret',
        'oauth-scopes': ['mail', 'roles'],
      };
      fs.writeFileSync(dwJsonPath, JSON.stringify(config));

      const result = loadDwJson();
      expect(result?.config['client-id']).to.equal('test-client');
      expect(result?.config['client-secret']).to.equal('test-secret');
      expect(result?.config['oauth-scopes']).to.deep.equal(['mail', 'roles']);
    });

    it('handles webdav-hostname', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      const config: DwJsonConfig = {
        hostname: 'test.demandware.net',
        'webdav-hostname': 'webdav.test.com',
      };
      fs.writeFileSync(dwJsonPath, JSON.stringify(config));

      const result = loadDwJson();
      expect(result?.config['webdav-hostname']).to.equal('webdav.test.com');
    });
  });
});
