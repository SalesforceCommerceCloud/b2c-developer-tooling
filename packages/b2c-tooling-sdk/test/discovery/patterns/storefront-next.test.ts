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

    it('detects @salesforce/storefront-next-dev dependency (the definitive signal)', async () => {
      const pkg = {devDependencies: {'@salesforce/storefront-next-dev': 'workspace:*'}};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('does NOT detect on @salesforce/storefront-next-runtime alone (shared with PWA Kit)', async () => {
      // -runtime is now pulled in by PWA Kit projects too, so it is no longer a
      // Storefront Next signal on its own — only -dev is.
      const pkg = {name: 'x', dependencies: {'@salesforce/storefront-next-runtime': 'workspace:*'}};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.false;
    });

    it('does NOT detect a PWA Kit project even if it depends on storefront-next-runtime', async () => {
      // The exact field false positive: template-retail-react-app ships
      // @salesforce/storefront-next-runtime but is a PWA Kit app.
      const pkg = {
        name: '@salesforce/retail-react-app',
        dependencies: {
          '@salesforce/pwa-kit-runtime': '^3.0.0',
          '@salesforce/storefront-next-runtime': '^1.0.0',
        },
      };
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.false;
    });

    it('a PWA Kit signal disqualifies Storefront Next even with storefront-next-dev present', async () => {
      const pkg = {
        name: 'x',
        dependencies: {'@salesforce/pwa-kit-runtime': '^3.0.0', '@salesforce/storefront-next-dev': '^1.0.0'},
      };
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await storefrontNextPattern.detect(tempDir);

      expect(result).to.be.false;
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

    it('detects monorepo when a workspace package has storefront-next dependency', async () => {
      const rootPkg = {name: 'my-monorepo', workspaces: ['packages/*']};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(rootPkg));
      const packagesDir = path.join(tempDir, 'packages');
      await fs.mkdir(packagesDir, {recursive: true});
      const pkgDir = path.join(packagesDir, 'storefront-app');
      await fs.mkdir(pkgDir, {recursive: true});
      const pkgPkg = {name: 'storefront-app', devDependencies: {'@salesforce/storefront-next-dev': '^1.0.0'}};
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
