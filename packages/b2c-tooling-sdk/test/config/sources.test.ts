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
    it('loads config from dw.json in current directory', async () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'test.demandware.net',
          'code-version': 'v1',
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve();

      expect(config.hostname).to.equal('test.demandware.net');
      expect(config.codeVersion).to.equal('v1');
    });

    it('does NOT load config from dw.json in parent directory (no upward search)', async () => {
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
      const {config} = await resolver.resolve();

      // Parent dw.json should NOT be found (no upward search)
      expect(config.hostname).to.be.undefined;
    });

    it('handles OAuth credentials from dw.json', async () => {
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
      const {config} = await resolver.resolve();

      expect(config.clientId).to.equal('test-client');
      expect(config.clientSecret).to.equal('test-secret');
      expect(config.scopes).to.deep.equal(['mail', 'roles']);
    });

    it('loads tenant-id from dw.json', async () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'test.demandware.net',
          'tenant-id': 'abcd_prd',
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve();

      expect(config.tenantId).to.equal('abcd_prd');
    });

    it('loads import-set directory exclusions from dw.json', async () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'test.demandware.net',
          'import-set-exclude': ['fixtures', 'test/integration'],
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve();

      expect(config.importSetExclude).to.deep.equal(['fixtures', 'test/integration']);
    });

    it('returns undefined when dw.json does not exist', async () => {
      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve();

      // Should not have hostname from dw.json
      expect(config.hostname).to.be.undefined;
    });

    it('uses the global default config when the project has no dw.json', async () => {
      const defaultConfigPath = path.join(tempDir, 'shared.dw.json');
      const projectDirectory = path.join(tempDir, 'project');
      fs.mkdirSync(projectDirectory);
      fs.writeFileSync(defaultConfigPath, JSON.stringify({hostname: 'global-default.demandware.net'}));

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve({}, {projectDirectory, defaultConfigPath});

      expect(config.hostname).to.equal('global-default.demandware.net');
    });

    it('prefers the project dw.json over the global default config', async () => {
      const defaultConfigPath = path.join(tempDir, 'shared.dw.json');
      const projectDirectory = path.join(tempDir, 'project');
      fs.mkdirSync(projectDirectory);
      fs.writeFileSync(defaultConfigPath, JSON.stringify({hostname: 'global-default.demandware.net'}));
      fs.writeFileSync(path.join(projectDirectory, 'dw.json'), JSON.stringify({hostname: 'project.demandware.net'}));

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve({}, {projectDirectory, defaultConfigPath});

      expect(config.hostname).to.equal('project.demandware.net');
    });

    it('prefers an explicit config path over project and global defaults', async () => {
      const explicitConfigPath = path.join(tempDir, 'explicit.dw.json');
      const defaultConfigPath = path.join(tempDir, 'shared.dw.json');
      const projectDirectory = path.join(tempDir, 'project');
      fs.mkdirSync(projectDirectory);
      fs.writeFileSync(explicitConfigPath, JSON.stringify({hostname: 'explicit.demandware.net'}));
      fs.writeFileSync(defaultConfigPath, JSON.stringify({hostname: 'global-default.demandware.net'}));
      fs.writeFileSync(path.join(projectDirectory, 'dw.json'), JSON.stringify({hostname: 'project.demandware.net'}));

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve(
        {},
        {projectDirectory, configPath: explicitConfigPath, defaultConfigPath},
      );

      expect(config.hostname).to.equal('explicit.demandware.net');
    });

    it('prefers the explicit file default over an active global instance', async () => {
      const explicitConfigPath = path.join(tempDir, 'explicit.dw.json');
      const defaultConfigPath = path.join(tempDir, 'shared.dw.json');
      fs.writeFileSync(explicitConfigPath, JSON.stringify({hostname: 'explicit.demandware.net'}));
      fs.writeFileSync(
        defaultConfigPath,
        JSON.stringify({configs: [{name: 'global', hostname: 'global.demandware.net', active: true}]}),
      );

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve({}, {configPath: explicitConfigPath, defaultConfigPath});

      expect(config.hostname).to.equal('explicit.demandware.net');
    });

    it('handles named instance from multi-config', async () => {
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
      const {config} = await resolver.resolve({}, {instance: 'staging'});

      expect(config.hostname).to.equal('staging.demandware.net');
    });

    it('selects a named instance from the global catalog when it is absent locally', async () => {
      const defaultConfigPath = path.join(tempDir, 'shared.dw.json');
      fs.writeFileSync(
        path.join(tempDir, 'dw.json'),
        JSON.stringify({configs: [{name: 'local', hostname: 'local.demandware.net'}]}),
      );
      fs.writeFileSync(
        defaultConfigPath,
        JSON.stringify({configs: [{name: 'global', hostname: 'global.demandware.net'}]}),
      );

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve({}, {instance: 'global', defaultConfigPath});

      expect(config.hostname).to.equal('global.demandware.net');
    });

    it('shadows a same-name global instance with the complete local instance', async () => {
      const defaultConfigPath = path.join(tempDir, 'shared.dw.json');
      fs.writeFileSync(
        path.join(tempDir, 'dw.json'),
        JSON.stringify({configs: [{name: 'shared', hostname: 'local.demandware.net'}]}),
      );
      fs.writeFileSync(
        defaultConfigPath,
        JSON.stringify({configs: [{name: 'shared', hostname: 'global.demandware.net', username: 'global-user'}]}),
      );

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve({}, {instance: 'shared', defaultConfigPath});

      expect(config.hostname).to.equal('local.demandware.net');
      expect(config.username).to.be.undefined;
    });

    it('provides location from load result', async () => {
      const dwJsonPath = path.join(tempDir, 'dw.json');
      fs.writeFileSync(
        dwJsonPath,
        JSON.stringify({
          hostname: 'test.demandware.net',
        }),
      );

      const resolver = new ConfigResolver();
      const {sources} = await resolver.resolve();

      const dwJsonSource = sources.find((s) => s.name === 'DwJsonSource');
      // Normalize paths to handle macOS symlinks (/var -> /private/var)
      const expectedPath = fs.realpathSync(dwJsonPath);
      const actualLocation = dwJsonSource?.location ? fs.realpathSync(dwJsonSource.location) : undefined;
      expect(actualLocation).to.equal(expectedPath);
    });

    describe('listInstances', () => {
      it('returns empty array when no dw.json exists', async () => {
        const source = new DwJsonSource();
        const instances = await source.listInstances();
        expect(instances).to.deep.equal([]);
      });

      it('returns instances from configs array', async () => {
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
        const instances = await source.listInstances();

        expect(instances).to.have.length(2);
        expect(instances[0].name).to.equal('staging');
        expect(instances[0].hostname).to.equal('staging.demandware.net');
        expect(instances[1].name).to.equal('production');
        expect(instances[1].active).to.be.true;
      });

      it('includes root config if it has a name', async () => {
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
        const instances = await source.listInstances();

        expect(instances).to.have.length(2);
        expect(instances[0].name).to.equal('root');
        expect(instances[0].active).to.be.true;
        expect(instances[1].name).to.equal('staging');
      });

      it('returns an empty array (does not throw) when dw.json is malformed', async () => {
        // A garbled dw.json must degrade gracefully rather than throw — the
        // VS Code extension awaits this on its activation path, so a re-thrown
        // JSON.parse error would disable the whole extension.
        const dwJsonPath = path.join(tempDir, 'dw.json');
        fs.writeFileSync(dwJsonPath, '{ "hostname": "broken.demandware.net", }'); // trailing comma

        const source = new DwJsonSource();
        const instances = await source.listInstances();

        expect(instances).to.deep.equal([]);
      });

      it('returns the union of local and global instances with local names taking precedence', async () => {
        const defaultConfigPath = path.join(tempDir, 'shared.dw.json');
        const localConfigPath = path.join(tempDir, 'dw.json');
        fs.writeFileSync(
          localConfigPath,
          JSON.stringify({
            configs: [
              {name: 'local', hostname: 'local.demandware.net'},
              {name: 'shared', hostname: 'local-shared.demandware.net'},
            ],
          }),
        );
        fs.writeFileSync(
          defaultConfigPath,
          JSON.stringify({
            configs: [
              {name: 'global', hostname: 'global.demandware.net'},
              {name: 'shared', hostname: 'global-shared.demandware.net'},
            ],
          }),
        );

        const source = new DwJsonSource();
        const instances = await source.listInstances({defaultConfigPath});

        expect(instances.map((instance) => instance.name)).to.deep.equal(['local', 'shared', 'global']);
        const shared = instances.find((instance) => instance.name === 'shared');
        expect(shared?.hostname).to.equal('local-shared.demandware.net');
        expect(shared?.location && fs.realpathSync(shared.location)).to.equal(fs.realpathSync(localConfigPath));
      });
    });

    describe('createInstance', () => {
      it('creates a new instance', async () => {
        const source = new DwJsonSource();
        await source.createInstance({
          name: 'staging',
          config: {hostname: 'staging.demandware.net'},
        });

        const instances = await source.listInstances();
        expect(instances).to.have.length(1);
        expect(instances[0].name).to.equal('staging');
        expect(instances[0].hostname).to.equal('staging.demandware.net');
      });

      it('creates instance with setActive', async () => {
        const source = new DwJsonSource();
        await source.createInstance({
          name: 'staging',
          config: {hostname: 'staging.demandware.net'},
          setActive: true,
        });

        const instances = await source.listInstances();
        expect(instances[0].active).to.be.true;
      });

      it('creates in the primary file when present and otherwise in the global fallback', async () => {
        const projectDirectory = path.join(tempDir, 'project');
        const localConfigPath = path.join(projectDirectory, 'dw.json');
        const defaultConfigPath = path.join(tempDir, 'shared.dw.json');
        fs.mkdirSync(projectDirectory);
        fs.writeFileSync(localConfigPath, JSON.stringify({configs: []}));
        fs.writeFileSync(defaultConfigPath, JSON.stringify({configs: []}));
        const source = new DwJsonSource();

        await source.createInstance({
          name: 'local',
          config: {hostname: 'local.demandware.net'},
          projectDirectory,
          defaultConfigPath,
        });
        fs.rmSync(localConfigPath);
        await source.createInstance({
          name: 'global',
          config: {hostname: 'global.demandware.net'},
          projectDirectory,
          defaultConfigPath,
        });

        expect(JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8')).configs).to.deep.equal([
          {name: 'global', hostname: 'global.demandware.net'},
        ]);
      });

      it('clears the fallback active instance when creating an active primary instance', async () => {
        const defaultConfigPath = path.join(tempDir, 'shared.dw.json');
        fs.writeFileSync(path.join(tempDir, 'dw.json'), JSON.stringify({configs: []}));
        fs.writeFileSync(defaultConfigPath, JSON.stringify({configs: [{name: 'global', active: true}]}));
        const source = new DwJsonSource();

        await source.createInstance({
          name: 'local',
          config: {hostname: 'local.demandware.net'},
          setActive: true,
          defaultConfigPath,
        });

        expect(JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8')).configs[0].active).to.equal(false);
      });
    });

    describe('removeInstance', () => {
      it('removes an instance', async () => {
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
        await source.removeInstance('staging');

        const instances = await source.listInstances();
        expect(instances).to.have.length(1);
        expect(instances[0].name).to.equal('production');
      });

      it('removes from the fallback when the instance is not in the primary file', async () => {
        const defaultConfigPath = path.join(tempDir, 'shared.dw.json');
        fs.writeFileSync(path.join(tempDir, 'dw.json'), JSON.stringify({configs: [{name: 'local'}]}));
        fs.writeFileSync(defaultConfigPath, JSON.stringify({configs: [{name: 'global'}]}));
        const source = new DwJsonSource();

        await source.removeInstance('global', {defaultConfigPath});

        expect(JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8')).configs).to.deep.equal([]);
      });
    });

    describe('setActiveInstance', () => {
      it('sets an instance as active', async () => {
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
        await source.setActiveInstance('staging');

        const instances = await source.listInstances();
        const staging = instances.find((i) => i.name === 'staging');
        expect(staging?.active).to.be.true;
      });

      it('sets a fallback instance active and clears active markers in the primary file', async () => {
        const defaultConfigPath = path.join(tempDir, 'shared.dw.json');
        fs.writeFileSync(
          path.join(tempDir, 'dw.json'),
          JSON.stringify({configs: [{name: 'local', hostname: 'local.demandware.net', active: true}]}),
        );
        fs.writeFileSync(
          defaultConfigPath,
          JSON.stringify({configs: [{name: 'global', hostname: 'global.demandware.net'}]}),
        );
        const source = new DwJsonSource();

        await source.setActiveInstance('global', {defaultConfigPath});
        const resolver = new ConfigResolver();
        const {config} = await resolver.resolve({}, {defaultConfigPath});

        expect(JSON.parse(fs.readFileSync(path.join(tempDir, 'dw.json'), 'utf8')).configs[0].active).to.equal(false);
        expect(config.hostname).to.equal('global.demandware.net');
      });
    });
  });

  describe('MobifySource', () => {
    it('loads mrtApiKey from credentialsFile path', async () => {
      const mobifyPath = path.join(tempDir, '.mobify');
      fs.writeFileSync(
        mobifyPath,
        JSON.stringify({
          username: 'user@example.com',
          api_key: 'test-api-key',
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve({}, {credentialsFile: mobifyPath});

      expect(config.mrtApiKey).to.equal('test-api-key');
    });

    it('returns undefined when credentialsFile does not exist', async () => {
      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve({}, {credentialsFile: path.join(tempDir, '.mobify-missing')});

      expect(config.mrtApiKey).to.be.undefined;
    });

    it('returns undefined when api_key is missing from the credentialsFile', async () => {
      const mobifyPath = path.join(tempDir, '.mobify');
      fs.writeFileSync(
        mobifyPath,
        JSON.stringify({
          username: 'user@example.com',
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve({}, {credentialsFile: mobifyPath});

      expect(config.mrtApiKey).to.be.undefined;
    });

    it('handles cloudOrigin-suffixed credentials file', async () => {
      const mobifyPath = path.join(tempDir, '.mobify--example.com');
      fs.writeFileSync(
        mobifyPath,
        JSON.stringify({
          api_key: 'cloud-api-key',
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve({}, {credentialsFile: mobifyPath, cloudOrigin: 'https://example.com'});

      expect(config.mrtApiKey).to.equal('cloud-api-key');
    });

    it('creates SOURCE_ERROR warning for invalid JSON in credentialsFile', async () => {
      const mobifyPath = path.join(tempDir, '.mobify');
      fs.writeFileSync(mobifyPath, 'invalid json');

      const resolver = new ConfigResolver();
      const {config, warnings} = await resolver.resolve({}, {credentialsFile: mobifyPath});

      // Config should not have the API key
      expect(config.mrtApiKey).to.be.undefined;
      // Should have a SOURCE_ERROR warning for MobifySource
      const sourceError = warnings.find((w) => w.code === 'SOURCE_ERROR' && w.message.includes('MobifySource'));
      expect(sourceError).to.not.be.undefined;
      expect(sourceError?.message).to.include('Failed to load configuration');
    });

    it('provides location from load result', async () => {
      const mobifyPath = path.join(tempDir, '.mobify');
      fs.writeFileSync(
        mobifyPath,
        JSON.stringify({
          api_key: 'test-api-key',
        }),
      );

      const resolver = new ConfigResolver();
      const {sources} = await resolver.resolve({}, {credentialsFile: mobifyPath});

      const mobifySource = sources.find((s) => s.name === 'MobifySource');
      // Normalize paths to handle macOS symlinks
      const expectedPath = fs.realpathSync(mobifyPath);
      const actualLocation = mobifySource?.location ? fs.realpathSync(mobifySource.location) : undefined;
      expect(actualLocation).to.equal(expectedPath);
    });
  });

  describe('PackageJsonSource', () => {
    it('loads allowed fields from package.json b2c key', async () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({
          name: 'test-project',
          b2c: {
            shortCode: 'abc123',
            clientId: 'test-client-id',
            siteId: 'RefArch',
            mrtProject: 'my-project',
            mrtOrigin: 'https://custom.cloud.com',
            accountManagerHost: 'account.demandware.com',
            importSetExclude: ['fixtures', 'test/integration'],
          },
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve();

      expect(config.shortCode).to.equal('abc123');
      expect(config.clientId).to.equal('test-client-id');
      expect(config.siteId).to.equal('RefArch');
      expect(config.mrtProject).to.equal('my-project');
      expect(config.mrtOrigin).to.equal('https://custom.cloud.com');
      expect(config.accountManagerHost).to.equal('account.demandware.com');
      expect(config.importSetExclude).to.deep.equal(['fixtures', 'test/integration']);
    });

    it('loads libraries as a string array', async () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({
          name: 'test-project',
          b2c: {libraries: ['RefArch', 'OtherLib']},
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve();

      expect(config.libraries).to.deep.equal(['RefArch', 'OtherLib']);
    });

    it('loads libraries with site-library entries (mixed shapes allowed)', async () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({
          name: 'test-project',
          b2c: {libraries: ['RefArch', {id: 'homepage', siteLibrary: true}]},
        }),
      );

      const resolver = new ConfigResolver();
      const {config} = await resolver.resolve();

      expect(config.libraries).to.deep.equal(['RefArch', {id: 'homepage', siteLibrary: true}]);
    });

    it('ignores sensitive/instance-specific fields', async () => {
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
      const result = await source.load({projectDirectory: tempDir});

      expect(result).to.not.be.undefined;
      expect(result!.config.shortCode).to.equal('abc123');
      // Sensitive/instance-specific fields should NOT be loaded by PackageJsonSource
      expect(result!.config.hostname).to.be.undefined;
      expect(result!.config.password).to.be.undefined;
      expect(result!.config.clientSecret).to.be.undefined;
      expect(result!.config.username).to.be.undefined;
      expect(result!.config.mrtApiKey).to.be.undefined;
    });

    it('returns undefined when package.json does not exist', async () => {
      const resolver = new ConfigResolver();
      const {sources} = await resolver.resolve();

      const packageJsonSource = sources.find((s) => s.name === 'PackageJsonSource');
      expect(packageJsonSource).to.be.undefined;
    });

    it('returns undefined when b2c key is missing', async () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({
          name: 'test-project',
        }),
      );

      const resolver = new ConfigResolver();
      const {sources} = await resolver.resolve();

      const packageJsonSource = sources.find((s) => s.name === 'PackageJsonSource');
      expect(packageJsonSource).to.be.undefined;
    });

    it('returns undefined when b2c key has only disallowed fields', async () => {
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
      const {sources} = await resolver.resolve();

      const packageJsonSource = sources.find((s) => s.name === 'PackageJsonSource');
      expect(packageJsonSource).to.be.undefined;
    });

    it('has lowest priority (1000) and does not override other sources', async () => {
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
      const {config} = await resolver.resolve();

      // dw.json values should take precedence (priority 0 < 1000)
      expect(config.clientId).to.equal('dw-client-id');
      expect(config.shortCode).to.equal('dw-short-code');
      // package.json should fill in gaps
      expect(config.mrtProject).to.equal('package-project');
    });

    it('provides location from load result', async () => {
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
      const {sources} = await resolver.resolve();

      const packageJsonSource = sources.find((s) => s.name === 'PackageJsonSource');
      // Normalize paths to handle macOS symlinks
      const expectedPath = fs.realpathSync(packageJsonPath);
      const actualLocation = packageJsonSource?.location ? fs.realpathSync(packageJsonSource.location) : undefined;
      expect(actualLocation).to.equal(expectedPath);
    });

    it('accepts kebab-case fields and normalizes to camelCase', async () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify({
          name: 'test-project',
          b2c: {
            'short-code': 'abc123',
            'client-id': 'test-client-id',
            'site-id': 'RefArch',
            'mrt-project': 'my-project',
            'account-manager-host': 'account.demandware.com',
            'sandbox-api-host': 'admin.dx.commercecloud.salesforce.com',
          },
        }),
      );

      const source = new PackageJsonSource();
      const result = await source.load({projectDirectory: tempDir});

      expect(result).to.not.be.undefined;
      expect(result!.config.shortCode).to.equal('abc123');
      expect(result!.config.clientId).to.equal('test-client-id');
      expect(result!.config.siteId).to.equal('RefArch');
      expect(result!.config.mrtProject).to.equal('my-project');
      expect(result!.config.accountManagerHost).to.equal('account.demandware.com');
      expect(result!.config.sandboxApiHost).to.equal('admin.dx.commercecloud.salesforce.com');
    });

    it('rejects disallowed fields even in kebab-case', async () => {
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
      const result = await source.load({projectDirectory: tempDir});

      expect(result).to.not.be.undefined;
      expect(result!.config.shortCode).to.equal('abc123');
      expect(result!.config.password).to.be.undefined;
      expect(result!.config.clientSecret).to.be.undefined;
    });

    it('handles invalid JSON gracefully', async () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(packageJsonPath, 'invalid json');

      const resolver = new ConfigResolver();
      const {sources} = await resolver.resolve();

      const packageJsonSource = sources.find((s) => s.name === 'PackageJsonSource');
      expect(packageJsonSource).to.be.undefined;
    });
  });
});
