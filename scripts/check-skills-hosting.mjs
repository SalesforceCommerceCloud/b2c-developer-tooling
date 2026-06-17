#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 *
 * Post-docs-build assertion: the curl-able skill hosting actually produced the
 * files agents will fetch. Verifies, against the built VitePress output:
 *   1. skills-index.json exists, parses, and lists every governed skill.
 *   2. skills.txt exists and carries the fidelity note.
 *   3. Each index record's skillUrl + referenceUrls map to a real file on disk
 *      in dist/ (i.e. the absolute URL, stripped of origin+base, resolves).
 *   4. skillUrls are absolute (have an https:// origin) — a site-relative path
 *      would not be curl-able.
 * Run by the CI `skills` job after `pnpm run docs:build`.
 */

import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(repoRoot, 'docs', '.vitepress', 'dist');
const skillsPluginsPath = join(repoRoot, 'skills', 'plugins.json');

const fail = (msg) => {
  console.error(`error: ${msg}`);
  process.exitCode = 1;
};

if (!existsSync(distDir)) {
  console.error(`error: ${distDir} not found — run "pnpm run docs:build" first.`);
  process.exit(1);
}

const indexPath = join(distDir, 'skills-index.json');
const txtPath = join(distDir, 'skills.txt');

if (!existsSync(indexPath)) fail('dist/skills-index.json missing');
if (!existsSync(txtPath)) fail('dist/skills.txt missing');
if (process.exitCode) process.exit(1);

const index = JSON.parse(readFileSync(indexPath, 'utf8'));
const txt = readFileSync(txtPath, 'utf8');

if (!index.fidelityNote || !index.fidelityNote.includes('curl -sL'))
  fail('fidelity note missing or malformed in skills-index.json');
if (!txt.includes('curl -sL')) fail('skills.txt missing curl commands');
if (!Array.isArray(index.skills) || index.skills.length === 0) fail('skills-index.json has no skills');

// Map an absolute URL back to its dist-relative path: strip the origin and the
// site base path (everything up to and including "/skills/" or the site root).
function urlToDistPath(url) {
  const m = url.match(/^https?:\/\/[^/]+(\/.*)$/);
  if (!m) return null; // not absolute
  // base path is like /b2c-developer-tooling/ or /b2c-developer-tooling/dev/.
  // The published file lives at dist/<path-after-base>. Find "/skills/".
  const idx = m[1].indexOf('/skills/');
  if (idx === -1) return null;
  return m[1].slice(idx + 1); // drop leading slash → skills/<plugin>/...
}

let checked = 0;
for (const s of index.skills) {
  if (!/^https?:\/\//.test(s.skillUrl)) {
    fail(`skill "${s.name}" has non-absolute skillUrl: ${s.skillUrl}`);
    continue;
  }
  const rel = urlToDistPath(s.skillUrl);
  if (!rel || !existsSync(join(distDir, rel))) {
    fail(`skill "${s.name}" skillUrl does not resolve to a built file: ${s.skillUrl}`);
  }
  for (const ref of s.referenceUrls ?? []) {
    const refRel = urlToDistPath(ref);
    if (!refRel || !existsSync(join(distDir, refRel))) {
      fail(`skill "${s.name}" referenceUrl does not resolve to a built file: ${ref}`);
    }
  }
  checked++;
}

// Cross-check count against governed plugins (best-effort). Generated persona
// bundles are intentionally excluded from the index (their skills are hosted
// under their home plugin), so skip them here too.
try {
  const plugins = JSON.parse(readFileSync(skillsPluginsPath, 'utf8'))
    .plugins.filter((p) => !p.generated)
    .map((p) => p.name);
  const seenPlugins = new Set(index.skills.map((s) => s.plugin));
  for (const p of plugins) {
    if (!seenPlugins.has(p)) fail(`plugin "${p}" from skills/plugins.json has no skills in the index`);
  }
} catch {
  /* non-fatal */
}

if (process.exitCode) {
  console.error('\ncheck-skills-hosting: FAILED');
  process.exit(1);
}
console.log(`check-skills-hosting: OK (${checked} skills, all skillUrls absolute and resolvable in dist/).`);
