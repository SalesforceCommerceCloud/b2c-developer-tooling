/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Bundles the extension with esbuild.
 *
 * - Shims `import.meta.url` so SDK code that uses `createRequire(import.meta.url)`
 *   works in CJS output.
 * - Inlines `require('@salesforce/b2c-tooling-sdk/package.json')` and
 *   `require.resolve(...)` calls at LOAD time (i.e., on the SDK source before
 *   esbuild parses/minifies it) so the runtime doesn't try to resolve out of
 *   node_modules — `vsce --no-dependencies` never ships node_modules. Doing
 *   this at load time (rather than as a post-bundle string-replace) means
 *   minification can't break the pattern. A build-time assertion guards against
 *   regex drift.
 * - Stages static assets (SDK data dirs, script-types plugin, swagger-ui)
 *   into dist/ via a single helper used by both watch and production paths.
 * - Build-time `define` injects the extension version and telemetry connection
 *   string so the runtime doesn't have to readFileSync(package.json).
 */
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// scripts/ -> package root
const pkgRoot = path.resolve(__dirname, '..');
const sdkRoot = path.join(pkgRoot, '..', 'b2c-tooling-sdk');
const sdkPkgJsonPath = path.join(sdkRoot, 'package.json');
const scriptTypesRoot = path.join(pkgRoot, '..', 'b2c-script-types');
const watchMode = process.argv.includes('--watch');

const extPkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));

// In CJS there is no import.meta; SDK's version.js uses createRequire(import.meta.url). Shim it.
// Use globalThis so the value is visible inside all module wrappers in the bundle.
const IMPORT_META_URL_SHIM =
  "if (typeof globalThis.__import_meta_url === 'undefined') { try { globalThis.__import_meta_url = require('url').pathToFileURL(__filename).href; } catch (_) {} }";

