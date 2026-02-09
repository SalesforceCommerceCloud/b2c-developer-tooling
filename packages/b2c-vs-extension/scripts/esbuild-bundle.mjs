/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Bundles the extension with esbuild. Injects a shim for import.meta.url so
 * SDK code that uses createRequire(import.meta.url) works in CJS output.
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const IMPORT_META_URL_SHIM =
  "var __import_meta_url = require('url').pathToFileURL(__filename).href;";

function loaderFor(filePath) {
  const ext = path.extname(filePath);
  if (ext === '.ts' || filePath.endsWith('.tsx')) return 'ts';
  return 'js';
}

const importMetaUrlPlugin = {
  name: 'import-meta-url-shim',
  setup(build) {
    build.onLoad({ filter: /\.(ts|tsx|js|mjs|cjs)$/ }, (args) => {
      const contents = fs.readFileSync(args.path, 'utf-8');
      const replaced = contents.includes('import.meta.url')
        ? contents.replace(/import\.meta\.url/g, '__import_meta_url')
        : contents;
      return { contents: replaced, loader: loaderFor(args.path) };
    });
  },
};

await esbuild.build({
  entryPoints: [path.join(root, 'src', 'extension.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: path.join(root, 'out', 'extension.js'),
  sourcemap: true,
  external: ['vscode'],
  banner: { js: IMPORT_META_URL_SHIM },
  plugins: [importMetaUrlPlugin],
});
