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

const noExternal = [
  /^@aws-sdk\/.*/,
  /^@h4ad\/.*/,
  'express',
  'express-basic-auth',
  '@salesforce/mrt-utilities',
  'negotiator',
  'compressible',
  'winston',
];

const externalFilter = (id) => {
  for (const pattern of noExternal) {
    if (typeof pattern === 'string' && id === pattern) return false;
    if (pattern instanceof RegExp && pattern.test(id)) return false;
  }
  return true;
};

/** esbuild plugin that marks all packages external except noExternal list */
const bundlePlugin = {
  name: 'bundle-deps',
  setup(build) {
    build.onResolve({filter: /^[^./]/}, (args) => {
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

async function build() {
  await fs.rm(buildDir, {recursive: true, force: true});
  await fs.mkdir(buildDir, {recursive: true});

  const commonOptions = {
    bundle: true,
    platform: 'node',
    target: 'node22',
    format,
    minify: true,
    sourcemap: enableSourceMaps ? 'inline' : false,
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
  await esbuild.build({
    ...commonOptions,
    entryPoints: {[ssrEntry]: path.join(pkgRoot, 'src', `${ssrEntry}.ts`)},
  });

  // Build request-processor (always CJS regardless of MRT_EXPORT_TYPE)
  await esbuild.build({
    ...commonOptions,
    format: 'cjs',
    entryPoints: {'request-processor': path.join(pkgRoot, 'src', 'request-processor.ts')},
  });

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

  console.log(`Build complete → build/ (${ssrEntry}.js + request-processor.js)`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
