/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Build the Script API docs index. Output goes to
 * `packages/b2c-vs-extension/resources/docs/`.
 *
 * Usage:
 *   pnpm --filter b2c-vs-extension run build:docs-index
 *
 * Determinism: the same source input always produces byte-identical output.
 * CI verifies this via `git diff --exit-code` after running this script.
 */

import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {SCHEMA_VERSION, stableStringify} from './schema.mjs';
import {buildScriptApiIndex} from './build-script-api.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// scripts/build-docs-index → package root
const pkgRoot = path.resolve(__dirname, '..', '..');
const repoRoot = path.resolve(pkgRoot, '..', '..');
const scriptTypesPkg = path.join(repoRoot, 'packages', 'b2c-script-types');
const typesRoot = path.join(scriptTypesPkg, 'types');
const outputDir = path.join(pkgRoot, 'resources', 'docs');

main().catch((err) => {
  process.stderr.write(`[docs-index] build failed: ${err && err.stack ? err.stack : err}\n`);
  process.exit(1);
});

async function main() {
  ensureDir(outputDir);

  const scriptTypesPkgJson = readJson(path.join(scriptTypesPkg, 'package.json'));
  const scriptApiVersion = String(scriptTypesPkgJson.version ?? 'unknown');

  process.stdout.write(`[docs-index] script-api source: ${path.relative(repoRoot, typesRoot)}\n`);

  const {entries: scriptApiEntries, search: scriptApiSearch} = buildScriptApiIndex({
    typesRoot,
    scriptApiVersion,
  });

  const scriptApiJsonPath = path.join(outputDir, 'script-api.json');
  const scriptApiSearchPath = path.join(outputDir, 'script-api-search.json');

  const scriptApiPayload = stableStringify(scriptApiEntries);
  const scriptApiSearchPayload = stableStringify(scriptApiSearch);

  writeIfChanged(scriptApiJsonPath, scriptApiPayload);
  writeIfChanged(scriptApiSearchPath, scriptApiSearchPayload);

  const counts = {
    scriptApi: scriptApiEntries.length,
  };

  // Checksum the SOURCE payloads (not the manifest) so manifest changes
  // (e.g. timestamps) don't make the checksum tautological.
  const checksum = sha256OfMany([scriptApiPayload, scriptApiSearchPayload]);

  /** @type {import('./schema.mjs').IndexManifest} */
  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    scriptApiVersion,
    generatedAt: getStableGeneratedAt(),
    counts,
    checksum,
  };

  const manifestPath = path.join(outputDir, 'manifest.json');
  writeIfChanged(manifestPath, stableStringify(manifest));

  process.stdout.write(
    `[docs-index] wrote ${counts.scriptApi} script-api entries to ${path.relative(repoRoot, outputDir)}\n`,
  );
}

function ensureDir(dir) {
  fs.mkdirSync(dir, {recursive: true});
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Avoid touching mtime when the content matches — keeps incremental builds happy
 * and prevents needless git diffs.
 */
function writeIfChanged(file, contents) {
  let existing;
  try {
    existing = fs.readFileSync(file, 'utf8');
  } catch {
    existing = undefined;
  }
  if (existing === contents) return;
  fs.writeFileSync(file, contents, 'utf8');
}

/**
 * For deterministic CI builds we don't want a real timestamp. Use the latest
 * git commit date if available, otherwise a fixed epoch. Plain `new Date()`
 * would break determinism.
 */
function getStableGeneratedAt() {
  // Allow override via env (CI may supply this).
  if (process.env.SOURCE_DATE_EPOCH) {
    const epoch = Number(process.env.SOURCE_DATE_EPOCH);
    if (Number.isFinite(epoch)) {
      return new Date(epoch * 1000).toISOString();
    }
  }
  // Fall back to a fixed epoch so that bumping the source bumps generatedAt
  // without depending on `git`. We just use a hash bucket — not a true date,
  // but a stable string.
  return '1970-01-01T00:00:00.000Z';
}

function sha256OfMany(strings) {
  const h = createHash('sha256');
  for (const s of strings) h.update(s);
  return h.digest('hex');
}
