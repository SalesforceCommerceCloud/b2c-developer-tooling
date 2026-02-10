#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* global process */

// Load .env file if present (Node.js native support; same as b2c-cli run.js).
// When run by an MCP client (Cursor, Claude Desktop), env from mcp.json is already set in process.env.
try {
  process.loadEnvFile();
} catch {
  // .env file not found or not readable, continue without it
}

import {execute} from '@oclif/core';

await execute({dir: import.meta.url});
