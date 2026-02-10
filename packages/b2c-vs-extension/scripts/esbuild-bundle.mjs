/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Bundles the extension with esbuild. Injects a shim for import.meta.url so
 * SDK code that uses createRequire(import.meta.url) works in CJS output.
 */
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

const watchMode = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: [path.join(pkgRoot, "src", "extension.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  outfile: path.join(pkgRoot, "dist", "extension.js"),
  sourcemap: true,
  metafile: true,
  external: ["vscode"],
  // In watch mode, include "development" so esbuild resolves the SDK's exports to .ts source files
  // directly (no SDK rebuild needed). Production builds use the built dist/ artifacts.
  conditions: watchMode
    ? ["development", "require", "node", "default"]
    : ["require", "node", "default"],
  mainFields: ["main", "module"],
  banner: { js: IMPORT_META_URL_SHIM },
  plugins: [importMetaUrlPlugin],
  logLevel: "info",
};

if (watchMode) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("[esbuild] watching for changes...");
} else {
  const result = await esbuild.build(buildOptions);

  inlineSdkPackageJson();

  if (result.metafile && process.env.ANALYZE_BUNDLE) {
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
      console.log(`${String(i + 1).padStart(2)}  ${(bytes / 1024).toFixed(1).padStart(8)} KB  ${pct.padStart(5)}%  ${file}`);
    });
    console.log("\nWrote", metaPath);
  }
}
