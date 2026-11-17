/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Bundles the agent skills served by `loadBundledGuidanceCatalog()` (the MCP
 * `skills_read` tool and skill:// resources, `b2c docs skill`, and SDK hosts)
 * into `data/guidance`. Collections, featured resources and index summaries are
 * defined in `packages/b2c-dx-mcp/skills/`, next to the MCP-authored skills.
 *
 * Run with: pnpm --filter @salesforce/b2c-tooling-sdk run generate:guidance
 */

import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundleGuidance, type GuidanceCollectionSource} from '../src/guidance/index.js';
import {loadBuiltinScapiSnippets} from '../src/scapi/index.js';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageRoot, '../..');
const skillsRoot = join(repoRoot, 'packages/b2c-dx-mcp');
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
writeFileSync(join(skillsRoot, 'skills/b2c-mcp-scapi/references/snippets.md'), snippetIndex);
const config = JSON.parse(readFileSync(join(skillsRoot, 'skills/collections.json'), 'utf8')) as {
  version: number;
  featuredResources?: string[];
  collections: GuidanceCollectionSource[];
};
if (config.version !== 1) throw new Error('Unsupported guidance collections manifest');
// Short skill://index lines; skill descriptions and search are unaffected.
const indexSummaries = JSON.parse(readFileSync(join(skillsRoot, 'skills/index-summaries.json'), 'utf8')) as Record<
  string,
  string
>;
const result = bundleGuidance({
  repoRoot,
  baseDirectory: skillsRoot,
  collections: config.collections,
  featuredResources: config.featuredResources,
  indexSummaries,
  destination: join(packageRoot, 'data/guidance'),
});
process.stdout.write(`Bundled ${result.entries} guidance entries and ${result.files} Markdown files.\n`);
