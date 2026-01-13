/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {readPackageJson, exists, glob, globDirs} from '@salesforce/b2c-tooling-sdk/discovery';

describe('discovery/utils', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b2c-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, {recursive: true, force: true});
  });

  describe('readPackageJson', () => {
    it('returns parsed package.json when file exists', async () => {
      const pkg = {name: 'test-package', version: '1.0.0', dependencies: {lodash: '^4.0.0'}};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await readPackageJson(tempDir);

      expect(result).to.deep.equal(pkg);
    });

    it('returns undefined when package.json does not exist', async () => {
      const result = await readPackageJson(tempDir);

      expect(result).to.be.undefined;
    });

    it('returns undefined when package.json is invalid JSON', async () => {
      await fs.writeFile(path.join(tempDir, 'package.json'), 'not valid json');

      const result = await readPackageJson(tempDir);

      expect(result).to.be.undefined;
    });

    it('returns undefined when directory does not exist', async () => {
      const result = await readPackageJson('/nonexistent/path');

      expect(result).to.be.undefined;
    });
  });

  describe('exists', () => {
    it('returns true when file exists', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      await fs.writeFile(filePath, 'content');

      const result = await exists(filePath);

      expect(result).to.be.true;
    });

    it('returns true when directory exists', async () => {
      const dirPath = path.join(tempDir, 'subdir');
      await fs.mkdir(dirPath);

      const result = await exists(dirPath);

      expect(result).to.be.true;
    });

    it('returns false when path does not exist', async () => {
      const result = await exists(path.join(tempDir, 'nonexistent'));

      expect(result).to.be.false;
    });
  });

  describe('glob', () => {
    it('finds files matching pattern', async () => {
      await fs.writeFile(path.join(tempDir, 'file1.js'), '');
      await fs.writeFile(path.join(tempDir, 'file2.js'), '');
      await fs.writeFile(path.join(tempDir, 'file3.ts'), '');

      const result = await glob('*.js', {cwd: tempDir});

      expect(result).to.have.lengthOf(2);
      expect(result).to.include('file1.js');
      expect(result).to.include('file2.js');
    });

    it('finds files in subdirectories', async () => {
      const subdir = path.join(tempDir, 'src');
      await fs.mkdir(subdir);
      await fs.writeFile(path.join(subdir, 'index.js'), '');

      const result = await glob('**/*.js', {cwd: tempDir});

      expect(result).to.include('src/index.js');
    });

    it('ignores node_modules', async () => {
      const nodeModules = path.join(tempDir, 'node_modules', 'pkg');
      await fs.mkdir(nodeModules, {recursive: true});
      await fs.writeFile(path.join(nodeModules, 'index.js'), '');
      await fs.writeFile(path.join(tempDir, 'app.js'), '');

      const result = await glob('**/*.js', {cwd: tempDir});

      expect(result).to.include('app.js');
      expect(result).to.not.include('node_modules/pkg/index.js');
    });

    it('returns empty array when no matches', async () => {
      const result = await glob('*.xyz', {cwd: tempDir});

      expect(result).to.deep.equal([]);
    });

    it('returns empty array for invalid cwd', async () => {
      const result = await glob('*.js', {cwd: '/nonexistent/path'});

      expect(result).to.deep.equal([]);
    });
  });

  describe('globDirs', () => {
    it('finds directories matching pattern', async () => {
      await fs.mkdir(path.join(tempDir, 'cartridge1'));
      await fs.mkdir(path.join(tempDir, 'cartridge2'));
      await fs.writeFile(path.join(tempDir, 'file.txt'), '');

      const result = await globDirs('cartridge*', {cwd: tempDir});

      expect(result).to.have.lengthOf(2);
      expect(result).to.include('cartridge1');
      expect(result).to.include('cartridge2');
    });

    it('ignores node_modules', async () => {
      const nodeModules = path.join(tempDir, 'node_modules', 'pkg');
      await fs.mkdir(nodeModules, {recursive: true});
      await fs.mkdir(path.join(tempDir, 'src'));

      const result = await globDirs('**/*', {cwd: tempDir});

      const hasNodeModules = result.some((r) => r.includes('node_modules'));
      expect(hasNodeModules).to.be.false;
    });

    it('returns empty array when no matches', async () => {
      const result = await globDirs('nonexistent*', {cwd: tempDir});

      expect(result).to.deep.equal([]);
    });
  });
});
