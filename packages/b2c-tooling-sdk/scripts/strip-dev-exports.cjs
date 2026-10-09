/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Strips "development" conditions from package.json exports before packing.
 *
 * The "development" condition maps to TypeScript source files (./src/...)
 * which are not included in the published package. This prevents
 * MODULE_NOT_FOUND errors when consumers install the package from npm.
 *
 * Called by the "prepack" script; "postpack" restores the exact original
 * manifest from a temporary backup. This is intentionally not restored from
 * git because release workflows may have applied an unpublished snapshot
 * version before packing.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const backupPath = path.join(__dirname, '..', 'tmp', 'package.json.prepack');
const originalManifest = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(originalManifest);

fs.mkdirSync(path.dirname(backupPath), {recursive: true});
try {
  fs.writeFileSync(backupPath, originalManifest, {flag: 'wx'});
} catch (error) {
  if (error.code === 'EEXIST') {
    throw new Error(
      `Prepack manifest backup already exists at ${backupPath}. Restore or remove it before packing again.`,
      {cause: error},
    );
  }

  throw error;
}

let stripped = 0;

if (pkg.exports) {
  for (const [, value] of Object.entries(pkg.exports)) {
    if (value && typeof value === 'object' && 'development' in value) {
      delete value.development;
      stripped++;
    }
  }
}

try {
  if (stripped > 0) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Stripped "development" condition from ${stripped} export(s)`);
  }
} catch (error) {
  fs.rmSync(backupPath, {force: true});
  throw error;
}
