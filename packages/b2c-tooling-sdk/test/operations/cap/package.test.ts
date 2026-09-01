/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import JSZip from 'jszip';
import {commerceAppPackage} from '../../../src/operations/cap/package.js';

/** Build a minimal valid CAP in a temp directory, then call the callback */
async function withTempCap(setup: (dir: string) => void, callback: (dir: string) => Promise<void>): Promise<void> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-cap-package-'));
  try {
    setup(tempDir);
    await callback(tempDir);
  } finally {
    fs.rmSync(tempDir, {recursive: true, force: true});
  }
}

function writeMinimalCap(dir: string): void {
  const manifest = {id: 'test-app', name: 'Test App', version: '1.0.0', domain: 'tax'};
  fs.writeFileSync(path.join(dir, 'commerce-app.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(dir, 'README.md'), '# Test App');
}

describe('operations/cap/package', () => {
  describe('commerceAppPackage', () => {
    it('auto-creates an empty .project for cartridges missing one', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.mkdirSync(path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp', 'cartridge'), {recursive: true});
          fs.mkdirSync(path.join(dir, 'cartridges', 'bm_cartridges', 'bm_myapp', 'cartridge'), {recursive: true});
        },
        async (dir) => {
          const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-cap-package-out-'));
          try {
            await commerceAppPackage(dir, {outputPath: outputDir});

            // Source directory gets the empty .project files written in place.
            const siteProject = path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp', '.project');
            const bmProject = path.join(dir, 'cartridges', 'bm_cartridges', 'bm_myapp', '.project');
            expect(fs.existsSync(siteProject)).to.be.true;
            expect(fs.readFileSync(siteProject, 'utf-8')).to.equal('');
            expect(fs.existsSync(bmProject)).to.be.true;
            expect(fs.readFileSync(bmProject, 'utf-8')).to.equal('');

            // And the zip includes them.
            const zipPath = path.join(outputDir, 'test-app-v1.0.0.zip');
            const zip = await JSZip.loadAsync(await fs.promises.readFile(zipPath));
            expect(Object.keys(zip.files)).to.include('test-app-v1.0.0/cartridges/site_cartridges/int_myapp/.project');
            expect(Object.keys(zip.files)).to.include('test-app-v1.0.0/cartridges/bm_cartridges/bm_myapp/.project');
          } finally {
            fs.rmSync(outputDir, {recursive: true, force: true});
          }
        },
      );
    });

    it('does not overwrite an existing non-empty .project file', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          const cartridgeRoot = path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp');
          fs.mkdirSync(path.join(cartridgeRoot, 'cartridge'), {recursive: true});
          fs.writeFileSync(path.join(cartridgeRoot, '.project'), '<projectDescription>\n\t<name>int_myapp</name>\n');
        },
        async (dir) => {
          const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-cap-package-out-'));
          try {
            await commerceAppPackage(dir, {outputPath: outputDir});
            const projectFile = path.join(dir, 'cartridges', 'site_cartridges', 'int_myapp', '.project');
            expect(fs.readFileSync(projectFile, 'utf-8')).to.equal('<projectDescription>\n\t<name>int_myapp</name>\n');
          } finally {
            fs.rmSync(outputDir, {recursive: true, force: true});
          }
        },
      );
    });

    it('is a no-op when there is no cartridges/ directory', async () => {
      await withTempCap(
        (dir) => {
          writeMinimalCap(dir);
          fs.mkdirSync(path.join(dir, 'impex', 'install'), {recursive: true});
        },
        async (dir) => {
          const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-cap-package-out-'));
          try {
            const result = await commerceAppPackage(dir, {outputPath: outputDir});
            expect(fs.existsSync(result.outputPath)).to.be.true;
          } finally {
            fs.rmSync(outputDir, {recursive: true, force: true});
          }
        },
      );
    });
  });
});
