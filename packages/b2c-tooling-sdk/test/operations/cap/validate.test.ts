/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {validateCap} from '../../../src/operations/cap/validate.js';

const FIXTURE_CAP = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '../../fixtures/commerce-avalara-tax-app-v0.2.5',
);

/** Build a minimal valid CAP in a temp directory, then call the callback */
async function withTempCap(setup: (dir: string) => void, callback: (dir: string) => Promise<void>): Promise<void> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-cap-validate-'));
  try {
    setup(tempDir);
    await callback(tempDir);
  } finally {
    fs.rmSync(tempDir, {recursive: true, force: true});
  }
}

function writeMinimalCap(dir: string, overrides: {manifest?: Record<string, unknown>} = {}): void {
  const manifest = {
    id: 'test-app',
    name: 'Test App',
    version: '1.0.0',
    domain: 'tax',
    ...overrides.manifest,
  };
  fs.writeFileSync(path.join(dir, 'commerce-app.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(dir, 'README.md'), '# Test App');
  fs.mkdirSync(path.join(dir, 'app-configuration'));
  const tasks = [{taskNumber: '1', name: 'Step 1', description: 'Do step 1', link: '/bm/step1'}];
  fs.writeFileSync(path.join(dir, 'app-configuration', 'tasksList.json'), JSON.stringify(tasks));
  fs.mkdirSync(path.join(dir, 'impex', 'install'), {recursive: true});
}

describe('operations/cap/validate', () => {
  describe('validateCap', () => {
    it('should validate the sample Avalara CAP fixture successfully', async () => {
      if (!fs.existsSync(FIXTURE_CAP)) {
        console.warn('Skipping fixture test — fixture not found:', FIXTURE_CAP);
        return;
      }
      const result = await validateCap(FIXTURE_CAP);
      expect(result.errors).to.deep.equal([]);
      expect(result.valid).to.be.true;
      expect(result.manifest).to.include({id: 'avalara-tax', domain: 'tax', version: '0.2.5'});
    });

    it('should error when target does not exist', async () => {
      const result = await validateCap('/nonexistent/path');
      expect(result.valid).to.be.false;
      expect(result.errors[0]).to.include('not found');
    });

    it('should error when commerce-app.json is missing', async () => {
      await withTempCap(
        (dir) => {
          fs.writeFileSync(path.join(dir, 'README.md'), '# Test');
          fs.mkdirSync(path.join(dir, 'app-configuration'));
          fs.writeFileSync(
            path.join(dir, 'app-configuration', 'tasksList.json'),
            JSON.stringify([{taskNumber: '1', name: 'x', description: 'x', link: '/x'}]),
          );
          fs.mkdirSync(path.join(dir, 'impex'), {recursive: true});
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('commerce-app.json'))).to.be.true;
        },
      );
    });

    it('should error when README.md is missing', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.unlinkSync(path.join(dir, 'README.md'));
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('README.md'))).to.be.true;
        },
      );
    });

    it('should error when tasksList.json is missing', async () => {
      await withTempCap(
        (dir) => {
          fs.writeFileSync(
            path.join(dir, 'commerce-app.json'),
            JSON.stringify({id: 'a', name: 'a', version: '1.0.0', domain: 'tax'}),
          );
          fs.writeFileSync(path.join(dir, 'README.md'), '# test');
          fs.mkdirSync(path.join(dir, 'impex'), {recursive: true});
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('tasksList.json'))).to.be.true;
        },
      );
    });

    it('should error when no substantive directory is present', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.rmSync(path.join(dir, 'impex'), {recursive: true, force: true});
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('at least one'))).to.be.true;
        },
      );
    });

    it('should error for site cartridges with controllers/', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const siteCartridgeDir = path.join(
            dir,
            'cartridges',
            'site_cartridges',
            'int_myapp',
            'cartridge',
            'controllers',
          );
          fs.mkdirSync(siteCartridgeDir, {recursive: true});
          fs.writeFileSync(path.join(siteCartridgeDir, 'MyController.js'), '// controller');
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('controllers'))).to.be.true;
        },
      );
    });

    it('should error when pipeline/ directory is present', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const pipelineDir = path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp', 'cartridge', 'pipeline');
          fs.mkdirSync(pipelineDir, {recursive: true});
          fs.writeFileSync(path.join(pipelineDir, 'Start.xml'), '<pipeline/>');
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('pipeline'))).to.be.true;
        },
      );
    });

    it('should error when .ds pipeline file is present', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const cartDir = path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp', 'cartridge');
          fs.mkdirSync(cartDir, {recursive: true});
          fs.writeFileSync(path.join(cartDir, 'Start.ds'), '<pipeline/>');
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('.ds'))).to.be.true;
        },
      );
    });

    it('should warn when icons/icon.png is missing', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.true;
          expect(result.warnings.some((w) => w.includes('icon.png'))).to.be.true;
        },
      );
    });

    it('should warn when impex/uninstall/ is missing', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          // impex/install exists but no uninstall
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.true;
          expect(result.warnings.some((w) => w.includes('uninstall'))).to.be.true;
        },
      );
    });

    it('should error when manifest version is not semver', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir, {manifest: {version: 'not-semver'}});
        },
        async (dir) => {
          const result = await validateCap(dir);
          expect(result.valid).to.be.false;
          expect(result.errors.some((e) => e.includes('semver'))).to.be.true;
        },
      );
    });

    it('should allow controllers in bm_cartridges', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const bmControllers = path.join(dir, 'cartridges', 'bm_cartridges', 'bm_myapp', 'cartridge', 'controllers');
          fs.mkdirSync(bmControllers, {recursive: true});
          fs.writeFileSync(path.join(bmControllers, 'BM_Controller.js'), '// bm controller');
        },
        async (dir) => {
          const result = await validateCap(dir);
          // BM cartridge controllers are allowed
          expect(result.errors.some((e) => e.includes('controllers'))).to.be.false;
        },
      );
    });
  });
});
