/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Bundles the TypeScript Language Service plugin into a single CommonJS file
 * at plugin/index.js.
 *
 * The plugin is loaded by tsserver from the VS Code extension's staged
 * node_modules without its dependencies, so the shared cartridge resolver from
 * @salesforce/b2c-tooling-sdk/cartridges is inlined here. The SDK is resolved
 * through its `development` condition (TypeScript sources), so this build does
 * not depend on the SDK having been built first. `typescript` stays external:
 * tsserver passes its own instance to the plugin's init().
 */
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {build} from 'esbuild';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

await build({
  entryPoints: [path.join(pkgRoot, 'src', 'index.ts')],
  outfile: path.join(pkgRoot, 'plugin', 'index.js'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  conditions: ['development'],
  external: ['typescript', 'typescript/*'],
  logLevel: 'warning',
});

console.log('[b2c-script-types] bundled plugin/index.js');
