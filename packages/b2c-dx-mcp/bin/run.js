#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/* global process */

/**
 * Production entry point for MCP server using oclif.
 *
 * This uses oclif's production mode which:
 * - Uses compiled JavaScript from dist/
 * - Loads .env file if present for local configuration
 *
 * Run directly: ./bin/run.js mcp --toolsets all
 * Or with node: node bin/run.js mcp --toolsets all
 */

// Load .env file if present (Node.js native support)
try {
  process.loadEnvFile();
} catch {
  // .env file not found or not readable, continue without it
}

import {execute} from '@oclif/core';

await execute({dir: import.meta.url});
