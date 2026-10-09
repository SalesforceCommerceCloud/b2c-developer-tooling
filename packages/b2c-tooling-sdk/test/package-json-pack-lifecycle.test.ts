/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {execFileSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));
const sourceScriptsDir = join(testDir, '..', 'scripts');

describe('package.json pack lifecycle', () => {
  let tempDir: string;
  let packageDir: string;
  let packageJsonPath: string;
  let stripScriptPath: string;
  let restoreScriptPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'b2c-sdk-pack-'));
    packageDir = join(tempDir, 'package');
    const scriptsDir = join(packageDir, 'scripts');
    packageJsonPath = join(packageDir, 'package.json');
    stripScriptPath = join(scriptsDir, 'strip-dev-exports.cjs');
    restoreScriptPath = join(scriptsDir, 'restore-package-json.cjs');

    mkdirSync(scriptsDir, {recursive: true});
    copyFileSync(join(sourceScriptsDir, 'strip-dev-exports.cjs'), stripScriptPath);
    copyFileSync(join(sourceScriptsDir, 'restore-package-json.cjs'), restoreScriptPath);
  });

  afterEach(() => {
    rmSync(tempDir, {recursive: true, force: true});
  });

  it('restores the exact snapshot manifest after stripping development exports', () => {
    const originalManifest = `${JSON.stringify(
      {
        name: '@salesforce/b2c-tooling-sdk',
        version: '0.0.0-nightly.20260904022518',
        exports: {
          '.': {
            development: './src/index.ts',
            types: './dist/esm/index.d.ts',
            default: './dist/esm/index.js',
          },
        },
      },
      null,
      2,
    )}\n`;
    writeFileSync(packageJsonPath, originalManifest);

    execFileSync(process.execPath, [stripScriptPath]);

    const packedManifest = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      version: string;
      exports: Record<string, {development?: string}>;
    };
    expect(packedManifest.version).to.equal('0.0.0-nightly.20260904022518');
    expect(packedManifest.exports['.']).not.to.have.property('development');
    expect(existsSync(join(packageDir, 'tmp', 'package.json.prepack'))).to.equal(true);

    execFileSync(process.execPath, [restoreScriptPath]);

    expect(readFileSync(packageJsonPath, 'utf8')).to.equal(originalManifest);
    expect(existsSync(join(packageDir, 'tmp', 'package.json.prepack'))).to.equal(false);
  });
});