// Match a `require()` of the SDK package.json *before* minification. Bound to the literal
// `require` identifier (not a renamed minified local) because we run on source files.
const SDK_PKG_REQUIRE_RE = /require\s*\(\s*["']@salesforce\/b2c-tooling-sdk\/package\.json["']\s*\)/g;
const SDK_PKG_REQUIRE_RESOLVE_RE =
  /require\s*\.\s*resolve\s*\(\s*["']@salesforce\/b2c-tooling-sdk\/package\.json["']\s*\)/g;
// `require('path').join(__dirname, 'package.json')` evaluates at runtime to <extension-dist>/package.json,
// so `path.dirname(...)` gives the extension's dist/ directory — where SDK data dirs are staged.
const SDK_PKG_REQUIRE_RESOLVE_REPLACEMENT = "require('path').join(__dirname, 'package.json')";

let sdkPkgRequireHits = 0;
let sdkPkgResolveHits = 0;
let sdkPkgInlinedJson;

function loaderFor(filePath) {
  if (filePath.endsWith('.tsx')) return 'tsx';
  const ext = path.extname(filePath);
  if (ext === '.ts') return 'ts';
  return 'js';
}

/**
 * Source-level transform plugin:
 * - Replace `import.meta.url` with a globalThis shim (CJS has no import.meta).
 * - Inline `require('@salesforce/b2c-tooling-sdk/package.json')` and `require.resolve(...)`
 *   with the JSON literal / runtime __dirname path. Done at LOAD time so minification can't
 *   break the pattern.
 */
const sdkSourceShimPlugin = {
  name: 'sdk-source-shim',
  setup(build) {
    build.onStart(() => {
      sdkPkgRequireHits = 0;
      sdkPkgResolveHits = 0;
      sdkPkgInlinedJson = JSON.stringify(JSON.parse(fs.readFileSync(sdkPkgJsonPath, 'utf8')));
    });
    build.onLoad({filter: /\.(ts|tsx|js|mjs|cjs)$/}, (args) => {
      const original = fs.readFileSync(args.path, 'utf8');
      const hasImportMeta = original.includes('import.meta.url');
      const hasRequirePkg = SDK_PKG_REQUIRE_RE.test(original);
      // test() advances lastIndex; reset before re-using elsewhere.
      SDK_PKG_REQUIRE_RE.lastIndex = 0;
      const hasResolvePkg = SDK_PKG_REQUIRE_RESOLVE_RE.test(original);
      SDK_PKG_REQUIRE_RESOLVE_RE.lastIndex = 0;

      if (!hasImportMeta && !hasRequirePkg && !hasResolvePkg) return null;

      let contents = original;
      if (hasImportMeta) {
        contents = contents.replace(/import\.meta\.url/g, 'globalThis.__import_meta_url');
      }
      if (hasResolvePkg) {
        // Must run BEFORE the bare-require replacement, since `require.resolve(...)` also matches the bare regex.
        contents = contents.replace(SDK_PKG_REQUIRE_RESOLVE_RE, () => {
          sdkPkgResolveHits++;
          return SDK_PKG_REQUIRE_RESOLVE_REPLACEMENT;
        });
      }
      if (hasRequirePkg) {
        contents = contents.replace(SDK_PKG_REQUIRE_RE, () => {
          sdkPkgRequireHits++;
          return sdkPkgInlinedJson;
        });
      }
      return {contents, loader: loaderFor(args.path)};
    });
    build.onEnd((result) => {
      if (watchMode) return;
      if (result.errors && result.errors.length > 0) return;
      if (sdkPkgRequireHits === 0 && sdkPkgResolveHits === 0) {
        throw new Error(
          '[sdk-source-shim] expected at least one require()/require.resolve() of ' +
            "'@salesforce/b2c-tooling-sdk/package.json' in SDK source, found none. " +
            'SDK code may have changed; update SDK_PKG_REQUIRE_RE / SDK_PKG_REQUIRE_RESOLVE_RE.',
        );
      }
      console.log(
        `[sdk-source-shim] inlined ${sdkPkgRequireHits} require() and ${sdkPkgResolveHits} require.resolve() call(s).`,
      );
    });
  },
};

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.cpSync(src, dest, {recursive: true});
  return true;
}

/**
 * Copy SDK data directories into dist/data/. The SDK uses
 * `path.dirname(require.resolve('@salesforce/b2c-tooling-sdk/package.json'))` as packageRoot
 * and joins data subdirs to it. Since `sdkSourceShimPlugin` rewrites that resolve to
 * `path.join(__dirname, 'package.json')`, packageRoot becomes the extension's dist/, so
 * these data dirs must be staged there.
 */
const SDK_DATA_DIRS = ['scaffolds', 'cip-proto', 'script-api', 'content-schemas'];
function copySdkDataDirs() {
  for (const dir of SDK_DATA_DIRS) {
    copyDir(path.join(sdkRoot, 'data', dir), path.join(pkgRoot, 'dist', 'data', dir));
  }
}

/** Stage @salesforce/b2c-script-types into the extension's node_modules so the TypeScript Server
 * plugin (declared in contributes.typescriptServerPlugins) is resolvable from the extension root
 * at runtime, even with `vsce --no-dependencies`. */
function copyScriptTypesPlugin() {
  if (!fs.existsSync(scriptTypesRoot)) {
    console.warn('[script-types] source not found, skipping:', scriptTypesRoot);
    return;
  }
  const dest = path.join(pkgRoot, 'node_modules', '@salesforce', 'b2c-script-types');
  // Wipe any stale staged copy (or pnpm symlink) so we don't accumulate.
  if (fs.existsSync(dest) || fs.lstatSync(dest, {throwIfNoEntry: false})) {
    fs.rmSync(dest, {recursive: true, force: true});
  }
  fs.mkdirSync(path.dirname(dest), {recursive: true});
  for (const entry of ['package.json', 'plugin', 'types', 'README.md', 'jsconfig.template.json']) {
    const s = path.join(scriptTypesRoot, entry);
    if (!fs.existsSync(s)) continue;
    fs.cpSync(s, path.join(dest, entry), {recursive: true});
  }
  console.log('[script-types] staged', path.relative(pkgRoot, dest));
}

/** Copy Swagger UI assets to dist/swagger-ui/ for the API Browser webview. */
function copySwaggerUiAssets() {
  const swaggerUiIndex = fileURLToPath(import.meta.resolve('swagger-ui-dist'));
  const swaggerUiDist = path.dirname(swaggerUiIndex);
  const outDir = path.join(pkgRoot, 'dist', 'swagger-ui');
  fs.mkdirSync(outDir, {recursive: true});
  const files = ['swagger-ui-bundle.js', 'swagger-ui-standalone-preset.js', 'swagger-ui.css'];
  for (const file of files) {
    fs.copyFileSync(path.join(swaggerUiDist, file), path.join(outDir, file));
  }
  console.log(`[swagger-ui] copied ${files.length} assets to dist/swagger-ui/`);
}

/** Single helper invoked by both watch and production paths so they ship the same dist/ layout. */
function syncStaticAssets() {
  copySdkDataDirs();
  copyScriptTypesPlugin();
  copySwaggerUiAssets();
}

const buildOptions = {
  entryPoints: [path.join(pkgRoot, 'src', 'extension.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  // VS Code 1.105 ships Node 22; align with engines.
  target: 'node22',
  outfile: path.join(pkgRoot, 'dist', 'extension.cjs'),
  sourcemap: true,
  metafile: true,
  external: ['vscode'],
  // In watch mode, include "development" so esbuild resolves the SDK's exports to .ts source files
  // directly (no SDK rebuild needed). Production builds use the built dist/ artifacts.
  conditions: watchMode ? ['development', 'require', 'node', 'default'] : ['require', 'node', 'default'],
  mainFields: ['main', 'module'],
  banner: {js: IMPORT_META_URL_SHIM},
  plugins: [sdkSourceShimPlugin],
  // Build-time constants — read once at bundle time so the runtime doesn't readFileSync(package.json).
  define: {
    __EXT_VERSION__: JSON.stringify(extPkg.version),
    __TELEMETRY_CONNECTION_STRING__: JSON.stringify(extPkg.telemetry?.connectionString ?? ''),
  },
  minify: !watchMode,
  drop: watchMode ? [] : ['debugger'],
  legalComments: 'none',
  logLevel: 'info',
};

if (watchMode) {
  syncStaticAssets();
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('[esbuild] watching for changes...');
} else {
  const result = await esbuild.build(buildOptions);

  syncStaticAssets();

  if (result.metafile && process.env.ANALYZE_BUNDLE) {
    const metaPath = path.join(pkgRoot, 'dist', 'meta.json');
    fs.writeFileSync(metaPath, JSON.stringify(result.metafile, null, 2), 'utf8');
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
