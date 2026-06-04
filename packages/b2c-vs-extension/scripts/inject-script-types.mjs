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
 *
 * Because the injected tree introduces file extensions (notably .ts/.d.ts)
 * that vsce did not see, [Content_Types].xml is patched in-place to register
 * a Default content type for any new extension. Without this, strict OPC
 * consumers — observed on some Windows installs — reject the VSIX.
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

  patchContentTypes(vsixPath, stagingDir, target);
} finally {
  fs.rmSync(stagingDir, {recursive: true, force: true});
}

function collectExtensions(dir, acc = new Set()) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) collectExtensions(p, acc);
    else {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext) acc.add(ext);
    }
  }
  return acc;
}

function patchContentTypes(vsixPath, stagingDir, injectedRoot) {
  const injected = collectExtensions(injectedRoot);
  // unzip treats `[` as a glob char-class; backslash-escape to match it literally.
  const existing = execFileSync('unzip', ['-p', vsixPath, '\\[Content_Types\\].xml'], {encoding: 'utf8'});
  const declared = new Set();
  for (const m of existing.matchAll(/Extension="(\.[^"]+)"/g)) {
    declared.add(m[1].toLowerCase());
  }

  const missing = [...injected].filter((e) => !declared.has(e));
  if (missing.length === 0) {
    return;
  }

  const inserts = missing.map((e) => `<Default Extension="${e}" ContentType="application/octet-stream"/>`).join('');
  const updated = existing.replace('</Types>', `${inserts}</Types>`);

  // zip's CLI treats `[` as a glob char-class, so write the file then feed its
  // name through stdin via -@ to avoid wildcard expansion.
  fs.writeFileSync(path.join(stagingDir, '[Content_Types].xml'), updated);
  execFileSync('zip', ['-q', vsixPath, '-@'], {
    cwd: stagingDir,
    input: '[Content_Types].xml\n',
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  console.log('[inject] patched [Content_Types].xml with extensions:', missing.join(', '));
}
