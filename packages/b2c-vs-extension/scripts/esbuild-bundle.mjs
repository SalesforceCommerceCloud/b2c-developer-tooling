/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Bundles the extension with esbuild. Injects a shim for import.meta.url so
 * SDK code that uses createRequire(import.meta.url) works in CJS output.
 */
// import * as esbuild from 'esbuild';
// import fs from 'node:fs';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const root = path.resolve(__dirname, '..');

// const IMPORT_META_URL_SHIM =
//   "var __import_meta_url = require('url').pathToFileURL(__filename).href;";

// function loaderFor(filePath) {
//   const ext = path.extname(filePath);
//   if (ext === '.ts' || filePath.endsWith('.tsx')) return 'ts';
//   return 'js';
// }

// const importMetaUrlPlugin = {
//   name: 'import-meta-url-shim',
//   setup(build) {
//     build.onLoad({ filter: /\.(ts|tsx|js|mjs|cjs)$/ }, (args) => {
//       const contents = fs.readFileSync(args.path, 'utf-8');
//       const replaced = contents.includes('import.meta.url')
//         ? contents.replace(/import\.meta\.url/g, '__import_meta_url')
//         : contents;
//       return { contents: replaced, loader: loaderFor(args.path) };
//     });
//   },
// };

// await esbuild.build({
//   entryPoints: [path.join(root, 'src', 'extension.ts')],
//   bundle: true,
//   platform: 'node',
//   format: 'cjs',
//   outfile: path.join(root, 'out', 'extension.js'),
//   sourcemap: true,
//   external: ['vscode'],
//   banner: { js: IMPORT_META_URL_SHIM },
//   plugins: [importMetaUrlPlugin],
// });


import esbuild from "esbuild";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// scripts/ -> package root
const pkgRoot = path.resolve(__dirname, "..");

// In CJS there is no import.meta; SDK's version.js uses createRequire(import.meta.url). Shim it.
// Use globalThis so the value is visible inside all module wrappers in the bundle.
const IMPORT_META_URL_SHIM =
  "if (typeof globalThis.__import_meta_url === 'undefined') { try { globalThis.__import_meta_url = require('url').pathToFileURL(__filename).href; } catch (_) {} }";

function loaderFor(filePath) {
  const ext = path.extname(filePath);
  if (ext === ".ts" || filePath.endsWith(".tsx")) return "ts";
  return "js";
}

const importMetaUrlPlugin = {
  name: "import-meta-url-shim",
  setup(build) {
    build.onLoad({ filter: /\.(ts|tsx|js|mjs|cjs)$/ }, (args) => {
      const contents = fs.readFileSync(args.path, "utf-8");
      const replaced = contents.includes("import.meta.url")
        ? contents.replace(/import\.meta\.url/g, "globalThis.__import_meta_url")
        : contents;
      return { contents: replaced, loader: loaderFor(args.path) };
    });
  },
};

// Inline SDK package.json so the bundle doesn't require() it at runtime (vsce --no-dependencies
// never includes node_modules). The SDK uses createRequire() so esbuild leaves it as runtime require;
// we replace that require in the bundle output with the actual JSON (post-build).
const sdkPkgJsonPath = path.join(pkgRoot, "..", "b2c-tooling-sdk", "package.json");
const sdkPackageJsonPlugin = { name: "sdk-package-json", setup() {} };
function inlineSdkPackageJson() {
  const outPath = path.join(pkgRoot, "dist", "extension.js");
  let str = fs.readFileSync(outPath, "utf8");
  const sdkPkg = JSON.stringify(JSON.parse(fs.readFileSync(sdkPkgJsonPath, "utf8")));
  const replaced = str.replace(
    /require\d*\s*\(\s*["']@salesforce\/b2c-tooling-sdk\/package\.json["']\s*\)/g,
    sdkPkg
  );
  if (replaced !== str) fs.writeFileSync(outPath, replaced, "utf8");
}

const result = await esbuild.build({
  entryPoints: [path.join(pkgRoot, "src", "extension.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  outfile: path.join(pkgRoot, "dist", "extension.js"),
  sourcemap: true,
  metafile: true,
  // Exclude TypeScript compiler (~9 MB): pulled in by SDK deps but not needed at runtime for config/WebDAV.
  external: ["vscode", "typescript"],
  conditions: ["require", "node", "default"],
  mainFields: ["main", "module"],
  banner: { js: IMPORT_META_URL_SHIM },
  plugins: [sdkPackageJsonPlugin, importMetaUrlPlugin],
  logLevel: "info",
});

inlineSdkPackageJson();

if (result.metafile && process.env.ANALYZE_BUNDLE) {
  const fs = await import("node:fs");
  const metaPath = path.join(pkgRoot, "dist", "meta.json");
  fs.writeFileSync(metaPath, JSON.stringify(result.metafile, null, 2), "utf-8");
  const inputs = Object.entries(result.metafile.inputs).map(([file, info]) => ({
    file: path.relative(pkgRoot, file),
    bytes: info.bytes,
  }));
  inputs.sort((a, b) => b.bytes - a.bytes);
  const total = inputs.reduce((s, i) => s + i.bytes, 0);
  console.log("\n--- Bundle analysis (top 40 by input size) ---");
  console.log(`Total inputs: ${(total / 1024 / 1024).toFixed(2)} MB\n`);
  inputs.slice(0, 40).forEach(({ file, bytes }, i) => {
    const pct = ((bytes / total) * 100).toFixed(1);
    const mb = (bytes / 1024 / 1024).toFixed(2);
    console.log(`${String(i + 1).padStart(2)}  ${(bytes / 1024).toFixed(1).padStart(8)} KB  ${pct.padStart(5)}%  ${file}`);
  });
  console.log("\nWrote", metaPath);
}
