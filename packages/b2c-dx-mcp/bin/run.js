#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* global process */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const packageDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Load .env from package directory if present
try {
  process.loadEnvFile(path.join(packageDir, '.env'));
} catch {
  // .env file not found or not readable, continue without it
}

// Apply telemetry-related env from mcp.json; mcp.json takes priority over .env for these keys
const TELEMETRY_ENV_KEYS = ['SF_DISABLE_TELEMETRY', 'SFCC_DISABLE_TELEMETRY', 'SFCC_APP_INSIGHTS_KEY'];

function getMcpJsonCandidates() {
  const seen = new Set();
  const out = [];
  for (let dir = process.cwd(); ; dir = path.dirname(dir)) {
    const p = path.join(dir, '.cursor', 'mcp.json');
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
    if (dir === path.dirname(dir)) break;
  }
  for (let dir = packageDir; ; dir = path.dirname(dir)) {
    const p = path.join(dir, '.cursor', 'mcp.json');
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
    if (dir === path.dirname(dir)) break;
  }
  const globalPath = path.join(os.homedir(), '.cursor', 'mcp.json');
  if (!seen.has(globalPath)) out.push(globalPath);
  return out;
}

function mergeEnvFromConfig(config) {
  const merged = {};
  if (config && typeof config.env === 'object') Object.assign(merged, config.env);
  const servers = config?.mcpServers && typeof config.mcpServers === 'object' ? config.mcpServers : {};
  for (const server of Object.values(servers)) {
    if (server && typeof server.env === 'object') Object.assign(merged, server.env);
  }
  return merged;
}

function applyTelemetryEnv(mergedEnv) {
  // If either disable var is explicitly "false" in mcp.json, set the other to "false" so one key enables telemetry
  if (mergedEnv.SFCC_DISABLE_TELEMETRY === 'false' && mergedEnv.SF_DISABLE_TELEMETRY === undefined) {
    mergedEnv.SF_DISABLE_TELEMETRY = 'false';
  }
  if (mergedEnv.SF_DISABLE_TELEMETRY === 'false' && mergedEnv.SFCC_DISABLE_TELEMETRY === undefined) {
    mergedEnv.SFCC_DISABLE_TELEMETRY = 'false';
  }
  let n = 0;
  for (const key of TELEMETRY_ENV_KEYS) {
    if (mergedEnv[key] !== undefined) {
      process.env[key] = String(mergedEnv[key]);
      n++;
    }
  }
  return n;
}

function applyMcpJsonEnv() {
  for (const filePath of getMcpJsonCandidates()) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const merged = mergeEnvFromConfig(config);
      const applied = applyTelemetryEnv(merged);
      if (applied > 0) break; // Only stop at first file that actually sets a telemetry key (so it overrides .env)
    } catch {
      // Ignore parse errors or missing file
    }
  }
}
applyMcpJsonEnv();

// By now process.env already has telemetry vars from .env and mcp.json (mcp.json overwrote .env).
// Only default to disabled when neither source set either var.
if (process.env.SF_DISABLE_TELEMETRY === undefined && process.env.SFCC_DISABLE_TELEMETRY === undefined) {
  process.env.SF_DISABLE_TELEMETRY = 'true';
  process.env.SFCC_DISABLE_TELEMETRY = 'true';
}

import {execute} from '@oclif/core';

await execute({dir: import.meta.url});
