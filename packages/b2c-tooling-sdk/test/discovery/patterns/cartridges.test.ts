/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import {cartridgesPattern} from '@salesforce/b2c-tooling-sdk/discovery';

describe('discovery/patterns/cartridges', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temp directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cartridges-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  describe('cartridgesPattern', () => {
    it('should have correct metadata', () => {
      expect(cartridgesPattern.name).to.equal('cartridges');
      expect(cartridgesPattern.projectType).to.equal('cartridges');
    });

    it('should detect cartridge with .project file', async () => {
      // Create a cartridge with .project file
      const cartridgeDir = path.join(tempDir, 'app_storefront_base');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '');

      const result = await cartridgesPattern.detect(tempDir);
      expect(result).to.equal(true);
    });

    it('should detect nested cartridges', async () => {
      // Create cartridges in a nested structure
      const cartridgesDir = path.join(tempDir, 'cartridges', 'app_custom');
      fs.mkdirSync(cartridgesDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgesDir, '.project'), '');

      const result = await cartridgesPattern.detect(tempDir);
      expect(result).to.equal(true);
    });

    it('should return false when no cartridges found', async () => {
      // Empty directory - no cartridges
      const result = await cartridgesPattern.detect(tempDir);
      expect(result).to.equal(false);
    });

    it('should return false for non-existent path', async () => {
      const result = await cartridgesPattern.detect('/nonexistent/path/12345');
      expect(result).to.equal(false);
    });

    it('should detect multiple cartridges', async () => {
      // Create multiple cartridges
      const cartridge1 = path.join(tempDir, 'cartridges', 'app_custom');
      const cartridge2 = path.join(tempDir, 'cartridges', 'int_payment');
      fs.mkdirSync(cartridge1, {recursive: true});
      fs.mkdirSync(cartridge2, {recursive: true});
      fs.writeFileSync(path.join(cartridge1, '.project'), '');
      fs.writeFileSync(path.join(cartridge2, '.project'), '');

      const result = await cartridgesPattern.detect(tempDir);
      expect(result).to.equal(true);
    });
  });
});
