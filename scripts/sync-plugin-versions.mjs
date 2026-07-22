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
const claudeTargets = new Set(['b2c-cli', 'b2c', 'storefront-next', 'b2c-operator']);
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
  'skills/storefront-next/.codex-plugin/plugin.json',
  'skills/b2c-operator/.codex-plugin/plugin.json',
];
for (const rel of codexTargets) {
  const path = join(repoRoot, rel);
  const manifest = readJson(path);
  manifest.version = version;
  writeJson(path, manifest);
}

console.log(`Synced plugin manifests to version ${version}`);

// b2c-dx-mcp plugin: unlike the skills plugins, this one tracks the
// @salesforce/b2c-dx-mcp npm package (changeset version has already bumped its
// package.json by now), not the b2c-agent-plugins version. Two things must move
// together on every MCP release:
//
//  1. Pin the npx-launched server to the exact published version. npx reuses a
//     cached package for a floating tag like @latest, so users can get a stale
//     server after an upgrade; an exact version forces a fetch.
//  2. Bump the marketplace entry's `version` so Claude Code sees the plugin as
//     changed and re-pulls the new pin. Without a version change the updated
//     .mcp.json can sit on the marketplace and never reach installed plugins.
const mcpVersion = readJson(join(repoRoot, 'packages/b2c-dx-mcp/package.json')).version;
if (!mcpVersion) {
  console.error('packages/b2c-dx-mcp/package.json has no version field');
  process.exit(1);
}

// (1) Rewrite the pinned version in the plugin's .mcp.json.
const mcpConfigPath = join(repoRoot, 'plugins/b2c-dx-mcp/.mcp.json');
const mcpConfig = readJson(mcpConfigPath);
const mcpArgs = mcpConfig.mcpServers?.['b2c-dx-mcp']?.args;
if (!Array.isArray(mcpArgs)) {
  console.error('plugins/b2c-dx-mcp/.mcp.json has no mcpServers["b2c-dx-mcp"].args array');
  process.exit(1);
}
const pkgArgIndex = mcpArgs.findIndex((arg) => typeof arg === 'string' && arg.startsWith('@salesforce/b2c-dx-mcp@'));
if (pkgArgIndex === -1) {
  console.error('plugins/b2c-dx-mcp/.mcp.json args do not reference @salesforce/b2c-dx-mcp');
  process.exit(1);
}
mcpArgs[pkgArgIndex] = `@salesforce/b2c-dx-mcp@${mcpVersion}`;
writeJson(mcpConfigPath, mcpConfig);

// (2) Stamp the MCP version onto its marketplace entry so clients re-pull.
const mcpEntry = marketplace.plugins.find((plugin) => plugin.name === 'b2c-dx-mcp');
if (!mcpEntry) {
  console.error('.claude-plugin/marketplace.json has no b2c-dx-mcp plugin entry');
  process.exit(1);
}
mcpEntry.version = mcpVersion;
writeJson(marketplacePath, marketplace);

console.log(`Pinned b2c-dx-mcp plugin to @salesforce/b2c-dx-mcp@${mcpVersion}`);
