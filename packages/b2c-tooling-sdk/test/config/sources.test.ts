/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {ConfigResolver, DwJsonSource} from '@salesforce/b2c-tooling-sdk/config';
import {PackageJsonSource} from '../../src/config/sources/package-json-source.js';

describe('config/sources', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create a temporary directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-sources-test-'));
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

  describe('DwJsonSource', () => {
    it('loads config from dw.json in current directory', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'test.demandware.net',
          'code-version': 'v1',
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = resolver.resolve();

      expect(config.hostname).to.equal('test.demandware.net');
      expect(config.codeVersion).to.equal('v1');
    });

    it('does NOT load config from dw.json in parent directory (no upward search)', () => {
      const subDir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subDir);
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'parent.demandware.net',
        }),
      );

      // Change to subdirectory - should NOT find parent's dw.json
      process.chdir(subDir);
      const resolver = new ConfigResolver();
      const {config} = resolver.resolve();

      // Parent dw.json should NOT be found (no upward search)
      expect(config.hostname).to.be.undefined;
    });

    it('handles OAuth credentials from dw.json', () => {
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

      const resolver = new ConfigResolver();
      const {config} = resolver.resolve();

      expect(config.clientId).to.equal('test-client');
      expect(config.clientSecret).to.equal('test-secret');
      expect(config.scopes).to.deep.equal(['mail', 'roles']);
    });

    it('loads tenant-id from dw.json', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'test.demandware.net',
          'tenant-id': 'abcd_prd',
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = resolver.resolve();

      expect(config.tenantId).to.equal('abcd_prd');
    });

    it('returns undefined when dw.json does not exist', () => {
      const resolver = new ConfigResolver();
      const {config} = resolver.resolve();

      // Should not have hostname from dw.json
      expect(config.hostname).to.be.undefined;
    });

    it('handles named instance from multi-config', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'root.demandware.net',
          configs: [
            {name: 'staging', hostname: 'staging.demandware.net'},
            {name: 'production', hostname: 'prod.demandware.net'},
          ],
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = resolver.resolve({}, {instance: 'staging'});

      expect(config.hostname).to.equal('staging.demandware.net');
    });

    it('provides location from load result', () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'test.demandware.net',
        }),
      );

      const resolver = new ConfigResolver();
      const {sources} = resolver.resolve();

      const dwJsonSource = sources.find((s) => s.name === 'DwJsonSource');
      // Normalize paths to handle macOS symlinks (/var -> /private/var)
      const expectedPath = fs.realpathSync(dwJsonPath);
      const actualLocation = dwJsonSource?.location ? fs.realpathSync(dwJsonSource.location) : undefined;
      expect(actualLocation).to.equal(expectedPath);
    });

    describe('listInstances', () => {
      it('returns empty array when no dw.json exists', () => {
        const source = new DwJsonSource();
        const instances = source.listInstances();
        expect(instances).to.deep.equal([]);
      });

      it('returns instances from configs array', () => {
        const dwJsonPath = path.join(tempDir, 'dw.json');
        fs.writeFileSync(
          dwJsonPath,
          JSON.stringify({
            configs: [
              {name: 'staging', hostname: 'staging.demandware.net'},
              {name: 'production', hostname: 'prod.demandware.net', active: true},
            ],
          }),
        );

        const source = new DwJsonSource();
        const instances = source.listInstances();

        expect(instances).to.have.length(2);
        expect(instances[0].name).to.equal('staging');
        expect(instances[0].hostname).to.equal('staging.demandware.net');
        expect(instances[1].name).to.equal('production');
        expect(instances[1].active).to.be.true;
      });

      it('includes root config if it has a name', () => {
        const dwJsonPath = path.join(tempDir, 'dw.json');
        fs.writeFileSync(
          dwJsonPath,
          JSON.stringify({
            name: 'root',
            hostname: 'root.demandware.net',
            active: true,
            configs: [{name: 'staging', hostname: 'staging.demandware.net'}],
          }),
        );

        const source = new DwJsonSource();
        const instances = source.listInstances();

        expect(instances).to.have.length(2);
        expect(instances[0].name).to.equal('root');
        expect(instances[0].active).to.be.true;
        expect(instances[1].name).to.equal('staging');
      });
    });

    describe('createInstance', () => {
      it('creates a new instance', () => {
        const source = new DwJsonSource();
        source.createInstance({
          name: 'staging',
          config: {hostname: 'staging.demandware.net'},
        });

        const instances = source.listInstances();
        expect(instances).to.have.length(1);
        expect(instances[0].name).to.equal('staging');
        expect(instances[0].hostname).to.equal('staging.demandware.net');
      });

      it('creates instance with setActive', () => {
        const source = new DwJsonSource();
        source.createInstance({
          name: 'staging',
          config: {hostname: 'staging.demandware.net'},
          setActive: true,
        });

        const instances = source.listInstances();
        expect(instances[0].active).to.be.true;
      });
    });

    describe('removeInstance', () => {
      it('removes an instance', () => {
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

        const source = new DwJsonSource();
        source.removeInstance('staging');

        const instances = source.listInstances();
        expect(instances).to.have.length(1);
        expect(instances[0].name).to.equal('production');
      });
    });

    describe('setActiveInstance', () => {
      it('sets an instance as active', () => {
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

        const source = new DwJsonSource();
        source.setActiveInstance('staging');

        const instances = source.listInstances();
        const staging = instances.find((i) => i.name === 'staging');
        expect(staging?.active).to.be.true;
      });
    });
  });

  describe('MobifySource', () => {
    it('loads mrtApiKey from ~/.mobify', function () {
      const originalHomedir = os.homedir;
      let canMock = false;
      try {
        Object.defineProperty(os, 'homedir', {
          value: () => tempDir,
          writable: true,
          enumerable: true,
          configurable: true,
        });
        canMock = true;
      } catch {
        this.skip();
      }

      if (canMock) {
        const mobifyPath = path.join(tempDir, '.mobify');
        fs.writeFileSync(
          mobifyPath,
          JSON.stringify({
            username: 'user@example.com',
            api_key: 'test-api-key',
          }),
        );

        const resolver = new ConfigResolver();
        const {config} = resolver.resolve();

        expect(config.mrtApiKey).to.equal('test-api-key');

        // Restore
        Object.defineProperty(os, 'homedir', {
          value: originalHomedir,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    });

    it('returns undefined when ~/.mobify does not exist', function () {
      const originalHomedir = os.homedir;
      let canMock = false;
      try {
        Object.defineProperty(os, 'homedir', {
          value: () => tempDir,
          writable: true,
          enumerable: true,
          configurable: true,
        });
        canMock = true;
      } catch {
        this.skip();
      }

      if (canMock) {
        const resolver = new ConfigResolver();
        const {config} = resolver.resolve();

        expect(config.mrtApiKey).to.be.undefined;

        // Restore
        Object.defineProperty(os, 'homedir', {
          value: originalHomedir,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    });

    it('returns undefined when api_key is missing from ~/.mobify', function () {
      const originalHomedir = os.homedir;
      let canMock = false;
      try {
        Object.defineProperty(os, 'homedir', {
          value: () => tempDir,
          writable: true,
          enumerable: true,
          configurable: true,
        });
        canMock = true;
      } catch {
        this.skip();
      }

      if (canMock) {
        const mobifyPath = path.join(tempDir, '.mobify');
        fs.writeFileSync(
          mobifyPath,
          JSON.stringify({
            username: 'user@example.com',
          }),
        );

        const resolver = new ConfigResolver();
        const {config} = resolver.resolve();

        expect(config.mrtApiKey).to.be.undefined;

        // Restore
        Object.defineProperty(os, 'homedir', {
          value: originalHomedir,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    });

    it('handles cloudOrigin for custom mobify file', function () {
      const originalHomedir = os.homedir;
      let canMock = false;
      try {
        Object.defineProperty(os, 'homedir', {
          value: () => tempDir,
          writable: true,
          enumerable: true,
          configurable: true,
        });
        canMock = true;
      } catch {
        this.skip();
      }

      if (canMock) {
        const mobifyPath = path.join(tempDir, '.mobify--example.com');
        fs.writeFileSync(
          mobifyPath,
          JSON.stringify({
            api_key: 'cloud-api-key',
          }),
        );

        const resolver = new ConfigResolver();
        const {config} = resolver.resolve({}, {cloudOrigin: 'https://example.com'});

        expect(config.mrtApiKey).to.equal('cloud-api-key');

        // Restore
        Object.defineProperty(os, 'homedir', {
          value: originalHomedir,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    });

    it('creates SOURCE_ERROR warning for invalid JSON in ~/.mobify', function () {
      const originalHomedir = os.homedir;
      let canMock = false;
      try {
        Object.defineProperty(os, 'homedir', {
          value: () => tempDir,
          writable: true,
          enumerable: true,
          configurable: true,
        });
        canMock = true;
      } catch {
        this.skip();
      }

      if (canMock) {
        const mobifyPath = path.join(tempDir, '.mobify');
        fs.writeFileSync(mobifyPath, 'invalid json');

        const resolver = new ConfigResolver();
        const {config, warnings} = resolver.resolve();

        // Config should not have the API key
        expect(config.mrtApiKey).to.be.undefined;
        // Should have a SOURCE_ERROR warning for MobifySource
        const sourceError = warnings.find((w) => w.code === 'SOURCE_ERROR' && w.message.includes('MobifySource'));
        expect(sourceError).to.not.be.undefined;
        expect(sourceError?.message).to.include('Failed to load configuration');

        // Restore
        Object.defineProperty(os, 'homedir', {
          value: originalHomedir,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    });

    it('provides location from load result', function () {
      const originalHomedir = os.homedir;
      let canMock = false;
      try {
        Object.defineProperty(os, 'homedir', {
          value: () => tempDir,
          writable: true,
          enumerable: true,
          configurable: true,
        });
        canMock = true;
      } catch {
        this.skip();
      }

      if (canMock) {
        const mobifyPath = path.join(tempDir, '.mobify');
        fs.writeFileSync(
          mobifyPath,
          JSON.stringify({
            api_key: 'test-api-key',
          }),
        );

        const resolver = new ConfigResolver();
        const {sources} = resolver.resolve();

        const mobifySource = sources.find((s) => s.name === 'MobifySource');
        // Normalize paths to handle macOS symlinks
        const expectedPath = fs.realpathSync(mobifyPath);
        const actualLocation = mobifySource?.location ? fs.realpathSync(mobifySource.location) : undefined;
        expect(actualLocation).to.equal(expectedPath);

        // Restore
        Object.defineProperty(os, 'homedir', {
          value: originalHomedir,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    });
  });

  describe('PackageJsonSource', () => {
    it('loads allowed fields from package.json b2c key', () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({
          name: 'test-project',
          b2c: {
            shortCode: 'abc123',
            clientId: 'test-client-id',
            mrtProject: 'my-project',
            mrtOrigin: 'https://custom.cloud.com',
            accountManagerHost: 'account.demandware.com',
          },
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = resolver.resolve();

      expect(config.shortCode).to.equal('abc123');
      expect(config.clientId).to.equal('test-client-id');
      expect(config.mrtProject).to.equal('my-project');
      expect(config.mrtOrigin).to.equal('https://custom.cloud.com');
      expect(config.accountManagerHost).to.equal('account.demandware.com');
    });

    it('ignores sensitive/instance-specific fields', () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({
          name: 'test-project',
          b2c: {
            shortCode: 'abc123',
            // These should be ignored
            hostname: 'should-be-ignored.demandware.net',
            password: 'secret-password',
            clientSecret: 'secret-client-secret',
            username: 'secret-user',
            mrtApiKey: 'secret-api-key',
          },
        }),
      );

      // Use PackageJsonSource directly to test in isolation
      const source = new PackageJsonSource();
      const result = source.load({startDir: tempDir});

      expect(result).to.not.be.undefined;
      expect(result!.config.shortCode).to.equal('abc123');
      // Sensitive/instance-specific fields should NOT be loaded by PackageJsonSource
      expect(result!.config.hostname).to.be.undefined;
      expect(result!.config.password).to.be.undefined;
      expect(result!.config.clientSecret).to.be.undefined;
      expect(result!.config.username).to.be.undefined;
      expect(result!.config.mrtApiKey).to.be.undefined;
    });

    it('returns undefined when package.json does not exist', () => {
      const resolver = new ConfigResolver();
      const {sources} = resolver.resolve();

      const packageJsonSource = sources.find((s) => s.name === 'PackageJsonSource');
      expect(packageJsonSource).to.be.undefined;
    });

    it('returns undefined when b2c key is missing', () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({
          name: 'test-project',
        }),
      );

      const resolver = new ConfigResolver();
      const {sources} = resolver.resolve();

      const packageJsonSource = sources.find((s) => s.name === 'PackageJsonSource');
      expect(packageJsonSource).to.be.undefined;
    });

    it('returns undefined when b2c key has only disallowed fields', () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({
          name: 'test-project',
          b2c: {
            hostname: 'should-be-ignored.demandware.net',
            password: 'secret',
          },
        }),
      );

      const resolver = new ConfigResolver();
      const {sources} = resolver.resolve();

      const packageJsonSource = sources.find((s) => s.name === 'PackageJsonSource');
      expect(packageJsonSource).to.be.undefined;
    });

    it('has lowest priority (1000) and does not override other sources', () => {
      // Create dw.json with clientId
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'test.demandware.net',
          'client-id': 'dw-client-id',
          shortCode: 'dw-short-code',
        }),
      );

      // Create package.json with different clientId and shortCode
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({
          name: 'test-project',
          b2c: {
            clientId: 'package-client-id',
            shortCode: 'package-short-code',
            mrtProject: 'package-project', // Only in package.json
          },
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = resolver.resolve();

      // dw.json values should take precedence (priority 0 < 1000)
      expect(config.clientId).to.equal('dw-client-id');
      expect(config.shortCode).to.equal('dw-short-code');
      // package.json should fill in gaps
      expect(config.mrtProject).to.equal('package-project');
    });

    it('provides location from load result', () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({
          name: 'test-project',
          b2c: {
            shortCode: 'abc123',
          },
        }),
      );

      const resolver = new ConfigResolver();
      const {sources} = resolver.resolve();

      const packageJsonSource = sources.find((s) => s.name === 'PackageJsonSource');
      // Normalize paths to handle macOS symlinks
      const expectedPath = fs.realpathSync(packageJsonPath);
      const actualLocation = packageJsonSource?.location ? fs.realpathSync(packageJsonSource.location) : undefined;
      expect(actualLocation).to.equal(expectedPath);
    });

    it('accepts kebab-case fields and normalizes to camelCase', () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({
          name: 'test-project',
          b2c: {
            'short-code': 'abc123',
            'client-id': 'test-client-id',
            'mrt-project': 'my-project',
            'account-manager-host': 'account.demandware.com',
            'sandbox-api-host': 'admin.dx.commercecloud.salesforce.com',
          },
        }),
      );

      const source = new PackageJsonSource();
      const result = source.load({startDir: tempDir});

      expect(result).to.not.be.undefined;
      expect(result!.config.shortCode).to.equal('abc123');
      expect(result!.config.clientId).to.equal('test-client-id');
      expect(result!.config.mrtProject).to.equal('my-project');
      expect(result!.config.accountManagerHost).to.equal('account.demandware.com');
      expect(result!.config.sandboxApiHost).to.equal('admin.dx.commercecloud.salesforce.com');
    });

    it('rejects disallowed fields even in kebab-case', () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({
          name: 'test-project',
          b2c: {
            'short-code': 'abc123',
            // These should still be rejected after normalization
            password: 'secret',
            'client-secret': 'secret',
          },
        }),
      );

      const source = new PackageJsonSource();
      const result = source.load({startDir: tempDir});

      expect(result).to.not.be.undefined;
      expect(result!.config.shortCode).to.equal('abc123');
      expect(result!.config.password).to.be.undefined;
      expect(result!.config.clientSecret).to.be.undefined;
    });

    it('handles invalid JSON gracefully', () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(packageJsonPath, 'invalid json');

      const resolver = new ConfigResolver();
      const {sources} = resolver.resolve();

      const packageJsonSource = sources.find((s) => s.name === 'PackageJsonSource');
      expect(packageJsonSource).to.be.undefined;
    });
  });
});
