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
 * Called by the "prepack" script; "postpack" restores via git checkout.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

let stripped = 0;

if (pkg.exports) {
  for (const [, value] of Object.entries(pkg.exports)) {
    if (value && typeof value === 'object' && 'development' in value) {
      delete value.development;
      stripped++;
    }
  }
}

if (stripped > 0) {
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Stripped "development" condition from ${stripped} export(s)`);
}
