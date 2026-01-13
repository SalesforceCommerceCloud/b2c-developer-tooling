/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {customApiPattern} from '@salesforce/b2c-tooling-sdk/discovery';

describe('discovery/patterns/custom-api', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b2c-pattern-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, {recursive: true, force: true});
  });

  describe('customApiPattern', () => {
    it('has correct metadata', () => {
      expect(customApiPattern.name).to.equal('custom-api');
      expect(customApiPattern.projectType).to.equal('custom-api');
    });

    it('detects api.json in rest-apis structure', async () => {
      const apiPath = path.join(tempDir, 'cartridges', 'app_custom', 'cartridge', 'rest-apis', 'my-api');
      await fs.mkdir(apiPath, {recursive: true});
      await fs.writeFile(path.join(apiPath, 'api.json'), '{}');

      const result = await customApiPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('detects schema.yaml in rest-apis structure', async () => {
      const apiPath = path.join(tempDir, 'cartridges', 'app_custom', 'cartridge', 'rest-apis', 'my-api');
      await fs.mkdir(apiPath, {recursive: true});
      await fs.writeFile(path.join(apiPath, 'schema.yaml'), 'openapi: 3.0.0');

      const result = await customApiPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('returns false without rest-apis structure', async () => {
      const cartridgePath = path.join(tempDir, 'cartridges', 'app_custom', 'cartridge');
      await fs.mkdir(cartridgePath, {recursive: true});
      await fs.writeFile(path.join(cartridgePath, 'api.json'), '{}');

      const result = await customApiPattern.detect(tempDir);

      expect(result).to.be.false;
    });

    it('returns false in empty directory', async () => {
      const result = await customApiPattern.detect(tempDir);

      expect(result).to.be.false;
    });
  });
});
