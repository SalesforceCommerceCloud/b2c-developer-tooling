/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {sfraPattern} from '@salesforce/b2c-tooling-sdk/discovery';

describe('discovery/patterns/sfra', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b2c-pattern-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, {recursive: true, force: true});
  });

  describe('sfraPattern', () => {
    it('has correct metadata', () => {
      expect(sfraPattern.name).to.equal('sfra-cartridge');
      expect(sfraPattern.projectType).to.equal('sfra');
    });

    it('detects cartridges with controllers at root', async () => {
      const controllerPath = path.join(tempDir, 'cartridges', 'app_custom', 'cartridge', 'controllers');
      await fs.mkdir(controllerPath, {recursive: true});
      await fs.writeFile(path.join(controllerPath, 'Home.js'), '');

      const result = await sfraPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('detects cartridges with templates at root', async () => {
      const templatePath = path.join(tempDir, 'cartridges', 'app_custom', 'cartridge', 'templates', 'default');
      await fs.mkdir(templatePath, {recursive: true});
      await fs.writeFile(path.join(templatePath, 'home.isml'), '');

      const result = await sfraPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('detects cartridges nested in subdirectories (monorepo)', async () => {
      // Structure: app_sfrademo/cartridges/app_custom/cartridge/controllers/
      const controllerPath = path.join(tempDir, 'app_sfrademo', 'cartridges', 'app_custom', 'cartridge', 'controllers');
      await fs.mkdir(controllerPath, {recursive: true});
      await fs.writeFile(path.join(controllerPath, 'Home.js'), '');

      const result = await sfraPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('returns false with empty directory', async () => {
      const result = await sfraPattern.detect(tempDir);

      expect(result).to.be.false;
    });

    it('returns false with cartridge folder but no controllers or templates', async () => {
      const cartridgePath = path.join(tempDir, 'cartridges', 'app_custom', 'cartridge');
      await fs.mkdir(cartridgePath, {recursive: true});
      await fs.writeFile(path.join(cartridgePath, 'readme.txt'), '');

      const result = await sfraPattern.detect(tempDir);

      expect(result).to.be.false;
    });
  });
});
