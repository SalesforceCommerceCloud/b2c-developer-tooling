/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {discoverPlugins, resolveOclifDataDir} from '@salesforce/b2c-tooling-sdk/plugins';

describe('plugins/discovery', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-plugin-discovery-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  describe('resolveOclifDataDir', () => {
    it('returns a path containing the dirname', () => {
      const result = resolveOclifDataDir('b2c');
      expect(result).to.be.a('string');
      expect(result).to.include('b2c');
    });

    it('uses custom dirname', () => {
      const result = resolveOclifDataDir('my-cli');
      expect(result).to.include('my-cli');
    });
  });

  describe('discoverPlugins', () => {
    it('returns empty array when data dir does not exist', () => {
      const result = discoverPlugins({dataDir: path.join(tempDir, 'nonexistent')});
      expect(result).to.deep.equal([]);
    });

    it('returns empty array when package.json has no oclif.plugins', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({name: 'root'}));
      const result = discoverPlugins({dataDir: tempDir});
      expect(result).to.deep.equal([]);
    });

    it('returns empty array when package.json has empty plugins array', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({name: 'root', oclif: {plugins: []}}));
      const result = discoverPlugins({dataDir: tempDir});
      expect(result).to.deep.equal([]);
    });

    it('discovers a plugin with b2c:config-sources hook', () => {
      // Create root package.json
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({oclif: {plugins: ['my-plugin']}}));

      // Create plugin package
      const pluginDir = path.join(tempDir, 'node_modules', 'my-plugin');
      fs.mkdirSync(pluginDir, {recursive: true});
      fs.writeFileSync(
        path.join(pluginDir, 'package.json'),
        JSON.stringify({
          name: 'my-plugin',
          oclif: {
            hooks: {
              'b2c:config-sources': './dist/hooks/config-sources.js',
            },
          },
        }),
      );

      const result = discoverPlugins({dataDir: tempDir});
      expect(result).to.have.length(1);
      expect(result[0].name).to.equal('my-plugin');
      expect(result[0].packageDir).to.equal(pluginDir);
      expect(result[0].hooks['b2c:config-sources']).to.deep.equal(['./dist/hooks/config-sources.js']);
    });

    it('discovers a plugin with multiple hooks', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({oclif: {plugins: ['multi-plugin']}}));

      const pluginDir = path.join(tempDir, 'node_modules', 'multi-plugin');
      fs.mkdirSync(pluginDir, {recursive: true});
      fs.writeFileSync(
        path.join(pluginDir, 'package.json'),
        JSON.stringify({
          name: 'multi-plugin',
          oclif: {
            hooks: {
              'b2c:config-sources': './hooks/config.js',
              'b2c:http-middleware': './hooks/http.js',
              'b2c:auth-middleware': ['./hooks/auth1.js', './hooks/auth2.js'],
            },
          },
        }),
      );

      const result = discoverPlugins({dataDir: tempDir});
      expect(result).to.have.length(1);
      expect(result[0].hooks['b2c:config-sources']).to.deep.equal(['./hooks/config.js']);
      expect(result[0].hooks['b2c:http-middleware']).to.deep.equal(['./hooks/http.js']);
      expect(result[0].hooks['b2c:auth-middleware']).to.deep.equal(['./hooks/auth1.js', './hooks/auth2.js']);
    });

    it('skips plugins without supported hooks', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({oclif: {plugins: ['unrelated-plugin']}}));

      const pluginDir = path.join(tempDir, 'node_modules', 'unrelated-plugin');
      fs.mkdirSync(pluginDir, {recursive: true});
      fs.writeFileSync(
        path.join(pluginDir, 'package.json'),
        JSON.stringify({
          name: 'unrelated-plugin',
          oclif: {
            hooks: {
              init: './hooks/init.js',
            },
          },
        }),
      );

      const result = discoverPlugins({dataDir: tempDir});
      expect(result).to.deep.equal([]);
    });

    it('skips plugins with missing package.json', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({oclif: {plugins: ['missing-plugin']}}));
      // Don't create the plugin directory

      const result = discoverPlugins({dataDir: tempDir});
      expect(result).to.deep.equal([]);
    });

    it('skips plugins with corrupt package.json', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({oclif: {plugins: ['bad-plugin']}}));

      const pluginDir = path.join(tempDir, 'node_modules', 'bad-plugin');
      fs.mkdirSync(pluginDir, {recursive: true});
      fs.writeFileSync(path.join(pluginDir, 'package.json'), 'not valid json{{{');

      const result = discoverPlugins({dataDir: tempDir});
      expect(result).to.deep.equal([]);
    });

    it('handles scoped package names', () => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({oclif: {plugins: ['@myorg/b2c-keychain']}}));

      const pluginDir = path.join(tempDir, 'node_modules', '@myorg', 'b2c-keychain');
      fs.mkdirSync(pluginDir, {recursive: true});
      fs.writeFileSync(
        path.join(pluginDir, 'package.json'),
        JSON.stringify({
          name: '@myorg/b2c-keychain',
          oclif: {
            hooks: {
              'b2c:config-sources': './dist/hooks/keychain.js',
            },
          },
        }),
      );

      const result = discoverPlugins({dataDir: tempDir});
      expect(result).to.have.length(1);
      expect(result[0].name).to.equal('@myorg/b2c-keychain');
    });

    it('discovers multiple plugins', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({oclif: {plugins: ['plugin-a', 'plugin-b']}}),
      );

      for (const name of ['plugin-a', 'plugin-b']) {
        const dir = path.join(tempDir, 'node_modules', name);
        fs.mkdirSync(dir, {recursive: true});
        fs.writeFileSync(
          path.join(dir, 'package.json'),
          JSON.stringify({
            name,
            oclif: {hooks: {'b2c:config-sources': './hooks/config.js'}},
          }),
        );
      }

      const result = discoverPlugins({dataDir: tempDir});
      expect(result).to.have.length(2);
      expect(result.map((p) => p.name)).to.deep.equal(['plugin-a', 'plugin-b']);
    });

    it('handles oclif object-format plugin entries', () => {
      // oclif stores user-installed plugins as objects: {name, type, url}
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          oclif: {
            plugins: [
              {name: 'obj-plugin', type: 'user', url: 'https://example.com'},
              {name: 'obj-plugin-2', type: 'user'},
            ],
          },
        }),
      );

      for (const name of ['obj-plugin', 'obj-plugin-2']) {
        const dir = path.join(tempDir, 'node_modules', name);
        fs.mkdirSync(dir, {recursive: true});
        fs.writeFileSync(
          path.join(dir, 'package.json'),
          JSON.stringify({
            name,
            oclif: {hooks: {'b2c:config-sources': './hooks/config.js'}},
          }),
        );
      }

      const result = discoverPlugins({dataDir: tempDir});
      expect(result).to.have.length(2);
      expect(result.map((p) => p.name)).to.deep.equal(['obj-plugin', 'obj-plugin-2']);
    });

    it('handles mixed string and object plugin entries', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          oclif: {
            plugins: ['string-plugin', {name: 'object-plugin', type: 'user'}],
          },
        }),
      );

      for (const name of ['string-plugin', 'object-plugin']) {
        const dir = path.join(tempDir, 'node_modules', name);
        fs.mkdirSync(dir, {recursive: true});
        fs.writeFileSync(
          path.join(dir, 'package.json'),
          JSON.stringify({
            name,
            oclif: {hooks: {'b2c:http-middleware': './hooks/http.js'}},
          }),
        );
      }

      const result = discoverPlugins({dataDir: tempDir});
      expect(result).to.have.length(2);
      expect(result.map((p) => p.name)).to.deep.equal(['string-plugin', 'object-plugin']);
    });

    it('skips entries with no extractable name', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          oclif: {plugins: [42, null, {type: 'user'}, 'valid-plugin']},
        }),
      );

      const dir = path.join(tempDir, 'node_modules', 'valid-plugin');
      fs.mkdirSync(dir, {recursive: true});
      fs.writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({
          name: 'valid-plugin',
          oclif: {hooks: {'b2c:config-sources': './hooks/config.js'}},
        }),
      );

      const result = discoverPlugins({dataDir: tempDir});
      expect(result).to.have.length(1);
      expect(result[0].name).to.equal('valid-plugin');
    });
  });
});
