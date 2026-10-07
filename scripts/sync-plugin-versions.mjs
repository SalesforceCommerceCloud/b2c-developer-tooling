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
// b2c-dx-mcp is NOT part of b2c-agent-plugins — scripts/pin-mcp-plugin.mjs pins it after
// @salesforce/b2c-dx-mcp is published (see .github/workflows/pin-mcp-plugin.yml).
const marketplacePath = join(repoRoot, '.claude-plugin/marketplace.json');
const marketplace = readJson(marketplacePath);
const claudeTargets = new Set(['b2c-cli', 'b2c', 'b2c-ops', 'storefront-next']);
for (const plugin of marketplace.plugins) {
  if (claudeTargets.has(plugin.name)) {
    plugin.version = version;
  }
}
writeJson(marketplacePath, marketplace);

// Per-plugin manifests. Two layouts ship together during the transition to the
// Agent Plugins standard (agent-plugins.org):
//   - `plugin.json` at the plugin root — the standard manifest read by Codex
//     (CLI >= 0.146.0), Cursor, Copilot, VS Code, and Kiro.
//   - `.codex-plugin/plugin.json` — the legacy Codex manifest, kept so users on
//     Codex CLI < 0.146.0 (no root-`plugin.json` support) keep working. Codex
//     >= 0.146.0 reads the root manifest and treats this as an overlay.
// Both must stay in version lockstep. (Claude Code uses the marketplace above.)
const pluginManifestTargets = [
  'skills/b2c-cli/plugin.json',
  'skills/b2c-cli/.codex-plugin/plugin.json',
  'skills/b2c/plugin.json',
  'skills/b2c/.codex-plugin/plugin.json',
  'skills/b2c-ops/plugin.json',
  'skills/b2c-ops/.codex-plugin/plugin.json',
  'skills/storefront-next/plugin.json',
  'skills/storefront-next/.codex-plugin/plugin.json',
];
for (const rel of pluginManifestTargets) {
  const path = join(repoRoot, rel);
  const manifest = readJson(path);
  manifest.version = version;
  writeJson(path, manifest);
}

console.log(`Synced plugin manifests to version ${version}`);
