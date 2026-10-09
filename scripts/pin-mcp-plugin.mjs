#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 *
 * Pin the b2c-dx-mcp plugin to a published @salesforce/b2c-dx-mcp version.
 *
 * Usage: node scripts/pin-mcp-plugin.mjs [version]
 * Defaults to packages/b2c-dx-mcp/package.json's version.
 *
 * Run by .github/workflows/pin-mcp-plugin.yml once npm serves the version, not
 * by the version PR: plugin manifests on main are live the moment they merge, so
 * pinning before npm can serve the package leaves new installs unable to start.
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

const mcpVersion = process.argv[2] ?? readJson(join(repoRoot, 'packages/b2c-dx-mcp/package.json')).version;
if (!/^\d+\.\d+\.\d+$/.test(mcpVersion ?? '')) {
  console.error(`Invalid @salesforce/b2c-dx-mcp version: ${mcpVersion}`);
  process.exit(1);
}

// Two things must move together on every MCP release:
//
//  1. Pin the npx-launched server to the exact published version. npx reuses a
//     cached package for a floating tag like @latest, so users can get a stale
//     server after an upgrade; an exact version forces a fetch.
//  2. Bump the plugin's version so Claude Code and Codex see the plugin as
//     changed and re-pull the new pin. Without a version change the updated
//     .mcp.json can sit on the marketplace and never reach installed plugins.

// (1) Rewrite the pinned version in the plugin's MCP config. Two files carry
//     the same server config: `.mcp.json` (Claude Code marketplace / legacy
//     Codex native) and `mcp.json` (Agent Plugins standard, read by Codex,
//     Cursor, Copilot, VS Code, Kiro). Keep both in sync.
for (const mcpRel of ['plugins/b2c-dx-mcp/.mcp.json', 'plugins/b2c-dx-mcp/mcp.json']) {
  const mcpConfigPath = join(repoRoot, mcpRel);
  const mcpConfig = readJson(mcpConfigPath);
  const mcpArgs = mcpConfig.mcpServers?.['b2c-dx-mcp']?.args;
  if (!Array.isArray(mcpArgs)) {
    console.error(`${mcpRel} has no mcpServers["b2c-dx-mcp"].args array`);
    process.exit(1);
  }
  const pkgArgIndex = mcpArgs.findIndex((arg) => typeof arg === 'string' && arg.startsWith('@salesforce/b2c-dx-mcp@'));
  if (pkgArgIndex === -1) {
    console.error(`${mcpRel} args do not reference @salesforce/b2c-dx-mcp`);
    process.exit(1);
  }
  mcpArgs[pkgArgIndex] = `@salesforce/b2c-dx-mcp@${mcpVersion}`;
  writeJson(mcpConfigPath, mcpConfig);
}

// (2) Stamp the version onto the Agent Plugins root manifest, the legacy Codex
//     manifest (Codex reads the version there, not from a marketplace), and the
//     Claude marketplace entry.
for (const manifestRel of ['plugins/b2c-dx-mcp/plugin.json', 'plugins/b2c-dx-mcp/.codex-plugin/plugin.json']) {
  const manifestPath = join(repoRoot, manifestRel);
  const manifest = readJson(manifestPath);
  manifest.version = mcpVersion;
  writeJson(manifestPath, manifest);
}

const marketplacePath = join(repoRoot, '.claude-plugin/marketplace.json');
const marketplace = readJson(marketplacePath);
const mcpEntry = marketplace.plugins.find((plugin) => plugin.name === 'b2c-dx-mcp');
if (!mcpEntry) {
  console.error('.claude-plugin/marketplace.json has no b2c-dx-mcp plugin entry');
  process.exit(1);
}
mcpEntry.version = mcpVersion;
writeJson(marketplacePath, marketplace);

console.log(`Pinned b2c-dx-mcp plugin to @salesforce/b2c-dx-mcp@${mcpVersion}`);
