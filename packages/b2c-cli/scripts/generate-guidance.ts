/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Bundles the authored agent skills that `b2c docs skill` serves offline.
 * Collection definitions are shared with the MCP server; MCP-only collections
 * (backed by a package directory rather than a repo plugin) are excluded.
 */
import {readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundleGuidance, type GuidanceCollectionSource} from '@salesforce/b2c-tooling-sdk/guidance';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageRoot, '../..');
const config = JSON.parse(readFileSync(join(repoRoot, 'packages/b2c-dx-mcp/skills/collections.json'), 'utf8')) as {
  version: number;
  collections: GuidanceCollectionSource[];
};
if (config.version !== 1) throw new Error('Unsupported guidance collections manifest');
const result = bundleGuidance({
  repoRoot,
  collections: config.collections.filter((collection) => collection.plugin),
  destination: join(packageRoot, 'content/guidance'),
});
process.stdout.write(`Bundled ${result.entries} skills and ${result.files} Markdown files.\n`);
