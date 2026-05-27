/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Injects @salesforce/b2c-script-types into the VSIX zip.
 *
 * Background: vsce --no-dependencies hard-codes `ignore: 'node_modules/**'`
 * when collecting files, so .vscodeignore negations cannot bring those files
 * back. VS Code's TypeScript Server plugin loader requires the plugin to live
 * at <extension-root>/node_modules/<name>, so we add it to the zip ourselves
 * after vsce produces the VSIX.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgRoot = path.resolve(__dirname, '..');

const vsixPath = process.argv[2] || findDefaultVsix();
if (!vsixPath || !fs.existsSync(vsixPath)) {
  console.error('[inject] VSIX not found:', vsixPath);
  process.exit(1);
}

function findDefaultVsix() {
  const entries = fs
    .readdirSync(pkgRoot)
    .filter((f) => f.endsWith('.vsix'))
    .map((f) => ({f, m: fs.statSync(path.join(pkgRoot, f)).mtimeMs}))
    .sort((a, b) => b.m - a.m);
  return entries[0] ? path.join(pkgRoot, entries[0].f) : null;
}

const stagedRoot = path.join(pkgRoot, 'node_modules', '@salesforce', 'b2c-script-types');
if (!fs.existsSync(stagedRoot)) {
  console.error('[inject] staged plugin not found at', stagedRoot, '— run the build first');
  process.exit(1);
}

// Build a temp directory shaped like the VSIX interior so we can `zip -r` cleanly.
const stagingDir = fs.mkdtempSync(path.join(pkgRoot, '.vsix-inject-'));
try {
  const target = path.join(stagingDir, 'extension', 'node_modules', '@salesforce', 'b2c-script-types');
  fs.mkdirSync(target, {recursive: true});
  for (const entry of ['package.json', 'plugin', 'types', 'README.md', 'jsconfig.template.json']) {
    const s = path.join(stagedRoot, entry);
    if (!fs.existsSync(s)) continue;
    fs.cpSync(s, path.join(target, entry), {recursive: true});
  }

  // Append into the existing zip. -r recursive, paths are relative to staging dir (cwd).
  execFileSync('zip', ['-r', '-q', vsixPath, 'extension/node_modules/@salesforce/b2c-script-types'], {
    cwd: stagingDir,
    stdio: 'inherit',
  });
  console.log('[inject] added script-types plugin to', path.relative(pkgRoot, vsixPath));
} finally {
  fs.rmSync(stagingDir, {recursive: true, force: true});
}
