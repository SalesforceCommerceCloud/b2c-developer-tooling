/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundleGuidance, type GuidanceCollectionSource} from '@salesforce/b2c-tooling-sdk/guidance';
import {loadBuiltinScapiSnippets} from '@salesforce/b2c-tooling-sdk/scapi';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageRoot, '../..');
const snippetIndex =
  '# Built-in SCAPI snippets\n\nGenerated from the shipped catalog. Discover user snippets with `codemode.search(query)`.\n' +
  'Describe before first use: `await codemode.describe(name)`. Run through `scapi_execute`: `await codemode.run(name, input)`.\n' +
  'All calls share the enclosing execution limits, configuration, and safety rules.\n\n' +
  loadBuiltinScapiSnippets()
    .map(
      (snippet) =>
        `## ${snippet.name}\n\n${snippet.description}\n\nEffect: ${snippet.effect}.\n\nInput JSON Schema:\n\n\`\`\`json\n${JSON.stringify(snippet.inputSchema)}\n\`\`\`\n`,
    )
    .join('\n');
writeFileSync(join(packageRoot, 'skills/scapi/references/snippets.md'), snippetIndex);
const config = JSON.parse(readFileSync(join(packageRoot, 'skills/collections.json'), 'utf8')) as {
  version: number;
  featuredResources?: string[];
  collections: GuidanceCollectionSource[];
};
if (config.version !== 1) throw new Error('Unsupported guidance collections manifest');
const result = bundleGuidance({
  repoRoot,
  baseDirectory: packageRoot,
  collections: config.collections,
  featuredResources: config.featuredResources,
  destination: join(packageRoot, 'content/guidance'),
});
process.stdout.write(`Bundled ${result.entries} guidance entries and ${result.files} Markdown files.\n`);
