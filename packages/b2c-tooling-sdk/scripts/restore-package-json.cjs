/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Restores the exact package.json saved by strip-dev-exports.cjs.
 *
 * Preserving the prepack manifest matters for nightly releases: the workflow
 * assigns snapshot versions before publishing, and dependent workspace
 * packages must still see those versions after the SDK has been packed.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const backupPath = path.join(__dirname, '..', 'tmp', 'package.json.prepack');

if (!fs.existsSync(backupPath)) {
  throw new Error(`Prepack manifest backup not found at ${backupPath}.`);
}

const originalManifest = fs.readFileSync(backupPath, 'utf8');
fs.writeFileSync(pkgPath, originalManifest);
fs.rmSync(backupPath);

console.log('Restored package.json after packing');
