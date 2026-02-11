/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {storefrontNextPattern} from '@salesforce/b2c-tooling-sdk/discovery';

describe('discovery/patterns/storefront-next', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b2c-pattern-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, {recursive: true, force: true});
  });

  describe('storefrontNextPattern', () => {
    it('has correct metadata', () => {
      expect(storefrontNextPattern.name).to.equal('storefront-next');
      expect(storefrontNextPattern.projectType).to.equal('storefront-next');
    });

    it('detects @salesforce/storefront-next dependency', async () => {
      const pkg = {dependencies: {'@salesforce/storefront-next': '^1.0.0'}};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('detects @salesforce/storefront-next-dev dependency (prefix match)', async () => {
      const pkg = {devDependencies: {'@salesforce/storefront-next-dev': 'workspace:*'}};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('detects @salesforce/storefront-next-runtime dependency (prefix match)', async () => {
      const pkg = {dependencies: {'@salesforce/storefront-next-runtime': 'workspace:*'}};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('does not detect @salesforce/odyssey (not a real package)', async () => {
      const pkg = {devDependencies: {'@salesforce/odyssey': '^1.0.0'}};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.false;
    });

    it('returns false without storefront-next dependencies', async () => {
      const pkg = {dependencies: {react: '^18.0.0'}};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.false;
    });

    it('returns false without package.json', async () => {
      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.false;
    });

    it('detects by root package name starting with storefront-next', async () => {
      const pkg = {name: 'storefront-next-app'};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('detects by root package name sfcc-odyssey (monorepo)', async () => {
      const pkg = {name: 'sfcc-odyssey'};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('detects monorepo when a workspace package has storefront-next dependency', async () => {
      const rootPkg = {name: 'my-monorepo', workspaces: ['packages/*']};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(rootPkg));
      const packagesDir = path.join(tempDir, 'packages');
      await fs.mkdir(packagesDir, {recursive: true});
      const pkgDir = path.join(packagesDir, 'storefront-app');
      await fs.mkdir(pkgDir, {recursive: true});
      const pkgPkg = {name: 'storefront-app', dependencies: {'@salesforce/storefront-next-runtime': '^1.0.0'}};
      await fs.writeFile(path.join(pkgDir, 'package.json'), JSON.stringify(pkgPkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('detects monorepo when a workspace package name starts with storefront-next', async () => {
      const rootPkg = {name: 'some-repo', workspaces: ['packages/*']};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(rootPkg));
      const packagesDir = path.join(tempDir, 'packages');
      await fs.mkdir(packagesDir, {recursive: true});
      const pkgDir = path.join(packagesDir, 'storefront-next-runtime');
      await fs.mkdir(pkgDir, {recursive: true});
      const pkgPkg = {name: 'storefront-next-runtime'};
      await fs.writeFile(path.join(pkgDir, 'package.json'), JSON.stringify(pkgPkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('returns false for monorepo when no workspace package indicates storefront-next', async () => {
      const rootPkg = {name: 'my-monorepo', workspaces: ['packages/*']};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(rootPkg));
      const packagesDir = path.join(tempDir, 'packages');
      await fs.mkdir(packagesDir, {recursive: true});
      const pkgDir = path.join(packagesDir, 'other-app');
      await fs.mkdir(pkgDir, {recursive: true});
      const pkgPkg = {name: 'other-app', dependencies: {react: '^18.0.0'}};
      await fs.writeFile(path.join(pkgDir, 'package.json'), JSON.stringify(pkgPkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.false;
    });
  });
});
