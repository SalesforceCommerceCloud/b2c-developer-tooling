/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * Single source of truth: resources/xsd-mappings.json
 *
 * Reads the mappings file and:
 *   1. Copies the listed XSDs from the SDK (`b2c-tooling-sdk/data/xsd/`) into
 *      `resources/xsd/`. Any unrelated *.xsd previously written under that dir
 *      is removed so the bundle never carries unused schemas.
 *   2. Regenerates the `contributes.xmlValidation` block in package.json from
 *      the same mappings — keeping the VS Code contribution and the bundled
 *      schemas in lockstep.
 *
 * Invoked automatically at the start of esbuild-bundle.mjs (build/watch),
 * so a developer never needs to run it as a separate step.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultPkgRoot = path.resolve(__dirname, '..');

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

function readMappings(mappingsPath) {
  if (!fs.existsSync(mappingsPath)) {
    throw new Error(`[xsd-sync] Mappings file not found: ${mappingsPath}`);
  }
  const parsed = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
  const entries = parsed?.mappings;
  const bundleOnly = parsed?.bundleOnly ?? [];
  const skipped = parsed?.skipped ?? [];
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('[xsd-sync] xsd-mappings.json must contain a non-empty "mappings" array');
  }
  if (!Array.isArray(bundleOnly)) {
    throw new Error('[xsd-sync] xsd-mappings.json "bundleOnly" must be an array of filenames');
  }
  if (!Array.isArray(skipped)) {
    throw new Error('[xsd-sync] xsd-mappings.json "skipped" must be an array of filenames');
  }
  for (const entry of entries) {
    if (typeof entry?.schema !== 'string' || !entry.schema.endsWith('.xsd')) {
      throw new Error(`[xsd-sync] Invalid mapping entry — "schema" must end in .xsd: ${JSON.stringify(entry)}`);
    }
    if (!Array.isArray(entry.fileMatch) || entry.fileMatch.length === 0) {
      throw new Error(`[xsd-sync] Mapping for ${entry.schema} must have a non-empty fileMatch[]`);
    }
  }
  for (const name of [...bundleOnly, ...skipped]) {
    if (typeof name !== 'string' || !name.endsWith('.xsd')) {
      throw new Error(
        `[xsd-sync] Invalid bundleOnly/skipped entry — must be a filename ending in .xsd: ${JSON.stringify(name)}`,
      );
    }
  }
  return {mappings: entries, bundleOnly, skipped};
}

function assertFullSdkCoverage(mappings, bundleOnly, skipped, sdkXsdDir) {
  const sdkFiles = new Set(listXsdFiles(sdkXsdDir));
  const accounted = new Set([...mappings.map((m) => m.schema), ...bundleOnly, ...skipped]);

  const unaccounted = [...sdkFiles].filter((file) => !accounted.has(file)).sort();
  if (unaccounted.length > 0) {
    const list = unaccounted.map((f) => `  - ${f}`).join('\n');
    throw new Error(
      `[xsd-sync] ${unaccounted.length} SDK schema(s) are not accounted for:\n${list}\n` +
        `[xsd-sync] Edit resources/xsd-mappings.json — add each to one of:\n` +
        `[xsd-sync]   mappings[]    (bundled + contributed as fileMatch) for user-facing schemas\n` +
        `[xsd-sync]   bundleOnly[]  (bundled, no fileMatch) for schemas imported by other XSDs\n` +
        `[xsd-sync]   skipped[]     (excluded entirely) for internal/feed/non-workspace schemas.`,
    );
  }

  const phantom = [...accounted].filter((file) => !sdkFiles.has(file)).sort();
  if (phantom.length > 0) {
    const list = phantom.map((f) => `  - ${f}`).join('\n');
    throw new Error(
      `[xsd-sync] ${phantom.length} schema(s) listed in xsd-mappings.json no longer exist in the SDK:\n${list}\n` +
        `[xsd-sync] Remove them from mappings[]/bundleOnly[]/skipped[] in resources/xsd-mappings.json.`,
    );
  }
}

function syncSchemas(mappings, bundleOnly, sdkXsdDir, extensionXsdDir) {
  if (!fs.existsSync(sdkXsdDir)) {
    throw new Error(`[xsd-sync] SDK XSD source directory not found: ${sdkXsdDir}`);
  }
  fs.mkdirSync(extensionXsdDir, {recursive: true});

  const sourceFiles = new Set(listXsdFiles(sdkXsdDir));
  // Bundle both: schemas users validate against AND their transitive imports.
  const requested = new Set([...mappings.map((m) => m.schema), ...bundleOnly]);

  for (const schema of requested) {
    if (!sourceFiles.has(schema)) {
      throw new Error(`[xsd-sync] Schema "${schema}" is missing from SDK source directory ${sdkXsdDir}`);
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

function writeContribution(packageJsonPath, generated) {
  const raw = fs.readFileSync(packageJsonPath, 'utf8');
  const trailingNewline = raw.endsWith('\n');
  const pkg = JSON.parse(raw);
  pkg.contributes ??= {};
  const existing = pkg.contributes.xmlValidation ?? [];

  const sameContent =
    existing.length === generated.length &&
    existing.every((entry, idx) => entry?.fileMatch === generated[idx].fileMatch && entry?.url === generated[idx].url);

  if (sameContent) return false;

  pkg.contributes.xmlValidation = generated;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + (trailingNewline ? '\n' : ''));
  return true;
}

/**
 * Run the full sync. Safe to call multiple times — copies only when source/dest
 * differ and rewrites package.json only when the contribution array would change.
 */
export function syncXsd({pkgRoot = defaultPkgRoot} = {}) {
  const sdkXsdDir = path.resolve(pkgRoot, '..', 'b2c-tooling-sdk', 'data', 'xsd');
  const extensionXsdDir = path.join(pkgRoot, 'resources', 'xsd');
  const mappingsPath = path.join(pkgRoot, 'resources', 'xsd-mappings.json');
  const packageJsonPath = path.join(pkgRoot, 'package.json');

  const {mappings, bundleOnly, skipped} = readMappings(mappingsPath);
  assertFullSdkCoverage(mappings, bundleOnly, skipped, sdkXsdDir);
  const stats = syncSchemas(mappings, bundleOnly, sdkXsdDir, extensionXsdDir);
  const contribution = buildContribution(mappings);
  const wrotePkg = writeContribution(packageJsonPath, contribution);

  console.log(
    `[xsd-sync] ${mappings.length} mapped, ${bundleOnly.length} bundleOnly, ${skipped.length} skipped; ${contribution.length} fileMatch entries (${stats.copiedCount} copied, ${stats.unchangedCount} unchanged, ${stats.removedCount} removed)${wrotePkg ? ' — wrote package.json' : ''}`,
  );
  return {
    ...stats,
    mappedCount: mappings.length,
    bundleOnlyCount: bundleOnly.length,
    skippedCount: skipped.length,
    contributionEntries: contribution.length,
    wrotePackageJson: wrotePkg,
  };
}

// Allow direct invocation (e.g. `node scripts/sync-xsd.mjs`) for emergencies,
// even though the build pipeline calls syncXsd() directly.
const isDirectInvoke = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectInvoke) {
  try {
    syncXsd();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
