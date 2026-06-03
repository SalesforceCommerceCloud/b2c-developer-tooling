/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * Single source of truth: resources/xsd-mappings.json
 *
 * This script:
 *   1. Reads the mappings file.
 *   2. Copies the listed XSDs from the SDK (`b2c-tooling-sdk/data/xsd/`) into
 *      `resources/xsd/`. Any unrelated *.xsd previously written under that dir
 *      is removed so the bundle never carries unused schemas.
 *   3. Regenerates the `contributes.xmlValidation` block in package.json from
 *      the same mappings — keeping the VS Code contribution and the bundled
 *      schemas in lockstep. CI may invoke with `--check` to fail on drift.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgRoot = path.resolve(__dirname, '..');
const sdkXsdDir = path.resolve(pkgRoot, '..', 'b2c-tooling-sdk', 'data', 'xsd');
const extensionXsdDir = path.join(pkgRoot, 'resources', 'xsd');
const mappingsPath = path.join(pkgRoot, 'resources', 'xsd-mappings.json');
const packageJsonPath = path.join(pkgRoot, 'package.json');

const checkMode = process.argv.includes('--check');

function fail(message) {
  console.error(`[xsd-sync] ${message}`);
  process.exit(1);
}

function readMappings() {
  if (!fs.existsSync(mappingsPath)) {
    fail(`Mappings file not found: ${mappingsPath}`);
  }
  const parsed = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
  const entries = parsed?.mappings;
  if (!Array.isArray(entries) || entries.length === 0) {
    fail('xsd-mappings.json must contain a non-empty "mappings" array');
  }
  for (const entry of entries) {
    if (typeof entry?.schema !== 'string' || !entry.schema.endsWith('.xsd')) {
      fail(`Invalid mapping entry — "schema" must end in .xsd: ${JSON.stringify(entry)}`);
    }
    if (!Array.isArray(entry.fileMatch) || entry.fileMatch.length === 0) {
      fail(`Mapping for ${entry.schema} must have a non-empty fileMatch[]`);
    }
  }
  return entries;
}

function listXsdFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('.xsd'))
    .sort((left, right) => left.localeCompare(right));
}

function filesEqual(leftPath, rightPath) {
  if (!fs.existsSync(leftPath) || !fs.existsSync(rightPath)) return false;
  return fs.readFileSync(leftPath).equals(fs.readFileSync(rightPath));
}

function syncSchemas(mappings) {
  if (!fs.existsSync(sdkXsdDir)) {
    fail(`SDK XSD source directory not found: ${sdkXsdDir}`);
  }
  fs.mkdirSync(extensionXsdDir, {recursive: true});

  const sourceFiles = new Set(listXsdFiles(sdkXsdDir));
  const requested = new Set(mappings.map((m) => m.schema));

  for (const schema of requested) {
    if (!sourceFiles.has(schema)) {
      fail(`Mapped schema "${schema}" is missing from SDK source directory ${sdkXsdDir}`);
    }
  }

  let removedCount = 0;
  for (const file of listXsdFiles(extensionXsdDir)) {
    if (!requested.has(file)) {
      fs.rmSync(path.join(extensionXsdDir, file), {force: true});
      removedCount += 1;
    }
  }

  let copiedCount = 0;
  let unchangedCount = 0;
  for (const schema of requested) {
    const src = path.join(sdkXsdDir, schema);
    const dest = path.join(extensionXsdDir, schema);
    if (filesEqual(src, dest)) {
      unchangedCount += 1;
      continue;
    }
    if (checkMode) {
      fail(`Drift: ${schema} in resources/xsd/ does not match the SDK source. Run \`pnpm run sync:xsd\`.`);
    }
    fs.copyFileSync(src, dest);
    copiedCount += 1;
  }

  return {total: requested.size, copiedCount, unchangedCount, removedCount};
}

function buildContribution(mappings) {
  const entries = [];
  for (const mapping of mappings) {
    for (const fileMatch of mapping.fileMatch) {
      entries.push({fileMatch, url: `./resources/xsd/${mapping.schema}`});
    }
  }
  return entries;
}

function writeContribution(generated) {
  const raw = fs.readFileSync(packageJsonPath, 'utf8');
  const trailingNewline = raw.endsWith('\n');
  const pkg = JSON.parse(raw);
  pkg.contributes ??= {};
  const existing = pkg.contributes.xmlValidation ?? [];
  const desired = generated;

  const sameLength = existing.length === desired.length;
  const sameContent =
    sameLength &&
    existing.every((entry, idx) => entry?.fileMatch === desired[idx].fileMatch && entry?.url === desired[idx].url);

  if (sameContent) return false;

  if (checkMode) {
    fail(
      'Drift: package.json#contributes.xmlValidation is out of sync with xsd-mappings.json. Run `pnpm run sync:xsd`.',
    );
  }

  pkg.contributes.xmlValidation = desired;
  const next = JSON.stringify(pkg, null, 2) + (trailingNewline ? '\n' : '');
  fs.writeFileSync(packageJsonPath, next);
  return true;
}

const mappings = readMappings();
const stats = syncSchemas(mappings);
const contributionEntries = buildContribution(mappings);
const wrotePackageJson = writeContribution(contributionEntries);

if (checkMode) {
  console.log(`[xsd-sync] check OK: ${stats.total} schemas, ${contributionEntries.length} fileMatch entries`);
} else {
  console.log(
    `[xsd-sync] complete: ${stats.total} schemas (${stats.copiedCount} copied, ${stats.unchangedCount} unchanged, ${stats.removedCount} removed); ${contributionEntries.length} fileMatch entries${wrotePackageJson ? ' — wrote package.json' : ''}`,
  );
}
