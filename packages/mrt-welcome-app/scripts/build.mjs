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

const enableSourceMaps = !process.env.DISABLE_SOURCE_MAPS;
const format = process.env.MRT_EXPORT_TYPE === 'esm' ? 'esm' : 'cjs';

const noExternal = [/^@h4ad\/.*/, 'express', '@salesforce/mrt-utilities', 'ejs'];

const externalFilter = (id) => {
  for (const pattern of noExternal) {
    if (typeof pattern === 'string' && id === pattern) return false;
    if (pattern instanceof RegExp && pattern.test(id)) return false;
  }
  return true;
};

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

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} kB`;
  return `${bytes} B`;
}

async function build() {
  await fs.rm(buildDir, {recursive: true, force: true});
  await fs.mkdir(buildDir, {recursive: true});

  await esbuild.build({
    bundle: true,
    platform: 'node',
    target: 'node22',
    format,
    minify: true,
    sourcemap: enableSourceMaps ? 'inline' : false,
    outdir: buildDir,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    plugins: [bundlePlugin],
    splitting: false,
    entryPoints: {ssr: path.join(pkgRoot, 'src', 'ssr.ts')},
  });

  const ssrStat = await fs.stat(path.join(buildDir, 'ssr.js'));
  console.log(`  build/ssr.js  ${formatSize(ssrStat.size)}`);

  // Copy views
  const viewsSrc = path.join(pkgRoot, 'src', 'views');
  const viewsDest = path.join(buildDir, 'views');
  await copyDir(viewsSrc, viewsDest);

  // Build config.server.ts so the CLI can load ssrOnly/ssrShared/ssrParameters
  await esbuild.build({
    bundle: false,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    outdir: buildDir,
    entryPoints: {'config.server': path.join(pkgRoot, 'config.server.ts')},
  });

  // Create empty loader.js required by MRT
  await fs.writeFile(path.join(buildDir, 'loader.js'), '// This file is intentionally empty\n');

  // Write package.json without "type" field
  const pkg = JSON.parse(await fs.readFile(path.join(pkgRoot, 'package.json'), 'utf8'));
  delete pkg.type;
  await fs.writeFile(path.join(buildDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

  console.log('Build complete');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
