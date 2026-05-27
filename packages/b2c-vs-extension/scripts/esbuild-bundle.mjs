/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Bundles the extension with esbuild. Injects a shim for import.meta.url so
 * SDK code that uses createRequire(import.meta.url) works in CJS output.
 */
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// scripts/ -> package root
const pkgRoot = path.resolve(__dirname, '..');

// In CJS there is no import.meta; SDK's version.js uses createRequire(import.meta.url). Shim it.
// Use globalThis so the value is visible inside all module wrappers in the bundle.
const IMPORT_META_URL_SHIM =
  "if (typeof globalThis.__import_meta_url === 'undefined') { try { globalThis.__import_meta_url = require('url').pathToFileURL(__filename).href; } catch (_) {} }";

function loaderFor(filePath) {
  const ext = path.extname(filePath);
  if (ext === '.ts' || filePath.endsWith('.tsx')) return 'ts';
  return 'js';
}

const importMetaUrlPlugin = {
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

// Inline SDK package.json so the bundle doesn't require() it at runtime (vsce --no-dependencies
// never includes node_modules). The SDK uses createRequire() so esbuild leaves it as runtime require;
// we replace that require in the bundle output with the actual JSON (post-build).
// Also replace require.resolve('@salesforce/b2c-tooling-sdk/package.json') so it doesn't throw when
// the extension runs from a VSIX (no node_modules). We use __dirname so path.dirname(...) is the extension dist.
const sdkPkgJsonPath = path.join(pkgRoot, '..', 'b2c-tooling-sdk', 'package.json');
const REQUIRE_RESOLVE_PACKAGE_JSON_RE =
  /require\d*\.resolve\s*\(\s*["']@salesforce\/b2c-tooling-sdk\/package\.json["']\s*\)/g;
const REQUIRE_RESOLVE_REPLACEMENT = "require('path').join(__dirname, 'package.json')";

// Copy SDK scaffold templates into dist/ so the extension can find them at runtime.
// The extension passes this path explicitly via createScaffoldRegistry({ builtInScaffoldsDir }).
const sdkRoot = path.join(pkgRoot, '..', 'b2c-tooling-sdk');

function copySdkScaffolds() {
  const src = path.join(sdkRoot, 'data', 'scaffolds');
  const dest = path.join(pkgRoot, 'dist', 'data', 'scaffolds');
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, {recursive: true});
}

// Stage @salesforce/b2c-script-types into the extension's node_modules so the
// TypeScript Server plugin (declared in contributes.typescriptServerPlugins) is
// resolvable from the extension root at runtime, even with `vsce --no-dependencies`.
function copyScriptTypesPlugin() {
  const src = path.join(pkgRoot, '..', 'b2c-script-types');
  const dest = path.join(pkgRoot, 'node_modules', '@salesforce', 'b2c-script-types');
  if (!fs.existsSync(src)) {
    console.warn('[script-types] source not found, skipping:', src);
    return;
  }
  // Wipe any stale staged copy (or pnpm symlink) so we don't accumulate.
  if (fs.existsSync(dest) || fs.lstatSync(dest, {throwIfNoEntry: false})) {
    fs.rmSync(dest, {recursive: true, force: true});
  }
  fs.mkdirSync(path.dirname(dest), {recursive: true});
  // Copy only the runtime artifacts; skip src/, eslint/tsconfig dev files.
  for (const entry of ['package.json', 'plugin', 'types', 'README.md', 'jsconfig.template.json']) {
    const s = path.join(src, entry);
    if (!fs.existsSync(s)) continue;
    fs.cpSync(s, path.join(dest, entry), {recursive: true});
  }
  console.log('[script-types] staged', path.relative(pkgRoot, dest));
}

function copyCipProtoFiles() {
  const src = path.join(sdkRoot, 'data', 'cip-proto');
  const dest = path.join(pkgRoot, 'dist', 'data', 'cip-proto');
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, {recursive: true});
  fs.cpSync(src, dest, {recursive: true});
  console.log('[cip-proto] Copied proto files to dist/data/cip-proto/');
}

/**
 * Copy raw CIP webview stylesheet into dist/ so the packaged extension never
 * reaches back into src/. Mirrors how cip-proto data files are copied above.
 *
 * The webview UI scripts go through esbuild → dist/webview-ui/ Copying it
 * keeps the runtime resource layout consistent (everything under dist/).
 * keeps the runtime resource layout consistent (everything under dist/).
 */
function copyCipStyles() {
  const src = path.join(pkgRoot, 'src', 'cip-analytics', 'cip-styles.css');
  if (!fs.existsSync(src)) return;
  const destDir = path.join(pkgRoot, 'dist', 'cip-analytics');
  fs.mkdirSync(destDir, {recursive: true});
  fs.copyFileSync(src, path.join(destDir, 'cip-styles.css'));
  console.log('[cip-styles] Copied cip-styles.css to dist/cip-analytics/');
}

function inlineSdkPackageJson() {
  const outPath = path.join(pkgRoot, 'dist', 'extension.cjs');
  let str = fs.readFileSync(outPath, 'utf8');
  const sdkPkg = JSON.stringify(JSON.parse(fs.readFileSync(sdkPkgJsonPath, 'utf8')));
  str = str.replace(/require\d*\s*\(\s*["']@salesforce\/b2c-tooling-sdk\/package\.json["']\s*\)/g, sdkPkg);
  str = str.replace(REQUIRE_RESOLVE_PACKAGE_JSON_RE, REQUIRE_RESOLVE_REPLACEMENT);
  fs.writeFileSync(outPath, str, 'utf8');
}

/** Copy Swagger UI assets to dist/swagger-ui/ for the API Browser webview. */
function copySwaggerUiAssets() {
  // Resolve the swagger-ui-dist package location (pnpm may hoist it)
  const swaggerUiIndex = fileURLToPath(import.meta.resolve('swagger-ui-dist'));
  const swaggerUiDist = path.dirname(swaggerUiIndex);
  const outDir = path.join(pkgRoot, 'dist', 'swagger-ui');
  fs.mkdirSync(outDir, {recursive: true});

  const files = ['swagger-ui-bundle.js', 'swagger-ui-standalone-preset.js', 'swagger-ui.css'];
  for (const file of files) {
    fs.copyFileSync(path.join(swaggerUiDist, file), path.join(outDir, file));
  }
  console.log(`[swagger-ui] Copied ${files.length} assets to dist/swagger-ui/`);
}

const watchMode = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: [path.join(pkgRoot, 'src', 'extension.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: path.join(pkgRoot, 'dist', 'extension.cjs'),
  sourcemap: true,
  metafile: true,
  external: ['vscode'],
  // In watch mode, include "development" so esbuild resolves the SDK's exports to .ts source files
  // directly (no SDK rebuild needed). Production builds use the built dist/ artifacts.
  conditions: watchMode ? ['development', 'require', 'node', 'default'] : ['require', 'node', 'default'],
  mainFields: ['main', 'module'],
  banner: {js: IMPORT_META_URL_SHIM},
  plugins: [importMetaUrlPlugin],
  logLevel: 'info',
};

// Webview UI bundles. Each entry compiles a React app for one webview panel
// (Query Builder, Tables Browser, Report Dashboard). Targets the browser since
// these run inside a VS Code webview, not the extension host.
const webviewUiSrc = path.join(pkgRoot, 'src', 'webview-ui');
const webviewBuildOptions = {
  entryPoints: {
    'query-builder': path.join(webviewUiSrc, 'query-builder', 'index.tsx'),
    'tables-browser': path.join(webviewUiSrc, 'tables-browser', 'index.tsx'),
    'report-dashboard': path.join(webviewUiSrc, 'report-dashboard', 'index.tsx'),
  },
  outdir: path.join(pkgRoot, 'dist', 'webview-ui'),
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  sourcemap: true,
  jsx: 'automatic',
  loader: {'.css': 'text'},
  define: {
    'process.env.NODE_ENV': watchMode ? '"development"' : '"production"',
  },
  logLevel: 'info',
};

if (watchMode) {
  copySdkScaffolds();
  copyScriptTypesPlugin();
  copyCipProtoFiles();
  copyCipStyles();
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('[esbuild] watching for changes...');

  // Watch webview-ui in parallel; failures inside the React bundles must not bring
  // down the extension host build, so each runs in its own context.
  if (fs.existsSync(webviewUiSrc)) {
    const webviewCtx = await esbuild.context(webviewBuildOptions);
    await webviewCtx.watch();
    console.log('[esbuild] watching webview-ui for changes...');
  }
} else {
  const result = await esbuild.build(buildOptions);

  inlineSdkPackageJson();
  copySdkScaffolds();
  copyScriptTypesPlugin();
  copyCipProtoFiles();
  copyCipStyles();
  copySwaggerUiAssets();

  if (fs.existsSync(webviewUiSrc)) {
    try {
      await esbuild.build(webviewBuildOptions);
      console.log('[webview-ui] Built webview UI bundles into dist/webview-ui/');
    } catch (err) {
      // Surface a clean error so CI logs a single recognisable line instead of
      // letting esbuild's stack ride out as the top-level rejection.
      console.error('[webview-ui] Build failed:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  if (result.metafile && process.env.ANALYZE_BUNDLE) {
    const metaPath = path.join(pkgRoot, 'dist', 'meta.json');
    fs.writeFileSync(metaPath, JSON.stringify(result.metafile, null, 2), 'utf-8');
    const inputs = Object.entries(result.metafile.inputs).map(([file, info]) => ({
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
}
