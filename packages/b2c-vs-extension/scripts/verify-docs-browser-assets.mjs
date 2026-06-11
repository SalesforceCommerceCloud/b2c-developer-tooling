/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgRoot = path.resolve(__dirname, '..');

const REQUIRED_FILES = [
  'src/docs-browser/docs-webview.html',
  'resources/docs/manifest.json',
  'resources/docs/script-api.json',
  'resources/docs/script-api-search.json',
];

const REQUIRED_VSCODEIGNORE_ALLOWLIST = ['!src/docs-browser/docs-webview.html'];

main();

function main() {
  verifyRequiredFilesExist();
  verifyVscodeIgnoreAllowlist();
  verifyDocsIndexShape();
  process.stdout.write('[docs-browser-verify] docs browser runtime assets look valid.\n');
}

function verifyRequiredFilesExist() {
  for (const relativeFile of REQUIRED_FILES) {
    const absoluteFile = path.join(pkgRoot, relativeFile);
    if (!fs.existsSync(absoluteFile)) {
      throw new Error(`Missing required docs browser runtime file: ${relativeFile}`);
    }
    const stat = fs.statSync(absoluteFile);
    if (!stat.isFile() || stat.size === 0) {
      throw new Error(`Required docs browser runtime file is empty or not a file: ${relativeFile}`);
    }
  }
}

function verifyVscodeIgnoreAllowlist() {
  const vscodeIgnorePath = path.join(pkgRoot, '.vscodeignore');
  const raw = fs.readFileSync(vscodeIgnorePath, 'utf8');

  if (raw.includes('src/**')) {
    for (const allowlistEntry of REQUIRED_VSCODEIGNORE_ALLOWLIST) {
      if (!raw.includes(allowlistEntry)) {
        throw new Error(
          `Missing .vscodeignore allow-list entry: ${allowlistEntry}. ` +
            'Without this, Docs Browser webview can fail in packaged VSIX builds.',
        );
      }
    }
  }
}

function verifyDocsIndexShape() {
  const manifest = readJson('resources/docs/manifest.json');
  const scriptApi = readJson('resources/docs/script-api.json');
  const scriptApiSearch = readJson('resources/docs/script-api-search.json');

  if (!manifest || typeof manifest !== 'object') {
    throw new Error('resources/docs/manifest.json must contain an object');
  }
  if (manifest.schemaVersion !== 1) {
    throw new Error(
      `Unsupported docs manifest schemaVersion: ${String(manifest.schemaVersion)} (expected 1). ` +
        'Run `pnpm --filter b2c-vs-extension run build:docs-index`.',
    );
  }

  if (!Array.isArray(scriptApi) || scriptApi.length === 0) {
    throw new Error('resources/docs/script-api.json must be a non-empty array');
  }
  if (!Array.isArray(scriptApiSearch) || scriptApiSearch.length === 0) {
    throw new Error('resources/docs/script-api-search.json must be a non-empty array');
  }
  if (scriptApi.length !== scriptApiSearch.length) {
    throw new Error(
      `script-api and search index length mismatch: ${scriptApi.length} vs ${scriptApiSearch.length}. ` +
        'Run `pnpm --filter b2c-vs-extension run build:docs-index`.',
    );
  }

  const manifestScriptApiCount = manifest?.counts?.scriptApi;
  if (typeof manifestScriptApiCount !== 'number' || manifestScriptApiCount !== scriptApi.length) {
    throw new Error(
      `manifest counts.scriptApi (${String(manifestScriptApiCount)}) does not match script-api.json length (${scriptApi.length}).`,
    );
  }
}

function readJson(relativeFile) {
  const absoluteFile = path.join(pkgRoot, relativeFile);
  try {
    return JSON.parse(fs.readFileSync(absoluteFile, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse ${relativeFile}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
