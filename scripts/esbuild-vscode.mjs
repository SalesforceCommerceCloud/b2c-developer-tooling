/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Shared esbuild configuration for all VS Code extension packages.
 * Each extension's scripts/esbuild-bundle.mjs imports from this module.
 */
import fs from 'node:fs';
import path from 'node:path';

// In CJS there is no import.meta; SDK's version.js uses createRequire(import.meta.url). Shim it.
// Use globalThis so the value is visible inside all module wrappers in the bundle.
export const IMPORT_META_URL_SHIM =
  "if (typeof globalThis.__import_meta_url === 'undefined') { try { globalThis.__import_meta_url = require('url').pathToFileURL(__filename).href; } catch (_) {} }";

function loaderFor(filePath) {
  const ext = path.extname(filePath);
  if (ext === '.ts' || filePath.endsWith('.tsx')) return 'ts';
  return 'js';
}

/**
 * esbuild plugin that replaces import.meta.url references with a globalThis shim
 * so SDK code using createRequire(import.meta.url) works in CJS output.
 */
export const importMetaUrlPlugin = {
  name: 'import-meta-url-shim',
  setup(build) {
    build.onLoad({filter: /\.(ts|tsx|js|mjs|cjs)$/}, (args) => {
      const contents = fs.readFileSync(args.path, 'utf-8');
      const replaced = contents.includes('import.meta.url')
        ? contents.replace(/import\.meta\.url/g, 'globalThis.__import_meta_url')
        : contents;
      return {contents: replaced, loader: loaderFor(args.path)};
    });
  },
};

const REQUIRE_RESOLVE_PACKAGE_JSON_RE =
  /require\d*\.resolve\s*\(\s*["']@salesforce\/b2c-tooling-sdk\/package\.json["']\s*\)/g;
const REQUIRE_RESOLVE_REPLACEMENT = "require('path').join(__dirname, 'package.json')";

/**
 * Create the base esbuild options for a VS Code extension package.
 * @param {string} pkgRoot - Absolute path to the extension package root
 * @param {{ watch?: boolean }} options
 */
export function createBuildOptions(pkgRoot, {watch = false} = {}) {
  return {
    entryPoints: [path.join(pkgRoot, 'src', 'extension.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: path.join(pkgRoot, 'dist', 'extension.js'),
    sourcemap: true,
    metafile: true,
    external: ['vscode'],
    // In watch mode, include "development" so esbuild resolves the SDK's exports to .ts source files
    // directly (no SDK rebuild needed). Production builds use the built dist/ artifacts.
    conditions: watch ? ['development', 'require', 'node', 'default'] : ['require', 'node', 'default'],
    mainFields: ['main', 'module'],
    banner: {js: IMPORT_META_URL_SHIM},
    plugins: [importMetaUrlPlugin],
    logLevel: 'info',
  };
}

/**
 * Post-build: inline the SDK package.json into the bundle so it works without node_modules.
 * The SDK uses createRequire() which esbuild leaves as a runtime require; we replace that
 * require in the bundle output with the actual JSON content.
 * @param {string} pkgRoot - Absolute path to the extension package root
 * @param {string} sdkPkgJsonPath - Absolute path to the SDK package.json
 */
export function inlineSdkPackageJson(pkgRoot, sdkPkgJsonPath) {
  const outPath = path.join(pkgRoot, 'dist', 'extension.js');
  let str = fs.readFileSync(outPath, 'utf8');
  const sdkPkg = JSON.stringify(JSON.parse(fs.readFileSync(sdkPkgJsonPath, 'utf8')));
  str = str.replace(/require\d*\s*\(\s*["']@salesforce\/b2c-tooling-sdk\/package\.json["']\s*\)/g, sdkPkg);
  str = str.replace(REQUIRE_RESOLVE_PACKAGE_JSON_RE, REQUIRE_RESOLVE_REPLACEMENT);
  fs.writeFileSync(outPath, str, 'utf8');
}

/**
 * Print bundle analysis if ANALYZE_BUNDLE env is set.
 * @param {object} metafile - esbuild metafile result
 * @param {string} pkgRoot - Absolute path to the extension package root
 */
export function printBundleAnalysis(metafile, pkgRoot) {
  if (!metafile || !process.env.ANALYZE_BUNDLE) return;
  const metaPath = path.join(pkgRoot, 'dist', 'meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(metafile, null, 2), 'utf-8');
  const inputs = Object.entries(metafile.inputs).map(([file, info]) => ({
    file: path.relative(pkgRoot, file),
    bytes: info.bytes,
  }));
  inputs.sort((a, b) => b.bytes - a.bytes);
  const total = inputs.reduce((s, i) => s + i.bytes, 0);
  console.log('\n--- Bundle analysis (top 40 by input size) ---');
  console.log(`Total inputs: ${(total / 1024 / 1024).toFixed(2)} MB\n`);
  inputs.slice(0, 40).forEach(({file, bytes}, i) => {
    const pct = ((bytes / total) * 100).toFixed(1);
    console.log(
      `${String(i + 1).padStart(2)}  ${(bytes / 1024).toFixed(1).padStart(8)} KB  ${pct.padStart(5)}%  ${file}`,
    );
  });
  console.log('\nWrote', metaPath);
}
