/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {existsSync, mkdirSync, symlinkSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

// pnpm pack only finds bundles in package-local node_modules, even with hoisted installs.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
// Include the pinned server's transitive runtime dependencies in the bundle tree.
for (const name of ['@modelcontextprotocol/server', '@modelcontextprotocol/core', 'zod']) {
  const target = resolve(packageRoot, 'node_modules', name);
  if (existsSync(target)) continue;
  let source = dirname(require.resolve(name));
  while (!existsSync(resolve(source, 'package.json'))) {
    const parent = dirname(source);
    if (parent === source) throw new Error(`Cannot find package root for ${name}`);
    source = parent;
  }
  mkdirSync(dirname(target), {recursive: true});
  symlinkSync(source, target, 'junction');
}
