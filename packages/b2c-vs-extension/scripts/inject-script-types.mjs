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
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgRoot = path.resolve(__dirname, '..');

const PLUGIN_PREFIX = 'extension/node_modules/@salesforce/b2c-script-types';
const PLUGIN_ENTRIES = ['package.json', 'plugin', 'types', 'README.md', 'jsconfig.template.json'];
const CONTENT_TYPES_PATH = '[Content_Types].xml';

const vsixPath = process.argv[2] || findDefaultVsix();
if (!vsixPath || !fs.existsSync(vsixPath)) {
  console.error('[inject] VSIX not found:', vsixPath);
  process.exit(1);
}

const stagedRoot = path.join(pkgRoot, 'node_modules', '@salesforce', 'b2c-script-types');
if (!fs.existsSync(stagedRoot)) {
  console.error('[inject] staged plugin not found at', stagedRoot, '— run the build first');
  process.exit(1);
}

await injectPlugin(vsixPath, stagedRoot);

function findDefaultVsix() {
  const entries = fs
    .readdirSync(pkgRoot)
    .filter((f) => f.endsWith('.vsix'))
    .map((f) => ({f, m: fs.statSync(path.join(pkgRoot, f)).mtimeMs}))
    .sort((a, b) => b.m - a.m);
  return entries[0] ? path.join(pkgRoot, entries[0].f) : null;
}

async function injectPlugin(vsixPath, stagedRoot) {
  const zip = await JSZip.loadAsync(fs.readFileSync(vsixPath));

  const addedExtensions = new Set();
  let addedFiles = 0;
  for (const entry of PLUGIN_ENTRIES) {
    const sourcePath = path.join(stagedRoot, entry);
    if (!fs.existsSync(sourcePath)) continue;
    addedFiles += addToZip(zip, sourcePath, `${PLUGIN_PREFIX}/${entry}`, addedExtensions);
  }
  if (addedFiles === 0) {
    console.error('[inject] no plugin files staged — refusing to ship empty plugin tree');
    process.exit(1);
  }
  console.log(`[inject] added ${addedFiles} plugin file(s) to`, path.relative(pkgRoot, vsixPath));

  await patchContentTypes(zip, addedExtensions);

  const out = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {level: 6},
  });
  fs.writeFileSync(vsixPath, out);
}

function addToZip(zip, sourcePath, zipPath, addedExtensions) {
  const stat = fs.statSync(sourcePath);
  if (stat.isDirectory()) {
    let count = 0;
    for (const child of fs.readdirSync(sourcePath)) {
      count += addToZip(zip, path.join(sourcePath, child), `${zipPath}/${child}`, addedExtensions);
    }
    return count;
  }
  // OPC content-type entries use a leading-dot extension form (e.g., ".json").
  const ext = path.extname(zipPath).toLowerCase();
  if (ext) addedExtensions.add(ext);
  zip.file(zipPath, fs.readFileSync(sourcePath));
  return 1;
}

async function patchContentTypes(zip, addedExtensions) {
  const file = zip.file(CONTENT_TYPES_PATH);
  if (!file) {
    console.error('[inject] [Content_Types].xml missing from VSIX');
    process.exit(1);
  }
  const existing = await file.async('string');
  const declared = new Set();
  for (const m of existing.matchAll(/Extension="([^"]+)"/g)) {
    declared.add(m[1].toLowerCase());
  }
  const missing = [...addedExtensions].filter((e) => !declared.has(e));
  if (missing.length === 0) return;

  if (!existing.includes('</Types>')) {
    console.error('[inject] [Content_Types].xml does not contain </Types> — refusing to patch');
    process.exit(1);
  }
  const inserts = missing.map((e) => `<Default Extension="${e}" ContentType="application/octet-stream"/>`).join('');
  zip.file(CONTENT_TYPES_PATH, existing.replace('</Types>', `${inserts}</Types>`));
  console.log('[inject] patched [Content_Types].xml with extensions:', missing.join(', '));
}
