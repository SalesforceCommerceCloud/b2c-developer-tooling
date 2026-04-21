#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 *
 * Sync the @salesforce/b2c-agent-plugins workspace package version into the
 * plugin manifest files consumed by Claude Code and Codex.
 *
 * Runs as part of the root `version` script after `changeset version`.
 */

import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
}

const pluginsPkg = readJson(join(repoRoot, 'skills/package.json'));
const version = pluginsPkg.version;
if (!version) {
  console.error('skills/package.json has no version field');
  process.exit(1);
}

// Claude Code marketplace: stamp version into each relevant plugins[] entry.
// b2c-dx-mcp is NOT part of b2c-agent-plugins — it tracks @salesforce/b2c-dx-mcp separately.
const marketplacePath = join(repoRoot, '.claude-plugin/marketplace.json');
const marketplace = readJson(marketplacePath);
const claudeTargets = new Set(['b2c-cli', 'b2c']);
for (const plugin of marketplace.plugins) {
  if (claudeTargets.has(plugin.name)) {
    plugin.version = version;
  }
}
writeJson(marketplacePath, marketplace);

// Codex per-plugin manifests.
const codexTargets = [
  'skills/b2c-cli/.codex-plugin/plugin.json',
  'skills/b2c/.codex-plugin/plugin.json',
];
for (const rel of codexTargets) {
  const path = join(repoRoot, rel);
  const manifest = readJson(path);
  manifest.version = version;
  writeJson(path, manifest);
}

console.log(`Synced plugin manifests to version ${version}`);
