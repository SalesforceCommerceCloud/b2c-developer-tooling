/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Bundles the Storefront Next extension with esbuild using shared VS Code extension config.
 * SFN has no SDK runtime dependencies — it consumes Core's API at runtime.
 */
import esbuild from 'esbuild';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {createBuildOptions, printBundleAnalysis} from '../../../../scripts/esbuild-vscode.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgRoot = path.resolve(__dirname, '..');
const watchMode = process.argv.includes('--watch');
const buildOptions = createBuildOptions(pkgRoot, {watch: watchMode});

if (watchMode) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('[esbuild] watching for changes...');
} else {
  const result = await esbuild.build(buildOptions);
  printBundleAnalysis(result.metafile, pkgRoot);
}
