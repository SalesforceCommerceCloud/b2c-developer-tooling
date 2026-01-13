/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {pwaKitV3Pattern} from '@salesforce/b2c-tooling-sdk/discovery';

describe('discovery/patterns/pwa-kit', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b2c-pattern-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, {recursive: true, force: true});
  });

  describe('pwaKitV3Pattern', () => {
    it('has correct metadata', () => {
      expect(pwaKitV3Pattern.name).to.equal('pwa-kit-v3');
      expect(pwaKitV3Pattern.projectType).to.equal('pwa-kit-v3');
    });

    it('detects @salesforce/pwa-kit-react-sdk dependency', async () => {
      const pkg = {dependencies: {'@salesforce/pwa-kit-react-sdk': '^3.0.0'}};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await pwaKitV3Pattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('detects @salesforce/pwa-kit-runtime dependency', async () => {
      const pkg = {dependencies: {'@salesforce/pwa-kit-runtime': '^3.0.0'}};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await pwaKitV3Pattern.detect(tempDir);

      expect(result).to.be.true;
    });

    it('does not detect legacy pwa-kit-react-sdk dependency (v2)', async () => {
      const pkg = {devDependencies: {'pwa-kit-react-sdk': '^2.0.0'}};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await pwaKitV3Pattern.detect(tempDir);

      expect(result).to.be.false;
    });

    it('returns false without PWA Kit dependencies', async () => {
      const pkg = {dependencies: {react: '^18.0.0'}};
      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));

      const result = await pwaKitV3Pattern.detect(tempDir);

      expect(result).to.be.false;
    });

    it('returns false without package.json', async () => {
      const result = await pwaKitV3Pattern.detect(tempDir);

      expect(result).to.be.false;
    });
  });
});
