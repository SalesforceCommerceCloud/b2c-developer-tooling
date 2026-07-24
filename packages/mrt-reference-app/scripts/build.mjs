/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');
const buildDir = path.resolve(pkgRoot, 'build');

const bundleType = process.env.MRT_BUNDLE_TYPE;
const MRT_STREAMING_BUNDLES = ['stream', 'streaming', 'streamingHandler'];
const isStreaming = MRT_STREAMING_BUNDLES.includes(bundleType ?? '');
const ssrEntry = isStreaming ? 'streamingHandler' : 'ssr';
const enableSourceMaps = !process.env.DISABLE_SOURCE_MAPS;
const format = process.env.MRT_EXPORT_TYPE === 'esm' ? 'esm' : 'cjs';

/** esbuild plugin that replaces import.meta.url with a CJS-compatible expression */
const importMetaUrlCjsPlugin = {
  name: 'import-meta-url-cjs',
  setup(build) {
    build.onLoad({filter: /\.[jt]s$/}, async (args) => {
      const contents = await fs.readFile(args.path, 'utf8');
      if (!contents.includes('import.meta.url')) return null;
      return {
        contents: contents.replaceAll('import.meta.url', 'require("url").pathToFileURL(__filename).href'),
        loader: args.path.endsWith('.ts') ? 'ts' : 'js',
      };
    });
  },
};

// Packages that must NOT be bundled (e.g., native modules, or modules provided
// by the Lambda runtime). The deploy ships only build/ssr.js — there is no
// node_modules at runtime — so the default is to bundle everything.
const external = [];

const externalFilter = (id) => {
  for (const pattern of external) {
    if (typeof pattern === 'string' && (id === pattern || id.startsWith(pattern + '/'))) return true;
    if (pattern instanceof RegExp && pattern.test(id)) return true;
  }
  return false;
};

/** esbuild plugin that marks specific packages external; bundles everything else */
const bundlePlugin = {
  name: 'bundle-deps',
  setup(build) {
    build.onResolve({filter: /^[^./]/}, (args) => {
      // Skip Windows absolute paths (e.g. D:\...) which match the filter
      if (/^[A-Za-z]:/.test(args.path)) return null;
      if (externalFilter(args.path)) {
        return {external: true};
      }
      return null;
    });
  },
};

async function copyDir(src, dest) {
  await fs.mkdir(dest, {recursive: true});
  const entries = await fs.readdir(src, {withFileTypes: true});
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} kB`;
  return `${bytes} B`;
}

async function logOutputFile(filePath) {
  const stat = await fs.stat(filePath);
  const rel = path.relative(pkgRoot, filePath);
  console.log(`  build/${path.basename(rel)}  ${formatSize(stat.size)}`);
}

/** Recursively sum the size of every file under a directory. */
async function dirSize(dir) {
  let total = 0;
  const entries = await fs.readdir(dir, {withFileTypes: true});
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await dirSize(entryPath);
    } else {
      const stat = await fs.stat(entryPath);
      total += stat.size;
    }
  }
  return total;
}

async function build() {
  await fs.rm(buildDir, {recursive: true, force: true});
  await fs.mkdir(buildDir, {recursive: true});

  const commonOptions = {
    bundle: true,
    platform: 'node',
    target: 'node22',
    format,
    minify: true,
    sourcemap: enableSourceMaps ? 'linked' : false,
    outdir: buildDir,
    define: {
      'process.env.NODE_ENV': '"production"',
      ...(bundleType ? {'process.env.MRT_BUNDLE_TYPE': `"${bundleType}"`} : {}),
    },
    plugins: [bundlePlugin],
    // Inline dynamic imports to avoid chunk resolution issues in Lambda
    splitting: false,
  };

  // Build SSR / streaming handler entry
  const ssrExt = format === 'esm' ? '.mjs' : '.js';
  // In ESM mode, esbuild leaves CJS `require()` calls from bundled deps as a
  // runtime helper that throws "Dynamic require of X is not supported". Bridge
  // it to a real Node CJS require so transitive deps that use require() work.
  const esmRequireBanner =
    "import {createRequire as __mrtCreateRequire} from 'node:module';" +
    'const require = __mrtCreateRequire(import.meta.url);';
  await esbuild.build({
    ...commonOptions,
    plugins: [...commonOptions.plugins, ...(format === 'cjs' ? [importMetaUrlCjsPlugin] : [])],
    entryPoints: {[ssrEntry]: path.join(pkgRoot, 'src', `${ssrEntry}.ts`)},
    outExtension: {'.js': ssrExt},
    ...(format === 'esm' ? {banner: {js: esmRequireBanner}} : {}),
  });
  await logOutputFile(path.join(buildDir, `${ssrEntry}${ssrExt}`));

  // Build request-processor (always CJS regardless of MRT_EXPORT_TYPE)
  await esbuild.build({
    ...commonOptions,
    format: 'cjs',
    plugins: [...commonOptions.plugins, importMetaUrlCjsPlugin],
    entryPoints: {'request-processor': path.join(pkgRoot, 'src', 'request-processor.ts')},
  });
  await logOutputFile(path.join(buildDir, 'request-processor.js'));

  // Build config.server.ts -> build/config.server.js so `b2c mrt bundle deploy`
  // reads the ssrOnly/ssrShared globs from it. Without this file the SDK falls
  // back to defaults that only match ssr.{js,mjs}, so the streamingHandler entry
  // ends up in neither ssr_only nor ssr_shared and the push is rejected.
  // MRT_BUNDLE_TYPE is baked in via `define`, so config.server.ts selects the
  // correct entry point (ssr vs. streamingHandler) at build time. Always CJS so
  // it loads regardless of MRT_EXPORT_TYPE (build/package.json has no "type").
  await esbuild.build({
    ...commonOptions,
    format: 'cjs',
    minify: false,
    sourcemap: false,
    entryPoints: {'config.server': path.join(pkgRoot, 'config.server.ts')},
  });
  await logOutputFile(path.join(buildDir, 'config.server.js'));

  // Copy static assets
  const staticSrc = path.join(pkgRoot, 'src', 'static');
  const staticDest = path.join(buildDir, 'static');
  await copyDir(staticSrc, staticDest);

  // Create empty loader.js required by MRT
  await fs.writeFile(path.join(buildDir, 'loader.js'), '// This file is intentionally empty\n');

  // Write package.json without "type" field (MRT requires CJS bundles without it)
  const pkg = JSON.parse(await fs.readFile(path.join(pkgRoot, 'package.json'), 'utf8'));
  delete pkg.type;
  await fs.writeFile(path.join(buildDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

  console.log(`Total build size: ${formatSize(await dirSize(buildDir))}`);
  console.log('Build complete');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
