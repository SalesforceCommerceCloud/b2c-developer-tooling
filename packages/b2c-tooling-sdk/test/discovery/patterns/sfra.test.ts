/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import {sfraPattern} from '@salesforce/b2c-tooling-sdk/discovery';

describe('discovery/patterns/sfra', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temp directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfra-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  describe('sfraPattern', () => {
    it('should have correct metadata', () => {
      expect(sfraPattern.name).to.equal('sfra');
      expect(sfraPattern.projectType).to.equal('cartridges');
    });

    describe('app_storefront_base cartridge detection', () => {
      it('should detect SFRA project with app_storefront_base cartridge', async () => {
        // Create app_storefront_base cartridge with .project file
        const cartridgeDir = path.join(tempDir, 'cartridges', 'app_storefront_base');
        fs.mkdirSync(cartridgeDir, {recursive: true});
        fs.writeFileSync(path.join(cartridgeDir, '.project'), '');

        const result = await sfraPattern.detect(tempDir);
        expect(result).to.equal(true);
      });

      it('should detect SFRA project with app_storefront_base at root level', async () => {
        // Create app_storefront_base cartridge at root level with .project file
        const cartridgeDir = path.join(tempDir, 'app_storefront_base');
        fs.mkdirSync(cartridgeDir, {recursive: true});
        fs.writeFileSync(path.join(cartridgeDir, '.project'), '');

        const result = await sfraPattern.detect(tempDir);
        expect(result).to.equal(true);
      });

      it('should return false for other cartridges without app_storefront_base', async () => {
        // Create a different cartridge (not app_storefront_base)
        const cartridgeDir = path.join(tempDir, 'cartridges', 'plugin_cart');
        fs.mkdirSync(cartridgeDir, {recursive: true});
        fs.writeFileSync(path.join(cartridgeDir, '.project'), '');

        const result = await sfraPattern.detect(tempDir);
        expect(result).to.equal(false);
      });
    });

    describe('package.json paths.base detection', () => {
      it('should detect SFRA project with paths.base in package.json', async () => {
        // Create package.json with paths.base pointing to app_storefront_base
        const packageJson = {
          name: 'my-sfra-project',
          paths: {
            base: '../sfra/cartridges/app_storefront_base/cartridge',
          },
        };
        fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

        const result = await sfraPattern.detect(tempDir);
        expect(result).to.equal(true);
      });

      it('should detect SFRA with absolute path to app_storefront_base', async () => {
        const packageJson = {
          name: 'my-sfra-project',
          paths: {
            base: '/Users/dev/sfra/cartridges/app_storefront_base/cartridge',
          },
        };
        fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

        const result = await sfraPattern.detect(tempDir);
        expect(result).to.equal(true);
      });

      it('should return false if paths.base does not contain app_storefront_base', async () => {
        const packageJson = {
          name: 'my-project',
          paths: {
            base: '../other_cartridge/cartridge',
          },
        };
        fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

        const result = await sfraPattern.detect(tempDir);
        expect(result).to.equal(false);
      });

      it('should return false if package.json has no paths field', async () => {
        const packageJson = {
          name: 'my-project',
          dependencies: {},
        };
        fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

        const result = await sfraPattern.detect(tempDir);
        expect(result).to.equal(false);
      });
    });

    describe('edge cases', () => {
      it('should return false for empty directory', async () => {
        const result = await sfraPattern.detect(tempDir);
        expect(result).to.equal(false);
      });

      it('should return false for non-existent path', async () => {
        const result = await sfraPattern.detect('/nonexistent/path/12345');
        expect(result).to.equal(false);
      });

      it('should prioritize cartridge detection over package.json', async () => {
        // Create both: app_storefront_base cartridge and package.json without paths.base
        const cartridgeDir = path.join(tempDir, 'app_storefront_base');
        fs.mkdirSync(cartridgeDir, {recursive: true});
        fs.writeFileSync(path.join(cartridgeDir, '.project'), '');

        const packageJson = {name: 'my-project'};
        fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

        const result = await sfraPattern.detect(tempDir);
        expect(result).to.equal(true);
      });
    });
  });
});
