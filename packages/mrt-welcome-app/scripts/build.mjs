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

const format = process.env.MRT_EXPORT_TYPE === 'esm' ? 'esm' : 'cjs';

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

async function build() {
  await fs.rm(buildDir, {recursive: true, force: true});
  await fs.mkdir(buildDir, {recursive: true});

  const ssrExt = format === 'esm' ? '.mjs' : '.js';
  // In ESM mode, esbuild leaves CJS `require()` calls from bundled deps as a
  // runtime helper that throws "Dynamic require of X is not supported". Bridge
  // it to a real Node CJS require so transitive deps that use require() work.
  const esmRequireBanner =
    "import {createRequire as __mrtCreateRequire} from 'node:module';" +
    'const require = __mrtCreateRequire(import.meta.url);';
  await esbuild.build({
    bundle: true,
    platform: 'node',
    target: 'node22',
    format,
    minify: true,
    sourcemap: false,
    outdir: buildDir,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    plugins: [bundlePlugin],
    splitting: false,
    entryPoints: {ssr: path.join(pkgRoot, 'src', 'ssr.ts')},
    outExtension: {'.js': ssrExt},
    ...(format === 'esm' ? {banner: {js: esmRequireBanner}} : {}),
  });

  const ssrStat = await fs.stat(path.join(buildDir, `ssr${ssrExt}`));
  console.log(`  build/ssr${ssrExt}  ${formatSize(ssrStat.size)}`);

  // Copy views
  const viewsSrc = path.join(pkgRoot, 'src', 'views');
  const viewsDest = path.join(buildDir, 'views');
  await copyDir(viewsSrc, viewsDest);

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
