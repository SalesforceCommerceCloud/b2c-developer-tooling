/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {dwJsonPattern} from '@salesforce/b2c-tooling-sdk/discovery';

describe('discovery/patterns/base', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b2c-pattern-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, {recursive: true, force: true});
  });

  describe('dwJsonPattern', () => {
    it('has correct metadata', () => {
      expect(dwJsonPattern.name).to.equal('dw-json');
      expect(dwJsonPattern.projectType).to.equal('headless');
    });

    it('detects dw.json file', async () => {
      await fs.writeFile(path.join(tempDir, 'dw.json'), '{}');

      const result = await dwJsonPattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('returns false without dw.json', async () => {
      const result = await dwJsonPattern.detect(tempDir);

      expect(result).to.be.false;
    });
  });
});
