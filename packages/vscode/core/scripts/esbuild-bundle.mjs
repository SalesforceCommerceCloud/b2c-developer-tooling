/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Bundles the core extension with esbuild using shared VS Code extension config.
 * Core-specific post-build steps: inline SDK package.json, copy scaffolds, copy Swagger UI assets.
 */
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {createBuildOptions, inlineSdkPackageJson, printBundleAnalysis} from '../../../../scripts/esbuild-vscode.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// scripts/ -> package root
const pkgRoot = path.resolve(__dirname, '..');
const sdkRoot = path.join(pkgRoot, '..', '..', 'b2c-tooling-sdk');
const sdkPkgJsonPath = path.join(sdkRoot, 'package.json');

/** Copy SDK scaffold templates into dist/ so the extension can find them at runtime. */
function copySdkScaffolds() {
  const src = path.join(sdkRoot, 'data', 'scaffolds');
  const dest = path.join(pkgRoot, 'dist', 'data', 'scaffolds');
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, {recursive: true});
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
  console.log(`[swagger-ui] Copied ${files.length} assets to dist/swagger-ui/`);
}

const watchMode = process.argv.includes('--watch');
const buildOptions = createBuildOptions(pkgRoot, {watch: watchMode});

if (watchMode) {
  copySdkScaffolds();
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('[esbuild] watching for changes...');
} else {
  const result = await esbuild.build(buildOptions);

  inlineSdkPackageJson(pkgRoot, sdkPkgJsonPath);
  copySdkScaffolds();
  copySwaggerUiAssets();

  printBundleAnalysis(result.metafile, pkgRoot);
}
